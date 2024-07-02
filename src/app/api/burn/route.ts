import getWalletTokens from "@/utils/wallet/getWalletTokens";
import { ACTIONS_CORS_HEADERS, ActionGetResponse, ActionPostRequest, ActionPostResponse, createPostResponse } from "@solana/actions";
import { createBurnCheckedInstruction } from "@solana/spl-token";
import { Connection, PublicKey, Transaction, TransactionMessage, VersionedTransaction, clusterApiUrl } from "@solana/web3.js";

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
        const tokenList = await getWalletTokens(account.toBase58());
        console.log("tokenList", tokenList);
        let transaction = new Transaction();

        const MINT_ADDRESS = tokenList[0].address;
        const burnIx = createBurnCheckedInstruction(
            account, // PublicKey of Owner's Associated Token Account
            new PublicKey(MINT_ADDRESS), // Public Key of the Token Mint Address
            account, // Public Key of Owner's Wallet
            0 * (10**tokenList[0].decimals), // Number of tokens to burn
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
        } catch (error) {
            console.log("error", error);
        }

    } catch (err) {
        return Response.json("unkown error account not found", { status: 400 })
    }
}