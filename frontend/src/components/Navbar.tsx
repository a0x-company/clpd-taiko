"use client";

// react
import React, { useCallback, useEffect, useState } from "react";

// next
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

// components
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTrigger } from "./ui/sheet";

// translations
import { useTranslations } from "next-intl";

// context
import { useUserStore } from "@/context/global-store";

// utils
import { cn } from "@/lib/utils";

// icons
import { LucideMenu } from "lucide-react";
import { startAuthentication } from "@simplewebauthn/browser";
import axios from "axios";
import { LoadingSpinner } from "./ui/spinner";

interface NavbarProps {
  sessionData: any;
}

const links = [
  {
    href: "/",
    label: "stableCoin",
  },
  // {
  //   href: "/earn",
  //   label: "earnWithPesos",
  // },
  // {
  //   href: "/about",
  //   label: "aboutUs",
  // },
  {
    href: "/reserve",
    label: "reserve",
  },
  {
    href: "/clpd",
    label: "aboutCLPD",
  },
];

const currentPathStyle =
  "bg-white text-black h-auto px-6 py-2 text-xl rounded-xl border-2 border-black font-bold shadow-brutalist";

const Navbar: React.FC<NavbarProps> = ({ sessionData }) => {
  const t = useTranslations("navbar");
  const { user } = useUserStore();
  const pathname = usePathname();
  const currentLang = pathname.startsWith("/es") ? "es" : "en";
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    setLoading(true);
    if (!sessionData) {
      router.push(`/${currentLang}/signin`);
      return;
    }
    try {
      const response = await axios.post(`/api/auth/authenticate`, {
        phoneNumber: sessionData.phoneNumber,
      });
      if (response.status === 200 && !response.data.requiresPasskey) {
        router.push(`/${currentLang}/app`);
        return;
      }

      const assertion = await startAuthentication({
        optionsJSON: response.data.options,
      });
      const resAuthentication = await axios.post("/api/auth/authenticate-passkey", {
        assertion,
        phoneNumber: sessionData.phoneNumber,
      });
      if (resAuthentication.status === 200) {
        router.push(`/${currentLang}/app`);
      }
    } catch (error) {
      console.error("Error fetching authentication options:", error);
    } finally {
      setLoading(false);
    }
  };

  const isExpired = sessionData?.exp < Date.now();

  return (
    <nav className="bg-brand-blue px-6 py-2 lg:px-12 lg:py-4 flex justify-between items-center sticky top-0 z-50 h-auto lg:h-24 max-w-screen">
      {/* Desktop */}
      <div id="recaptcha-container" />
      <div className="hidden md:flex flex-1 space-x-4 items-center justify-evenly font-bold font-helvetica">
        <Link href="/">
          <Image src="/images/clpa-logo-white.svg" alt="CLPD logo" width={64} height={64} />
        </Link>
        <div className="flex flex-1 space-x-4 items-center justify-evenly font-bold font-helvetica">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href === "/" ? `/${currentLang}` : `/${currentLang}${link.href}`}
              className={cn(
                pathname === (link.href === "/" ? `/${currentLang}` : `/${currentLang}${link.href}`)
                  ? currentPathStyle
                  : "text-white text-xl hover:text-blue-200"
              )}
            >
              {t(link.label)}
            </Link>
          ))}
        </div>
        {isExpired ? (
          <Button
            onClick={handleLogin}
            className="bg-black text-white h-auto px-6 py-2 text-xl rounded-xl border-2 border-black font-bold shadow-brutalist"
            disabled={loading}
          >
            {loading ? <LoadingSpinner /> : t("login")}
          </Button>
        ) : (
          <Link
            href={`/${currentLang}/signin`}
            className="bg-black text-white h-auto px-6 py-2 text-xl rounded-xl border-2 border-black font-bold shadow-brutalist"
          >
            {t("login")}
          </Link>
        )}
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-1 justify-between items-center">
        <Link href="/">
          <Image src="/images/clpa-logo-white.svg" alt="CLPD logo" width={64} height={64} />
        </Link>

        <div className="flex items-center gap-2">
          {isExpired ? (
            <Button
              onClick={handleLogin}
              className="bg-black text-white h-auto px-6 py-2 max-md:text-sm text-xl rounded-xl border-2 border-black font-bold shadow-brutalist"
              disabled={loading}
            >
              {loading ? <LoadingSpinner /> : t("login")}
            </Button>
          ) : (
            <Link href={`/${currentLang}/signin`} className={currentPathStyle}>
              {t("login")}
            </Link>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button className="bg-black text-white h-auto p-1.5 max-md:text-sm text-xl rounded-xl border-2 border-black font-bold shadow-brutalist">
                <LucideMenu />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="bg-brand-blue border-t-2 border-x-2 border-black rounded-t-xl transition-all duration-300"
            >
              <SheetDescription className="flex flex-col gap-2 items-center justify-center">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href === "/" ? `/${currentLang}` : `/${currentLang}${link.href}`}
                    className={cn(
                      pathname ===
                        (link.href === "/" ? `/${currentLang}` : `/${currentLang}${link.href}`)
                        ? currentPathStyle
                        : "text-white text-xl hover:text-blue-200 font-helvetica"
                    )}
                  >
                    {t(link.label)}
                  </Link>
                ))}
              </SheetDescription>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
