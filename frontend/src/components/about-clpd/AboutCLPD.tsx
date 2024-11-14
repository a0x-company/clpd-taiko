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

interface Event {
  id: string;
  type: "mint" | "burn";
  amount: string;
  user: string;
  chain: string;
  createdAt: Date;
}

const mockEvents: Event[] = [
  {
    id: "1",
    type: "mint",
    amount: "100",
    user: "0x0000000000000000000000000000000000000000",
    chain: "base",
    createdAt: new Date(),
  },
  {
    id: "2",
    type: "burn",
    amount: "100",
    user: "0x0000000000000000000000000000000000000000",
    chain: "base",
    createdAt: new Date(),
  },
  {
    id: "3",
    type: "mint",
    amount: "2500",
    user: "0x0000000000000000000000000000000000000000",
    chain: "base",
    createdAt: new Date(),
  },
  {
    id: "4",
    type: "burn",
    amount: "2500",
    user: "0x0000000000000000000000000000000000000000",
    chain: "taiko",
    createdAt: new Date(),
  },
];

const hrefBaseScan = "https://basescan.org/tx/";
const hrefTaikoScan = "https://hekla.taikoscan.io/tx/";

const TableToken = ({
  events,
  t,
  locale,
}: {
  events: Event[];
  t: (key: string) => string;
  locale: string;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const indexOfLastEvent = currentPage * itemsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - itemsPerPage;
  const currentEvents = events.slice(indexOfFirstEvent, indexOfLastEvent);

  const totalPages = Math.ceil(events.length / itemsPerPage);

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
                  event.chain === "base"
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
              <TableCell className="font-bold text-xl">{event.amount} CLPD</TableCell>
              <TableCell className="text-xl font-bold text-slate-600">
                {event.user.slice(0, 6)}...{event.user.slice(-4)}
              </TableCell>
              <TableCell className="text-xl font-bold text-slate-600">{event.chain}</TableCell>
              <TableCell className="text-xl font-bold text-slate-600">
                {formatDateTime(event.createdAt, locale).dateOnly}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
    </>
  );
};

const AboutCLPD: React.FC<AboutCLPDProps> = () => {
  const fetchedData = useRef(false);

  // const result = useReadContracts({
  //   allowFailure: true,
  //   contracts: [
  //     {
  //       address: addresses.base.CLPD.address,
  //       abi: erc20Abi,
  //       functionName: "totalSupply",
  //     },
  //   ],
  // });

  // console.log("result", result.data);

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

      <div className="flex flex-col max-w-7xl w-full mx-auto p-6 content-center justify-center items-center gap-8 border-2 border-black shadow-brutalist rounded-xl bg-white">
        <TableToken events={mockEvents} t={t} locale={locale} />
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
