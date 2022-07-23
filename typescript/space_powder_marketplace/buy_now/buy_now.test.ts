import assert from "assert";
import { maxFaucetAmount } from "../../utils/constants";
import {
  martianTokenClient,
  martianWalletClient,
  martianFaucetClient,
} from "../../wallets/martian";
import { createNftCollection } from "../common/create_nft_collection";
import { SpacePowderBuyNowClient } from "./buy_now";

// TODO: These should be testing all suported wallets by making an internal SupportedWallets class where we test for each
async function main() {
  const buyNowClient = new SpacePowderBuyNowClient();

  const collectionCreatorWallet = await martianWalletClient.createWallet();
  const collectionCreatorAddress = collectionCreatorWallet.accounts[0].address;
  const collectionCreatorSigningKey = collectionCreatorWallet.code;
  const collectionCreatorAccount =
    await martianWalletClient.getAccountFromMetaData(
      collectionCreatorSigningKey,
      collectionCreatorWallet.accounts[0]
    );

  const buyerWallet = await martianWalletClient.createWallet();
  const buyerAddress = buyerWallet.accounts[0].address;
  const buyerSigningKey = buyerWallet.code;
  const buyerAccount = await martianWalletClient.getAccountFromMetaData(
    buyerSigningKey,
    buyerWallet.accounts[0]
  );

  const { collectionName, tokensNames } = await createNftCollection(
    collectionCreatorWallet
  );

  const firstTokenName = tokensNames[0];
  const secondTokenName = tokensNames[1];
  const thirdTokenName = tokensNames[2];

  const firstTokenId = {
    creator: collectionCreatorAddress,
    collection: collectionName,
    name: firstTokenName,
  };

  console.log("\n=== Addresses ===");
  console.log(
    `CollectionCreator Account: ${collectionCreatorAddress} SecretKey: ${collectionCreatorSigningKey}`
  );
  console.log(`Buyer Account: ${buyerAddress} SecretKey: ${buyerSigningKey}`);
  let { value: firstTokenBalance } =
    await martianTokenClient.getTokenBalanceForAccount(
      collectionCreatorAddress,
      firstTokenId
    );
  console.log(`\CollectionCreator's firstToken balance: ${firstTokenBalance}`);
  assert(firstTokenBalance == 1);

  // TODO: remove this try/catch. Currently, necessary bc martian doesn't handle this error properly
  // https://github.com/martian-dao/aptos-web3.js/issues/8
  try {
    firstTokenBalance = (
      await martianTokenClient.getTokenBalanceForAccount(
        buyerAddress,
        firstTokenId
      )
    ).value;
  } catch {
    firstTokenBalance = 0;
  }
  console.log(`Buyer's firstToken balance: ${firstTokenBalance}`);
  assert(firstTokenBalance == 0);

  /******************** CREATOR LISTS FIRST TOKEN ********************/
  console.log("\n=== CollectionCreator Lists First Token ====");
  const firstTokenListedName = tokensNames[0];
  const firstTokenListedPrice = 100;

  let payload = buyNowClient.getListTokenPayload(
    collectionCreatorAddress,
    collectionName,
    firstTokenListedName,
    firstTokenListedPrice
  );
  await martianWalletClient.signGenericTransaction(
    collectionCreatorAccount,
    payload.func,
    payload.args,
    payload.type_arguments
  );

  console.log("First token name: ", firstTokenName);
  firstTokenBalance = (
    await martianTokenClient.getTokenBalanceForAccount(
      collectionCreatorAddress,
      firstTokenId
    )
  ).value;
  console.log(`\n CollectionCreator firstToken balance: ${firstTokenBalance}`);
  assert(firstTokenBalance == 0);
}

main();
