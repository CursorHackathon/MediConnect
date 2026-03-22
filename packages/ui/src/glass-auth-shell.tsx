"use client";

import type { ReactNode } from "react";

import { AppHubNav, type AppHubId } from "./app-hub-nav";

export function GlassAuthShell({
  hubCurrent,
  title,
  description,
  children,
}: {
  hubCurrent: AppHubId;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[#f0f2f8]" />
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="mc-auth-orb-a absolute -right-[15%] -top-[18%] h-[min(52vw,480px)] w-[min(52vw,480px)] rounded-full bg-[#0058bb]/20 blur-[100px]" />
        <div className="mc-auth-orb-b absolute -bottom-[22%] -left-[12%] h-[min(48vw,420px)] w-[min(48vw,420px)] rounded-full bg-[#006a26]/15 blur-[90px]" />
        <div className="absolute left-1/2 top-1/3 h-[min(35vw,320px)] w-[min(35vw,320px)] -translate-x-1/2 rounded-full bg-[#4c49c9]/10 blur-[80px]" />
      </div>

      <div className="relative z-10 mb-6 w-full max-w-md">
        <div className="ether-glass-panel rounded-2xl border border-white/50 px-3 py-3 shadow-lg shadow-slate-900/5">
          <AppHubNav current={hubCurrent} className="[&_ul]:justify-center" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="ether-glass-panel rounded-3xl border border-white/55 p-8 shadow-[0_24px_80px_rgba(45,47,51,0.1)]">
          <div className="mb-6 space-y-1.5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700/80">MediConnect</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
