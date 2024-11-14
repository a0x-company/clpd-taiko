import { getSessionToken } from "@/lib/auth";
import { getContactsByPhoneNumber } from "@/lib/firebase/queries/getContacts";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phoneNumber = searchParams.get("phoneNumber");
  if (!phoneNumber) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }
  try {
    const contacts = await getContactsByPhoneNumber(phoneNumber);
    return NextResponse.json(contacts);
  } catch (error) {
    return NextResponse.json({ error: "Error fetching contacts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log("[POST][/api/contacts]");
  const { name, phoneNumber } = await req.json();
  console.log(name, phoneNumber);
  const idToken = getSessionToken();
  try {
    const response = await axios.post(
      `${API_URL}/contacts`,
      { name, phoneNumber },
      {
        headers: {
          "api-key": API_KEY,
          Authorization: `Bearer ${idToken}`,
        },
      }
    );
    console.log("response", response);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error adding contact" }, { status: 500 });
  }
}
