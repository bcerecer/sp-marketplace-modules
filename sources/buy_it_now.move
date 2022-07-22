module space_powder_marketplace::buy_it_now {
    use aptos_framework::coin::{Self};
    use aptos_framework::table::{Self, Table};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::token::{Self, Token, TokenId};
    use std::signer;
    use aptos_std::event::{Self, EventHandle};
    use std::option::{Self, Option};

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

    // Set of data sent to the event stream during a delisting of a token (for fixed price)
    struct DelistEvent has drop, store {
        id: TokenId,
    }

    struct ListedItemsData has key {
        listed_items: Table<TokenId, ListedItem>,
        listing_events: EventHandle<ListEvent>,
        buying_events: EventHandle<BuyEvent>,
        delisting_events: EventHandle<DelistEvent>,
    }

    public fun init_marketplace(seller: &signer) {
        move_to(seller, ListedItemsData {
            listed_items: table::new<TokenId, ListedItem>(),
            listing_events: event::new_event_handle<ListEvent>(seller),
            buying_events: event::new_event_handle<BuyEvent>(seller),
            delisting_events: event::new_event_handle<DelistEvent>(seller),
        });
    }

    // part of the fixed price sale flow
    public fun list_token(seller: &signer, collection_owner_addres: address, collection_name: vector<u8>, token_name: vector<u8>, price: u64) acquires ListedItemsData {
        let token_id = token::create_token_id_raw(collection_owner_addres, collection_name, token_name);
        let seller_addr = signer::address_of(seller);

        if (!exists<ListedItemsData>(seller_addr)) {
            init_marketplace(seller);
        };

        let token = token::withdraw_token(seller, token_id, 1);

        let listed_items_data = borrow_global_mut<ListedItemsData>(seller_addr);
        let listed_items = &mut listed_items_data.listed_items;

        event::emit_event<ListEvent>(
            &mut listed_items_data.listing_events,
            ListEvent { id: token_id, amount: price },
        );

        table::add(listed_items, token_id, ListedItem {
            price,
            locked_token: option::some(token),
        })
    }

    // part of the fixed price sale flow
    public fun buy_token(buyer: &signer, seller_addr: address, collection_owner_addres: address, collection_name: vector<u8>, token_name: vector<u8>) acquires ListedItemsData {
        let token_id = token::create_token_id_raw(collection_owner_addres, collection_name, token_name);
        let buyer_addr = signer::address_of(buyer);
        assert!(buyer_addr != seller_addr, E_INVALID_BUYER);

        let listedItemsData = borrow_global_mut<ListedItemsData>(seller_addr);

        let listed_items = &mut listedItemsData.listed_items;
        let listed_item = table::borrow_mut(listed_items, token_id);

        assert!(coin::balance<AptosCoin>(buyer_addr) >= listed_item.price, E_INSUFFICIENT_FUNDS);
        coin::transfer<AptosCoin>(buyer, seller_addr, listed_item.price);

        // This is a copy of locked_token
        let locked_token: &mut Option<Token> = &mut listed_item.locked_token;

        // Move to new owner
        let token = option::extract(locked_token);
        token::deposit_token(buyer, token);

        // Remove token from escrow and destroy entry
        let ListedItem{price: _, locked_token: remove_empty_option} = table::remove(listed_items, token_id);
        option::destroy_none(remove_empty_option);

        event::emit_event<BuyEvent>(
            &mut listedItemsData.buying_events,
            BuyEvent { id: token_id },
        );
    }

    public fun delist_token(seller: &signer, collection_owner_addres: address, collection_name: vector<u8>, token_name: vector<u8>) acquires ListedItemsData {
        let token_id = token::create_token_id_raw(collection_owner_addres, collection_name, token_name);
        let seller_addr = signer::address_of(seller);
        
        let listedItemsData = borrow_global_mut<ListedItemsData>(seller_addr);
        let listed_items = &mut listedItemsData.listed_items;
        let listed_item = table::borrow_mut(listed_items, token_id);
        // This is a copy of locked_token
        let locked_token: &mut Option<Token> = &mut listed_item.locked_token;

        // Move to seller
        let token = option::extract(locked_token);
        token::deposit_token(seller, token);

        // Remove token from escrow and destroy entry
        let ListedItem{price: _, locked_token: remove_empty_option} = table::remove(listed_items, token_id);
        option::destroy_none(remove_empty_option);

        event::emit_event<DelistEvent>(
            &mut listedItemsData.delisting_events,
            DelistEvent { id: token_id },
        );
    }
}
