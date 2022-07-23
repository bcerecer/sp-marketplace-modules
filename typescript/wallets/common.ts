import { AptosClient, FaucetClient, TokenClient } from "aptos";

export const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
export const FAUCET_URL = "https://faucet.devnet.aptoslabs.com";

/**************** APTOS ****************/

const getAptosClient = (): AptosClient => {
  return new AptosClient(NODE_URL);
};
export const aptosClient = getAptosClient();

const getFaucetClient = (): FaucetClient =>
  new FaucetClient(NODE_URL, FAUCET_URL);
export const aptosFaucetClient = getFaucetClient();

const getTokenClient = (): TokenClient => new TokenClient(aptosClient);
export const aptosTokenClient = getTokenClient();
