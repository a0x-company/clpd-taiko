import { ethers } from "ethers";
import { WalletOperationMediator } from "./mediator";
import { BASE_ADDRESS } from "@internal/constants/address";
import { formatUnits, parseUnits } from "viem";
import { ContractService } from "@internal/ethereum/contract-service";
import { ERC20TokenContract, UniswapRouterContract, UniswapV3LiquidityPoolContract } from "./contracts";
import { User } from "@internal/users/types";
import { CryptoService } from "@internal/users/crypto-service";
import { TokenTransferOperation } from "./operations";

export class WalletService {
  private readonly contractService: ContractService;
  private readonly mediator: WalletOperationMediator;
  private readonly contracts: {
    clpd: ERC20TokenContract
    usdc: ERC20TokenContract;
    pool: UniswapV3LiquidityPoolContract;
    router: UniswapRouterContract;
  };
  private cryptoService: CryptoService;

  constructor(rpcUrl: string) {
    this.contractService = new ContractService(rpcUrl);
    this.cryptoService = new CryptoService();
    
    this.contracts = {
      clpd: new ERC20TokenContract(
        BASE_ADDRESS.CLPD.address,
        this.contractService,
      ),
      usdc: new ERC20TokenContract(
        BASE_ADDRESS.USDC.address,
        this.contractService,
      ),
      pool: new UniswapV3LiquidityPoolContract(
        BASE_ADDRESS.POOL_USDC_CLPD,
        this.contractService
      ),
      router: new UniswapRouterContract(
        BASE_ADDRESS.AERO_SWAP,
        this.contractService
      )
    };

    this.mediator = new WalletOperationMediator(
      this.contractService,
      this.contracts
    );
  }

  async getTokenBalance(
    user: User,
    tokenSymbol: "CLPD" | "USDC"
  ): Promise<number> {
    if (!user.address) {
      throw new Error("User address is undefined");
    }

    const token = this.contracts[tokenSymbol.toLowerCase()];
    const balance = await token.getBalance(user.address);
    
    const decimals = tokenSymbol === "CLPD" ? 
      BASE_ADDRESS.CLPD.decimals : 
      BASE_ADDRESS.USDC.decimals;

    return Number(formatUnits(balance, decimals));
  }

  async transferToken(
    user: User,
    address: string,
    tokenSymbol: "CLPD" | "USDC",
    withdrawAmount: number
  ): Promise<string> {
    if (!user.address || !user.internalPrivateKeys?.evmPrivateKey) {
      throw new Error("User address or private key is undefined");
    }

    const token = this.contracts[tokenSymbol.toLowerCase()];
    const tokenBalance = await token.getBalance(user.address);
    console.log("💰 Token balance in user wallet:", formatUnits(tokenBalance, 18));

    if (tokenBalance < parseUnits(withdrawAmount.toString(), 18)) {
      throw new Error(`Insufficient ${tokenSymbol} balance: available ${formatUnits(tokenBalance, 18)}`);
    }

    const signer = new ethers.Wallet(
      this.cryptoService.decrypt(user.internalPrivateKeys.evmPrivateKey),
      this.contractService.jsonRpcProvider
    );

    const operation = new TokenTransferOperation(
      this.contractService,
      token,
      {
        to: address,
        amount: parseUnits(withdrawAmount.toString(), 18),
        signer
      }
    );

    const result = await this.contractService.executeOperation(operation);
    return result.hash;
  }

  async swapToken(
    user: User,
    tokenInSymbol: "CLPD" | "USDC",
    amountIn: number
  ): Promise<string> {
    if (!user.address || !user.internalPrivateKeys?.evmPrivateKey) {
      throw new Error("User address or private key is undefined");
    }

    const tokenIn = this.contracts[tokenInSymbol.toLowerCase()];
    const tokenOut = tokenInSymbol === "CLPD" ? this.contracts.usdc : this.contracts.clpd;

    const tokenBalance = await tokenIn.getBalance(user.address);
    if (tokenBalance < parseUnits(amountIn.toString(), 18)) {
      throw new Error(`Insufficient ${tokenInSymbol} balance: available ${formatUnits(tokenBalance, 18)}`);
    }

    const signer = new ethers.Wallet(
      this.cryptoService.decrypt(user.internalPrivateKeys.evmPrivateKey),
      this.contractService.jsonRpcProvider
    );

    const result = await this.mediator.executeSwapWithApproval({
      tokenIn,
      tokenOut,
      amount: parseUnits(amountIn.toString(), 18),
      signer
    });

    return result.hash;
  }

  async investCLPD(
    user: User,
    amountCLPD: number
  ): Promise<string> {
    if (!user.address || !user.internalPrivateKeys?.evmPrivateKey) {
      throw new Error("User address or private key is undefined");
    }

    const clpdBalance = await this.contracts.clpd.getBalance(user.address);
    if (clpdBalance < parseUnits(amountCLPD.toString(), 18)) {
      throw new Error(`Insufficient CLPD balance: available ${formatUnits(clpdBalance, 18)}`);
    }

    const signer = new ethers.Wallet(
      this.cryptoService.decrypt(user.internalPrivateKeys.evmPrivateKey),
      this.contractService.jsonRpcProvider
    );

    const result = await this.mediator.executeLiquidityAdditionWithApproval({
      token: this.contracts.clpd,
      amount: parseUnits(amountCLPD.toString(), 18),
      signer,
      isClpd: true
    });

    return result.hash;
  }

  async investUSDC(
    user: User,
    amountUSDC: number
  ): Promise<string> {
    if (!user.address || !user.internalPrivateKeys?.evmPrivateKey) {
      throw new Error("User address or private key is undefined");
    }

    const usdcBalance = await this.contracts.usdc.getBalance(user.address);
    if (usdcBalance < parseUnits(amountUSDC.toString(), 6)) {
      throw new Error(`Insufficient USDC balance: available ${formatUnits(usdcBalance, 6)}`);
    }

    const signer = new ethers.Wallet(
      this.cryptoService.decrypt(user.internalPrivateKeys.evmPrivateKey),
      this.contractService.jsonRpcProvider
    );

    const result = await this.mediator.executeLiquidityAdditionWithApproval({
      token: this.contracts.usdc,
      amount: parseUnits(amountUSDC.toString(), 6),
      signer,
      isClpd: false
    });

    return result.hash;
  }

  async getPositions(user: User): Promise<{
    amountCLPD: number;
    amountUSDC: number;
  }> {
    if (!user.address) {
      throw new Error("User address is undefined");
    }

    const [liquidity, totalSupply, reserves] = await Promise.all([
      this.contracts.pool.getBalance(user.address),
      this.contracts.pool.getTotalSupply(),
      this.contracts.pool.getReserves()
    ]);

    const amountCLPDWithDecimals = Math.round(
      (Number(liquidity) / Number(totalSupply)) * Number(reserves[0])
    );
    const amountUSDCWithDecimals = Math.round(
      (Number(liquidity) / Number(totalSupply)) * Number(reserves[1])
    );

    return {
      amountCLPD: Number(formatUnits(BigInt(amountCLPDWithDecimals), 18)),
      amountUSDC: Number(formatUnits(BigInt(amountUSDCWithDecimals), 6))
    };
  }
}