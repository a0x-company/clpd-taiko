// icons
import { useLocale, useTranslations } from "next-intl";
import DepositIcon from "../icons/DepositIcon";
import WithdrawIcon from "../icons/WithdrawIcon";

// components
import { Card } from "../ui/card";
import { LoadingSpinner } from "../ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

// types
import { Deposit, Redeem } from "@/types";
import { formatDateTime } from "@/lib/utils";
import Image from "next/image";
export interface History {
  deposits: (Deposit & { type: "deposit" })[];
  redeems: (Redeem & { type: "redeem" })[];
}

interface MovementsProps {
  history: History | null;
  loading: boolean;
}

const tableHeaders = ["type", "amount", "date"];

const icons = {
  deposit: <DepositIcon />,
  redeem: <WithdrawIcon />,
};

interface Movement {
  id: string;
  type: "deposit" | "redeem";
  amount: string;
  createdAt: Date;
}

const parseMovements = (history: History | null): Movement[] => {
  if (!history) return [];

  return [...history.deposits, ...history.redeems].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

const TableMovements = ({
  movements,
  t,
  locale,
}: {
  movements: Movement[];
  t: (key: string) => string;
  locale: string;
}) => {
  return (
    <Table>
      <TableHeader className="border-b-2 border-dashed">
        <TableRow className="[&>th:first-child]:w-40 [&>th:last-child]:w-40">
          {tableHeaders.map((header) => (
            <TableHead key={header} className="text-brand-blue/75 font-bold text-xl">
              {t(header)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody className="w-full h-full items-center">
        {movements.map((movement) => (
          <TableRow key={movement.id} className="border-b-0">
            <TableCell className="font-bold text-xl">
              <div className="flex items-center gap-2">
                <div className="rounded-md">{icons[movement.type]}</div>
                {t(movement.type)}
              </div>
            </TableCell>
            <TableCell className="font-bold text-xl">
              {movement.type === "deposit" ? "+ " : "- "}
              {movement.amount} CLPD
            </TableCell>
            <TableCell className="text-xl font-bold text-slate-600">
              {formatDateTime(movement.createdAt, locale).dateOnly}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const Movements = ({ history, loading }: MovementsProps) => {
  const movements = parseMovements(history);
  const t = useTranslations("profile.movementsTable");
  const currentLocale = useLocale();
  return (
    <Card className="flex flex-col w-full bg-white border-2 border-black shadow-brutalist overflow-hidden rounded-xl p-6 gap-3 h-full items-center justify-center">
      {loading ? (
        <LoadingSpinner />
      ) : // ) : false ? (
      movements.length > 0 ? (
        <TableMovements movements={movements} t={t} locale={currentLocale} />
      ) : (
        <div className="flex flex-col w-full h-full">
          <div className="flex items-center gap-2 border-b-2 border-dashed [&>p:first-child]:w-40 [&>p:last-child]:ml-auto [&>p:last-child]:w-40">
            {tableHeaders.map((header) => (
              <p key={header} className="text-brand-blue/75 font-bold text-xl">
                {t(header)}
              </p>
            ))}
          </div>
          <div className="text-center text-xl font-bold text-slate-600 w-full h-full flex flex-col items-center justify-center self-center">
            {t("noMovements")}
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

export default Movements;
