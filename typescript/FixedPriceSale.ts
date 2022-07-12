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
      "0x69f2cbcf3934c8b6b0ff79f10b5db1e12cedfb932f2c74cf365e26ccbe52dc3",
    module: "FixedPriceSale",
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
      function:
        "0x69f2cbcf3934c8b6b0ff79f10b5db1e12cedfb932f2c74cf365e26ccbe52dc3::FixedPriceSale::list_token",
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

  // unlist_token(seller: &signer, collection_owner_addres: address, collection_name: vector<u8>, token_name: vector<u8>)
  async unlistTokenWrapper(
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
      function: `${this.spacePowderData.ownerAddress}::${this.spacePowderData.module}::unlist_token`,
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
  const token_name = "Alice's first token";

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
    token_name,
    "Alice's simple token",
    1,
    "https://aptos.dev/img/nyan.jpeg"
  );

  let token_balance: number = await tokenClient.getTokenBalance(
    alice.address(),
    alice.address(),
    collection_name,
    token_name
  );
  console.log(`\nAlice's token balance: ${token_balance}`);
  assert(token_balance == 1);

  token_balance = await tokenClient.getTokenBalance(
    bob.address(),
    alice.address(),
    collection_name,
    token_name
  );
  console.log(`Bob's token balance: ${token_balance}`);
  assert(token_balance == 0);

  const tokenPrice = 100;
  await spacePowderClient.listTokenWrapper(
    alice,
    alice.address(),
    collection_name,
    token_name,
    tokenPrice
  );

  token_balance = await tokenClient.getTokenBalance(
    alice.address(),
    alice.address(),
    collection_name,
    token_name
  );
  console.log(`\nAlice's token balance: ${token_balance}`);
  assert(token_balance == 0);
}

if (require.main === module) {
  main().then((resp) => console.log(resp));
}
