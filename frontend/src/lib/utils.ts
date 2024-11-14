import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    const millions = num / 1000000;
    return millions % 1 === 0 ? millions.toFixed(0) + "m" : millions.toFixed(1) + "m";
  } else if (num >= 100000) {
    const hundreds = num / 1000;
    return hundreds.toFixed(0) + "k";
  } else {
    return num.toLocaleString();
  }
};

export function calculateFees(
  feeGrowthGlobal: bigint,
  feeGrowthOutsideLower: bigint,
  feeGrowthOutsideUpper: bigint,
  feeGrowthInsideLast: bigint,
  liquidity: bigint
): bigint {
  const Q128 = BigInt("340282366920938463463374607431768211455");

  // Calculate feeGrowthInside
  const feeGrowthBelow = feeGrowthOutsideLower;
  const feeGrowthAbove = feeGrowthOutsideUpper;
  const feeGrowthInside = feeGrowthGlobal - feeGrowthBelow - feeGrowthAbove;

  // Calculate fees
  const fees = (liquidity * (feeGrowthInside - feeGrowthInsideLast)) / Q128;

  return fees;
}

export const getOrigin = () => {
  return process.env.NODE_ENV === "development"
    ? "https://localhost:3000"
    : "https://clpd-staging.vercel.app";
};

export const formatDateTime = (dateString: Date, locale: string) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    weekday: "short", // abbreviated weekday name (e.g., 'Mon')
    month: "short", // abbreviated month name (e.g., 'Oct')
    day: "numeric", // numeric day of the month (e.g., '25')
    hour: "numeric", // numeric hour (e.g., '8')
    minute: "numeric", // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  };

  const dateDayOptions: Intl.DateTimeFormatOptions = {
    weekday: "short", // abbreviated weekday name (e.g., 'Mon')
    year: "numeric", // numeric year (e.g., '2023')
    month: "2-digit", // abbreviated month name (e.g., 'Oct')
    day: "2-digit", // numeric day of the month (e.g., '25')
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short", // abbreviated month name (e.g., 'Oct')
    year: "numeric", // numeric year (e.g., '2023')
    day: "numeric", // numeric day of the month (e.g., '25')
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric", // numeric hour (e.g., '8')
    minute: "numeric", // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  };

  const formattedDateTime: string = new Date(dateString).toLocaleString(locale, dateTimeOptions);

  const formattedDateDay: string = new Date(dateString).toLocaleString(locale, dateDayOptions);

  const formattedDate: string = new Date(dateString).toLocaleString(locale, dateOptions);

  const formattedTime: string = new Date(dateString).toLocaleString(locale, timeOptions);

  return {
    dateTime: formattedDateTime,
    dateDay: formattedDateDay,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  };
};
