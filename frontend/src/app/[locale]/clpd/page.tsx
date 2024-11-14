// next

// http client

//components

// utils
import AboutCLPD from "@/components/about-clpd/AboutCLPD";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

// wagmi

// provider

// constants

// viem
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export default async function CLPD() {
  const cookie = cookies().get("session")?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const sessionData = session ? JSON.parse(JSON.stringify(session)) : null;

  return (
    <main className="min-h-screen max-w-screen bg-white text-black">
      <Navbar sessionData={sessionData} />
      <AboutCLPD />
      <Footer />
    </main>
  );
}
