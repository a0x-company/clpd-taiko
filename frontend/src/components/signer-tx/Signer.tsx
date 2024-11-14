"use client";
// react
import { useCallback, useEffect, useRef, useState } from "react";

// next
import { useTranslations } from "next-intl";

// simplewebauthn
import {
  platformAuthenticatorIsAvailable,
  startAuthentication,
  startRegistration,
  WebAuthnError,
} from "@simplewebauthn/browser";
import { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/types";

// axios
import axios from "axios";

type Status = "idle" | "loading" | "error" | "success";

const Signer = ({
  options,
  phoneNumber,
}: {
  options: PublicKeyCredentialRequestOptionsJSON;
  phoneNumber: string;
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"sign" | "success" | "error">("sign");
  const t = useTranslations("signer");

  const handleAuthError = (error: WebAuthnError) => {
    console.error(`Error on authentication: ${error}`);
    console.log("regError", error.code);
    switch (error.code) {
      case "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY":
      case "ERROR_CEREMONY_ABORTED":
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
        setError(t("errorSigning"));
    }
  };

  const authenticateUser = useCallback(async () => {
    try {
      const assertion = await startAuthentication({
        optionsJSON: options,
      });
      const resVerification = await axios.post(`/api/auth/authenticate-passkey`, {
        assertion,
        phoneNumber,
      });

      if (resVerification.status === 200) {
        setStatus("success");
      } else {
        setError(`Error de inicio de sesión`);
      }
    } catch (error) {
      if (error instanceof WebAuthnError) {
        handleAuthError(error);
      } else {
        setError(`Error de inicio de sesión`);
      }
    }
  }, [options, phoneNumber]);

  const hasExecuted = useRef(false);

  useEffect(() => {
    if (!hasExecuted.current) {
      authenticateUser();
      hasExecuted.current = true;
    }
  }, [authenticateUser]);

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

  return <div>{step}</div>;
};

export default Signer;
