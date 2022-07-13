// Copyright (c) The Aptos Foundation
// SPDX-License-Identifier: Apache-2.0
const prompt = require("prompt");

import {
  Account,
  RestClient,
  TESTNET_URL,
  FAUCET_URL,
  FaucetClient,
} from "../first_transaction";
import { TokenClient } from "../first_nft";

const maxFaucetAmount = 20_000;
const restClient = new RestClient(TESTNET_URL);
const faucetClient = new FaucetClient(FAUCET_URL, restClient);

async function main() {
  const tokenClient = new TokenClient(restClient);

  const collection_creator = new Account();
  const collection_name = "Test Collection";
  const token_name = "Test token";

  console.log("\n=== Addresses ===");
  console.log(
    `Collection creator Account: 0x${collection_creator.address()} SecretKey: ${Buffer.from(
      collection_creator.signingKey.secretKey
    )
      .toString("hex")
      .slice(0, 64)}`
  );

  await faucetClient.fundAccount(collection_creator.address(), maxFaucetAmount);

  console.log("\n=== Initial Balances ===");
  console.log(
    `Collection creator: ${await restClient.accountBalance(
      collection_creator.address()
    )}`
  );

  console.log("\n=== Creating Collection and Token ===");

  await tokenClient.createCollection(
    collection_creator,
    collection_name,
    "Collection creator's simple collection",
    "https://aptos.dev"
  );

  for (let i = 1; i <= 5; i++) {
    // Transfer maxFaucetAmount for every modded variable to avoid going out of balance
    if (i % 10 == 0) {
      await faucetClient.fundAccount(
        collection_creator.address(),
        maxFaucetAmount
      );
    }

    await tokenClient.createToken(
      collection_creator,
      collection_name,
      `${token_name} ${i}`,
      "Collection creator's any description",
      1,
      "https://aptos.dev/img/nyan.jpeg"
    );
  }

  let token_balance: number = await tokenClient.getTokenBalance(
    collection_creator.address(),
    collection_creator.address(),
    collection_name,
    token_name
  );
  console.log(`\nCollection creator's token balance: ${token_balance}`);
}

if (require.main === module) {
  main().then((resp) => console.log(resp));
}
