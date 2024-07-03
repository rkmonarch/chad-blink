import getWalletTokens from "@/utils/wallet/getWalletTokens";
import { ACTIONS_CORS_HEADERS, ActionGetResponse, ActionPostRequest, ActionPostResponse, createPostResponse } from "@solana/actions";
import { createBurnCheckedInstruction, createCloseAccountInstruction } from "@solana/spl-token";
import { Connection, PublicKey, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction, clusterApiUrl } from "@solana/web3.js";


interface InstructionPayload {
    instructions: TransactionInstruction[];
    addresses: string[];
}

export interface TransactionPayload {
    transaction: Transaction;
    addresses: string[];
}

export function bundleIxsIntoTxArray(
    instructions: InstructionPayload[],
    maxPerTransaction: number
) {
    const transactions: TransactionPayload[] = [];

    while (instructions.length > 0) {
        const ixs = instructions.splice(0, maxPerTransaction);
        const payload: TransactionPayload = ixs.reduce(
            (txPayload, ix) => {
                txPayload.transaction.add(...ix.instructions);
                txPayload.addresses.push(...ix.addresses);
                return txPayload;
            },
            {
                transaction: new Transaction(),
                addresses: [] as string[],
            }
        );
        transactions.push(payload);
    }

    return transactions;
}

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
        console.log("tokenList", tokenList)

        if (tokenList.length === 0) {
            return new Response('no tokens found', {
                status: 400,
                headers: ACTIONS_CORS_HEADERS
            })

        } else {
            let transaction = new Transaction();
            console.log("tokenList", tokenList[0].amount * (10 ** tokenList[0].decimals))
            const MINT_ADDRESS = tokenList[0].address;
            // const burnIx = createBurnCheckedInstruction(
            //     account, // PublicKey of Owner's Associated Token Account
            //     new PublicKey(MINT_ADDRESS), // Public Key of the Token Mint Address
            //     account, // Public Key of Owner's Wallet
            //     tokenList[0].amount * (10 ** tokenList[0].decimals), // Number of tokens to burn
            //     tokenList[0].decimals // Number of Decimals of the Token Mint
            // );
            const closeIxPayloads: InstructionPayload[] = tokenList.map((token) => {
                return {
                    instructions: [
                        createCloseAccountInstruction(
                            new PublicKey(token.address),
                            account,
                            account
                        )
                    ],
                    addresses: [account.toBase58(), token.address]
                }
            }
            );

            const transactions: TransactionPayload[] = bundleIxsIntoTxArray(
                closeIxPayloads,
                27
            );
            try {
                transaction.feePayer = new PublicKey(account);
                transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                transaction.add(...transactions[0].transaction.instructions);

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