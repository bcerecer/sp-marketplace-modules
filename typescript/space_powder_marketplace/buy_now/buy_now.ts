type PayloadParams = {
  func: string;
  args: string[]; // TODO: add proper type. This can be an array of string/buffer/, etc. Check if can be exported from martian
  type_arguments: string[];
};

export class SpacePowderBuyNowClient {
  spacePowderData = {
    ownerAddress:
      "0x78b4ee642c178e5e47f52a53d249bb80ff175ce254d81120a05abf74d37a23cb",
    module: "buy_now",
  };

  // list_token(seller: &signer, collection_owner_addres: address, collection_name: vector<u8>, token_name: vector<u8>, price: u64)
  getListTokenPayload(
    collectionCreatorAddress: string,
    collectionName: string,
    tokenName: string,
    price: number
  ): PayloadParams {
    return {
      func: `${this.spacePowderData.ownerAddress}::${this.spacePowderData.module}::list_token`,
      args: [
        collectionCreatorAddress,
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
    collectionCreatorAddress: string,
    collectionName: string,
    tokenName: string
  ): PayloadParams {
    return {
      func: `${this.spacePowderData.ownerAddress}::${this.spacePowderData.module}::buy_token`,
      args: [
        sellerAddress,
        collectionCreatorAddress,
        Buffer.from(collectionName).toString("hex"),
        Buffer.from(tokenName).toString("hex"),
      ],
      type_arguments: [],
    };
  }

  // delist_token(seller: &signer, collection_owner_addres: address, collection_name: vector<u8>, token_name: vector<u8>)
  getDelistTokenPayload(
    collectionCreatorAddress: string,
    collectionName: string,
    tokenName: string
  ): PayloadParams {
    return {
      func: `${this.spacePowderData.ownerAddress}::${this.spacePowderData.module}::delist_token`,
      args: [
        collectionCreatorAddress,
        Buffer.from(collectionName).toString("hex"),
        Buffer.from(tokenName).toString("hex"),
      ],
      type_arguments: [],
    };
  }
}
