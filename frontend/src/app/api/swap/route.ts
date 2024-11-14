// next
import { getSessionToken } from "@/lib/auth";
import axios from "axios";
import { NextResponse } from "next/server";

export const maxDuration = 25;

const API_URL = process.env.API_URL;
// const API_URL = "http://localhost:8080";
const API_KEY = process.env.API_KEY;

export async function POST(request: Request) {
  console.info(`[POST][/api/swap]`);
  const idToken = await getSessionToken();
  const { amountIn, tokenInSymbol }: { amountIn: number; tokenInSymbol: "CLPD" | "USDC" } =
    await request.json();

  if (!idToken || !amountIn || !tokenInSymbol) {
    return NextResponse.json(
      { error: "idToken, amountIn and tokenInSymbol are required" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.post(
      `${API_URL}/wallet/swap-token`,
      {
        tokenInSymbol,
        amountIn,
      },
      {
        headers: {
          "api-key": API_KEY,
          Authorization: `Bearer ${idToken}`,
        },
      }
    );

    console.log("response", response);

    return NextResponse.json({ message: "✅ Swap completed successfully" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error al procesar la swap:", error);
    return NextResponse.json({ error: "❌ Error Interno del Servidor" }, { status: 500 });
  }
}
