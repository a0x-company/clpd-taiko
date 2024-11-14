"use client";

import { useEffect, useState } from "react";

// next
import Image from "next/image";

// translations
import { useTranslations } from "next-intl";

// icons
import ChangeIcon from "../icons/ChangeIcon";
import DepositIcon from "../icons/DepositIcon";
import InvestIcon from "../icons/InvestIcon";
import ProfileIcon from "../icons/ProfileIcon";
import WithdrawIcon from "../icons/WithdrawIcon";

// context
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

// lib
import { cn } from "@/lib/utils";

// ui
import { LucideMenu } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTrigger } from "../ui/sheet";

import { Button } from "../ui/button";

type NavOption = "profile" | "deposit" | "withdraw" | "invest" | "change";

const getTabColor = (option: NavOption, selectedOption: NavOption) => {
  return selectedOption === option ? "white" : "black";
};

const tabs: { href: string; label: NavOption; icon: (color: string) => React.ReactNode }[] = [
  {
    href: "/app?tab=profile",
    label: "profile",
    icon: (color) => <ProfileIcon color={color} />,
  },
  {
    href: "/app?tab=deposit",
    label: "deposit",
    icon: (color) => <DepositIcon color={color} />,
  },
  {
    href: "/app?tab=withdraw",
    label: "withdraw",
    icon: (color) => <WithdrawIcon color={color} />,
  },
  {
    href: "/app?tab=invest",
    label: "invest",
    icon: (color) => <InvestIcon color={color} />,
  },
  {
    href: "/app?tab=change",
    label: "change",
    icon: (color) => <ChangeIcon color={color} />,
  },
];

const AppNavbar = () => {
  const [selectedOption, setSelectedOption] = useState<NavOption>("deposit");

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const t = useTranslations("navbar");
  const currentLang = pathname.startsWith("/es") ? "es" : "en";

  const getButtonStyle = (option: NavOption) => {
    const baseStyle =
      "flex w-[192px] py-3 px-4 justify-center items-center gap-[8px] rounded-[12px] cursor-pointer transition-all duration-300";
    const selectedStyle = "bg-black text-white";
    const unselectedStyle = "border-[2px] border-transparent hover:border-black";

    return `${baseStyle} ${selectedOption === option ? selectedStyle : unselectedStyle}`;
  };

  useEffect(() => {
    if (searchParams.size === 0) {
      setSelectedOption("deposit");
      return;
    }
    const tab = searchParams.get("tab") as NavOption;
    setSelectedOption(tab);
  }, [searchParams]);

  return (
    <div className="flex flex-row py-4 md:py-[32px] px-6 md:px-[48px] justify-between items-center">
      <Link href={`/${currentLang}`} className="content-center items-center gap-[10px]">
        <Image
          src="/images/clpa-logo.svg"
          alt="CLPD logo"
          width={64}
          height={64}
          className="max-md:w-10 max-md:h-10"
        />
      </Link>

      <Sheet>
        <SheetTrigger asChild>
          <Button className="bg-black text-white h-auto p-1.5 max-md:text-sm text-xl rounded-xl border-2 border-black font-bold shadow-brutalist md:hidden">
            <LucideMenu />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="bg-brand-blue border-t-2 border-x-2 border-black rounded-t-xl transition-all duration-300"
        >
          <SheetDescription className="flex flex-col gap-2 items-center justify-center">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={`/${currentLang}${tab.href}`}
                className={cn(
                  selectedOption === tab.label
                    ? "bg-white text-black h-auto px-6 py-2 text-xl rounded-xl border-2 border-black font-bold shadow-brutalist"
                    : "text-white text-xl hover:text-blue-200 font-helvetica"
                )}
              >
                {t(tab.label)}
              </Link>
            ))}
          </SheetDescription>
        </SheetContent>
      </Sheet>

      <div className="max-md:hidden flex flex-row max-w-3xl p-[16px] items-center gap-[16px] rounded-[12px]  absolute left-1/2 -translate-x-1/2">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={`/${currentLang}${tab.href}`}
            className={getButtonStyle(tab.label)}
            onClick={() => setSelectedOption(tab.label)}
          >
            {tab.icon(getTabColor(tab.label, selectedOption))}
            <p className="text-center font-helvetica text-[20px] font-[700]">{t(tab.label)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AppNavbar;
