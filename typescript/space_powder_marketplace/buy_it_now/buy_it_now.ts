type PayloadParams = {
  func: string;
  args: string[]; // TODO: add proper type. This can be an array of string/buffer/, etc. Check if can be exported from martian
  type_arguments: string[];
};

export class SpacePowderBuyNow {
  spacePowderData = {
    ownerAddress:
      "e555ea6e4621b4cc8b526d5b4959e832db4a341e718551cf1d476bef497b6b8a",
    module: "buy_it_now",
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
