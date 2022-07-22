// Copyright (c) The Aptos Foundation
// SPDX-License-Identifier: Apache-2.0
import assert from "assert";
import {
  Account,
  RestClient,
  TESTNET_URL,
  FAUCET_URL,
  FaucetClient,
} from "./first_transaction";
import { TokenClient } from "./first_nft";

export class SpacePowderClient {
  spacePowderData = {
    ownerAddress:
      "e555ea6e4621b4cc8b526d5b4959e832db4a341e718551cf1d476bef497b6b8a",
    module: "buy_it_now",
  };
  restClient: RestClient;

  constructor(restClient: RestClient) {
    this.restClient = restClient;
  }

  async submitTransactionHelper(
    account: Account,
    payload: Record<string, any>
  ) {
    const txn_request = await this.restClient.generateTransaction(
      account.address(),
      payload
    );
    const signed_txn = await this.restClient.signTransaction(
      account,
      txn_request
    );
    const res = await this.restClient.submitTransaction(signed_txn);
    await this.restClient.waitForTransaction(res["hash"]);
  }

  // list_token(seller: &signer, collection_owner_addres: address, collection_name: vector<u8>, token_name: vector<u8>, price: u64)
  async listTokenWrapper(
    seller: Account,
    collectionOwnerAddress: string,
    collectionName: string,
    tokenName: string,
    price: number
  ) {
    const payload: {
      function: string;
      arguments: string[];
      type: string;
      type_arguments: any[];
    } = {
      type: "script_function_payload",
      function: `${this.spacePowderData.ownerAddress}::${this.spacePowderData.module}::list_token`,
      type_arguments: [],
      arguments: [
        collectionOwnerAddress,
        Buffer.from(collectionName).toString("hex"),
        Buffer.from(tokenName).toString("hex"),
        price.toString(),
      ],
    };
    await this.submitTransactionHelper(seller, payload);
  }

  // buy_token(buyer: &signer, seller_addr: address, collection_owner_addres: address, collection_name: vector<u8>, token_name: vector<u8>)
  async buyTokenWrapper(
    buyer: Account,
    sellerAddress: string,
    collectionOwnerAddress: string,
    collectionName: string,
    tokenName: string
  ) {
    const payload: {
      function: string;
      arguments: string[];
      type: string;
      type_arguments: any[];
    } = {
      type: "script_function_payload",
      function: `${this.spacePowderData.ownerAddress}::${this.spacePowderData.module}::buy_token`,
      type_arguments: [],
      arguments: [
        sellerAddress,
        collectionOwnerAddress,
        Buffer.from(collectionName).toString("hex"),
        Buffer.from(tokenName).toString("hex"),
      ],
    };
    await this.submitTransactionHelper(buyer, payload);
  }

  // delist_token(seller: &signer, collection_owner_addres: address, collection_name: vector<u8>, token_name: vector<u8>)
  async delistTokenWrapper(
    seller: Account,
    collectionOwnerAddress: string,
    collectionName: string,
    tokenName: string
  ) {
    const payload: {
      function: string;
      arguments: string[];
      type: string;
      type_arguments: any[];
    } = {
      type: "script_function_payload",
      function: `${this.spacePowderData.ownerAddress}::${this.spacePowderData.module}::delist_token`,
      type_arguments: [],
      arguments: [
        collectionOwnerAddress,
        Buffer.from(collectionName).toString("hex"),
        Buffer.from(tokenName).toString("hex"),
      ],
    };
    await this.submitTransactionHelper(seller, payload);
  }
}

async function main() {
  const restClient = new RestClient(TESTNET_URL);
  const spacePowderClient = new SpacePowderClient(restClient);
  const tokenClient = new TokenClient(restClient);
  const faucetClient = new FaucetClient(FAUCET_URL, restClient);

  const alice = new Account();
  const bob = new Account();
  const collection_name = "Alice's";
  const first_token_name = "Alice's first token";

  console.log("\n=== Addresses ===");
  console.log(
    `Alice Account: 0x${alice.address()} SecretKey: ${Buffer.from(
      alice.signingKey.secretKey
    )
      .toString("hex")
      .slice(0, 64)}`
  );
  console.log(
    `Bob Account: 0x${bob.address()} SecretKey: ${Buffer.from(
      bob.signingKey.secretKey
    )
      .toString("hex")
      .slice(0, 64)}`
  );

  const maxFaucetAmount = 20_000;
  await faucetClient.fundAccount(alice.address(), maxFaucetAmount);
  await faucetClient.fundAccount(bob.address(), maxFaucetAmount);

  console.log("\n=== Initial Balances ===");
  console.log(`Alice: ${await restClient.accountBalance(alice.address())}`);
  console.log(`Bob: ${await restClient.accountBalance(bob.address())}`);
  assert(
    await restClient.accountBalance(alice.address()),
    maxFaucetAmount.toString()
  );
  assert(
    await restClient.accountBalance(bob.address()),
    maxFaucetAmount.toString()
  );

  console.log("\n=== Creating Collection and Token ===");

  await tokenClient.createCollection(
    alice,
    collection_name,
    "Alice's simple collection",
    "https://aptos.dev"
  );
  await tokenClient.createToken(
    alice,
    collection_name,
    first_token_name,
    "Alice's any description",
    1,
    "https://aptos.dev/img/nyan.jpeg"
  );

  let token_balance: number = await tokenClient.getTokenBalance(
    alice.address(),
    alice.address(),
    collection_name,
    first_token_name
  );
  console.log(`\nAlice's token balance: ${token_balance}`);
  assert(token_balance == 1);

  token_balance = await tokenClient.getTokenBalance(
    bob.address(),
    alice.address(),
    collection_name,
    first_token_name
  );
  console.log(`Bob's token balance: ${token_balance}`);
  assert(token_balance == 0);

  console.log("\n=== Alice Lists Token ===");

  const tokenPrice = 100;
  await spacePowderClient.listTokenWrapper(
    alice,
    alice.address(),
    collection_name,
    first_token_name,
    tokenPrice
  );

  token_balance = await tokenClient.getTokenBalance(
    alice.address(),
    alice.address(),
    collection_name,
    first_token_name
  );
  console.log(`\nAlice's token balance: ${token_balance}`);
  assert(token_balance == 0);

  token_balance = await tokenClient.getTokenBalance(
    bob.address(),
    alice.address(),
    collection_name,
    first_token_name
  );
  console.log(`\Bob's token balance: ${token_balance}`);
  assert(token_balance == 0);

  console.log("\n=== Bob Buys Token ===");

  await spacePowderClient.buyTokenWrapper(
    bob,
    alice.address(),
    alice.address(),
    collection_name,
    first_token_name
  );

  token_balance = await tokenClient.getTokenBalance(
    bob.address(),
    alice.address(),
    collection_name,
    first_token_name
  );
  console.log(`\nBob's token balance: ${token_balance}`);
  assert(token_balance == 1);
  token_balance = await tokenClient.getTokenBalance(
    alice.address(),
    alice.address(),
    collection_name,
    first_token_name
  );
  console.log(`\Alice's token balance: ${token_balance}`);
  assert(token_balance == 0);

  console.log("\n=== Bob Lists Token ===");

  await spacePowderClient.listTokenWrapper(
    bob,
    alice.address(),
    collection_name,
    first_token_name,
    tokenPrice
  );

  token_balance = await tokenClient.getTokenBalance(
    bob.address(),
    alice.address(),
    collection_name,
    first_token_name
  );
  console.log(`\Bob's token balance: ${token_balance}`);
  assert(token_balance == 0);

  console.log("\n=== Bob Delists Token ===");

  await spacePowderClient.delistTokenWrapper(
    bob,
    alice.address(),
    collection_name,
    first_token_name
  );

  token_balance = await tokenClient.getTokenBalance(
    bob.address(),
    alice.address(),
    collection_name,
    first_token_name
  );
  console.log(`\Bob's token balance: ${token_balance}`);
  assert(token_balance == 1);

  console.log("\n=== Alice Creates Second Token ===");
  const second_token_name = "Alice's second token";
  await tokenClient.createToken(
    alice,
    collection_name,
    second_token_name,
    "Alice's any description",
    1,
    "https://aptos.dev/img/nyan.jpeg"
  );
  token_balance = await tokenClient.getTokenBalance(
    alice.address(),
    alice.address(),
    collection_name,
    second_token_name
  );
  console.log(`\nAlice's token balance: ${token_balance}`);
  assert(token_balance == 1);

  console.log("\n=== Alice Lists Token ===");
  await spacePowderClient.listTokenWrapper(
    alice,
    alice.address(),
    collection_name,
    second_token_name,
    tokenPrice
  );

  token_balance = await tokenClient.getTokenBalance(
    alice.address(),
    alice.address(),
    collection_name,
    second_token_name
  );
  console.log(`\nAlice's token balance: ${token_balance}`);
  assert(token_balance == 0);
}

if (require.main === module) {
  main().then((resp) => console.log(resp));
}
