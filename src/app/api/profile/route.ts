import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

interface Nft {
  nft_id: string;
  collection: {
    floor_prices: {
      value: number;
      payment_token: {
        symbol: string;
      };
    }[];
  };
}

interface NftResponse {
  nfts: Nft[];
}

