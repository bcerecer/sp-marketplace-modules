module SpacePowderMarketplace::FixedPriceSale {
    use AptosFramework::Coin::{Self};
    use AptosFramework::Table::{Self, Table};
    use AptosFramework::TestCoin::TestCoin;
    use AptosFramework::Token::{Self, Token, TokenId};
    use Std::Signer;
    use Std::Event::{Self, EventHandle};
    use Std::Option::{Self, Option};

    const E_INVALID_BUYER: u64 = 0;
    const E_INSUFFICIENT_FUNDS: u64 = 1;

    struct ListedItem has store {
        price: u64,
        locked_token: Option<Token>,
    }
    
    // Set of data sent to the event stream during a listing of a token (for fixed price)
    struct ListEvent has drop, store {
        id: TokenId,
        amount: u64,
    }

    // Set of data sent to the event stream during a buying of a token (for fixed price)
    struct BuyEvent has drop, store {
        id: TokenId,
    }

    // Set of data sent to the event stream during a unlisting of a token (for fixed price)
    struct UnlistEvent has drop, store {
        id: TokenId,
    }

    struct ListedItemsData has key {
        listed_items: Table<TokenId, ListedItem>,
        listing_events: EventHandle<ListEvent>,
        buying_events: EventHandle<BuyEvent>,
        unlisting_events: EventHandle<UnlistEvent>,
    }

    // part of the fixed price sale flow
    public(script) fun list_token(seller: &signer, collection_owner_addres: address, collection_name: vector<u8>, token_name: vector<u8>, price: u64) acquires ListedItemsData {
        let token_id = Token::create_token_id_raw(collection_owner_addres, collection_name, token_name);
        let seller_addr = Signer::address_of(seller);

        if (!exists<ListedItemsData>(seller_addr)) {
            move_to(seller, ListedItemsData {
                listed_items: Table::new<TokenId, ListedItem>(),
                listing_events: Event::new_event_handle<ListEvent>(seller),
                buying_events: Event::new_event_handle<BuyEvent>(seller),
                unlisting_events: Event::new_event_handle<UnlistEvent>(seller),
            });
        };

        let token = Token::withdraw_token(seller, token_id, 1);

        let listed_items_data = borrow_global_mut<ListedItemsData>(seller_addr);
        let listed_items = &mut listed_items_data.listed_items;

        Event::emit_event<ListEvent>(
            &mut listed_items_data.listing_events,
            ListEvent { id: token_id, amount: price },
        );

        Table::add(listed_items, token_id, ListedItem {
            price,
            locked_token: Option::some(token),
        })
    }

    // part of the fixed price sale flow
    public(script) fun buy_token(buyer: &signer, seller: address, collection_owner_addres: address, collection_name: vector<u8>, token_name: vector<u8>) acquires ListedItemsData {
        let token_id = Token::create_token_id_raw(collection_owner_addres, collection_name, token_name);
        let buyer_addr = Signer::address_of(buyer);
        assert!(buyer_addr != seller, E_INVALID_BUYER);

        let listedItemsData = borrow_global_mut<ListedItemsData>(seller);

        let listed_items = &mut listedItemsData.listed_items;
        let listed_item = Table::borrow_mut(listed_items, token_id);

        assert!(Coin::balance<TestCoin>(buyer_addr) >= listed_item.price, E_INSUFFICIENT_FUNDS);
        Coin::transfer<TestCoin>(buyer, seller, listed_item.price);

        // This is a copy of locked_token
        let locked_token: &mut Option<Token> = &mut listed_item.locked_token;

        // Move to new owner
        let token = Option::extract(locked_token);
        Token::deposit_token(buyer, token);

        // Remove token from escrow and destroy entry
        let ListedItem{price: _, locked_token: remove_empty_option} = Table::remove(listed_items, token_id);
        Option::destroy_none(remove_empty_option);

        Event::emit_event<BuyEvent>(
            &mut listedItemsData.buying_events,
            BuyEvent { id: token_id },
        );
    }

    public(script) fun unlist_token(seller: &signer, collection_owner_addres: address, collection_name: vector<u8>, token_name: vector<u8>) acquires ListedItemsData {
        let token_id = Token::create_token_id_raw(collection_owner_addres, collection_name, token_name);
        let seller_addr = Signer::address_of(seller);
        
        let listedItemsData = borrow_global_mut<ListedItemsData>(seller_addr);
        let listed_items = &mut listedItemsData.listed_items;
        let listed_item = Table::borrow_mut(listed_items, token_id);
        // This is a copy of locked_token
        let locked_token: &mut Option<Token> = &mut listed_item.locked_token;

        // Move to seller
        let token = Option::extract(locked_token);
        Token::deposit_token(seller, token);

        // Remove token from escrow and destroy entry
        let ListedItem{price: _, locked_token: remove_empty_option} = Table::remove(listed_items, token_id);
        Option::destroy_none(remove_empty_option);

        Event::emit_event<UnlistEvent>(
            &mut listedItemsData.unlisting_events,
            UnlistEvent { id: token_id },
        );
    }

    /**************************** TESTS ****************************/

    #[test_only]
    use AptosFramework::TokenTransfers::{Self};
    use Std::ASCII;
    use AptosFramework::ManagedCoin;

    const E_INCORRECT_TOKEN_OWNER: u64 = 100;
    const E_INVALID_BALANCE: u64 = 101;

    public fun create_collection_and_token(
        collection_creator: &signer,
        collection_name: vector<u8>,
        token_name: vector<u8>,
        token_amount: u64,
        collection_max: u64,
        token_max: u64,
    ): TokenId {
        Token::create_collection(
            collection_creator,
            ASCII::string(collection_name),
            ASCII::string(b"Any collection description"),
            ASCII::string(b"https://anyuri.com"),
            Option::some(collection_max),
        );

        Token::create_token(
            collection_creator,
            ASCII::string(collection_name),
            ASCII::string(token_name),
            ASCII::string(b"Any token description"),
            true,
            token_amount,
            Option::some(token_max),
            ASCII::string(b"https://anyuri.com"),
            0,
        )
    }

    public fun before_each_setup(
        collection_creator: &signer,
        collection_name: vector<u8>,
        token_name: vector<u8>,
        seller: &signer,
    ) {
        // Create a collection owned by collection_creator
        let collection_creator_addr = Signer::address_of(collection_creator);
        let token_id = create_collection_and_token(collection_creator, collection_name, token_name, 1, 2, 1);

        // Change ownership of collection's token(NFT) to seller
        let seller_addr = Signer::address_of(seller);
        TokenTransfers::offer(collection_creator, seller_addr, token_id, 1);
        TokenTransfers::claim(seller, collection_creator_addr, token_id);
            // Verify seller is owner of token(NFT)
            assert!(Token::balance_of(collection_creator_addr, token_id) == 0, E_INCORRECT_TOKEN_OWNER);
            assert!(Token::balance_of(seller_addr, token_id) == 1, E_INCORRECT_TOKEN_OWNER);
    }

    #[test(faucet = @0x1, seller = @0x2, buyer = @0x3, collection_creator = @0x4)]
    public(script) fun WHEN_list_and_buy_THEN_succeeds(faucet: signer, seller: signer, buyer: signer, collection_creator: signer) acquires ListedItemsData {
        // Setup
        let collection_name: vector<u8> = b"Any collection name";
        let token_name: vector<u8> = b"Any token name";
        before_each_setup(&collection_creator, collection_name, token_name, &seller);
        ManagedCoin::initialize<TestCoin>(&faucet, b"TestCoin", b"TEST", 6, false);
        ManagedCoin::register<TestCoin>(&faucet);
        ManagedCoin::register<TestCoin>(&seller);
        ManagedCoin::register<TestCoin>(&buyer);

        // List collection for sale
        let seller_addr = Signer::address_of(&seller);
        let collection_creator_addr = Signer::address_of(&collection_creator);
        let token_id = Token::create_token_id_raw(collection_creator_addr, collection_name, token_name);
        let token_price = 100;
        list_token(&seller, collection_creator_addr, collection_name, token_name, token_price);
            // Verify seller doesn't own the token(NFT) anymore
            assert!(Token::balance_of(seller_addr, token_id) == 0, E_INCORRECT_TOKEN_OWNER);

        // Create and fund faucet        
        let coin_mint_amount = 1000;
        let faucet_addr = Signer::address_of(&faucet);
        ManagedCoin::mint<TestCoin>(&faucet, faucet_addr, coin_mint_amount);

        // Fund buyer
        let buyer_addr = Signer::address_of(&buyer);
        Coin::transfer<TestCoin>(&faucet, buyer_addr, token_price);
            // Verify buyer insuffice_funds amount of coins
            assert!(Coin::balance<TestCoin>(buyer_addr) == token_price, E_INVALID_BALANCE);
        
        // Buy token(NFT)
        buy_token(&buyer, seller_addr, collection_creator_addr, collection_name, token_name);
            // Verify buyer owns token(NFT) and seller has the coins
            assert!(Token::balance_of(seller_addr, token_id) == 0, E_INCORRECT_TOKEN_OWNER);
            assert!(Token::balance_of(buyer_addr, token_id) == 1, E_INCORRECT_TOKEN_OWNER);
            assert!(Coin::balance<TestCoin>(seller_addr) == token_price, E_INVALID_BALANCE);
            assert!(Coin::balance<TestCoin>(buyer_addr) == 0, E_INVALID_BALANCE);
    }

    #[expected_failure(abort_code = 1)]
    #[test(faucet = @0x1, seller = @0x2, buyer = @0x3, collection_creator = @0x4)]
    public(script) fun WHEN_insuffiencient_funds_THEN_fails(faucet: signer, seller: signer, buyer: signer, collection_creator: signer) acquires ListedItemsData {
        // Setup
        let collection_name: vector<u8> = b"Any collection name";
        let token_name: vector<u8> = b"Any token name";
        before_each_setup(&collection_creator, collection_name, token_name, &seller);
        ManagedCoin::initialize<TestCoin>(&faucet, b"TestCoin", b"TEST", 6, false);
        ManagedCoin::register<TestCoin>(&faucet);
        ManagedCoin::register<TestCoin>(&seller);
        ManagedCoin::register<TestCoin>(&buyer);

        // List collection for sale
        let seller_addr = Signer::address_of(&seller);
        let collection_creator_addr = Signer::address_of(&collection_creator);
        let token_id = Token::create_token_id_raw(collection_creator_addr, collection_name, token_name);
        let token_price = 100;
        list_token(&seller, collection_creator_addr, collection_name, token_name, token_price);
            // Verify seller doesn't own the token(NFT) anymore
            assert!(Token::balance_of(seller_addr, token_id) == 0, E_INCORRECT_TOKEN_OWNER);

        // Create and fund faucet        
        let coin_mint_amount = 1000;
        let faucet_addr = Signer::address_of(&faucet);
        ManagedCoin::mint<TestCoin>(&faucet, faucet_addr, coin_mint_amount);

        // Fund buyer
        let buyer_addr = Signer::address_of(&buyer);
        let deficit_from_token_price = 10;
        let insufficient_funds = token_price - deficit_from_token_price;
        Coin::transfer<TestCoin>(&faucet, buyer_addr, insufficient_funds);
            // Verify buyer insuffice_funds amount of coins
            assert!(Coin::balance<TestCoin>(buyer_addr) == insufficient_funds, E_INVALID_BALANCE);
        
        buy_token(&buyer, seller_addr, collection_creator_addr, collection_name, token_name);
            // Verify buyer owns token(NFT) and seller has the coins
            assert!(Token::balance_of(buyer_addr, token_id) == 0, E_INCORRECT_TOKEN_OWNER);
            assert!(Coin::balance<TestCoin>(seller_addr) == 0, E_INVALID_BALANCE);
            assert!(Coin::balance<TestCoin>(buyer_addr) == insufficient_funds, E_INVALID_BALANCE);
    }

    #[test(faucet = @0x1, seller = @0x2, buyer = @0x3, collection_creator = @0x4)]
    public(script) fun WHEN_seller_unlist_THEN_succeeds(faucet: signer, seller: signer, buyer: signer, collection_creator: signer) acquires ListedItemsData {
        // Setup
        let collection_name: vector<u8> = b"Any collection name";
        let token_name: vector<u8> = b"Any token name";
        before_each_setup(&collection_creator, collection_name, token_name, &seller);
        ManagedCoin::initialize<TestCoin>(&faucet, b"TestCoin", b"TEST", 6, false);
        ManagedCoin::register<TestCoin>(&faucet);
        ManagedCoin::register<TestCoin>(&seller);
        ManagedCoin::register<TestCoin>(&buyer);

        // List collection for sale
        let seller_addr = Signer::address_of(&seller);
        let collection_creator_addr = Signer::address_of(&collection_creator);
        let token_id = Token::create_token_id_raw(collection_creator_addr, collection_name, token_name);
        let token_price = 100;
        list_token(&seller, collection_creator_addr, collection_name, token_name, token_price);
            // Verify seller doesn't own the token(NFT) anymore
            assert!(Token::balance_of(seller_addr, token_id) == 0, E_INCORRECT_TOKEN_OWNER);

        // Unlist listed token(NFT)
        unlist_token(&seller, collection_creator_addr, collection_name, token_name);
            // Verify seller owns the token(NFT) anymore
            assert!(Token::balance_of(seller_addr, token_id) == 1, E_INCORRECT_TOKEN_OWNER);
    }
}
