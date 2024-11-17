import { ethers } from "ethers";
import { WalletOperationMediator } from "./mediator";
import { formatUnits, parseUnits } from "viem";
import { ContractService } from "@internal/ethereum/contract-service";
import { ERC20TokenContract, UniswapRouterContract, UniswapV3LiquidityPoolContract } from "./contracts";
import { User } from "@internal/users/types";
import { CryptoService } from "@internal/users/crypto-service";
import { TokenTransferOperation } from "./operations";
import { ChainConfig, ChainId } from "./types";
import { CLPDTokenContract } from "./contracts/clpd-token";
import { BurnTokensOperation, MintTokensOperation } from "./operations/clpd-token";

export class WalletService {
  private readonly contractServices: Map<ChainId, ContractService>;
  private readonly mediators: Map<ChainId, WalletOperationMediator>;
  private readonly chainContracts: Map<ChainId, {
    clpd: ERC20TokenContract;
    usdc: ERC20TokenContract;
    pool: UniswapV3LiquidityPoolContract;
    router: UniswapRouterContract;
    clpdToken: CLPDTokenContract;
  }>;
  private cryptoService: CryptoService;

  constructor(chainConfigs: Record<ChainId, ChainConfig>) {
    this.contractServices = new Map();
    this.mediators = new Map();
    this.chainContracts = new Map();
    this.cryptoService = new CryptoService();

    console.log("🔧 Inicializando servicios para cada cadena");

    Object.entries(chainConfigs).forEach(([chainId, config]) => {
      console.log(`📈 Configurando chain: ${chainId}`);
      const contractService = new ContractService(config.rpcUrl);
      this.contractServices.set(chainId as ChainId, contractService);

      const contracts = {
        clpd: new ERC20TokenContract(config.addresses.CLPD.address, contractService),
        usdc: new ERC20TokenContract(config.addresses.USDC?.address || '', contractService),
        pool: new UniswapV3LiquidityPoolContract(config.addresses.POOL_USDC_CLPD || '', contractService),
        router: new UniswapRouterContract(config.addresses.AERO_SWAP || '', contractService),
        clpdToken: new CLPDTokenContract(config.addresses.CLPD.address, contractService)
      };
      console.log(`📄 Contratos instanciados para ${chainId}`);

      this.chainContracts.set(chainId as ChainId, contracts);
    });

    const mediatorConfigs = {} as Record<ChainId, {
      contractService: ContractService;
      contracts: {
        clpd: ERC20TokenContract;
        usdc: ERC20TokenContract;
        pool: UniswapV3LiquidityPoolContract;
        router: UniswapRouterContract;
        clpdToken: CLPDTokenContract;
      };
    }>;

    Object.entries(chainConfigs).forEach(([chainId, _]) => {
      const chain = chainId as ChainId;
      const contractService = this.contractServices.get(chain)!;
      const contracts = this.chainContracts.get(chain)!;

      mediatorConfigs[chain] = {
        contractService,
        contracts
      };
    });

    const mediator = new WalletOperationMediator(mediatorConfigs);
    console.log("🔗 Mediador creado para todas las cadenas");

    Object.keys(chainConfigs).forEach((chainId) => {
      this.mediators.set(chainId as ChainId, mediator);
    });
  }

  private getChainServices(chain: ChainId = "base") {
    const contracts = this.chainContracts.get(chain);
    const mediator = this.mediators.get(chain);
    const contractService = this.contractServices.get(chain);

    if (!contracts || !mediator || !contractService) {
      console.error(`❌ La cadena ${chain} no está configurada correctamente`);
      throw new Error(`Chain ${chain} not configured`);
    }

    return { contracts, mediator, contractService };
  }

  async getTokenBalance(
    user: User,
    tokenSymbol: "CLPD" | "USDC",
    chain: ChainId = "base"
  ): Promise<number> {
    console.log(`🔍 Consultando balance de ${tokenSymbol} para ${user.address}`);
    if (!user.address) {
      throw new Error("User address is undefined");
    }

    const { contracts } = this.getChainServices(chain);
    const token = contracts[tokenSymbol.toLowerCase()];
    const balance = await token.getBalance(user.address);
    console.log(`📊 Balance obtenido: ${balance}`);

    const decimals = tokenSymbol === "CLPD" ? 18 : 6;
    const formattedBalance = formatUnits(balance, decimals);
    return Number(formattedBalance);
  }

  async transferToken(
    user: User,
    address: string,
    tokenSymbol: "CLPD" | "USDC",
    withdrawAmount: number,
    chain: ChainId = "base"
  ): Promise<string> {
    console.log(`🔄 Iniciando transferencia de ${withdrawAmount} ${tokenSymbol}`);
    if (!user.address || !user.internalPrivateKeys?.evmPrivateKey) {
      throw new Error("User address or private key is undefined");
    }

    const { contracts, contractService } = this.getChainServices(chain);
    const token = contracts[tokenSymbol.toLowerCase()];
    const tokenBalance = await token.getBalance(user.address);

    if (tokenBalance < parseUnits(withdrawAmount.toString(), 18)) {
      throw new Error(`Insufficient ${tokenSymbol} balance: available ${formatUnits(tokenBalance, 18)}`);
    }

    const decryptedKey = this.cryptoService.decrypt(user.internalPrivateKeys.evmPrivateKey);
    const signer = new ethers.Wallet(decryptedKey, contractService.jsonRpcProvider);

    const operation = new TokenTransferOperation(
      contractService,
      token,
      {
        to: address,
        amount: parseUnits(withdrawAmount.toString(), 18),
        signer
      }
    );

    const result = await contractService.executeOperation(operation);
    console.log(`✅ Transferencia ejecutada: ${result.hash}`);
    return result.hash;
  }

  async swapToken(
    user: User,
    amount: number,
    fromToken: "CLPD" | "USDC",
    chain: ChainId = "base"
  ): Promise<string> {
    console.log(`🔄 Iniciando swap de ${amount} ${fromToken}`);
    if (!user.address || !user.internalPrivateKeys?.evmPrivateKey) {
      throw new Error("User address or private key is undefined");
    }

    const { contracts, mediator, contractService } = this.getChainServices(chain);
    const tokenIn = contracts[fromToken.toLowerCase()];
    const toToken: "CLPD" | "USDC" = fromToken === "CLPD" ? "USDC" : "CLPD";
    const tokenOut = contracts[toToken.toLowerCase()];

    const decimals = fromToken === "CLPD" ? 18 : 6;
    const balance = await tokenIn.getBalance(user.address);

    if (balance < parseUnits(amount.toString(), decimals)) {
      throw new Error(`Insufficient ${fromToken} balance: available ${formatUnits(balance, decimals)}`);
    }

    const decryptedKey = this.cryptoService.decrypt(user.internalPrivateKeys.evmPrivateKey);
    const signer = new ethers.Wallet(decryptedKey, contractService.jsonRpcProvider);

    const result = await mediator.executeSwapWithApproval({
      tokenIn,
      tokenOut,
      amount: parseUnits(amount.toString(), decimals),
      signer
    });

    if (!result.success) {
      throw new Error("Swap failed");
    }

    console.log(`✅ Swap completado: ${result.hash}`);
    return result.hash;
  }

  async investCLPD(
    user: User,
    amount: number,
    chain: ChainId = "base"
  ): Promise<string> {
    console.log(`💼 Invirtiendo ${amount} CLPD`);
    if (!user.address || !user.internalPrivateKeys?.evmPrivateKey) {
      throw new Error("User address or private key is undefined");
    }

    const { contracts, mediator, contractService } = this.getChainServices(chain);
    const balance = await contracts.clpd.getBalance(user.address);

    if (balance < parseUnits(amount.toString(), 18)) {
      throw new Error(`Insufficient CLPD balance: available ${formatUnits(balance, 18)}`);
    }

    const decryptedKey = this.cryptoService.decrypt(user.internalPrivateKeys.evmPrivateKey);
    const signer = new ethers.Wallet(decryptedKey, contractService.jsonRpcProvider);

    const result = await mediator.executeLiquidityAdditionWithApproval({
      token: contracts.clpd,
      amount: parseUnits(amount.toString(), 18),
      signer,
      isClpd: true
    });

    if (!result.success) {
      throw new Error("Investment failed");
    }

    console.log(`✅ Inversión completada: ${result.hash}`);
    return result.hash;
  }

  async investUSDC(
    user: User,
    amount: number,
    chain: ChainId = "base"
  ): Promise<string> {
    console.log(`💼 Invirtiendo ${amount} USDC`);
    if (!user.address || !user.internalPrivateKeys?.evmPrivateKey) {
      throw new Error("User address or private key is undefined");
    }

    const { contracts, mediator, contractService } = this.getChainServices(chain);
    const balance = await contracts.usdc.getBalance(user.address);

    if (balance < parseUnits(amount.toString(), 6)) {
      throw new Error(`Insufficient USDC balance: available ${formatUnits(balance, 6)}`);
    }

    const decryptedKey = this.cryptoService.decrypt(user.internalPrivateKeys.evmPrivateKey);
    const signer = new ethers.Wallet(decryptedKey, contractService.jsonRpcProvider);

    const result = await mediator.executeLiquidityAdditionWithApproval({
      token: contracts.usdc,
      amount: parseUnits(amount.toString(), 6),
      signer,
      isClpd: false
    });

    if (!result.success) {
      throw new Error("Investment failed");
    }

    console.log(`✅ Inversión completada: ${result.hash}`);
    return result.hash;
  }

  async getPositions(
    user: User,
    chain: ChainId = "base"
  ): Promise<{ amountCLPD: number; amountUSDC: number }> {
    console.log(`📊 Obteniendo posiciones para ${user.address}`);
    if (!user.address) {
      throw new Error("User address is undefined");
    }

    const { contracts } = this.getChainServices(chain);
    const [liquidity, totalSupply, reserves] = await Promise.all([
      contracts.pool.getBalance(user.address),
      contracts.pool.getTotalSupply(),
      contracts.pool.getReserves()
    ]);

    const amountCLPDWithDecimals = Math.round(
      (Number(liquidity) / Number(totalSupply)) * Number(reserves[0])
    );
    const amountUSDCWithDecimals = Math.round(
      (Number(liquidity) / Number(totalSupply)) * Number(reserves[1])
    );

    const formattedCLPD = Number(formatUnits(BigInt(amountCLPDWithDecimals), 18));
    const formattedUSDC = Number(formatUnits(BigInt(amountUSDCWithDecimals), 6));
    console.log(`💼 Posiciones: ${formattedCLPD} CLPD, ${formattedUSDC} USDC`);

    return {
      amountCLPD: formattedCLPD,
      amountUSDC: formattedUSDC
    };
  }
  
  async mintTokens(
    agentSigner: ethers.Wallet,
    pendingUsers: string[],
    pendingAmounts: number[],
    chain: ChainId = "base"
  ): Promise<string> {
    console.log(`🪙 Iniciando mint de tokens`);
    const { contracts, contractService } = this.getChainServices(chain);
    const parsedAmounts = pendingAmounts.map(amount => parseUnits(amount.toString(), 18));

    const operation = new MintTokensOperation(
      contractService,
      contracts.clpdToken,
      {
        pendingUsers,
        pendingAmounts: parsedAmounts,
        agentSigner
      }
    );

    const result = await contractService.executeOperation(operation);
    console.log(`✅ Tokens minteados: ${result.hash}`);
    return result.hash;
  }

  async burnTokens(
    user: User,
    amount: number,
    chain: ChainId = "base"
  ): Promise<string> {
    console.log(`🔥 Iniciando burn de ${amount} CLPD`);
    if (!user.address || !user.internalPrivateKeys?.evmPrivateKey) {
      throw new Error("User address or private key is undefined");
    }

    const { contracts, contractService } = this.getChainServices(chain);
    const balance = await contracts.clpdToken.getBalance(user.address);

    if (BigInt(balance) < parseUnits(amount.toString(), 18)) {
      throw new Error(`Insufficient CLPD balance: available ${formatUnits(BigInt(balance), 18)}`);
    }

    const decryptedKey = this.cryptoService.decrypt(user.internalPrivateKeys.evmPrivateKey);
    const signer = new ethers.Wallet(decryptedKey, contractService.jsonRpcProvider);

    const operation = new BurnTokensOperation(
      contractService,
      contracts.clpdToken,
      {
        amount: parseUnits(amount.toString(), 18),
        userAddress: user.address,
        signer
      }
    );

    const result = await contractService.executeOperation(operation);
    console.log(`✅ Tokens quemados: ${result.hash}`);
    return result.hash;
  }

  async bridgeToken(
    user: User,
    amount: number,
    sourceChain: ChainId,
    targetChain: ChainId
  ): Promise<string> {
    console.log(`🌉 Iniciando bridge de ${amount} CLPD: ${sourceChain} -> ${targetChain}`);
    if (!user.address || !user.internalPrivateKeys?.evmPrivateKey) {
      throw new Error("User address or private key is undefined");
    }

    const { contracts, mediator, contractService } = this.getChainServices(sourceChain);
    const clpdBalance = await contracts.clpd.getBalance(user.address);

    if (clpdBalance < parseUnits(amount.toString(), 18)) {
      throw new Error(`Insufficient CLPD balance on ${sourceChain}: available ${formatUnits(clpdBalance, 18)}`);
    }

    const decryptedKey = this.cryptoService.decrypt(user.internalPrivateKeys.evmPrivateKey);
    const signer = new ethers.Wallet(decryptedKey, contractService.jsonRpcProvider);

    const result = await mediator.executeCrossChainBridge({
      amount: parseUnits(amount.toString(), 18),
      sourceChain,
      targetChain,
      userSigner: signer
    });

    if (!result.success) {
      throw new Error(`Bridge process failed on ${sourceChain}`);
    }

    console.log(`✅ Bridge completado: ${result.hash}`);
    return result.hash;
  }
}