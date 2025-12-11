"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { APP_STAGE, APP_VERSION } from "@/lib/appMeta";

export function Header() {
  return (
    <header className="relative z-50 border-b border-slate-800/50 bg-slate-950/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold text-white">StoryLab</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-800/70 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold text-slate-200 shadow-sm">
            <span className="uppercase tracking-[0.18em] text-slate-100">
              {APP_STAGE}
            </span>
            <span className="h-3 w-px rounded-full bg-slate-700" aria-hidden />
            <span className="text-slate-300">v{APP_VERSION}</span>
          </span>
        </div>
        <Button
          onClick={() => signIn("google")}
          size="sm"
          className="bg-cyan-400 text-slate-950 shadow-lg transition hover:bg-cyan-300"
        >
          Sign in
        </Button>
      </div>
    </header>
  );
}
