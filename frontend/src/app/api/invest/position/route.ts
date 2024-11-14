// next
import { getSessionToken } from "@/lib/auth";
import axios from "axios";
import { NextResponse } from "next/server";

export const maxDuration = 25;

const API_URL = process.env.API_URL;
// const API_URL = "http://localhost:8080";
const API_KEY = process.env.API_KEY;

export async function GET(request: Request) {
  console.info(`[GET][/api/invest/positions]`);
  const idToken = await getSessionToken();

  if (!idToken) {
    return NextResponse.json({ error: "idToken is required" }, { status: 400 });
  }

  try {
    const response = await axios.get(`${API_URL}/wallet/get-positions`, {
      headers: {
        "api-key": API_KEY,
        Authorization: `Bearer ${idToken}`,
      },
    });

    const data = response.data;

    return NextResponse.json(
      { message: "✅ Positions retrieved successfully", data },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error al procesar las posiciones:", error);
    return NextResponse.json({ error: "❌ Error Interno del Servidor" }, { status: 500 });
  }
}
