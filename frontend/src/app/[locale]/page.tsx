// next
import { Metadata } from "next";

// components
import DepositSection from "@/components/landing/DepositSection";
import EarnSection from "@/components/landing/EarnSection";
import Hero from "@/components/landing/Hero";
import WithdrawSection from "@/components/landing/WithdrawSection";
import FeatureSection from "@/components/landing/FeatureSection";
import Navbar from "@/components/Navbar";
import Roadmap from "@/components/landing/Roadmap";
import Footer from "@/components/Footer";
import AutomateSection from "@/components/landing/AutomateSection";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export const metadata: Metadata = {
  title: "CLPD | Peso Chileno Digital",
  description:
    "CLP Digital es la primera y única stablecoin del peso chileno con pruebas de reserva garantizada y verificable. Siempre existirá 1 CLP en reservas por cada $CLPD en circulación.",
  openGraph: {
    images: ["/images/landing/og.png"],
    type: "website",
    siteName: "CLPD | Peso Chileno Digital",
    locale: "es-CL",
  },
};

export default async function Home() {
  const cookie = cookies().get("session")?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const sessionData = session ? JSON.parse(JSON.stringify(session)) : null;
  return (
    <main className="min-h-screen max-w-screen bg-white text-black">
      <Navbar sessionData={sessionData} />
      <Hero />
      <FeatureSection />
      <DepositSection />
      <WithdrawSection />
      <EarnSection />
      <AutomateSection />
      <Roadmap />
      <Footer />
    </main>
  );
}
