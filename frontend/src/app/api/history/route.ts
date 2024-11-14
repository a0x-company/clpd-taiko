import { getDepositsByPhoneNumber } from "@/lib/firebase/queries/getDeposits";
import { getRedeemsByPhoneNumber } from "@/lib/firebase/queries/getRedeems";
import { Deposit, Redeem } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phoneNumber = searchParams.get("phoneNumber");
  if (!phoneNumber) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }
  try {
    const [deposits, redeems] = await Promise.all([
      getDepositsByPhoneNumber(phoneNumber),
      getRedeemsByPhoneNumber(phoneNumber),
    ]);
    let depositsWithType = [];
    let redeemsWithType = [];
    if (deposits) {
      depositsWithType = deposits.map((deposit: Deposit) => ({ ...deposit, type: "deposit" }));
    }
    if (redeems) {
      redeemsWithType = redeems.map((redeem: Redeem) => ({ ...redeem, type: "redeem" }));
    }
    const history = { deposits: depositsWithType, redeems: redeemsWithType };
    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: "Error fetching history" }, { status: 500 });
  }
}
