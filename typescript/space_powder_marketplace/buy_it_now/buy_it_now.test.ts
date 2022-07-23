import { martianWalletClient } from "../../wallets/martian";
import { createNftCollection } from "../common/create_nft_collection";
import { SpacePowderBuyNowClient } from "./buy_it_now";

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
  const buyerAddress = collectionCreatorWallet.accounts[0].address;
  const buyerSigningKey = collectionCreatorWallet.code;
  const buyerAccount = await martianWalletClient.getAccountFromMetaData(
    buyerSigningKey,
    collectionCreatorWallet.accounts[0]
  );

  const { collectionName, tokensNames } = await createNftCollection(
    collectionCreatorWallet
  );

  console.log("\n=== Addresses ===");
  console.log(
    `Collection creator Account: ${collectionCreatorAddress} SecretKey: ${collectionCreatorSigningKey}`
  );
  console.log(`Buyer Account: ${buyerWallet} SecretKey: ${buyerSigningKey}`);

  console.log(`\nCollection creator lists token: `, tokensNames[0]);

  const firstTokenListedName = tokensNames[0];
  const firstTokenListedPrice = 100;

  const { func, args, type_arguments } = buyNowClient.getListTokenPayload(
    collectionCreatorAddress,
    collectionName,
    firstTokenListedName,
    firstTokenListedPrice
  );
  await martianWalletClient.signGenericTransaction(
    collectionCreatorAccount,
    func,
    args,
    type_arguments
  );
}

main();
