import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

interface SessionPayload {
  [key: string]: string | number | boolean;
}

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    console.log("Failed to verify session");
  }
}

export async function getSessionUser() {
  const session = cookies().get("session")?.value;
  return await decrypt(session);
}

export async function getSessionToken() {
  const sessionUser = await getSessionUser();
  return sessionUser?.token;
}
