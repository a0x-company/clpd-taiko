import axios from "axios";
import { NextResponse } from "next/server";

const API_URL = "https://development-clpd-vault-api-claucondor-61523929174.us-central1.run.app";
const API_KEY = process.env.API_KEY;

export async function GET(request: Request) {
  console.log("[GET][/api/events]");
  try {
    const response = await axios.get(`${API_URL}/vault/reserve-data`, {
      headers: {
        "Content-Type": "application/json",
        "api-key": API_KEY,
      },
    });
    return NextResponse.json(response.data.data);
  } catch (error) {
    console.error("Error al obtener los datos de reserva:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
