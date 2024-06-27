import { ACTIONS_CORS_HEADERS, ActionGetResponse, ActionPostRequest, ActionPostResponse, createPostResponse } from "@solana/actions"
import { Connection, PublicKey, SystemProgram, Transaction, TransactionMessage, VersionedTransaction, clusterApiUrl } from "@solana/web3.js"
import { NextApiRequest } from "next";
import axios from "axios";

export const GET = async (req: NextApiRequest) => {
    const url = new URL(req.url!);
    const userName = url.searchParams.get("username");
    const address = url.searchParams.get("address");

    const user = await getGHProfile(userName!);
    if (!address || !userName) {
        const payload: ActionGetResponse = {
            icon: 'https://t3.ftcdn.net/jpg/01/01/89/46/360_F_101894688_RVSZUtDfPR6Cr5eBDQI7Qo5pZ01jmyK3.jpg',
            label: `Wallet or username Not Found`,
            description: `Not a valid user`,
            title: `Try again with a valid wallet address`,
        }

        return Response.json(payload, {
            headers: ACTIONS_CORS_HEADERS
        })
    }

    const nfts = await topNFTs(address!);

    if (!user.login) {
        const payload: ActionGetResponse = {
            icon: 'https://t3.ftcdn.net/jpg/01/01/89/46/360_F_101894688_RVSZUtDfPR6Cr5eBDQI7Qo5pZ01jmyK3.jpg',
            label: `User Not Found`,
            description: `Not a valid user ${userName}`,
            title: `Try again with a valid user`,
        }

        return Response.json(payload, {
            headers: ACTIONS_CORS_HEADERS
        })
    }

    const events = await getGHEvents(user.login);

    const payload: ActionGetResponse = {
        icon: user.avatar_url,
        label: `Checking status for ${user.name}`,
        description: `${user.login} has ${events.length} contribution on github in last week`,
        title: events.length > 10 && nfts > 4 ? `${user.login} is a chad dev!` : `Inactive Contributor`,
    }

    return Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS
    })
}

export const OPTIONS = GET;

export const POST = async (req: Request) => {
    const connection = new Connection(clusterApiUrl("mainnet-beta"));
    const url = new URL(req.url!);
    const receiver = url.searchParams.get("address");

    try {
        const body: ActionPostRequest = await req.json();

        let account: PublicKey;

        try {
            account = new PublicKey(body.account);
        } catch (err) {
            return new Response('invalid account provided', {
                status: 400,
                headers: ACTIONS_CORS_HEADERS
            })
        }
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: new PublicKey(account),
                toPubkey: new PublicKey(receiver!),
                lamports: 100000,
            }),
        );

        transaction.feePayer = new PublicKey(account);
        const latestBlockhash = await connection.getLatestBlockhash();

        transaction!.recentBlockhash = latestBlockhash.blockhash;
        transaction!.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;

        try {
            transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

            const payload: ActionPostResponse = await createPostResponse({
                fields: {
                    transaction,
                    message: 'Chad devs supports each other'
                }
            })

            return Response.json(payload, { headers: ACTIONS_CORS_HEADERS })
        } catch (error) {
            console.log("error", error);
        }

    } catch (err) {
        return Response.json("unkown error", { status: 400 })
    }
}


async function getGHProfile(userName: string) {

    try {
        const url = "https://api.github.com/users/"

        const response = await fetch(url + userName, {
            headers: {
                "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`
            }
        });

        return await response.json();
    } catch (error) {
        console.log("error", error);
        throw new Error("Error fetching data");
    }
}

async function getGHEvents(userName: string) {
    try {
        const response = await fetch(`https://api.github.com/users/${userName}/events`, {
            headers: {
                "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`
            }
        });

        return await response.json();
    } catch (error) {
        console.log("error", error);
        throw new Error("Error fetching data");
    }
}

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

async function topNFTs(address: string) {

    const api = axios.create({
        baseURL: `https://api.simplehash.com/api/v0/nfts/owners`,
        headers: {
            "x-api-key": process.env.SIMPLEHASH_API_KEY as string,
        },
    });

    try {
        const { data: nfts } = await api.get("", {
            params: {
                chains: "solana",
                wallet_addresses: address,
            },
        });

        const formattedNfts = nfts as NftResponse;

        const filteredNFTs = formattedNfts.nfts.filter((nft) => {
            const solFloorPrice = nft.collection.floor_prices.find(
                (price) => price.payment_token.symbol === "SOL"
            );

            return solFloorPrice && solFloorPrice.value > 100000000;
        });

        if (filteredNFTs.length === 0) {
            return 0;
        } else {
            return filteredNFTs.length;
        }
    } catch (error) {
        console.log("error", error);
        throw new Error("Error fetching data");
    }
};
