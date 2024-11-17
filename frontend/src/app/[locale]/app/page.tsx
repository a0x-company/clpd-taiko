// components
import AppNavbar from "@/components/app/AppNavbar";
import Change from "@/components/app/Change";
import Deposit from "@/components/app/Deposit";
import Invest from "@/components/app/Invest";
import Profile from "@/components/app/Profile";
import Withdraw from "@/components/app/Withdraw";
import Bridge from "@/components/app/Bridge";

export default function App({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <main className="min-h-screen min-w-screen bg-white text-black flex flex-col">
      <AppNavbar />
      {(searchParams.tab === "deposit" || !searchParams.tab) && <Deposit />}
      {searchParams.tab === "withdraw" && <Withdraw />}
      {searchParams.tab === "invest" && <Invest />}
      {searchParams.tab === "change" && <Change />}
      {searchParams.tab === "profile" && <Profile />}
      {searchParams.tab === "bridge" && <Bridge />}
    </main>
  );
}
