import { ContractService, Operation, TransactionResult } from "@internal/ethereum/contract-service";
import { ERC20TokenContract } from "../contracts/erc20-token";
import { ERC20_CONTRACT_ABI } from "@internal/constants/abis";
import { formatUnits } from "viem";
import { ethers } from "ethers";

export class TokenTransferOperation implements Operation {
  constructor(
    private readonly contractService: ContractService,
    private readonly tokenContract: ERC20TokenContract,
    private readonly params: {
      to: string;
      amount: bigint;
      signer: ethers.Wallet;
    }
  ) {}

  async execute(): Promise<TransactionResult> {
    return this.contractService.callContract({
      contractAddress: this.tokenContract.address,
      abi: ERC20_CONTRACT_ABI,
      method: 'transfer',
      methodParams: [this.params.to, this.params.amount],
      signer: this.params.signer
    });
  }

  getDescription(): string {
    return `Transfer ${formatUnits(this.params.amount, 18)} tokens to ${this.params.to}`;
  }
}

export class TokenApprovalOperation implements Operation {
  constructor(
    private readonly contractService: ContractService,
    private readonly tokenContract: ERC20TokenContract,
    private readonly params: {
      spender: string;
      amount: bigint;
      signer: ethers.Wallet;
    }
  ) {}

  async execute(): Promise<TransactionResult> {
    return this.contractService.callContract({
      contractAddress: this.tokenContract.address,
      abi: ERC20_CONTRACT_ABI,
      method: 'approve',
      methodParams: [this.params.spender, this.params.amount],
      signer: this.params.signer
    });
  }

  getDescription(): string {
    return `Approve ${formatUnits(this.params.amount, 18)} tokens for ${this.params.spender}`;
  }
}