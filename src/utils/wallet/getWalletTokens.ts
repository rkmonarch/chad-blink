interface Token {
    address: string;
    decimals: number;
    amount: number;
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

export default async function getWalletTokens(address: string) {
    const response = await fetch("https://token.jup.ag/strict");
    const data = await response.json();
    console.log("data", data.length)
    let tokenList: { address: string }[];

    try {
        tokenList = data;
    } catch (err) {
        console.error('Error reading or parsing token list file:', err);
        return [];
    }

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

        const tokenData: WalletTokensResponse = await tokenResponse.json();
        let emptyTokens: Token[] = [];

        for (let token of tokenData.result) {
            if (token.balance === 0 && !tokenAddresses.includes(token.address)) {
                emptyTokens.push({
                    address: token.address,
                    decimals: token.info.decimals,
                    amount: token.balance,
                });
            }
        }

        return emptyTokens;
    } catch (error) {
        console.error('Error fetching wallet tokens:', error);
        return [];
    }
}
