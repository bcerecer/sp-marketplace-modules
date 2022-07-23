import { WalletClient } from "@martiandao/aptos-web3-bip44.js";
import { FaucetClient } from "aptos";
import { NODE_URL, FAUCET_URL } from "./common";

type MartianSignParams = {
  func: string;
  args: any[];
  type_arguments: string[];
};

const getMartianWalletClient = () => new WalletClient(NODE_URL, FAUCET_URL);
export const martianWalletClient = getMartianWalletClient();

const getMartianFaucetClient = () => new FaucetClient(NODE_URL, FAUCET_URL);
export const martianFaucetClient = getMartianFaucetClient();
