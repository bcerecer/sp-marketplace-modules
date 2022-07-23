import { WalletClient, FaucetClient } from "@martiandao/aptos-web3-bip44.js";
import { NODE_URL, FAUCET_URL } from "./common";

const getMartianWalletClient = () => new WalletClient(NODE_URL, FAUCET_URL);
export const martianWalletClient = getMartianWalletClient();

const getMartianFaucetClient = () => new FaucetClient(NODE_URL, FAUCET_URL);
export const martianFaucetClient = getMartianFaucetClient();
