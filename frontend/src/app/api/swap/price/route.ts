// next
import { NextResponse } from "next/server";

// constants
import { addresses } from "@/constants/address";
import aeroSwapCLPDABI from "@/constants/aero-swap-CLPD-abi.json";

// ethers
import { ethers } from "ethers";
import { formatUnits } from "viem";
import { getSessionToken } from "@/lib/auth";

const providerUrl = process.env.QUICKNODE_URL;

const getPrice = async () => {
  const provider = new ethers.JsonRpcProvider(providerUrl);
  const poolContract = new ethers.Contract(addresses.base.investment, aeroSwapCLPDABI, provider);

  try {
    const priceCLPDUSDC = await poolContract.getPriceOfCLPDInUSDC();
    const priceUSDCCLPD = await poolContract.getPriceOfUSDCInCLPD();

    return {
      priceCLPDUSDC: formatUnits(priceCLPDUSDC, 6),
      priceUSDCCLPD: formatUnits(priceUSDCCLPD, 18),
    };
  } catch (error) {
    console.error("Error al obtener la información del token:", error);
    return { error: "Error fetching token price" };
  } finally {
    provider.destroy();
  }
};

export async function GET(request: Request) {
  console.info("[GET][/api/swap/price]");
  const idToken = await getSessionToken();

  if (!idToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { priceCLPDUSDC, priceUSDCCLPD } = await getPrice();

    return NextResponse.json(
      { message: "✅ Price fetched successfully", data: { priceCLPDUSDC, priceUSDCCLPD } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching token price:", error);
    return NextResponse.json({ error: "Error fetching token price" }, { status: 500 });
  }
}
