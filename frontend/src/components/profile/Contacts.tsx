// react
import { useState } from "react";

// icons
import { useTranslations } from "next-intl";

// components
import { Card } from "../ui/card";
import { LoadingSpinner } from "../ui/spinner";
import ContactsFooter from "./ContactsFooter";
import DialogAddContact from "./DialogAddContact";
import ListContacts from "./ListContacts";

// next
import Image from "next/image";

// types
import { Contact } from "@/hooks/useContacts";

interface ContactsProps {
  contacts: Contact[] | null;
  loading: boolean;
}

const Contacts = ({ contacts, loading }: ContactsProps) => {
  const t = useTranslations("profile.contactsList");
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <Card className="flex flex-col w-full bg-white border-2 border-black shadow-brutalist overflow-hidden rounded-xl p-6 gap-3 h-full">
      {loading ? (
        <LoadingSpinner />
      ) : contacts && contacts.length > 0 ? (
        <ListContacts contacts={contacts} handleOpen={handleOpen} />
      ) : (
        <div className="flex flex-col w-full h-full">
          <div className="text-center text-xl font-bold text-slate-600 w-full h-full flex flex-col items-center justify-center self-center">
            {t("noContacts")}
            <Image
              src="/images/app/contacts-gif.gif"
              alt="contacts"
              width={200}
              height={200}
              unoptimized
            />
          </div>
          <ContactsFooter handleOpen={handleOpen} />
        </div>
      )}
      <DialogAddContact open={open} setOpen={setOpen} />
    </Card>
  );
};

export default Contacts;
