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

    console.log("🔧 Initializing services and contracts for each chain.");

    Object.entries(chainConfigs).forEach(([chainId, config]) => {
      console.log(`📈 Configuring chain: ${chainId}`);
      const contractService = new ContractService(config.rpcUrl);
      this.contractServices.set(chainId as ChainId, contractService);
      console.log(`🔗 Contract service created for ${chainId}: ${config.rpcUrl}`);

      const contracts = {
        clpd: new ERC20TokenContract(config.addresses.CLPD.address, contractService),
        usdc: new ERC20TokenContract(config.addresses.USDC?.address || '', contractService),
        pool: new UniswapV3LiquidityPoolContract(config.addresses.POOL_USDC_CLPD || '', contractService),
        router: new UniswapRouterContract(config.addresses.AERO_SWAP || '', contractService),
        clpdToken: new CLPDTokenContract(config.addresses.CLPD.address, contractService)
      };
      console.log(`📄 Contracts instantiated for ${chainId}.`);

      this.chainContracts.set(chainId as ChainId, contracts);
    });

    console.log("🔗 Setting up mediators for all chains.");

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
      console.log(`🛠️ Mediator configuration added for ${chain}.`);
    });

    const mediator = new WalletOperationMediator(mediatorConfigs);
    console.log("🔗 Single mediator created for all chains.");

    Object.keys(chainConfigs).forEach((chainId) => {
      this.mediators.set(chainId as ChainId, mediator);
      console.log(`🔗 Mediator assigned to chain ${chainId}.`);
    });

    console.log("✅ All services and mediators have been configured successfully.");
  }

  private getChainServices(chain: ChainId = "base") {
    console.log(`🔍 Retrieving services for chain: ${chain}`);
    const contracts = this.chainContracts.get(chain);
    const mediator = this.mediators.get(chain);
    const contractService = this.contractServices.get(chain);

    if (!contracts || !mediator || !contractService) {
      console.error(`❌ The chain ${chain} is not configured correctly.`);
      throw new Error(`Chain ${chain} not configured`);
    }

    console.log(`✅ Services retrieved for chain: ${chain}`);
    return { contracts, mediator, contractService };
  }

  async getTokenBalance(
    user: User,
    tokenSymbol: "CLPD" | "USDC",
    chain: ChainId = "base"
  ): Promise<number> {
    console.log(`🔍 Requesting balance for token ${tokenSymbol} on chain ${chain} for user ${user.address}.`);
    if (!user.address) {
      console.error("❌ User address is undefined.");
      throw new Error("User address is undefined");
    }

    const { contracts } = this.getChainServices(chain);
    const token = contracts[tokenSymbol.toLowerCase()];
    const balance = await token.getBalance(user.address);
    console.log(`📊 Raw balance obtained: ${balance}`);

    const decimals = tokenSymbol === "CLPD" ? 18 : 6;
    const formattedBalance = formatUnits(balance, decimals);
    console.log("💰 Token balance in user wallet:", formattedBalance);
    return Number(formattedBalance);
  }

  async transferToken(
    user: User,
    address: string,
    tokenSymbol: "CLPD" | "USDC",
    withdrawAmount: number,
    chain: ChainId = "base"
  ): Promise<string> {
    console.log(`🔄 Initiating transfer of ${withdrawAmount} ${tokenSymbol} from ${user.address} to ${address} on chain ${chain}.`);
    if (!user.address || !user.internalPrivateKeys?.evmPrivateKey) {
      console.error("❌ User address or private key is undefined.");
      throw new Error("User address or private key is undefined");
    }

    const { contracts, contractService } = this.getChainServices(chain);
    const token = contracts[tokenSymbol.toLowerCase()];
    const tokenBalance = await token.getBalance(user.address);
    console.log(`📊 Available balance for transfer: ${formatUnits(tokenBalance, 18)}`);

    if (tokenBalance < parseUnits(withdrawAmount.toString(), 18)) {
      console.error(`❌ Insufficient ${tokenSymbol} balance: available ${formatUnits(tokenBalance, 18)}`);
      throw new Error(`Insufficient ${tokenSymbol} balance: available ${formatUnits(tokenBalance, 18)}`);
    }

    const decryptedKey = this.cryptoService.decrypt(user.internalPrivateKeys.evmPrivateKey);
    console.log("🔑 Private key decrypted.");

    const signer = new ethers.Wallet(
      decryptedKey,
      contractService.jsonRpcProvider
    );
    console.log("👤 Signer created successfully.");

    const operation = new TokenTransferOperation(
      contractService,
      token,
      {
        to: address,
        amount: parseUnits(withdrawAmount.toString(), 18),
        signer
      }
    );
    console.log("🛠️ Token transfer operation created.");

    const result = await contractService.executeOperation(operation);
    console.log(`✅ Transfer executed with hash: ${result.hash}`);
    return result.hash;
  }

  async swapToken(
    user: User,
    amount: number,
    fromToken: "CLPD" | "USDC",
    chain: ChainId = "base"
  ): Promise<string> {
    console.log(`🔁 Initiating swap of ${amount} ${fromToken} for user ${user.address} on chain ${chain}.`);
    if (!user.address || !user.internalPrivateKeys?.evmPrivateKey) {
      console.error("❌ User address or private key is undefined.");
      throw new Error("User address or private key is undefined");
    }

    const { contracts, mediator, contractService } = this.getChainServices(chain);
    const tokenIn = contracts[fromToken.toLowerCase()];
    console.log(`🔗 Input token: ${fromToken}`);

    const toToken: "CLPD" | "USDC" = fromToken === "CLPD" ? "USDC" : "CLPD";
    const tokenOut = contracts[toToken.toLowerCase()];
    console.log(`🔄 Inferred output token: ${toToken}`);

    const decimals = fromToken === "CLPD" ? 18 : 6;
    console.log(`⚖️ Decimals used for ${fromToken}: ${decimals}`);

    const balance = await tokenIn.getBalance(user.address);
    console.log(`📊 Available balance of ${fromToken}: ${formatUnits(balance, decimals)}`);

    if (balance < parseUnits(amount.toString(), decimals)) {
      console.error(`❌ Insufficient ${fromToken} balance: available ${formatUnits(balance, decimals)}`);
      throw new Error(`Insufficient ${fromToken} balance: available ${formatUnits(balance, decimals)}`);
    }

    const decryptedKey = this.cryptoService.decrypt(user.internalPrivateKeys.evmPrivateKey);
    console.log("🔑 Private key decrypted.");

    const signer = new ethers.Wallet(
      decryptedKey,
      contractService.jsonRpcProvider
    );
    console.log("👤 Signer created successfully.");

    const result = await mediator.executeSwapWithApproval({
      tokenIn,
      tokenOut,
      amount: parseUnits(amount.toString(), decimals),
      signer
    });
    console.log(`✅ Swap executed with hash: ${result.hash}`);

    if (!result.success) {
      console.error("❌ The swap has failed.");
      throw new Error("Swap failed");
    }

    return result.hash;
  }

  async investCLPD(
    user: User,
    amount: number,
    chain: ChainId = "base"
  ): Promise<string> {
    console.log(`💼 Investing ${amount} CLPD for user ${user.address} on chain ${chain}.`);
    if (!user.address || !user.internalPrivateKeys?.evmPrivateKey) {
      console.error("❌ User address or private key is undefined.");
      throw new Error("User address or private key is undefined");
    }

    const { contracts, mediator, contractService } = this.getChainServices(chain);
    const balance = await contracts.clpd.getBalance(user.address);
    console.log(`📊 Available CLPD balance: ${formatUnits(balance, 18)}`);

    if (balance < parseUnits(amount.toString(), 18)) {
      console.error(`❌ Insufficient CLPD balance: available ${formatUnits(balance, 18)}`);
      throw new Error(`Insufficient CLPD balance: available ${formatUnits(balance, 18)}`);
    }

    const decryptedKey = this.cryptoService.decrypt(user.internalPrivateKeys.evmPrivateKey);
    console.log("🔑 Private key decrypted.");

    const signer = new ethers.Wallet(
      decryptedKey,
      contractService.jsonRpcProvider
    );
    console.log("👤 Signer created successfully.");

    const result = await mediator.executeLiquidityAdditionWithApproval({
      token: contracts.clpd,
      amount: parseUnits(amount.toString(), 18),
      signer,
      isClpd: true
    });
    console.log(`✅ Investment executed with hash: ${result.hash}`);

    if (!result.success) {
      console.error("❌ The investment has failed.");
      throw new Error("Investment failed");
    }

    return result.hash;
  }

  async investUSDC(
    user: User,
    amount: number,
    chain: ChainId = "base"
  ): Promise<string> {
    console.log(`💼 Investing ${amount} USDC for user ${user.address} on chain ${chain}.`);
    if (!user.address || !user.internalPrivateKeys?.evmPrivateKey) {
      console.error("❌ User address or private key is undefined.");
      throw new Error("User address or private key is undefined");
    }

    const { contracts, mediator, contractService } = this.getChainServices(chain);
    const balance = await contracts.usdc.getBalance(user.address);
    console.log(`📊 Available USDC balance: ${formatUnits(balance, 6)}`);

    if (balance < parseUnits(amount.toString(), 6)) {
      console.error(`❌ Insufficient USDC balance: available ${formatUnits(balance, 6)}`);
      throw new Error(`Insufficient USDC balance: available ${formatUnits(balance, 6)}`);
    }

    const decryptedKey = this.cryptoService.decrypt(user.internalPrivateKeys.evmPrivateKey);
    console.log("🔑 Private key decrypted.");

    const signer = new ethers.Wallet(
      decryptedKey,
      contractService.jsonRpcProvider
    );
    console.log("👤 Signer created successfully.");

    const result = await mediator.executeLiquidityAdditionWithApproval({
      token: contracts.usdc,
      amount: parseUnits(amount.toString(), 6),
      signer,
      isClpd: false
    });
    console.log(`✅ Investment executed with hash: ${result.hash}`);

    if (!result.success) {
      console.error("❌ The investment has failed.");
      throw new Error("Investment failed");
    }

    return result.hash;
  }

  async getPositions(
    user: User,
    chain: ChainId = "base"
  ): Promise<{ amountCLPD: number; amountUSDC: number }> {
    console.log(`📈 Retrieving positions for user ${user.address} on chain ${chain}.`);
    if (!user.address) {
      console.error("❌ User address is undefined.");
      throw new Error("User address is undefined");
    }

    const { contracts } = this.getChainServices(chain);
    const [liquidity, totalSupply, reserves] = await Promise.all([
      contracts.pool.getBalance(user.address),
      contracts.pool.getTotalSupply(),
      contracts.pool.getReserves()
    ]);
    console.log("📊 Liquidity data obtained.");

    const amountCLPDWithDecimals = Math.round(
      (Number(liquidity) / Number(totalSupply)) * Number(reserves[0])
    );
    const amountUSDCWithDecimals = Math.round(
      (Number(liquidity) / Number(totalSupply)) * Number(reserves[1])
    );
    console.log("📉 Position calculations completed.");

    const formattedCLPD = Number(formatUnits(BigInt(amountCLPDWithDecimals), 18));
    const formattedUSDC = Number(formatUnits(BigInt(amountUSDCWithDecimals), 6));
    console.log(`💼 Positions: ${formattedCLPD} CLPD, ${formattedUSDC} USDC.`);

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
    console.log(`🪙 Starting token minting for pending users on chain ${chain}.`);
    const { contracts, contractService } = this.getChainServices(chain);
    console.log(`🔗 Contracts retrieved for chain ${chain}.`);

    const parsedAmounts = pendingAmounts.map(amount => parseUnits(amount.toString(), 18));
    console.log("🔢 Pending amounts parsed.");

    const operation = new MintTokensOperation(
      contractService,
      contracts.clpdToken,
      {
        pendingUsers,
        pendingAmounts: parsedAmounts,
        agentSigner
      }
    );
    console.log("🛠️ Token minting operation created.");

    const result = await contractService.executeOperation(operation);
    console.log(`✅ Tokens minted with hash: ${result.hash}`);
    return result.hash;
  }

  async burnTokens(
    user: User,
    amount: number,
    chain: ChainId = "base"
  ): Promise<string> {
    console.log(`🔥 Initiating burn of ${amount} CLPD for user ${user.address} on chain ${chain}.`);
    if (!user.address || !user.internalPrivateKeys?.evmPrivateKey) {
      console.error("❌ User address or private key is undefined.");
      throw new Error("User address or private key is undefined");
    }

    const { contracts, contractService } = this.getChainServices(chain);
    const balance = await contracts.clpdToken.getBalance(user.address);
    console.log(`📊 Available CLPD balance for burn: ${formatUnits(BigInt(balance), 18)}`);

    if (BigInt(balance) < parseUnits(amount.toString(), 18)) {
      console.error(`❌ Insufficient CLPD balance: available ${formatUnits(BigInt(balance), 18)}`);
      throw new Error(`Insufficient CLPD balance: available ${formatUnits(BigInt(balance), 18)}`);
    }

    const decryptedKey = this.cryptoService.decrypt(user.internalPrivateKeys.evmPrivateKey);
    console.log("🔑 Private key decrypted.");

    const signer = new ethers.Wallet(
      decryptedKey,
      contractService.jsonRpcProvider
    );
    console.log("👤 Signer created successfully.");

    const operation = new BurnTokensOperation(
      contractService,
      contracts.clpdToken,
      {
        amount: parseUnits(amount.toString(), 18),
        userAddress: user.address,
        signer
      }
    );
    console.log("🛠️ Token burn operation created.");

    const result = await contractService.executeOperation(operation);
    console.log(`✅ Tokens burned with hash: ${result.hash}`);
    return result.hash;
  }

  async bridgeToken(
    user: User,
    amount: number,
    sourceChain: ChainId,
    targetChain: ChainId
  ): Promise<string> {
    console.log(`🌉 Initiating bridge of ${amount} CLPD from ${sourceChain} to ${targetChain} for user ${user.address}.`);
    if (!user.address || !user.internalPrivateKeys?.evmPrivateKey) {
      console.error("❌ User address or private key is undefined.");
      throw new Error("User address or private key is undefined");
    }

    const { contracts, mediator, contractService } = this.getChainServices(sourceChain);
    const clpdBalance = await contracts.clpd.getBalance(user.address);
    console.log(`📊 CLPD balance on ${sourceChain}: ${formatUnits(clpdBalance, 18)}`);

    if (clpdBalance < parseUnits(amount.toString(), 18)) {
      console.error(`❌ Insufficient CLPD balance on ${sourceChain}: available ${formatUnits(clpdBalance, 18)}`);
      throw new Error(`Insufficient CLPD balance on ${sourceChain}: available ${formatUnits(clpdBalance, 18)}`);
    }

    const decryptedKey = this.cryptoService.decrypt(user.internalPrivateKeys.evmPrivateKey);
    console.log("🔑 Private key decrypted.");

    const signer = new ethers.Wallet(
      decryptedKey,
      contractService.jsonRpcProvider
    );
    console.log("👤 Signer created successfully.");

    const result = await mediator.executeCrossChainBridge({
      amount: parseUnits(amount.toString(), 18),
      sourceChain,
      targetChain,
      userSigner: signer
    });
    console.log(`✅ Bridge executed with hash: ${result.hash}`);

    if (!result.success) {
      console.error(`❌ The bridge process has failed on ${sourceChain}.`);
      throw new Error(`Bridge process failed on ${sourceChain}`);
    }

    return result.hash;
  }
}