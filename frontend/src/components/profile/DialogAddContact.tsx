// react
import { useState } from "react";

// translations
import { useTranslations } from "next-intl";

// components
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

// icons
import UserIcon from "../icons/UserIcon";
import PhoneIcon from "../icons/PhoneIcon";

// utils
import { cn } from "@/lib/utils";

// axios
import axios from "axios";
import { LoadingSpinner } from "../ui/spinner";
import useContacts from "@/hooks/useContacts";

const DialogAddContact = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useTranslations("profile.contactsList");

  const { addContact } = useContacts();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("handleSubmit");
    setLoading(true);
    try {
      const response = await addContact({
        id: "",
        name,
        phoneNumber,
      });
      console.log(response);
      if (response?.status === 200) {
        setOpen(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const onChangePhoneNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9]/g, "");
    setPhoneNumber(numericValue);
  };
  const onChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl bg-white text-black font-helvetica rounded-3xl border-2 border-black">
        <DialogHeader>
          <DialogTitle>{t("addContact")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} id="add-contact-form">
          <div className="grid gap-4 py-4">
            <div
              className={cn(
                "flex flex-col bg-gray-100 border-2 border-black shadow-brutalist-sm p-4 rounded-lg relative transition-all duration-300",
                name.length > 0 && "bg-white border-brand-blue shadow-[2px_2px_0px_0px_#0267FF]"
              )}
            >
              <Input
                id="name"
                name="name"
                value={name}
                className="bg-transparent text-xl font-helvetica outline-none p-0 pt-2 text-brand-blue rounded-none border-none peer transition-all duration-300"
                onChange={onChangeName}
              />
              <div
                className={cn(
                  "absolute flex items-center gap-2 top-1/2 -translate-y-1/2 transition-all duration-300",
                  name.length > 0
                    ? "top-0 scale-75 translate-y-0 -translate-x-3"
                    : "peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:translate-y-0 peer-focus:top-0 peer-focus:-translate-x-3 peer-focus:scale-75"
                )}
              >
                <UserIcon
                  color={name.length > 0 ? "#0267FF" : "#000"}
                  opacity={name.length > 0 ? 1 : 0.5}
                />
                <Label
                  htmlFor="name"
                  className={cn(
                    "font-bold font-helvetica text-lg text-black/50 transition-all duration-300",
                    name.length > 0 && "text-brand-blue"
                  )}
                >
                  {t("name")}
                </Label>
              </div>
            </div>
            <div
              className={cn(
                "flex flex-col bg-gray-100 border-2 border-black shadow-brutalist-sm p-4 rounded-lg relative transition-all duration-300",
                phoneNumber.length > 0 &&
                  "bg-white border-brand-blue shadow-[2px_2px_0px_0px_#0267FF]"
              )}
            >
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={phoneNumber}
                className="bg-transparent text-xl font-helvetica outline-none p-0 pt-2 text-brand-blue rounded-none border-none peer transition-all duration-300"
                onChange={onChangePhoneNumber}
              />
              <div
                className={cn(
                  "absolute flex items-center gap-2 top-1/2 -translate-y-1/2 transition-all duration-300",
                  phoneNumber.length > 0
                    ? "top-0 scale-75 translate-y-0 -translate-x-8"
                    : "peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:translate-y-0 peer-focus:top-0 peer-focus:-translate-x-8 peer-focus:scale-75"
                )}
              >
                <PhoneIcon
                  color={phoneNumber.length > 0 ? "#0267FF" : "#000"}
                  opacity={phoneNumber.length > 0 ? 1 : 0.5}
                />
                <Label
                  htmlFor="phoneNumber"
                  className={cn(
                    "font-bold font-helvetica text-lg text-black/50 transition-all duration-300",
                    phoneNumber.length > 0 && "text-brand-blue"
                  )}
                >
                  {t("phone")}
                </Label>
              </div>
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button
            type="submit"
            disabled={loading}
            form="add-contact-form"
            className="w-full bg-brand-blue text-white shadow-brutalist-sm border-2 border-black py-3 text-xl font-bold h-auto"
          >
            {loading ? <LoadingSpinner /> : t("addContact")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DialogAddContact;
