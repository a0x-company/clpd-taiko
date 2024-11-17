"use client";
// react
import React, { useEffect, useState, useRef } from "react";

// firebase

// components
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

// icons

// simplewebauthn
import { cn } from "@/lib/utils";
import { platformAuthenticatorIsAvailable, startRegistration } from "@simplewebauthn/browser";
import { Check, ChevronLeft, ChevronRight, Clipboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import PhoneIcon from "../icons/PhoneIcon";
import UserIcon from "../icons/UserIcon";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import HeroSignIn from "./Hero";
import axios, { AxiosError } from "axios";
import { useTranslations } from "next-intl";

const formsIds = {
  register: "register",
  verify: "verify-otp",
  registerPasskey: "register-passkey",
  success: "success",
};

const textValidatorFromClipboard = (text: string) => {
  return text.length === 6 && !text.includes(" ");
};

const PasteButton = ({
  setOtp,
  pasted,
  setPasted,
}: {
  setOtp: (otp: string) => void;
  pasted: boolean;
  setPasted: (pasted: boolean) => void;
}) => {
  const handlePaste = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      const text = await navigator.clipboard.readText();
      if (textValidatorFromClipboard(text)) {
        setOtp(text);
        setPasted(true);
      } else {
        console.error("El texto pegado no es válido");
      }
    } catch (err) {
      console.error("Error al pegar:", err);
    }
  };
  return (
    <Button
      onClick={handlePaste}
      className={cn(
        "rounded-full p-2 h-auto transition-colors duration-300",
        pasted ? "bg-brand-green-pastel/10" : "hover:bg-brand-blue/10"
      )}
    >
      {pasted ? (
        <Check className="h-8 w-8 text-brand-green-pastel" />
      ) : (
        <Clipboard className="h-8 w-8 text-brand-blue" />
      )}
    </Button>
  );
};

const SignIn = () => {
  const [step, setStep] = useState<"register" | "verify" | "register-passkey" | "success">(
    "register"
  );
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [pasted, setPasted] = useState(false);
  const otpRef = useRef<HTMLInputElement>(null);

  const t = useTranslations("signin");

  const router = useRouter();
  const pathname = usePathname();
  const currentLang = pathname.startsWith("/es") ? "es" : "en";

  useEffect(() => {
    platformAuthenticatorIsAvailable()
      .then((isAvailable) => {
        setIsSupported(isAvailable);
      })
      .catch((err) => {
        setIsSupported(false);
        console.error("Error checking platform authenticator availability:", err);
      });
  }, []);

  useEffect(() => {
    if (step === "verify" && otpRef.current) {
      otpRef.current.focus();
    }
  }, [step]);

  const onChangePhoneNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // const numberWithoutPrefix = value.replace("56", "");
    // const numericValue = numberWithoutPrefix.replace(/[^0-9]/g, "");
    const numericValue = value.replace(/[^0-9]/g, "");
    setPhoneNumber(numericValue);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`/api/user/register`, {
        phoneNumber,
        name,
      });
      console.log("response", response);
      if (response.status === 200) {
        setStep("verify");
      } else {
        setError(t("errorRegisteringUser"));
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400) {
          setError(t("alreadyRegistered"));
        } else {
          setError(t("errorRegisteringUser"));
        }
      } else {
        setError(t("errorRegisteringUser"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`/api/user/verify`, {
        phoneNumber,
        sixCharCode: otp,
      });
      console.log("response", response);
      if (response.status === 200) {
        setStep("register-passkey");
      } else {
        setError(t("errorVerifyingOTP"));
      }
    } catch (err) {
      console.log(err);
      setError(t("errorVerifyingOTP"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPasskey = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      console.log("phoneNumber", phoneNumber);
      setError(null);
      setLoading(true);
      const getVerification = await axios.post(
        `/api/auth/register-passkey-start`,
        {
          phoneNumber,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const cleanedData = {
        ...getVerification.data,
        user: {
          ...getVerification.data.user,
          id: btoa(getVerification.data.user.id.trim()),
          name: getVerification.data.user.name.trim(),
          displayName: getVerification.data.user.displayName.trim(),
        },
      };

      try {
        const assertion = await startRegistration({
          optionsJSON: cleanedData,
          useAutoRegister: true,
        });
        const resVerification = await axios.post(`/api/auth/register-passkey-complete`, {
          response: assertion,
          phoneNumber,
        });
        if (resVerification.status === 200) {
          setSuccess(true);
          setStep("success");
        } else {
          setError(`Error de registro: ${resVerification.data.message}`);
        }
      } catch (regError) {
        console.error("Error durante el registro:", regError);
        setError(`Error de registro: ${(regError as Error).message}`);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error al obtener datos de la API:", err);
      setError(`Error de API: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`/${currentLang}/app`);
  };

  return (
    <section className="grid grid-cols-1 max-md:grid-rows-[250px_1fr] md:grid-cols-2 gap-4 items-center justify-center border-2 min-h-screen">
      <HeroSignIn />
      <Card className="w-full max-w-xl max-md:w-[90%] mx-auto my-auto border-none">
        <CardHeader className="px-0">
          <CardTitle className="text-4xl text-brand-blue font-bold">
            {step === "register" && t("register")}
            {step === "verify" && t("verify")}
            {(step === "register-passkey" || step === "success") && t("security")}
          </CardTitle>
          <CardDescription className="text-brand-slate font-bold text-base">
            {step === "register" && t("registerDescription")}
            {step === "verify" && (
              <>
                {t("verifyDescription")}
                <span className="font-bold">
                  {" "}
                  {/* +56 */}
                  {phoneNumber}
                </span>
                . {t("verifyDescription2")}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {/* Forms */}
          {step === "register" && (
            <form
              id={formsIds.register}
              onSubmit={handleRegister}
              className="grid w-full items-center gap-8"
            >
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
                  onChange={(e) => setName(e.target.value)}
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
                  "flex flex-col bg-gray-100 border-2 border-black shadow-brutalist-sm p-4 rounded-lg relative",
                  phoneNumber.length > 0 &&
                    "bg-white border-brand-blue shadow-[2px_2px_0px_0px_#0267FF]"
                )}
              >
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={phoneNumber}
                  className="bg-transparent text-xl font-helvetica outline-none p-0 pt-2 pl-10 text-brand-blue rounded-none border-none peer transition-all duration-300"
                  onChange={onChangePhoneNumber}
                />
                {/* <span
                  className={cn(
                    "text-xl opacity-0 peer-focus:opacity-100 absolute left-4 pt-2.5 transition-all duration-300",
                    phoneNumber.length > 0 && "opacity-100"
                  )}
                >
                  +56
                </span> */}
                <div
                  className={cn(
                    "absolute flex items-center gap-2 top-1/2 -translate-y-1/2 transition-all duration-300",
                    phoneNumber.length > 0
                      ? "top-0 scale-75 translate-y-0 -translate-x-5"
                      : "peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:translate-y-0 peer-focus:top-0 peer-focus:-translate-x-5 peer-focus:scale-75"
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
                    {t("phoneNumber")}
                  </Label>
                </div>
              </div>
            </form>
          )}

          {step === "verify" && (
            <form
              id={formsIds.verify}
              onSubmit={handleVerifyOTP}
              className="grid w-full items-center gap-2"
            >
              <div className="flex items-center md:gap-6">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                  ref={otpRef}
                >
                  <InputOTPGroup className="gap-1 md:gap-8">
                    <InputOTPSlot
                      index={0}
                      className="border-2 border-black rounded-lg h-12 w-12"
                    />
                    <InputOTPSlot
                      index={1}
                      className="border-2 border-black rounded-lg h-12 w-12"
                    />
                    <InputOTPSlot
                      index={2}
                      className="border-2 border-black rounded-lg h-12 w-12"
                    />
                    <InputOTPSlot
                      index={3}
                      className="border-2 border-black rounded-lg h-12 w-12"
                    />
                    <InputOTPSlot
                      index={4}
                      className="border-2 border-black rounded-lg h-12 w-12"
                    />
                    <InputOTPSlot
                      index={5}
                      className="border-2 border-black rounded-lg h-12 w-12"
                    />
                  </InputOTPGroup>
                </InputOTP>
                <PasteButton setOtp={setOtp} pasted={pasted} setPasted={setPasted} />
              </div>
            </form>
          )}

          {step === "register-passkey" && (
            <form
              id={formsIds.registerPasskey}
              onSubmit={handleRegisterPasskey}
              className="grid w-full items-center gap-2"
            >
              <Image
                src="/images/fingerprint-gif.gif"
                alt="fingerprint"
                width={200}
                height={200}
                className="mx-auto"
                unoptimized
              />
              <p className="text-sm text-brand-slate mt-2">{t("registerPasskeyDescription")}</p>
            </form>
          )}

          {step === "success" && (
            <form
              id={formsIds.success}
              onSubmit={handleSuccess}
              className="flex flex-col items-center justify-center gap-2"
            >
              <Image
                src="/images/fingerprint-success-gif.gif"
                alt="success"
                width={200}
                height={200}
                unoptimized
              />
              <p className="text-sm text-brand-slate mt-2">{t("registerPasskeySuccess")}</p>
            </form>
          )}

          {/* info */}
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          {step === "register" && (
            <p className="text-sm text-brand-slate mt-2">{t("registerPhoneNumberInfo")}</p>
          )}
          {step === "verify" && (
            <p className="text-sm text-brand-slate mt-2">
              {t("verifyNotReceived")}{" "}
              <span className="text-brand-blue font-bold">{t("verifyResend")}</span>
            </p>
          )}
          {!isSupported && <p className="text-sm text-red-500 mt-2">{t("browserNotSupported")}</p>}
        </CardContent>
        <CardFooter
          className={cn("flex px-0 gap-8", step === "verify" ? "justify-between" : "justify-end")}
        >
          {step === "verify" && (
            <Button
              className="bg-white border-2 border-black shadow-brutalist-sm w-32 text-black p-4 h-full text-xl font-bold rounded-xl flex items-center justify-center gap-2"
              onClick={() => setStep("register")}
            >
              <ChevronLeft className="w-6 h-6" />
              {t("back")}
            </Button>
          )}
          <Button
            className={cn(
              "border-2 border-black shadow-brutalist-sm w-40 text-black p-4 h-full text-xl font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300",
              step === "verify"
                ? otp.length !== 6
                  ? "opacity-50 cursor-not-allowed bg-white"
                  : "bg-brand-yellow-pastel flex-grow"
                : "bg-brand-yellow-pastel",
              step === "success" && "w-full"
            )}
            type="submit"
            form={
              step === "register"
                ? formsIds.register
                : step === "verify"
                ? formsIds.verify
                : step === "register-passkey"
                ? formsIds.registerPasskey
                : formsIds.success
            }
            disabled={loading || (step === "verify" && otp.length !== 6)}
          >
            {loading
              ? t("sending")
              : step === "register"
              ? t("continue")
              : step === "verify"
              ? t("verifyButton")
              : step === "success"
              ? t("ready")
              : t("ready")}
            <ChevronRight className="w-6 h-6" />
          </Button>
        </CardFooter>
        {step === "register" && (
          <>
            <div className="w-full h-px bg-brand-slate/20" />
            <CardFooter className="flex flex-col items-start justify-center px-0 pt-8">
              <p className="text-base text-brand-slate font-bold">{t("alreadyHaveAccount")}</p>
              <Link
                href={`/${currentLang}/login`}
                className="text-4xl text-brand-orange-pastel font-bold"
              >
                {t("login")}
              </Link>
            </CardFooter>
          </>
        )}
      </Card>
    </section>
  );
};

export default SignIn;
