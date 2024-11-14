"use client";

// react
import { useEffect, useRef, useState } from "react";

// next
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

// context
import { useUserStore } from "@/context/global-store";

// lib
import { formatNumber } from "@/lib/utils";
import { zeroAddress } from "viem";

// icons
import { RefreshCcw } from "lucide-react";

// axios
import axios from "axios";

// components
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import CopyButton, { copyToClipboard } from "./CopyButton";
import Movements, { History } from "../profile/Movements";
import Contacts from "../profile/Contacts";

// hooks
import { useCLPDBalance } from "@/hooks/useCLPDBalance";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";

// translations
import { useTranslations } from "next-intl";

// icons
import MovementsIcon from "../icons/MovementsIcon";
import ContactsIcon from "../icons/ContactsIcon";
import InvestmentIcon from "../icons/InvestmentIcon";
import Investments from "../profile/Investments";
import useContacts, { Contact } from "@/hooks/useContacts";

type NavOption = "movements" | "contacts" | "investments";

const options: { label: NavOption; icon: (color: string) => React.ReactNode }[] = [
  {
    label: "movements",
    icon: (color) => <MovementsIcon color={color} />,
  },
  {
    label: "contacts",
    icon: (color) => <ContactsIcon color={color} />,
  },
  {
    label: "investments",
    icon: (color) => <InvestmentIcon color={color} />,
  },
];

const getTabColor = (option: NavOption, selectedOption: NavOption) => {
  return selectedOption === option ? "white" : "black";
};

const Profile = () => {
  const [copied, setCopied] = useState(false);
  const [selectedOption, setSelectedOption] = useState<NavOption>("movements");
  const [history, setHistory] = useState<History | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { user } = useUserStore();
  const address = user?.address || zeroAddress;

  const { clpdBalanceFormatted, refetch: refetchCLPDBalance } = useCLPDBalance({ address });
  const { usdcBalanceFormatted, refetch: refetchUSDCBalance } = useUSDCBalance({ address });

  const t = useTranslations("profile");

  const router = useRouter();
  const pathname = usePathname();
  const currentLang = pathname.startsWith("/es") ? "es" : "en";

  const handleDisconnect = async () => {
    await axios.post("/api/user/logout");
    router.push(`/${currentLang}`);
  };

  const fetchHistory = async (phoneNumber: string) => {
    setLoadingHistory(true);
    const history = await axios.get<History>(`/api/history?phoneNumber=${phoneNumber}`);
    if (history.status === 200) {
      setHistory(history.data);
    }
    setLoadingHistory(false);
  };

  const hasFetchedHistory = useRef(false);

  const { contacts, loadingContacts } = useContacts();

  useEffect(() => {
    if (!hasFetchedHistory.current && user?.phoneNumber) {
      fetchHistory(user.phoneNumber);
      hasFetchedHistory.current = true;
    }
  }, [user]);

  /* INVESTMENTS */
  const [positions, setPositions] = useState<{ amountCLPD: number; amountUSDC: number } | null>(
    null
  );
  const [fees, setFees] = useState<{ amountCLPD: number; amountUSDC: number } | null>(null);
  const [loadingInvestments, setLoadingInvestments] = useState(false);
  const positionsFetched = useRef(false);
  const feesFetched = useRef(false);

  const getPositionsPool = async () => {
    try {
      const response = await axios.get(`/api/invest/position`);
      if (response.status === 200) {
        setPositions(response.data.data.positions);
        positionsFetched.current = true;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getFees = async () => {
    try {
      const response = await axios.get(`/api/invest/earned`);
      if (response.status === 200) {
        setFees(response.data.data);
        feesFetched.current = true;
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setLoadingInvestments(true);
    if (!positionsFetched.current) {
      getPositionsPool();
    }
    if (!feesFetched.current) {
      getFees();
    }
    setLoadingInvestments(false);
  }, [positionsFetched.current, feesFetched.current]);

  const getButtonStyle = (option: NavOption) => {
    const baseStyle =
      "flex w-full py-3 px-4 justify-center items-center gap-[8px] rounded-lg cursor-pointer transition-all duration-300 border-2 font-bold";
    const selectedStyle = "bg-black text-white border-black";
    const unselectedStyle = "border-black hover:border-gray-400";

    return `${baseStyle} ${selectedOption === option ? selectedStyle : unselectedStyle}`;
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start justify-center max-w-6xl w-full self-center">
      <Card className="flex flex-col w-96 bg-white border-2 border-black shadow-brutalist overflow-hidden rounded-xl p-6 gap-3">
        <div className="flex flex-col gap-2 items-start relative w-full overflow-hidden">
          <div className="flex gap-2 w-full">
            <div className="bg-gradient-to-t from-brand-blue to-brand-white p-4 rounded-lg border-2 border-black w-32">
              <Image
                src="/images/clpa-logo-white.svg"
                alt="CLPD logo"
                width={82}
                height={82}
                className="-rotate-[20deg] z-0 opacity-50"
              />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <p className="font-helvetica text-xl font-[700] text-black">{user?.name}</p>
              <p className="font-helvetica text-xl font-normal text-black">{user?.phoneNumber}</p>
              <p
                onClick={() => {
                  copyToClipboard(address, setCopied);
                }}
                className="font-helvetica text-xl font-normal text-black/40 flex items-center justify-between w-full gap-2 group cursor-pointer"
              >
                {address?.slice(0, 6)}...{address?.slice(-4)}
                <CopyButton text={address} setCopied={setCopied} copied={copied} />
              </p>
            </div>
          </div>

          <Image
            src="/images/reserve/divider-mobile.svg"
            alt="divider"
            width={140}
            height={2}
            className="w-full my-4"
          />

          <p className="font-helvetica text-xl font-[700] text-black">{t("balance")}:</p>
          <div className="flex items-center justify-start w-full gap-2 group">
            <Image
              src={`/images/landing/clpa-logo-white.svg`}
              alt={`Logo CLPD`}
              width={32}
              height={32}
              unoptimized
              className="rounded-full overflow-hidden border-2 border-black h-8 w-8 object-cover bg-brand-blue-dark p-px"
            />
            <p className="font-helvetica text-xl text-black gap-2 cursor-pointer mr-auto">
              {formatNumber(Number(clpdBalanceFormatted))} CLPD
            </p>
            <Button
              onClick={() => {
                refetchCLPDBalance();
              }}
              className="text-black group-hover:opacity-100 opacity-0 transition-opacity duration-300 p-1 h-auto"
            >
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-start w-full gap-2 group">
            <Image
              src={`/images/app/usdc-icon.svg`}
              alt={`Logo CLPD`}
              width={32}
              height={32}
              unoptimized
              className="rounded-full overflow-hidden h-8 w-8 object-cover"
            />
            <p className="font-helvetica text-xl text-black gap-2 cursor-pointer mr-auto">
              {usdcBalanceFormatted === "0.00" ? "0" : formatNumber(Number(usdcBalanceFormatted))}{" "}
              USDC
            </p>
            <Button
              onClick={() => {
                refetchUSDCBalance();
              }}
              className="text-black group-hover:opacity-100 opacity-0 transition-opacity duration-300 p-1 h-auto"
            >
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {options.map((option) => (
          <button
            key={option.label}
            className={getButtonStyle(option.label as NavOption)}
            onClick={() => {
              setSelectedOption(option.label as NavOption);
            }}
          >
            {option.icon(getTabColor(option.label, selectedOption))}
            {t(option.label)}
          </button>
        ))}
        <button
          onClick={handleDisconnect}
          className="flex items-center justify-center bg-brand-orange-pastel py-3 border-2 border-black rounded-lg w-full text-start text-white gap-2 font-helvetica text-base leading-none font-[700]"
        >
          <Image src="/images/app/logout-vector.svg" alt="logout" width={24} height={24} />
          {t("logout")}
        </button>
      </Card>

      {selectedOption === "movements" && <Movements history={history} loading={loadingHistory} />}
      {selectedOption === "contacts" && <Contacts contacts={contacts} loading={loadingContacts} />}
      {selectedOption === "investments" && (
        <Investments positions={positions} fees={fees} loading={loadingInvestments} />
      )}
    </section>
  );
};

export default Profile;
