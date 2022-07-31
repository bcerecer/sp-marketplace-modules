import { WalletClient } from "@martiandao/aptos-web3-bip44.js";
import { maxFaucetAmount } from "../../utils/constants";
import {
  martianWalletClient,
  martianFaucetClient,
} from "../../wallets/martian";
import {
  nyanCollectionData,
  tokenData,
} from "./collections_data/nyan_collection_data";

/***************** PARAMS *****************/
const collectionData = nyanCollectionData;
/***************** PARAMS *****************/

async function main() {
  // create new wallet (10 test tokens airdropped by default)
  console.log("\n=== Wallet Creation ===");
  const collectionCreatorWallet = await martianWalletClient.createWallet();
  const collectionCreatorAddress = collectionCreatorWallet.accounts[0].address;
  const signingKey = collectionCreatorWallet.code;
  const collectionCreatorAccount = await WalletClient.getAccountFromMetaData(
    signingKey,
    collectionCreatorWallet.accounts[0]
  );

  console.log("\n=== Addresses ===");
  console.log(
    `Collection creator Account: ${collectionCreatorAddress} SecretKey: ${signingKey}`
  );

  await martianFaucetClient.fundAccount(
    collectionCreatorAddress,
    maxFaucetAmount
  );

  console.log("\n=== Initial Balances ===");
  console.log(
    `Collection creator: ${await martianWalletClient.getBalance(
      collectionCreatorAddress
    )}`
  );

  console.log("\n=== Creating Collection and Token ===");

  await martianWalletClient.createCollection(
    collectionCreatorAccount,
    collectionData.name,
    collectionData.description,
    collectionData.uri
  );

  console.log("Begin creating nyans :D");
  let index = 0;
  for (let token of tokenData) {
    // Transfer maxFaucetAmount for every 10 nfts to avoid going out of balance
    if (index % 10 == 0) {
      await martianFaucetClient.fundAccount(
        collectionCreatorAddress,
        maxFaucetAmount
      );
    }
    console.log("creating token: ", token.name);
    await martianWalletClient.createToken(
      collectionCreatorAccount,
      collectionData.name,
      token.name,
      token.name, // this is the description
      1,
      token.uri
    );
    index += 1;
  }
  console.log("Finished creating nyans");

  console.log(
    `Collection creator: ${JSON.stringify(
      await martianWalletClient.getTokens(collectionCreatorAddress)
    )}`
  );
}

main();
