import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export const POST = async (req: NextRequest) => {
  console.log("[POST][api/user/verify]");
  const { phoneNumber, sixCharCode } = await req.json();

  if (!phoneNumber || !sixCharCode) {
    return NextResponse.json(
      { error: "Phone number and six char code are required" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.post(
      `${API_URL}/users/verify`,
      {
        phoneNumber,
        sixCharacters: sixCharCode,
      },
      {
        headers: {
          "api-key": API_KEY,
        },
      }
    );
    console.log("[POST][api/user/verify] response", response);

    const temporaryToken = response.data.token;

    cookies().set("temporaryToken", temporaryToken, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 1, // 1 day
    });

    return NextResponse.json({ message: "User verified" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error verifying user" }, { status: 500 });
  }
};
