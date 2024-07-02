import fs from 'fs';

interface Token {
    address: string;
    decimals: number;
}

export default async function getWalletTokens(address: string) {
    const filePath = 'src/utils/jupiter/strict.ts';

    // Read and parse the token list
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const tokenList = JSON.parse(fileData);

    // Extract token addresses
    const tokenAddresses = tokenList.map((token: { address: string }) => token.address);

    try {
        const tokenResponse = await fetch(`https://api.shyft.to/sol/v1/wallet/all_tokens?network=mainnet-beta&wallet=${address}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.SHYFT_API_KEY as string,
            },
        });

        const tokenData = await tokenResponse.json();
        let emptyTokens: Token[] = [];

        for (let token of tokenData.result) {
            if (token.balance === 0 && !tokenAddresses.includes(token.address)) {
                emptyTokens.push({
                    address: token.address,
                    decimals: token.info.decimals,
                });
            }
        }

        return emptyTokens;
    } catch (error) {
        console.error('Error fetching wallet tokens:', error);
        return [];
    }
}
