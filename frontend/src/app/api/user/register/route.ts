import { getUserByPhoneNumber } from "@/lib/firebase/queries/getUser";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export const POST = async (req: NextRequest) => {
  console.log("[POST][api/user/register]");
  const { phoneNumber, name } = await req.json();

  if (!phoneNumber || !name) {
    return NextResponse.json({ error: "Phone number and name are required" }, { status: 400 });
  }

  const user = await getUserByPhoneNumber(phoneNumber);
  if (user?.sixCharacters) {
    return NextResponse.json(
      { message: "User already exists but passkey is not set" },
      { status: 200 }
    );
  } else if (user && !user?.sixCharacters) {
    return NextResponse.json(
      { message: "User already exists and passkey is set" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.post(
      `${API_URL}/users/register`,
      {
        phoneNumber,
        name,
      },
      {
        headers: {
          "api-key": API_KEY,
        },
      }
    );

    return NextResponse.json({ message: "User registered" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error registering user" }, { status: 500 });
  }
};
