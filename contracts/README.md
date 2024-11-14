# CLPD Smart Contracts

## Smart Contracts in the `src` Folder

This section describes the main smart contracts located in the project's `src` folder. It contains four main smart contracts:

### 1. CLPD_BaseMainnet.sol
This smart contract is designed for deployment on the Base mainnet. It implements CLPD's core functionality, including:
- ERC20 token management with custom mint and burn functions
- Role system with owner and authorized agents
- Security mechanisms such as account freezing and blacklisting
- Custom events for tracking transactions and state changes
- Integration with message passing protocols for secure cross-chain communication
- Locking and unlocking mechanisms for bridged tokens

### 2. CLPD_BaseSepolia_Bridge.sol
A variant of the previous contract optimized for the Base Sepolia testnet. Features include:
- Enhanced debugging and logging functions
- Bridge functionality for testing cross-chain transfers with Taiko testnet
- Role-based access control for agents and owner
- Account freezing and blacklisting capabilities
- Test environments for message verification and validation
- Bridge event monitoring and tracking system

### 3. CLPD__Taiko_Helka_Bridge.sol
Contract designed for deployment on the Taiko Helka testnet:
- Bridge functionality for Taiko-Base token transfers
- ERC20 token implementation with custom features
- Role management for agents and owner
- Security features like account freezing
- Cross-chain message passing implementation
- Token locking mechanism on source chain
- Token minting/burning on destination chain
- Bridge state verification and synchronization

### 4. swap_InvestLiquidity_CLPD.sol
Advanced contract for CLPD-related DeFi operations:
- Full integration with the Aerodrome protocol for swaps and liquidity management
- Volatile and stable pool support for different trading pairs
- Functions to add, remove, and increase liquidity positions
- Implementation of automated investment strategies
- Slippage management and protection against impermanent losses
- Fee collection and distribution mechanisms
- Gauge staking and reward claiming functionality
- Support for Aerodrome's voting escrow system

### Technologies Used
- Solidity: Programming language for smart contracts
- Foundry: Development and testing toolkit
- Aerodrome: DEX protocol used for exchange and liquidity operations
- OpenZeppelin: Used for token standards and security features
- Base: Ethereum L2 network for mainnet and testnet deployments
- Taiko: L2 network supporting cross-chain bridge functionality
- ERC20: Token standard implementation
- Cross-chain messaging protocols for bridge operations
- Aerodrome interfaces for swap and liquidity operations

### Contract Compilation

To compile the contracts, follow these steps:

1. Make sure you have Foundry installed on your system
2. Open a terminal and navigate to the project directory
3. Enter the contracts directory:
   ```
   cd contracts
   ```
4. Run the Forge compilation command:
   ```
   forge build
   ```

## Tests

The `test` folder contains test files for the contracts. These tests verify the correct functioning of all contract features.

### Main Test Files:

1. `CLPD_BaseMainnet.t.sol`: Tests for Base mainnet deployment and functionality
2. `CLPD_BaseSepolia_Bridge.t.sol`: Tests for Base Sepolia deployment and testnet bridge operations
3. `CLPD__Taiko_Helka_Bridge.t.sol`: Tests for Taiko Helka deployment and cross-chain transfers
4. `swap_InvestLiquidity_CLPD.t.sol`: Tests for Aerodrome swap and liquidity features

### Running Tests:

Execute these commands to run the tests:

1. Base mainnet tests:
   ```
   forge test -vvvv --match-path test/CLPD_BaseMainnet.t.sol --fork-url https://mainnet.base.org/
   ```

2. Base Sepolia tests:
   ```
   forge test -vvvv --match-path test/CLPD_BaseSepolia_Bridge.t.sol --fork-url https://sepolia.base.org/
   ```

3. Taiko Helka tests:
   ```
   forge test -vvvv --match-path test/CLPD__Taiko_Helka_Bridge.t.sol --fork-url https://hekla.taikoscan.io/
   ```

4. Swap and liquidity tests:
   ```
   forge test -vvvv --match-path test/swap_InvestLiquidity_CLPD.t.sol --fork-url https://mainnet.base.org/
   ```

## Deployment Scripts

The `script` folder contains deployment scripts for each contract. These scripts use Forge for deployment.

### Main Script Files:

1. `DeployCLPD_BaseMainnet.s.sol`: Base mainnet deployment
2. `DeployCLPD_BaseSepolia.s.sol`: Base Sepolia deployment with testnet bridge setup
3. `DeployCLPD_TaikoHelka.s.sol`: Taiko Helka deployment with cross-chain functionality
4. `DeploySwapInvestLiquidity.s.sol`: Aerodrome integration deployment

### Running Scripts:

Deploy using these commands:

1. Base Mainnet:
   ```
   forge script scripts/DeployCLPD_BaseMainnet.s.sol --rpc-url https://mainnet.base.org/ --broadcast
   ```

2. Base Sepolia:
   ```
   forge script scripts/DeployCLPD_BaseSepolia_Bridge.s.sol --rpc-url https://sepolia.base.org/ --broadcast
   ```

3. Taiko Helka:
   ```
   forge script scripts/DeployCLPD__Taiko_Helka_Bridge.s.sol --rpc-url https://hekla.taikoscan.io/ --broadcast
   ```

4. Swap contract:
   ```
   forge script scripts/DeploySwapInvestLiquidity.s.sol --rpc-url https://mainnet.base.org/ --broadcast
   ```