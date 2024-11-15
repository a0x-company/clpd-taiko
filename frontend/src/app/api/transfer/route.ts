// next
import { NextResponse } from "next/server";

// viem
import { getSessionToken } from "@/lib/auth";
import axios from "axios";

const API_URL = process.env.API_URL;
// const API_URL = "http://localhost:8080";
const API_KEY = process.env.API_KEY;

export async function POST(request: Request) {
  const { address, withdrawAmount, contactName } = await request.json();
  const idToken = await getSessionToken();

  if (!idToken || !withdrawAmount) {
    return NextResponse.json({ error: "idToken and withdrawAmount are required" }, { status: 400 });
  }

  if (!address && !contactName) {
    return NextResponse.json({ error: "address or contactName are required" }, { status: 400 });
  }

  try {
    const response = await axios.post(
      `${API_URL}/wallet/transfer-token`,
      {
        address: address,
        contactName,
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
