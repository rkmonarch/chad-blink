import { ACTIONS_CORS_HEADERS, ActionGetResponse } from "@solana/actions";

export const GET = async (req: Request) => {

    const payload: ActionGetResponse = {
        icon: 'https://qph.cf2.quoracdn.net/main-qimg-9605a2ad7033f8f568d3b08d443f26c6',
        label: `The platform facilitates irreversible token burning, with users accepting full responsibility for any burns. The platform disclaims liability for any mistakes or unintended actions resulting in undesired burns. Use at your own risk.`,
        description: `Token Burning Disclaimer`,
        title: 'Start burning tokens now!',
    }

    return Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS
    });

}

export const OPTIONS = GET;