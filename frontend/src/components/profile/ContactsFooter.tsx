import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ContactsFooter = ({ handleOpen }: { handleOpen: () => void }) => {
  const t = useTranslations("profile.contactsList");
  const router = useRouter();
  const locale = useLocale();

  const [canShare, setCanShare] = useState<boolean>(true);

  const shareData = {
    title: "CLPD",
    text: t("shareText"),
    url: "https://clpd-staging.vercel.app",
  };

  useEffect(() => {
    if (!navigator.canShare) {
      setCanShare(false);
    }
  }, [navigator]);

  const handleShare = async () => {
    if (canShare) {
      await navigator.share(shareData);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 mt-auto">
      <div className="flex gap-3 w-full">
        <Button
          onClick={handleShare}
          className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white shadow-brutalist-sm border-2 border-black py-3 text-xl font-bold h-auto"
        >
          {t("invite")}
        </Button>
        <Button
          onClick={handleOpen}
          className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white shadow-brutalist-sm border-2 border-black py-3 text-xl font-bold h-auto"
        >
          {t("addContact")}
        </Button>
      </div>
      <Button
        onClick={() => {
          router.push(`/${locale}/app?tab=withdraw&type=contact`);
        }}
        className="w-full bg-gray-300 py-3 text-white border-2 border-black text-xl font-bold h-auto"
      >
        {t("sendCLPD")}
      </Button>
    </div>
  );
};

export default ContactsFooter;
