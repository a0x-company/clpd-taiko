import { NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth";
import axios from "axios";

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export async function POST(request: Request) {
  try {
    const { amount, networkIn, networkOut } = await request.json();
    const idToken = await getSessionToken();

    if (!idToken) {
      return NextResponse.json({ error: "❌ No autorizado" }, { status: 401 });
    }

    const response = await axios.post(
      `${API_URL}/wallet/bridge`,
      {
        amount,
        sourceChain: networkIn === "baseSepolia" ? "base-sepolia" : "taiko-hekla-testnet",
        targetChain: networkOut === "baseSepolia" ? "base-sepolia" : "taiko-hekla-testnet"
      },
      {
        headers: {
          "api-key": API_KEY,
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    return NextResponse.json(
      { message: "✅ Bridge completado exitosamente" },
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Error procesando bridge:", error);
    return NextResponse.json(
      { error: "❌ Error Interno del Servidor" },
      { status: 500 }
    );
  }
}