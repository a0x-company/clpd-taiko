import { NextRequest, NextResponse } from "next/server";

import { decrypt, encrypt } from "@/lib/auth";
import { getUserByPhoneNumber } from "@/lib/firebase/queries/getUser";
import axios from "axios";
import { cookies } from "next/headers";
import { getOrigin } from "@/lib/utils";

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

const parseRpId = (rpId: string) => {
  const isDevelopment = process.env.NODE_ENV === "development";
  if (isDevelopment) {
    return rpId.replace("clpd-staging.vercel.app", "localhost");
  }
  return rpId;
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

  const cookie = cookies().get("session")?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const sessionData = session ? JSON.parse(JSON.stringify(session)) : null;

  try {
    const response = await axios.post(
      `${API_URL}/users/login`,
      {
        phoneNumber: phoneNumber,
      },
      {
        headers: {
          "api-key": API_KEY,
          Authorization: `Bearer ${sessionData?.token}`,
          Origin: getOrigin(),
        },
      }
    );

    const newAccessToken = response.data.token;
    const sessionUser = {
      token: newAccessToken,
      phoneNumber: phoneNumber,
      address: user.address,
      name: user.name,
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
