"use client";

import App from "@/src/App";
import { SessionProvider } from "next-auth/react";

export default function HomePage() {
  return (
    <SessionProvider>
      <App />
    </SessionProvider>
  );
}
