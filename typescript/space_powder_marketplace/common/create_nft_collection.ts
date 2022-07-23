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

  const collectionName = "Test Collection";
  const tokenName = "Test token";

  console.log("\n=== Creating Collection and Token ===");

  await martianWalletClient.createCollection(
    collectionCreatorAccount,
    collectionName,
    "Collection creator's simple collection",
    "https://aptos.dev"
  );

  const tokensNames = [];
  for (let i = 1; i <= 3; i++) {
    // Transfer maxFaucetAmount for every modded variable to avoid going out of balance
    if (i % 10 == 0) {
      await martianFaucetClient.fundAccount(
        collectionCreatorAddress,
        maxFaucetAmount
      );
    }

    await martianWalletClient.createToken(
      collectionCreatorAccount,
      collectionName,
      `${tokenName} ${i}`,
      "Collection creator's any description",
      1,
      "https://nyancatcollection.com/images/Original.gif"
    );
    tokensNames.push(`${tokenName} ${i}`);
  }

  console.log(
    `Tokens created: ${JSON.stringify(
      await martianWalletClient.getTokens(collectionCreatorAddress)
    )}`
  );

  console.log("NFT Collection created successfully");
  return {
    collectionName: collectionName,
    tokensNames: tokensNames,
  };
};
