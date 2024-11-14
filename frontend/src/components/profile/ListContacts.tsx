// react
import { useState } from "react";

// components
import { Input } from "../ui/input";
import ContactsFooter from "./ContactsFooter";

// icons
import { Search, Send, Trash2 } from "lucide-react";

// next
import Image from "next/image";

// translations
import { useLocale, useTranslations } from "next-intl";

// utils
import { cn } from "@/lib/utils";

// types
import { Contact } from "@/hooks/useContacts";
import Link from "next/link";

const ListContacts = ({
  contacts,
  withdrawPage = false,
  handleOpen,
  handleSelectContact,
  selectedContact,
}: {
  contacts: Contact[];
  withdrawPage?: boolean;
  handleOpen?: () => void;
  handleSelectContact?: (contact: Contact) => void;
  selectedContact?: Contact | null;
}) => {
  const t = useTranslations("profile.contactsList");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const contactsPerPage = 4;

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastContact = currentPage * contactsPerPage;
  const indexOfFirstContact = indexOfLastContact - contactsPerPage;
  const currentContacts = filteredContacts.slice(indexOfFirstContact, indexOfLastContact);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const locale = useLocale();

  return withdrawPage && selectedContact ? (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "w-full border-2 shadow-brutalist-sm rounded-xl p-2 flex items-center justify-start gap-2 border-brand-blue"
        )}
      >
        <div className="bg-gradient-to-t from-brand-blue to-brand-white p-1 rounded-full w-12">
          <Image src="/images/clpa-logo-white.svg" alt="CLPD logo" width={40} height={40} />
        </div>
        <div className="flex flex-col items-start justify-start">
          <p className="font-bold">{selectedContact.name}</p>
          <p className="font-normal text-sm text-black/50">{selectedContact.phoneNumber}</p>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-center border-b-2 border-dashed">
        <Search />
        <Input
          type="text"
          placeholder={t("contactsSearch")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 rounded bg-white outline-none border-none"
        />
      </div>
      <ul className="flex flex-col gap-3">
        {currentContacts.map((contact) => (
          <li key={contact.id} className="relative group">
            <button
              type="button"
              onClick={() => {
                if (withdrawPage && handleSelectContact) {
                  handleSelectContact(contact);
                }
              }}
              className={cn(
                "w-full border-2 border-black shadow-brutalist-sm rounded-xl p-2 flex items-center justify-start gap-2",
                selectedContact?.id === contact.id && "border-brand-blue"
              )}
            >
              <div className="bg-gradient-to-t from-brand-blue to-brand-white p-1 rounded-full w-12">
                <Image
                  src="/images/clpa-logo-white.svg"
                  alt="CLPD logo"
                  width={40}
                  height={40}
                  className="-rotate-[20deg] z-0 opacity-50"
                />
              </div>
              <div className="flex flex-col items-start justify-start">
                <p className="font-bold">{contact.name}</p>
                <p className="font-normal text-sm text-black/50">{contact.phoneNumber}</p>
              </div>
            </button>
            <div className="absolute top-1/2 -translate-y-1/2 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
              <Link
                href={`/${locale}/app?tab=withdraw&type=contact&phoneNumber=${contact.phoneNumber}&name=${contact.name}`}
              >
                <Send className="w-6 h-6" />
              </Link>
              <button type="button">
                <Trash2 className="w-6 h-6" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {/* Paginación */}
      {filteredContacts.length > contactsPerPage && (
        <div className="flex justify-center mt-auto">
          {Array.from(
            { length: Math.ceil(filteredContacts.length / contactsPerPage) },
            (_, index) => (
              <button
                type="button"
                key={index + 1}
                onClick={() => paginate(index + 1)}
                className="mx-1 bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 font-bold text-sm border border-black transition-colors duration-300"
              >
                {index + 1}
              </button>
            )
          )}
        </div>
      )}
      {handleOpen && <ContactsFooter handleOpen={handleOpen} />}
    </div>
  );
};

export default ListContacts;
