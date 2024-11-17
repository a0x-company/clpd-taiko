import { ContractService, Operation, TransactionResult } from "@internal/ethereum/contract-service";
import { ethers } from "ethers";
import { CLPDTokenContract } from "../contracts/clpd-token";
import { CLPD_TOKEN_ABI } from "@internal/constants/abis";

export class BridgeCLPDOperation implements Operation {
  constructor(
    private readonly contractService: ContractService,
    private readonly clpdContract: CLPDTokenContract,
    private readonly params: {
      amount: bigint;
      chain: string;
      signer: ethers.Wallet;
    }
  ) {}

  async execute(): Promise<TransactionResult> {
    return this.contractService.callContract({
      contractAddress: this.clpdContract.address,
      abi: CLPD_TOKEN_ABI,
      method: 'bridgeCLPD',
      methodParams: [this.params.amount, this.params.chain],
      signer: this.params.signer
    });
  }

  getDescription(): string {
    return `Bridge ${this.params.amount} CLPD a la cadena ${this.params.chain}`;
  }
}

export class VerifyValueAPIOperation implements Operation {
    constructor(
      private readonly contractService: ContractService,
      private readonly clpdContract: CLPDTokenContract,
      private readonly params: {
        totalSupplyAllChains: bigint;
        currentBankBalance: bigint;
        agentSigner: ethers.Wallet;
      }
    ) {}
  
    async execute(): Promise<TransactionResult> {
      return this.contractService.callContract({
        contractAddress: this.clpdContract.address,
        abi: CLPD_TOKEN_ABI,
        method: 'verifyValueAPI',
        methodParams: [this.params.totalSupplyAllChains, this.params.currentBankBalance],
        signer: this.params.agentSigner
      });
    }
  
    getDescription(): string {
      return `Verify API values with totalSupply=${this.params.totalSupplyAllChains} and bankBalance=${this.params.currentBankBalance}`;
    }
  }

  export class MintTokensOperation implements Operation {
    constructor(
      private readonly contractService: ContractService,
      private readonly clpdContract: CLPDTokenContract,
      private readonly params: {
        pendingUsers: string[];
        pendingAmounts: bigint[];
        agentSigner: ethers.Wallet;
      }
    ) {}
  
    async execute(): Promise<TransactionResult> {
      return this.contractService.callContract({
        contractAddress: this.clpdContract.address,
        abi: CLPD_TOKEN_ABI,
        method: 'mintTokens',
        methodParams: [this.params.pendingUsers, this.params.pendingAmounts],
        signer: this.params.agentSigner
      });
    }
  
    getDescription(): string {
      return `Mint tokens for users: ${this.params.pendingUsers.join(', ')}`;
    }
  }

  export class BurnTokensOperation implements Operation {
    constructor(
      private readonly contractService: ContractService,
      private readonly clpdContract: CLPDTokenContract,
      private readonly params: {
        amount: bigint;
        userAddress: string;
        signer: ethers.Wallet;
      }
    ) {}
  
    async execute(): Promise<TransactionResult> {
      return this.contractService.callContract({
        contractAddress: this.clpdContract.address,
        abi: CLPD_TOKEN_ABI,
        method: 'burnTokens',
        methodParams: [this.params.amount, this.params.userAddress],
        signer: this.params.signer
      });
    }
  
    getDescription(): string {
      return `Burn ${this.params.amount} tokens from user: ${this.params.userAddress}`;
    }
  }