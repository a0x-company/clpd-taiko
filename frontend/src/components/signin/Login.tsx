"use client";
// react
import React, { useEffect, useRef, useState } from "react";

// next
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// components
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import HeroSignIn from "./Hero";

// icons
import { Check, ChevronRight, Clipboard } from "lucide-react";
import PhoneIcon from "../icons/PhoneIcon";

// simplewebauthn
import {
  platformAuthenticatorIsAvailable,
  startAuthentication,
  startRegistration,
  WebAuthnError,
} from "@simplewebauthn/browser";

// axios
import axios, { AxiosError } from "axios";

// translations
import { useTranslations } from "next-intl";

// utils
import { cn } from "@/lib/utils";

const formsIds = {
  login: "login",
  verify: "verify",
  success: "success",
  registerPasskey: "register-passkey",
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

const Login = () => {
  const [step, setStep] = useState<"login" | "verify" | "register-passkey" | "success">("login");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [sendPinCode, setSendPinCode] = useState(false);
  const [otp, setOtp] = useState<string>("");
  const [pasted, setPasted] = useState(false);
  const otpRef = useRef<HTMLInputElement>(null);

  const t = useTranslations("login");
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

  const handleSendPinCode = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const resSendPinCode = await axios.post(`/api/auth/resend-code`, {
      phoneNumber,
    });
    if (resSendPinCode.status === 200) {
      setStep("verify");
      setSendPinCode(false);
      setError(null);
      return;
    }
  };

  const handleAuthentication = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const phoneNumber = (formData.get("phoneNumber") as string) || "";
    try {
      console.log("phoneNumber", phoneNumber);
      setError(null);
      setLoading(true);

      const getVerification = await axios.post(`/api/auth/authenticate`, {
        phoneNumber,
      });
      console.log("Datos recibidos de la API:", getVerification.data);
      if (getVerification.status === 200 && !getVerification.data.requiresPasskey) {
        setSuccess(true);
        router.push(`/${currentLang}/app`);
        return;
      }

      try {
        const assertion = await startAuthentication({
          optionsJSON: getVerification.data.options,
        });
        const resVerification = await axios.post(`/api/auth/authenticate-passkey`, {
          assertion,
          phoneNumber,
        });
        const data = resVerification.data;
        if (resVerification.status === 200) {
          setSuccess(true);
          router.push(`/${currentLang}/app`);
        } else {
          setError(`Error de inicio de sesión`);
        }
      } catch (regError) {
        console.error("Error durante el registro:", regError);
        if (regError instanceof WebAuthnError) {
          console.log("regError", regError.code);
          switch (regError.code) {
            case "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY":
            case "ERROR_CEREMONY_ABORTED":
              setSendPinCode(true);
              setError(t("ceremonyAborted"));
              break;
            case "ERROR_INVALID_DOMAIN":
            case "ERROR_INVALID_RP_ID":
              setError(t("invalidDomain"));
              break;
            case "ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT":
            case "ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT":
              setError(t("noPasskeyFound"));
              break;
            default:
              setError(`Error de inicio de sesión`);
          }
        } else {
          setError(`Error de inicio de sesión`);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error("Error al obtener datos de la API:", err);
      if (err instanceof AxiosError) {
        if (err.response?.status === 400) {
          setError(t("notRegistered"));
        } else {
          setError(`Error de API: ${(err as Error).message}`);
        }
      } else {
        setError(`Error de API: ${(err as Error).message}`);
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
        if (regError instanceof WebAuthnError) {
          switch (regError.code) {
            case "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY":
            case "ERROR_CEREMONY_ABORTED":
              setSendPinCode(true);
              setError(t("ceremonyAborted"));
              break;
            default:
              setError(`Error de inicio de sesión`);
          }
        } else {
          setError(`Error de inicio de sesión`);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error("Error al obtener datos de la API:", err);
      setError(`Error de inicio de sesión`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`/${currentLang}/app`);
  };

  const getButtonText = () => {
    if (loading) {
      return t("sending");
    }
    if (step === "login") {
      return sendPinCode ? t("retry") : t("next");
    }
    if (step === "verify") {
      return t("verifyButton");
    }
    if (step === "register-passkey") {
      return t("continue");
    }
    return t("ready");
  };

  return (
    <section className="grid grid-cols-1 max-md:grid-rows-[250px_1fr] md:grid-cols-2 gap-4 items-center justify-center border-2 min-h-screen">
      <HeroSignIn />
      <Card className="w-full max-w-xl max-md:w-[90%] mx-auto my-auto border-none">
        <CardHeader className="px-0">
          <CardTitle className="text-4xl text-brand-blue font-bold">
            {step === "login" && t("login")}
            {step === "verify" && t("verify")}
            {(step === "register-passkey" || step === "success") && t("security")}
          </CardTitle>
          <CardDescription className="text-[#475467] font-bold text-base">
            {step === "login" && t("loginDescription")}
            {step === "verify" && (
              <>
                {t("verifyDescription")}
                <span className="font-bold"> +56{phoneNumber}</span>. {t("verifyDescription2")}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {/* Forms */}
          {step === "login" && (
            <form
              id={formsIds.login}
              onSubmit={handleAuthentication}
              className="grid w-full items-center gap-8"
            >
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
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <span
                  className={cn(
                    "text-xl opacity-0 peer-focus:opacity-100 absolute left-4 pt-2.5 transition-all duration-300",
                    phoneNumber.length > 0 && "opacity-100"
                  )}
                >
                  +56
                </span>
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
              <p className="text-sm text-[#475467] mt-2">{t("registerPasskeySuccess")}</p>
            </form>
          )}

          {/* info */}
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          {!isSupported && <p className="text-sm text-red-500 mt-2">{t("browserNotSupported")}</p>}
        </CardContent>

        <CardFooter className={cn("flex px-0 gap-8 justify-end")}>
          {sendPinCode && (
            <Button
              className="border-2 border-black shadow-brutalist-sm w-40 text-black p-4 h-full text-xl font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 bg-brand-yellow-pastel"
              type="button"
              onClick={(e) => {
                handleSendPinCode(e);
              }}
              disabled={loading}
            >
              {t("sendPinCode")}
            </Button>
          )}
          <Button
            className={cn(
              "border-2 border-black shadow-brutalist-sm w-40 text-black p-4 h-full text-xl font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 bg-brand-yellow-pastel"
            )}
            type="submit"
            form={
              step === "login"
                ? formsIds.login
                : step === "verify"
                ? formsIds.verify
                : step === "register-passkey"
                ? formsIds.registerPasskey
                : formsIds.success
            }
            disabled={loading || !phoneNumber || (step === "verify" && otp.length !== 6)}
          >
            {getButtonText()}
            <ChevronRight className="w-6 h-6" />
          </Button>
        </CardFooter>
        {step === "login" && (
          <>
            <div className="w-full h-px bg-brand-slate/20" />
            <CardFooter className="flex flex-col items-start justify-center px-0 pt-8">
              <p className="text-base text-brand-slate font-bold">{t("noAccount")}</p>
              <Link
                href={`/${currentLang}/signin`}
                className="text-4xl text-brand-orange-pastel font-bold"
              >
                {t("register")}
              </Link>
            </CardFooter>
          </>
        )}
      </Card>
    </section>
  );
};

export default Login;
