import { encrypt } from "@/lib/auth";
import { getOrigin } from "@/lib/utils";
import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export const POST = async (req: NextRequest) => {
  console.log("[POST][api/auth/register-passkey-complete]");
  const data = await req.json();

  if (!data.phoneNumber) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  const temporaryToken = cookies().get("temporaryToken")?.value;

  try {
    const response = await axios.post(
      `${API_URL}/users/passkey/complete`,
      {
        phoneNumber: data.phoneNumber,
        response: data.response,
      },
      {
        headers: {
          "api-key": API_KEY,
          Authorization: `Bearer ${temporaryToken}`,
          Origin: getOrigin(),
        },
      }
    );

    cookies().delete("temporaryToken");
    const accessToken = response.data.token;
    const sessionUser = {
      token: accessToken,
      phoneNumber: data.phoneNumber,
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
