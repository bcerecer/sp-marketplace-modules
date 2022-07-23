import { Wallet } from "@martiandao/aptos-web3-bip44.js";
import { maxFaucetAmount } from "../../utils/constants";
import {
  martianWalletClient,
  martianFaucetClient,
} from "../../wallets/martian";

export const createNftCollection = async (collectionCreatorWallet: Wallet) => {
  const signingKey = collectionCreatorWallet.code;
  const collectionCreatorAddress = collectionCreatorWallet.accounts[0].address;
  const collectionCreatorAccount =
    await martianWalletClient.getAccountFromMetaData(
      signingKey,
      collectionCreatorWallet.accounts[0]
    );

  console.log("\n=== Addresses ===");
  console.log(
    `Collection creator Account: 0x${collectionCreatorAddress} SecretKey: ${signingKey}`
  );
  await martianFaucetClient.fundAccount(
    collectionCreatorAddress,
    maxFaucetAmount
  );

  const collection_name = "Test Collection";
  const token_name = "Test token";

  console.log("\n=== Creating Collection and Token ===");

  await martianWalletClient.createCollection(
    collectionCreatorAccount,
    collection_name,
    "Collection creator's simple collection",
    "https://aptos.dev"
  );

  for (let i = 1; i <= 1; i++) {
    // Transfer maxFaucetAmount for every modded variable to avoid going out of balance
    if (i % 10 == 0) {
      await martianFaucetClient.fundAccount(
        collectionCreatorAddress,
        maxFaucetAmount
      );
    }

    await martianWalletClient.createToken(
      collectionCreatorAccount,
      collection_name,
      `${token_name} ${i}`,
      "Collection creator's any description",
      1,
      "https://nyancatcollection.com/images/Original.gif"
    );
  }

  console.log(
    `Tokens created: ${JSON.stringify(
      await martianWalletClient.getTokens(collectionCreatorAddress)
    )}`
  );

  console.log("NFT Collection created successfully");
};
