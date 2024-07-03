import getWalletTokens from "@/utils/wallet/getWalletTokens";
import { ACTIONS_CORS_HEADERS, ActionGetResponse, ActionPostRequest, ActionPostResponse, createPostResponse } from "@solana/actions";
import { Connection, PublicKey, Transaction, clusterApiUrl } from "@solana/web3.js";
import { createCloseAccountInstruction, getAssociatedTokenAddress } from "@solana/spl-token";

export const GET = async (req: Request) => {

    const payload: ActionGetResponse = {
        icon: 'https://static.vecteezy.com/system/resources/previews/035/808/957/non_2x/3d-round-arrow-with-golden-coins-in-wallet-render-cashback-or-return-money-in-shopping-concept-of-payment-with-money-back-refund-and-digital-payment-return-of-investment-illustration-vector.jpg',
        description: `The platform facilitates irreversible token closing, with users accepting full responsibility for any burns. The platform disclaims liability for any mistakes or unintended actions resulting in undesired token closing. Use at your own risk.`,
        title: `Close the unwanted token accounts!, Get 0.002 SOL back for each token closed`,
        label: 'Close Token Account',
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

            try {
                transaction.feePayer = new PublicKey(account);
                transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                const associatedAccount = await getAssociatedTokenAddress(
                    new PublicKey(MINT_ADDRESS),
                    account
                );
                let tx = new Transaction().add(
                    createCloseAccountInstruction(
                        associatedAccount,
                        account,
                        account
                    )
                );
                transaction.add(tx)

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