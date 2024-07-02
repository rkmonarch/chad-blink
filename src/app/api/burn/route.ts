import getWalletTokens from "@/utils/wallet/getWalletTokens";
import { ACTIONS_CORS_HEADERS, ActionGetResponse, ActionPostRequest, ActionPostResponse, createPostResponse } from "@solana/actions";
import { createBurnCheckedInstruction } from "@solana/spl-token";
import { Connection, PublicKey, Transaction, TransactionMessage, VersionedTransaction, clusterApiUrl } from "@solana/web3.js";
import fs from 'fs';
import path from "path";
interface Token {
    address: string;
    decimals: number;
}

interface TokenInfo {
    decimals: number;
    name: string;
    symbol: string;
    image: string;
}

interface TokenS {
    address: string;
    balance: number;
    associated_account: string;
    info: TokenInfo;
}

interface WalletTokensResponse {
    success: boolean;
    message: string;
    result: TokenS[];
}


// async function getWalletTokens(address: string) {
//     const fileName = 'strict.ts';
//     console.log("dirname", __dirname)
//     const filePath = path.resolve(__dirname, '../../../../../src/utils/jupiter', fileName);

//     let tokenList: { address: string }[];

//     try {
//         // Read and parse the token list
//         const fileData = fs.readFileSync(filePath, 'utf-8');
//         tokenList = JSON.parse(fileData);
//     } catch (err) {
//         console.error('Error reading or parsing token list file:', err);
//         return [];
//     }

//     // Extract token addresses
//     const tokenAddresses = tokenList.map((token: { address: string }) => token.address);

//     try {
//         const tokenResponse = await fetch(`https://api.shyft.to/sol/v1/wallet/all_tokens?network=mainnet-beta&wallet=${address}`, {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'x-api-key': process.env.SHYFT_API_KEY as string,
//             },
//         });

//         const tokenData:WalletTokensResponse = await tokenResponse.json();
//         let emptyTokens: Token[] = [];

//         for (let token of tokenData.result) {
//             if (token.balance === 0 && !tokenAddresses.includes(token.address)) {
//                 emptyTokens.push({
//                     address: token.address,
//                     decimals: token.info.decimals,
//                 });
//             }
//         }

//         return emptyTokens;
//     } catch (error) {
//         console.error('Error fetching wallet tokens:', error);
//         return [];
//     }
// }


export const GET = async (req: Request) => {

    const payload: ActionGetResponse = {
        icon: 'https://qph.cf2.quoracdn.net/main-qimg-9605a2ad7033f8f568d3b08d443f26c6',
        description: `The platform facilitates irreversible token burning, with users accepting full responsibility for any burns. The platform disclaims liability for any mistakes or unintended actions resulting in undesired burns. Use at your own risk.`,
        title: `Token Burning Disclaimer`,
        label: 'Start burning tokens now!',
    }

    return Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS
    });

}

export const OPTIONS = GET;

export const POST = async (req: Request) => {
    const connection = new Connection(clusterApiUrl("mainnet-beta"));

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
        const tokenList = await getWalletTokens(body.account);

        if (tokenList.length === 0) {
            return new Response('no tokens found', {
                status: 400,
                headers: ACTIONS_CORS_HEADERS
            })

        } else {
            let transaction = new Transaction();

            const MINT_ADDRESS = tokenList[0].address;
            const burnIx = createBurnCheckedInstruction(
                account, // PublicKey of Owner's Associated Token Account
                new PublicKey(MINT_ADDRESS), // Public Key of the Token Mint Address
                account, // Public Key of Owner's Wallet
                0, // Number of tokens to burn
                tokenList[0].decimals // Number of Decimals of the Token Mint
            );

            try {
                transaction.feePayer = new PublicKey(account);
                transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                transaction.add(burnIx);

                const payload: ActionPostResponse = await createPostResponse({
                    fields: {
                        transaction,
                        message: 'Burning tokens is irreversible and final. Proceed with caution.'
                    }
                })

                return Response.json(payload, { headers: ACTIONS_CORS_HEADERS })
            } catch (err) {
                return Response.json("unkown error account not found", { status: 400 })
            }
        }
    } catch (err) {
        return Response.json("unkown error account not found", { status: 400 })
    }
}