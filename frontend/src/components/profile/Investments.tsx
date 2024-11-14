// icons
import { useLocale, useTranslations } from "next-intl";

// components
import { Card } from "../ui/card";
import { LoadingSpinner } from "../ui/spinner";

// types
import Image from "next/image";

interface InvestmentsProps {
  fees: { amountCLPD: number; amountUSDC: number } | null;
  positions: { amountCLPD: number; amountUSDC: number } | null;
  loading: boolean;
}

const Investments = ({ positions, fees, loading }: InvestmentsProps) => {
  const t = useTranslations("profile.investmentsInfo");
  const currentLocale = useLocale();
  return (
    <Card className="flex flex-col w-full min-h-40 bg-white border-2 border-black shadow-brutalist overflow-hidden rounded-xl p-6 gap-3 items-center justify-center">
      {loading ? (
        <LoadingSpinner />
      ) : positions && fees ? (
        <div className="flex w-full h-full items-center justify-between">
          <div className="flex flex-col gap-2">
            <p className="font-bold text-xl">{t("yourPool")}</p>
            <p className="text-xl text-brand-blue/50 font-bold">
              {positions.amountCLPD.toFixed(2)} CLPD
            </p>
            <p className="text-xl text-brand-blue/50 font-bold">
              {positions.amountUSDC.toFixed(2)} USDC
            </p>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <p className="font-bold text-xl">{t("yourFees")}</p>
            <p className="text-xl text-brand-blue/50 font-bold">
              {fees.amountCLPD.toFixed(2)} CLPD
            </p>
            <p className="text-xl text-brand-blue/50 font-bold">
              {fees.amountUSDC.toFixed(2)} USDC
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full">
          <div className="text-center text-xl font-bold text-slate-600 w-full h-full flex flex-col items-center justify-center self-center">
            {t("noInvestments")}
            <Image
              src="/images/app/document-gif.gif"
              alt="document"
              width={200}
              height={200}
              unoptimized
            />
          </div>
        </div>
      )}
    </Card>
  );
};

export default Investments;
