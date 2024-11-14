// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/**
 * @dev Contract deployed on Base Mainnet
 * @notice You can view the deployed contract at:
 * https://basescan.org/address/0x34d2C23dC8C51D26D26BCc37608Cf5638Ac7ca2c
*/

// Interface for the Aerodrome Router
interface IRouter {
    // Struct to define a route for token swaps
    struct Route {
        address from;
        address to;
        bool stable;
        address factory;
    }

    // Function to get the output amounts for a given input amount and route
    function getAmountsOut(uint256 amountIn, Route[] calldata routes) external view returns (uint256[] memory amounts);

    // Function to perform a token swap
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        Route[] calldata routes,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function addLiquidity(
        address tokenA,
        address tokenB,
        bool stable, // Indicates if the pool is stable or volatile
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);
}

interface IAerodromePool {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1);
    function token0() external view returns (address);
    function token1() external view returns (address);
}

// Interface for ERC20 tokens
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

// Contract for swapping CLPD tokens using Aerodrome
contract AeroSwapCLPD {
    IRouter public immutable aeroRouter;
    IAerodromePool public pool;  // CLPD/USDC pool in Aerodrome
    IERC20 public immutable CLPD;
    IERC20 public immutable USDC;
    address public factory;

    // Event emitted when liquidity is added to the pool
    event LiquidityAdded(address indexed user, uint256 amountUSDC, uint256 amountCLPD, uint256 liquidity);
    
    // Event emitted when tokens are returned to the user
    event TokensReturned(address indexed user, uint256 returnedUSDC, uint256 returnedCLPD);
    
    // Event emitted when an investment is made
    event InvestmentMade(address indexed investor, uint256 amountUSDC, uint256 amountCLPD, uint256 liquidity);

    // Event emitted when a swap is performed
    event Swapped(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);

    // Event emitted when price is fetched
    event PriceFetched(address token, uint256 price);

    constructor() {
        aeroRouter = IRouter(0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43); // Aerodrome V2 Router address
        pool = IAerodromePool(0x82dbc912599EfDa0F1FDC6e2A13c3843EC48662d);
        CLPD = IERC20(0x24460D2b3d96ee5Ce87EE401b1cf2FD01545d9b1); // CLPD Token address
        USDC = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913); // USDC Token address
        factory = 0x420DD381b31aEf6683db6B902084cB0FFECe40Da; // Factory address for the Aerodrome pool
    }

    // @dev: swap tokens via Aerodrome Router for v2 pools
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public returns (uint256 amountOut) {
        // Transfer tokens from sender to this contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        // Approve the router to spend the tokens
        IERC20(tokenIn).approve(address(aeroRouter), amountIn);

        // Create dynamic array of RouteStruct and add token path
        IRouter.Route[] memory routes = new IRouter.Route[](1);
        routes[0] = IRouter.Route({
            from: tokenIn,
            to: tokenOut,
            stable: false,
            factory: factory
        });

        // Get the amountOut from the trade
        uint256[] memory returnAmounts = aeroRouter.getAmountsOut(amountIn, routes);

        // Call swap function
        uint256[] memory amounts = aeroRouter.swapExactTokensForTokens(
            amountIn,
            returnAmounts[1],
            routes,
            msg.sender,
            block.timestamp
        );

        amountOut = amounts[amounts.length - 1];
    }

    // @dev: Get the price of CLPD in terms of USDC
    function getPriceOfCLPDInUSDC() public view returns (uint256) {
        (uint112 reserve0, uint112 reserve1) = pool.getReserves();
        address token0 = pool.token0();

        uint112 reserveCLPD;
        uint112 reserveUSDC;

        if (token0 == address(CLPD)) {
            reserveCLPD = reserve0;
            reserveUSDC = reserve1;
        } else {
            reserveCLPD = reserve1;
            reserveUSDC = reserve0;
        }

        // Price of 1 CLPD in terms of USDC
        uint256 price = (uint256(reserveUSDC) * 1e18) / uint256(reserveCLPD);
        
        return price;
    }

    // @dev: Get the price of USDC in terms of CLPD
    function getPriceOfUSDCInCLPD() public view returns (uint256) {
        (uint112 reserve0, uint112 reserve1) = pool.getReserves();
        address token0 = pool.token0();

        uint112 reserveCLPD;
        uint112 reserveUSDC;

        if (token0 == address(CLPD)) {
            reserveCLPD = reserve0;
            reserveUSDC = reserve1;
        } else {
            reserveCLPD = reserve1;
            reserveUSDC = reserve0;
        }

        // Price of 1 USDC in terms of CLPD
        uint256 price = (uint256(reserveCLPD) * 1e6) / uint256(reserveUSDC); // USDC has 6 decimals
        
        return price;
    }

    // @dev: Invest with USDC and add liquidity
    function investWithUSDC(uint256 amountUSDC) public returns (uint256 amountCLPD, uint256 liquidity) {
        uint256 priceCLPDInUSDC = getPriceOfCLPDInUSDC();
        require(priceCLPDInUSDC > 0, "Price must not be zero");
        require(USDC.allowance(msg.sender, address(this)) >= amountUSDC, "Insufficient allowance for USDC");
        
        amountCLPD = (amountUSDC * (10 ** 18)) / priceCLPDInUSDC;

        USDC.transferFrom(msg.sender, address(this), amountUSDC);
        CLPD.transferFrom(msg.sender, address(this), amountCLPD);

        USDC.approve(address(aeroRouter), amountUSDC);
        CLPD.approve(address(aeroRouter), amountCLPD);

        (amountCLPD, , liquidity) = aeroRouter.addLiquidity(
            address(CLPD),
            address(USDC),
            false,
            amountCLPD,
            amountUSDC,
            0,
            0,
            msg.sender,
            block.timestamp
        );

        emit LiquidityAdded(msg.sender, amountUSDC, amountCLPD, liquidity);
        
        // Return any remaining amount
        uint256 remainingUSDC = USDC.balanceOf(address(this));
        if (remainingUSDC > 0) {
            USDC.transferFrom(address(this), msg.sender, remainingUSDC);
            emit TokensReturned(msg.sender, remainingUSDC, 0);
        }
    }

    // @dev: Invest with CLPD and add liquidity
    function investWithCLPD(uint256 amountCLPD) public returns (uint256 amountUSDC, uint256 liquidity) {
        uint256 priceUSDCInCLPD = getPriceOfUSDCInCLPD();
        amountUSDC = (amountCLPD * (10 ** 6)) / priceUSDCInCLPD;

        require(CLPD.allowance(msg.sender, address(this)) >= amountCLPD, "Insufficient allowance for CLPD");

        CLPD.transferFrom(msg.sender, address(this), amountCLPD);
        USDC.transferFrom(msg.sender, address(this), amountUSDC);

        CLPD.approve(address(aeroRouter), amountCLPD);
        USDC.approve(address(aeroRouter), amountUSDC);

        (amountUSDC, , liquidity) = aeroRouter.addLiquidity(
            address(CLPD),
            address(USDC),
            false,
            amountCLPD,
            amountUSDC,
            0,
            0,
            msg.sender,
            block.timestamp
        );

        emit LiquidityAdded(msg.sender, amountUSDC, amountCLPD, liquidity);
        
        // Return any remaining amount
        uint256 remainingCLPD = CLPD.balanceOf(address(this));
        if (remainingCLPD > 0) {
            CLPD.transferFrom(address(this), msg.sender, remainingCLPD);
            emit TokensReturned(msg.sender, 0, remainingCLPD);
        }
    }

    // @dev: Invest USDC without CLPD
    function investUSDCwithoutCLPD(uint256 amountUSDC) public {
        // Calculate half of the amount to swap
        uint256 halfAmount = (amountUSDC / 2) * 99 / 100;

        // Swap half of the USDC to CLPD
        uint256 amountCLPDAdd = swap(address(USDC), address(CLPD), halfAmount);

        // Call the investment function with the swapped CLPD amount
        (uint256 amountUSDCAdded, uint256 liquidityAdded) = investWithCLPD(amountCLPDAdd);

        // Emit the investment event
        emit InvestmentMade(msg.sender, amountUSDCAdded, amountCLPDAdd, liquidityAdded);
    }

    // @dev: Invest CLPD without USDC
    function investCLPDwithoutUSDC(uint256 amountCLPD) public {
        // Calculate half of the amount to swap
        uint256 halfAmount = (amountCLPD / 2) * 99 / 100;

        // Swap half of the CLPD to USDC
        uint256 amountUSDCAdd = swap(address(CLPD), address(USDC), halfAmount);

        // Call the investment function
        (uint256 amountCLPDAdded, uint256 liquidityAdded) = investWithUSDC(amountUSDCAdd);

        // Emit the investment event
        emit InvestmentMade(msg.sender, amountUSDCAdd, amountCLPDAdded, liquidityAdded);
    }

}