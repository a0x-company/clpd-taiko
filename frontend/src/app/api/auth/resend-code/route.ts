import { getOrigin } from "@/lib/utils";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export const POST = async (req: NextRequest) => {
  console.log("[POST][api/auth/resend-code]");
  const data = await req.json();

  if (!data.phoneNumber) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  try {
    const response = await axios.post(
      `${API_URL}/users/verify/resend`,
      {
        phoneNumber: data.phoneNumber,
      },
      {
        headers: {
          "api-key": API_KEY,
          Origin: getOrigin(),
        },
      }
    );

    console.log("response", response);
    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error registering passkey" }, { status: 500 });
  }
};
