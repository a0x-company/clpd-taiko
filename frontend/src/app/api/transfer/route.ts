// next
import { NextResponse } from "next/server";

// viem
import { getSessionToken } from "@/lib/auth";
import axios from "axios";

const API_URL = process.env.API_URL;
// const API_URL = "http://localhost:8080";
const API_KEY = process.env.API_KEY;

export async function POST(request: Request) {
  const { address, withdrawAmount, phoneNumber } = await request.json();
  const idToken = await getSessionToken();

  if (!idToken) {
    return NextResponse.json({ error: "idToken is required" }, { status: 400 });
  }

  try {
    const response = await axios.post(
      `${API_URL}/wallet/transfer-token`,
      {
        address: address,
        phoneNumber: phoneNumber,
        withdrawAmount: Number(withdrawAmount),
        tokenSymbol: "CLPD",
      },
      {
        headers: {
          "api-key": API_KEY,
          Authorization: `Bearer ${idToken}`,
        },
      }
    );

    console.log("response", response);
    // TODO: guardar en la base de datos que se realizó la transferencia

    return NextResponse.json({ message: "✅ Transfer completed successfully" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error processing transfer:", error);
    return NextResponse.json({ error: "❌ Internal Server Error" }, { status: 500 });
  }
}
