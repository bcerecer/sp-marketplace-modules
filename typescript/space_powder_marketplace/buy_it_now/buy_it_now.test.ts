import assert from "assert";
import { maxFaucetAmount } from "../../utils/constants";
import {
  martianWalletClient,
  martianFaucetClient,
} from "../../wallets/martian";
import { createNftCollection } from "../common/create_nft_collection";

// TODO: These should be testing all suported wallets by making an internal SupportedWallets class where we test for each
async function main() {
  const collectionCreatorWallet = await martianWalletClient.createWallet();

  await createNftCollection(collectionCreatorWallet);
}

main();
