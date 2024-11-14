// next
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// lib
import { decrypt, encrypt } from "@/lib/auth";
import { getOrigin } from "@/lib/utils";

// firebase
import { getUserByPhoneNumber } from "@/lib/firebase/queries/getUser";
import { getVerifyByUuid } from "@/lib/firebase/queries/getVerify";

// axios
import axios from "axios";

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export const GET = async (req: NextRequest) => {
  console.log("[GET][/api/auth/verify-tx]");
  const { searchParams } = new URL(req.url);
  const uuid = searchParams.get("uuid");
  console.log("uuid", uuid);

  const verify = await getVerifyByUuid(uuid as string);
  console.log("verify", verify);

  const phoneNumber = verify?.phoneNumber;
  const options = verify?.options;

  return NextResponse.json(
    { message: "✅ Verify fetched successfully", options, phoneNumber },
    { status: 200 }
  );
};

export const POST = async (req: NextRequest) => {
  const { phoneNumber } = await req.json();

  if (!phoneNumber) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  const user = await getUserByPhoneNumber(phoneNumber);
  if (!user) {
    return NextResponse.json({ error: "Este número no está registrado" }, { status: 400 });
  }

  try {
    const response = await axios.post(
      `${API_URL}/users/login`,
      {
        phoneNumber: phoneNumber,
      },
      {
        headers: {
          "api-key": API_KEY,
          Authorization: `Bearer ${user?.permanentToken}`,
          Origin: getOrigin(),
        },
      }
    );

    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error registering passkey" }, { status: 500 });
  }
};
