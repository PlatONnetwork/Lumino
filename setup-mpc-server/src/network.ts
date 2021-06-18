export interface Network {
    host: string;
    hrp: string;
    chainId: number;
}

export const ALAYA = {
    host: `https://openapi.alaya.network/rpc`,
    hrp: "atp",
    chainId: 201018
}

export const ALAYA_DEV = {
    host: `http://47.241.91.2:6789`,
    hrp: "atp",
    chainId: 201030
}

export function getNetwork(ethNet: string) :Network {
    switch(ethNet.toUpperCase()) {
        case 'ALAYA':
            return ALAYA;
        case 'ALAYA-DEV':
            return ALAYA_DEV
        default:
            return ALAYA
    }
}

