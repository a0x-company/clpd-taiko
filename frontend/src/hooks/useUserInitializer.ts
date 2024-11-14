"use client";
import { useEffect } from "react";
import { useUserStore } from "@/context/global-store";
import { getUserByPhoneNumber } from "@/lib/firebase/queries/getUser";

export function UserInitializer({ userData }: { userData: any }) {
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    if (userData) {
      if (!userData.address || !userData.name) {
        getUserByPhoneNumber(userData.phoneNumber).then((user) => {
          setUser({
            name: user?.name || null,
            address: user?.address || null,
            phoneNumber: user?.phoneNumber || null,
          });
        });
      } else {
        setUser({
          name: userData.name || null,
          address: userData.address || null,
          phoneNumber: userData.phoneNumber || null,
        });
      }
    }
  }, [userData, setUser]);

  return null;
}
