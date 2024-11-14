// next
import { NextResponse } from "next/server";

// constants
import { addresses } from "@/constants/address";
import poolContractABI from "@/constants/poolContract-abi.json";
// ethers
import { getSessionUser } from "@/lib/auth";
import { ethers } from "ethers";
import { formatUnits } from "viem";

const providerUrl = process.env.QUICKNODE_URL;

const getFees = async (userAddress: `0x${string}`) => {
  const provider = new ethers.JsonRpcProvider(providerUrl);
  const poolContract = new ethers.Contract(
    addresses.base.poolUsdcClpdAddress,
    poolContractABI,
    provider
  );

  try {
    const amountCLPDWithDecimals = await poolContract.claimable0(userAddress);
    const amountUSDCWithDecimals = await poolContract.claimable1(userAddress);
    const amountCLPD = Number(formatUnits(amountCLPDWithDecimals, 18));
    const amountUSDC = Number(formatUnits(amountUSDCWithDecimals, 6));
    return {
      amountCLPD,
      amountUSDC,
    };
  } catch (error) {
    console.error("Error al obtener la información del token:", error);
    return { error: "Error fetching token price" };
  } finally {
    provider.destroy();
  }
};

export async function GET(request: Request) {
  console.info("[GET][/api/invest/earned]");
  const sessionUser = await getSessionUser();
  const userAddress = sessionUser?.address;
  const idToken = sessionUser?.token;

  if (!idToken || !userAddress) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { amountCLPD, amountUSDC } = await getFees(userAddress as `0x${string}`);

    return NextResponse.json(
      { message: "✅ Fees fetched successfully", data: { amountCLPD, amountUSDC } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching fees:", error);
    return NextResponse.json({ error: "Error fetching fees" }, { status: 500 });
  }
}
