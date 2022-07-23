type PayloadParams = {
  func: string;
  args: string[]; // TODO: add proper type. This can be an array of string/buffer/, etc. Check if can be exported from martian
  type_arguments: string[];
};

export class SpacePowderBuyNowClient {
  spacePowderData = {
    ownerAddress:
      "8d27c6260086d826da7defe88d7bf761d12dbf77935876b65b5a9624d7ea7c90",
    module: "buy_now",
  };

  // list_token(seller: &signer, collection_owner_addres: address, collection_name: vector<u8>, token_name: vector<u8>, price: u64)
  getListTokenPayload(
    collectionOwnerAddress: string,
    collectionName: string,
    tokenName: string,
    price: number
  ): PayloadParams {
    return {
      func: `${this.spacePowderData.ownerAddress}::${this.spacePowderData.module}::list_token`,
      args: [
        collectionOwnerAddress,
        Buffer.from(collectionName).toString("hex"),
        Buffer.from(tokenName).toString("hex"),
        price.toString(),
      ],
      type_arguments: [],
    };
  }

  // buy_token(buyer: &signer, seller_addr: address, collection_owner_addres: address, collection_name: vector<u8>, token_name: vector<u8>)
  getBuyTokenPayload(
    sellerAddress: string,
    collectionOwnerAddress: string,
    collectionName: string,
    tokenName: string
  ): PayloadParams {
    return {
      func: `${this.spacePowderData.ownerAddress}::${this.spacePowderData.module}::buy_token`,
      args: [
        sellerAddress,
        collectionOwnerAddress,
        Buffer.from(collectionName).toString("hex"),
        Buffer.from(tokenName).toString("hex"),
      ],
      type_arguments: [],
    };
  }

  // delist_token(seller: &signer, collection_owner_addres: address, collection_name: vector<u8>, token_name: vector<u8>)
  getDelistTokenPayload(
    collectionOwnerAddress: string,
    collectionName: string,
    tokenName: string
  ): PayloadParams {
    return {
      func: `${this.spacePowderData.ownerAddress}::${this.spacePowderData.module}::delist_token`,
      args: [
        collectionOwnerAddress,
        Buffer.from(collectionName).toString("hex"),
        Buffer.from(tokenName).toString("hex"),
      ],
      type_arguments: [],
    };
  }
}
