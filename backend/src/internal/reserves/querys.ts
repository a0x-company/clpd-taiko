import { gql } from '@apollo/client';

export const GET_RECENT_BRIDGES = gql`
  query ObtenerBridgesRecientes {
    tokensBridges(first: 10, orderBy: timestamp_, orderDirection: desc) {
      id
      block_number
      timestamp_
      transactionHash_
      contractId_
      user
      amount
      chain
    }
  }
`;

export const GET_RECENT_TOKENS_MINTED = gql`
  query ObtenerTokensMintedRecientes {
    tokensMinteds(first: 10, orderBy: timestamp_, orderDirection: desc) {
      id
      block_number
      timestamp_
      transactionHash_
      contractId_
      agent
      user
      amount
    }
  }
`;

export const GET_RECENT_TOKENS_BURNED = gql`
  query ObtenerTokensBurnedRecientes {
    tokensBurneds(first: 10, orderBy: timestamp_, orderDirection: desc) {
      id
      block_number
      timestamp_
      transactionHash_
      contractId_
      user
      amount
    }
  }
`;