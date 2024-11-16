"use client";

import React, { useEffect, useRef, useState } from "react";

// next
import Image from "next/image";

// http client
import axios from "axios";

// tranlations
import { useLocale, useTranslations } from "next-intl";

// constants

// recharts

import { useMediaQuery } from "react-responsive";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { formatUnits } from "viem";

interface AboutCLPDProps {}

const tableHeaders = [
  {
    title: "eventType",
    key: "eventType",
  },
  {
    title: "amount",
    key: "amount",
  },
  {
    title: "user",
    key: "user",
  },
  {
    title: "chain",
    key: "chain",
  },
  {
    title: "date",
    key: "date",
  },
];

export interface BridgeEvent {
  id: string;
  block_number: number;
  timestamp: string;
  transactionHash: string;
  contractId: string;
  user: string;
  amount: string;
  chain: string;
  from: string;
  toBridge: string;
  type: "bridge";
}

export interface TokenMintedEvent {
  id: string;
  block_number: number;
  timestamp: string;
  transactionHash: string;
  contractId: string;
  agent: string;
  user: string;
  amount: string;
  chain: string;
  type: "mint";
}

export interface TokenBurnedEvent {
  id: string;
  block_number: number;
  timestamp: string;
  transactionHash: string;
  contractId: string;
  user: string;
  amount: string;
  chain: string;
  type: "burn";
}

//   {
//     "data": {
//         "chains": {
//             "HeKlaTestnet": {
//                 "totalSupply": "2995869000000000000000000",
//                 "events": {
//                     "bridges": [],
//                     "minted": [
//                         {
//                             "id": "0x188dff9cf8cef4384c642899e09777c35af049ec6912bcf251e2843cd0c43fe4",
//                             "block_number": 970526,
//                             "timestamp": "2024-11-13T23:59:24.000Z",
//                             "transactionHash": "0x188dff9cf8cef4384c642899e09777c35af049ec6912bcf251e2843cd0c43fe4",
//                             "contractId": "0x53c04d5FC9F8d5c4f3C45B4da6617868ECEaF636",
//                             "agent": "0xd806A01E295386ef7a7Cea0B9DA037B242622743",
//                             "user": "0x2F2B1a3648C58CF224aA69A4B0BdC942F000045F",
//                             "amount": "2995869000000000000000000"
//                         }
//                     ],
//                     "burned": []
//                 }
//             },
//             "Sepolia": {
//                 "totalSupply": "2995869000000000000000000",
//                 "events": {
//                     "bridges": [],
//                     "minted": [
//                         {
//                             "__typename": "TokensMinted",
//                             "id": "0x4c319a90dee8531f04bdbfd2a69217adf643fc3b58146bb822af768fbd015689-6",
//                             "block_number": "17886900",
//                             "timestamp_": "1731542088",
//                             "transactionHash_": "0x4c319a90dee8531f04bdbfd2a69217adf643fc3b58146bb822af768fbd015689",
//                             "contractId_": "0xe2c6d205f0ef4a215b66b25437bbc5c8d59525fe",
//                             "agent": "0xd806a01e295386ef7a7cea0b9da037b242622743",
//                             "user": "0x2f2b1a3648c58cf224aa69a4b0bdc942f000045f",
//                             "amount": "2995869000000000000000000"
//                         }
//                     ],
//                     "burned": []
//                 }
//             }
//         }
//     }
// }

interface Events {
  bridges: BridgeEvent[];
  minted: TokenMintedEvent[];
  burned: TokenBurnedEvent[];
}

const hrefBaseScan = "https://basescan.org/tx/";
const hrefTaikoScan = "https://hekla.taikoscan.io/tx/";

const TableToken = ({
  events,
  t,
  locale,
}: {
  events: Events;
  t: (key: string) => string;
  locale: string;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const allEvents = [...events.bridges, ...events.minted, ...events.burned].sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  const indexOfLastEvent = currentPage * itemsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - itemsPerPage;
  const currentEvents = allEvents.slice(indexOfFirstEvent, indexOfLastEvent);

  const totalPages = Math.ceil(allEvents.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      <Table className="min-w-full">
        <TableHeader className="border-b-2 border-dashed">
          <TableRow className="[&>th:first-child]:w-40 [&>th:last-child]:w-40">
            {tableHeaders.map((header) => (
              <TableHead key={header.key} className="text-brand-blue/75 font-bold text-xl">
                {t(header.title)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="w-full h-full items-center">
          {currentEvents.map((event) => (
            <TableRow key={event.id} className="border-b-0">
              <Link
                href={
                  event.chain === "baseSepolia"
                    ? `${hrefBaseScan}${event.id}`
                    : `${hrefTaikoScan}${event.id}`
                }
                target="_blank"
                className="group"
              >
                <TableCell className="font-bold text-xl group-hover:text-brand-blue transition-all duration-300">
                  <div className="flex items-center gap-2">{t(event.type)}</div>
                </TableCell>
              </Link>
              <TableCell className="font-bold text-xl">
                {formatUnits(BigInt(event.amount), 18)} CLPD
              </TableCell>
              <TableCell className="text-xl font-bold text-slate-600">
                {event.user.slice(0, 6)}...{event.user.slice(-4)}
              </TableCell>
              <TableCell className="text-xl font-bold text-slate-600">
                {event.chain === "baseSepolia" ? "Base Sepolia" : "Taiko Hekla"}
              </TableCell>
              <TableCell className="text-xl font-bold text-slate-600">
                {formatDateTime(new Date(event.timestamp), locale).dateOnly}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              onClick={() => handlePageChange(index + 1)}
              className={`mx-1 px-3 py-1 rounded ${
                currentPage === index + 1 ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      <p className="text-sm font-beauford font-bold text-slate-600 flex items-center">
        Powered by
        <Link
          href="https://goldsky.com"
          target="_blank"
          className="flex items-center hover:opacity-75 transition-all duration-300"
        >
          <Image
            src="/images/goldsky-logo.svg"
            alt="Goldsky"
            width={24}
            height={24}
            className="ml-2 mr-1"
          />
          <span className="text-brand-yellow-pastel">Goldsky</span>
        </Link>
      </p>
    </>
  );
};

const AboutCLPD: React.FC<AboutCLPDProps> = () => {
  const [data, setData] = useState<Events | null>(null);

  const fetchedData = useRef(false);

  const fetchData = async () => {
    try {
      const response = await axios.get("/api/events");
      if (response.data) {
        const formattedData: Events = {
          bridges: [],
          minted: [],
          burned: [],
        };

        const heKlaEvents = response.data.chains.HeKlaTestnet.events;
        const sepoliaEvents = response.data.chains.Sepolia.events;

        heKlaEvents.bridges.forEach((event: BridgeEvent) => {
          formattedData.bridges.push({ ...event, chain: "taiko", type: "bridge" });
        });
        heKlaEvents.minted.forEach((event: TokenMintedEvent) => {
          formattedData.minted.push({ ...event, chain: "taiko", type: "mint" });
        });
        heKlaEvents.burned.forEach((event: TokenBurnedEvent) => {
          formattedData.burned.push({ ...event, chain: "taiko", type: "burn" });
        });

        sepoliaEvents.bridges.forEach((event: BridgeEvent) => {
          formattedData.bridges.push({ ...event, chain: "baseSepolia", type: "bridge" });
        });
        sepoliaEvents.minted.forEach((event: TokenMintedEvent) => {
          formattedData.minted.push({ ...event, chain: "baseSepolia", type: "mint" });
        });
        sepoliaEvents.burned.forEach((event: TokenBurnedEvent) => {
          formattedData.burned.push({ ...event, chain: "baseSepolia", type: "burn" });
        });

        setData(formattedData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (!fetchedData.current) {
      fetchData();
      fetchedData.current = true;
    }
  }, []);

  const t = useTranslations("aboutClpd");

  const isMobile = useMediaQuery({ maxWidth: 767 });

  const gradientStyle = { background: "linear-gradient(180deg, #06F 0%, #FFF 70%)" };

  const locale = useLocale();

  return (
    <section className="flex flex-col w-full relative gap-16" style={gradientStyle}>
      <div className="flex flex-col h-auto px-6 lg:px-[64px] content-center items-center gap-8 lg:gap-[64px] pt-16 lg:pt-[120px] relative">
        <div className="flex flex-col max-md:w-full max-lg:w-[860px] w-[1080px] content-center items-center gap-[12px]">
          <h1 className="text-white font-beauford text-[40px] md:text-[72px] font-[400]">
            {t("header")}
          </h1>

          <h3 className="text-white font-helvetica text-[24px] font-bold text-center">
            {t("description1")}
          </h3>
          <h3 className="text-white font-helvetica text-[24px] text-center">{t("description2")}</h3>
        </div>
      </div>

      <h1 className="text-white font-helvetica font-bold text-[40px] text-center">{t("events")}</h1>

      <div className="flex flex-col max-w-7xl w-full mx-auto p-6 content-center justify-center items-center gap-8 border-2 border-black shadow-brutalist rounded-xl bg-white">
        {data && <TableToken events={data} t={t} locale={locale} />}
      </div>

      <div className="flex flex-row items-center justify-center w-full relative">
        <Image
          src="/images/reserve/waves-vector-2.svg"
          alt="Waves Vector"
          width={250}
          height={350}
          className="absolute bottom-0 left-0 max-md:max-w-[100px] hidden md:block"
        />
      </div>

      <Image
        src="/images/reserve/waves-vector.svg"
        alt="Waves Vector"
        width={600}
        height={350}
        className="absolute -bottom-[175px] right-0 max-md:max-w-[300px]"
      />
    </section>
  );
};

export default AboutCLPD;
