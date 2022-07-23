import {
  AptosClient,
  WalletClient,
  FaucetClient,
  TokenClient,
} from "@martiandao/aptos-web3-bip44.js";
import { NODE_URL, FAUCET_URL } from "./common";

const martianAptosClient = new AptosClient(NODE_URL);

const getMartianWalletClient = () => new WalletClient(NODE_URL, FAUCET_URL);
export const martianWalletClient = getMartianWalletClient();

const getMartianFaucetClient = () => new FaucetClient(NODE_URL, FAUCET_URL);
export const martianFaucetClient = getMartianFaucetClient();

const getMartianTokenClient = () => new TokenClient(martianAptosClient);
export const martianTokenClient = getMartianTokenClient();
