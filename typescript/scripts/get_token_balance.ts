import { martianTokenClient } from "../wallets/martian";

/***************** PARAMS *****************/
const ownerAddress =
  "0xca75b82095d95731d0fbbb79b89137e46b2a4bfc8cec25933a343254e3e8bce2";
const collectionCreatorAddress =
  "0xca75b82095d95731d0fbbb79b89137e46b2a4bfc8cec25933a343254e3e8bce2";
const collectionName = "Aptos Nyan Cats";
const tokenName = "Star-Spangled Nyan Cat";
/***************** PARAMS *****************/

async function main() {
  const tokenId = {
    creator: collectionCreatorAddress,
    collection: collectionName,
    name: tokenName,
  };

  let tokenBalance;
  try {
    console.log("trying");
    tokenBalance = (
      await martianTokenClient.getTokenBalanceForAccount(ownerAddress, tokenId)
    ).value;
  } catch {
    tokenBalance = 0;
    console.log("error caught");
  }

  console.log("Token balance: ", tokenBalance);
}

main();
