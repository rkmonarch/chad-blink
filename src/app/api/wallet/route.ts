import getWalletTokens from "@/utils/wallet/getWalletTokens";
import { ACTIONS_CORS_HEADERS, ActionGetResponse } from "@solana/actions";

export const GET = async (req: Request) => {
    const url = new URL(req.url!);
    const address = url.searchParams.get("address");
    try {
        const tokenList = await getWalletTokens(address!);
        const payload: ActionGetResponse = {
            icon: 'https://qph.cf2.quoracdn.net/main-qimg-9605a2ad7033f8f568d3b08d443f26c6',
            description: `The platform facilitates irreversible token burning, with users accepting full responsibility for any burns. The platform disclaims liability for any mistakes or unintended actions resulting in undesired burns. Use at your own risk.`,
            title: `Token Burning Disclaimer`,
            label: 'Start burning tokens now!',
        }
        return Response.json(payload, {
            headers: ACTIONS_CORS_HEADERS
        })

    } catch (error) {
        console.error('Error fetching wallet tokens:', error);
        return new Response('no tokens found', {
            status: 400,
            headers: ACTIONS_CORS_HEADERS
        })
    }
}