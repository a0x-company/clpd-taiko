export const BASE_ADDRESS = {
  AERO_SWAP: "0x34d2C23dC8C51D26D26BCc37608Cf5638Ac7ca2c",
  POOL_USDC_CLPD: "0x82dbc912599EfDa0F1FDC6e2A13c3843EC48662d",
  POSITION_MANAGE: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
  FACTORY: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
  CLPD: {
    address: "0x24460D2b3d96ee5Ce87EE401b1cf2FD01545d9b1",
    decimals: 18,
  },
  USDC: {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
  },
} as const;

export const BASE_SEPOLIA_ADDRESS = {
  CLPD: {
    address: "0xe2C6D205F0EF4A215B66B25437BbC5C8d59525FE", 
    decimals: 18,
  }
} as const;

export const TAIKO_HEKLA_ADDRESS = {
  CLPD: {
    address: "0x53c04d5FC9F8d5c4f3C45B4da6617868ECEaF636",
    decimals: 18,
  }
} as const;

export const CHAIN_ADDRESSES = {
  "base": BASE_ADDRESS,
  "base-sepolia": BASE_SEPOLIA_ADDRESS,
  "taiko-hekla-testnet": TAIKO_HEKLA_ADDRESS,
} as const;