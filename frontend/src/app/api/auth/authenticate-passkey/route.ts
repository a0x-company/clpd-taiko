import { NextRequest, NextResponse } from "next/server";

import axios from "axios";
import { cookies } from "next/headers";
import { encrypt } from "@/lib/auth";
import { getUserByPhoneNumber } from "@/lib/firebase/queries/getUser";
import { getOrigin } from "@/lib/utils";

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export const POST = async (req: NextRequest) => {
  const { phoneNumber, assertion } = await req.json();

  if (!phoneNumber || !assertion) {
    return NextResponse.json({ error: "Phone number or assertion is required" }, { status: 400 });
  }

  try {
    const response = await axios.post(
      `${API_URL}/users/login/complete`,
      {
        phoneNumber: phoneNumber,
        passkeyResponse: assertion,
      },
      {
        headers: {
          "api-key": API_KEY,
          Origin: getOrigin(),
        },
      }
    );

    const user = await getUserByPhoneNumber(phoneNumber);

    const accessToken = response.data.token;
    const sessionUser = {
      token: accessToken,
      phoneNumber: phoneNumber,
      address: user?.address || null,
    };

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
    const session = await encrypt(sessionUser);
    cookies().set("session", session, {
      httpOnly: true,
      secure: true,
      expires: expiresAt,
      sameSite: "strict",
    });

    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error registering passkey" }, { status: 500 });
  }
};
