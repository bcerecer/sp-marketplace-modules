import { aptosClient } from "../wallets/common";

/***************** PARAMS *****************/
const transaction =
  "0x234be3fce3f94a063c4eb86673dc1d0815881a383893a752bd60eea5543f66ee";
/***************** PARAMS *****************/

async function main() {
  const transactionResponse = await aptosClient.getTransaction(transaction);

  console.log("transaction response: ", transactionResponse);
}

main();
