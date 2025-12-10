"use client";

import App from "@/App";
import { SessionProvider } from "next-auth/react";

export default function AppWorkspacePage() {
  return (
    <SessionProvider>
      <App />
    </SessionProvider>
  );
}
