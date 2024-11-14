import { create } from "zustand";

export interface User {
  name: string | null;
  address: `0x${string}` | null;
  phoneNumber: string | null;
}

interface UserStore {
  user: User;
  setUser: (user: User) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: {
    name: null,
    address: null,
    phoneNumber: null,
  },
  setUser: (user: User) => set({ user }),
}));
