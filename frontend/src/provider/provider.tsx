"use client";

// react-query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// react
import { useEffect, useState } from "react";
import WagmiConfig from "./WagmiConfig";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig>{mounted && children}</WagmiConfig>
    </QueryClientProvider>
  );
}
