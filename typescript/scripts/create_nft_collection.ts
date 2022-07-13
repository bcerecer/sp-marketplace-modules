// Copyright (c) The Aptos Foundation
// SPDX-License-Identifier: Apache-2.0
import { WalletClient, FaucetClient } from "@martiandao/aptos-web3.js";
import {
  Account,
  RestClient,
  TESTNET_URL,
  FAUCET_URL,
} from "../first_transaction";
import { TokenClient } from "../first_nft";

const maxFaucetAmount = 20_000;
const faucetClient = new FaucetClient(TESTNET_URL, FAUCET_URL);
const walletClient = new WalletClient(TESTNET_URL, FAUCET_URL);

async function main() {
  // create new wallet (10 test tokens airdropped by default)
  console.log("\n=== Wallet Creation ===");
  const collectionCreatorWallet = await walletClient.createWallet();
  const collectionCreatorAddress = collectionCreatorWallet.accounts[0].address;
  const signingKey = collectionCreatorWallet.code;
  const collectionCreatorAccount = await walletClient.getAccountFromMetaData(
    signingKey,
    collectionCreatorWallet.accounts[0]
  );
  const collection_name = "Test Collection";
  const token_name = "Test token";

  console.log("\n=== Addresses ===");
  console.log(
    `Collection creator Account: 0x${collectionCreatorAddress} SecretKey: ${signingKey}`
  );

  await faucetClient.fundAccount(collectionCreatorAddress, maxFaucetAmount);

  console.log("\n=== Initial Balances ===");
  console.log(
    `Collection creator: ${await walletClient.getBalance(
      collectionCreatorAddress
    )}`
  );

  console.log("\n=== Creating Collection and Token ===");

  await walletClient.createCollection(
    collectionCreatorAccount,
    collection_name,
    "Collection creator's simple collection",
    "https://aptos.dev"
  );

  for (let i = 1; i <= 5; i++) {
    // Transfer maxFaucetAmount for every modded variable to avoid going out of balance
    if (i % 10 == 0) {
      await faucetClient.fundAccount(collectionCreatorAddress, maxFaucetAmount);
    }

    await walletClient.createToken(
      collectionCreatorAccount,
      collection_name,
      `${token_name} ${i}`,
      "Collection creator's any description",
      1,
      "https://aptos.dev/img/nyan.jpeg"
    );
  }

  console.log(
    `Collection creator: ${JSON.stringify(
      await walletClient.getTokens(collectionCreatorAddress)
    )}`
  );
}

if (require.main === module) {
  main().then((resp) => console.log(resp));
}
