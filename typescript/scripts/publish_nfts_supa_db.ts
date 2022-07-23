import { createClient } from "@supabase/supabase-js";
import { martianWalletClient } from "../wallets/martian";
import { AptosClient } from "@martiandao/aptos-web3-bip44.js";
import { apiKey } from "../env";

const DATABASE_URL = "https://rxbadlmhqshszwaxifut.supabase.co";
const SUPABASE_SERVICE_API_KEY = apiKey;
const supabaseClient = createClient(DATABASE_URL, SUPABASE_SERVICE_API_KEY);

/***************** PARAMS *****************/
const collectionCreatorAddress =
  "0x867f1c59d09894968617f27bcd8bcf4de0726df8fbc0ed01f1c6e5bb419573b4";
const collectionName = "Aptos Nyan Cats";
const collecitonPath = "aptos_nyan_cats";
/***************** PARAMS *****************/

/*
    Gets events from 0x1::Token::Collections struct field create_token_events for  an address
  */
const getCreateTokenEvents = async (
  address: string,
  aptosClient: AptosClient
) => {
  return await aptosClient.getEventsByEventHandle(
    address,
    "0x1::token::Collections",
    "create_token_events"
  );
};

async function main() {
  // TODO: Validation with supa db that collection and tokens don't exist

  // Get collection (for description, uri, count, maximum)
  const collection = await martianWalletClient.getCollection(
    collectionCreatorAddress,
    collectionName
  );

  // Get tokens
  const createTokenEvents = await getCreateTokenEvents(
    collectionCreatorAddress,
    martianWalletClient.aptosClient
  );
  const currentTime = new Date().toISOString();

  let collectionImage: string = null;
  const tokens: any[] = [];
  createTokenEvents.map(async (event) => {
    if (event.data.id.collection === collectionName) {
      const token = {
        token_id: `${collectionCreatorAddress}::${collectionName}::${event.data.token_data.name}`,
        name: event.data.token_data.name,
        listed: false,
        img_url: event.data.token_data.uri,
        collection_name: collectionName,
        created_at: currentTime,
      };
      if (!collectionImage) {
        collectionImage = token.img_url;
      }
      tokens.push(token);
    }
  });

  const { data: tokensDbData, error: tokensDbError } = await supabaseClient
    .from("tokens")
    .insert(tokens);
  console.log(`tokensDbData: ${JSON.stringify(tokensDbData)}`);
  console.log(`tokensDbError: ${JSON.stringify(tokensDbError)}`);

  const { data: collectionDbData, error: collectionDbError } =
    await supabaseClient.from("collections").insert({
      collection_id: `${collectionCreatorAddress}::${collectionName}`,
      name: collectionName,
      tokens_created: collection.count,
      likes: 0,
      description: collection.description,
      path: collecitonPath,
      img_url: collectionImage,
      creator_address: collectionCreatorAddress,
      created_at: currentTime,
      uri: collection.uri,
    });
  console.log(`collectionDbData: ${JSON.stringify(collectionDbData)}`);
  console.log(`collectionDbError: ${JSON.stringify(collectionDbError)}`);
}

main();