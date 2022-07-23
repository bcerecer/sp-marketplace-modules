import { WalletClient } from "@martiandao/aptos-web3-bip44.js";
import { NODE_URL, FAUCET_URL } from "./common";

type MartianSignParams = {
  func: string;
  args: any[];
  type_arguments: string[];
};

const getMartianWalletClient = () => new WalletClient(NODE_URL, FAUCET_URL);
export const martianWalletClient = getMartianWalletClient();
