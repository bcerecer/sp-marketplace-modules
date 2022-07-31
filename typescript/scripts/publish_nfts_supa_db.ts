import { createClient } from "@supabase/supabase-js";
import { martianWalletClient } from "../wallets/martian";
import { AptosClient } from "@martiandao/aptos-web3-bip44.js";
import { apiKey } from "../env";

const DATABASE_URL = "https://rxbadlmhqshszwaxifut.supabase.co";
const SUPABASE_SERVICE_API_KEY = apiKey;
const supabaseClient = createClient(DATABASE_URL, SUPABASE_SERVICE_API_KEY);

/***************** PARAMS *****************/
const collectionCreatorAddress =
  "0xdd3a4fd9ca5fc403a5a2c1b18be625f69fe8b149083e59a2234429950fcdf477";
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

  if (collection.code === 404) {
    throw new Error("Collection doesnt exist");
  }

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
        id: `${collectionCreatorAddress}::${collectionName}::${event.data.token_data.name}`,
        name: event.data.token_data.name,
        listed: false,
        img_url: event.data.token_data.uri,
        collection_id: `${collectionCreatorAddress}::${collectionName}`,
        created_at: currentTime,
      };
      if (!collectionImage) {
        collectionImage = token.img_url;
      }
      tokens.push(token);
    }
  });

  const { data: collectionDbData, error: collectionDbError } =
    await supabaseClient.from("collections").insert({
      id: `${collectionCreatorAddress}::${collectionName}`,
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

  if (collectionDbError) {
    throw new Error("Error adding to collection db");
  }

  const { data: tokensDbData, error: tokensDbError } = await supabaseClient
    .from("tokens")
    .insert(tokens);

  if (tokensDbError) {
    throw new Error("Error adding to tokens db");
  }
  console.log(`tokensDbData: ${JSON.stringify(tokensDbData)}`);
  console.log(`tokensDbError: ${JSON.stringify(tokensDbError)}`);
}

main();
