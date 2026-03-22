"use client";

import Link from "next/link";

import { getAppHubUrls } from "@mediconnect/ui";
import {
  BarChart3,
  FolderOpen,
  MessageSquare,
  Settings,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

type Props = {
  children: React.ReactNode;
};

export function AiAvatarConsultationChrome({ children }: Props) {
  const urls = getAppHubUrls();

  return (
    <div className="flex min-h-[calc(100dvh-3.75rem)] w-full">
      <aside className="fixed left-0 top-[3.75rem] z-50 flex h-[calc(100dvh-3.75rem)] w-64 flex-col gap-4 bg-[#f0f4f7] p-6 dark:bg-slate-900">
        <div className="mb-6">
          <h1 className="font-[family-name:var(--font-mc-ai-display),sans-serif] text-xl font-bold tracking-tight text-[#006a71] dark:text-[#92f2fb]">
            MediConnect
          </h1>
          <p className="mt-1 text-xs text-[#596064] dark:text-slate-400">AI consultation</p>
        </div>
        <nav className="flex flex-col gap-2" aria-label="Sections">
          <span className="flex scale-[1.02] items-center gap-3 rounded-lg bg-white px-4 py-3 font-semibold text-[#006a71] shadow-sm dark:bg-slate-800 dark:text-[#92f2fb]">
            <MessageSquare aria-hidden className="size-5 shrink-0" />
            <span className="text-sm">Consultation</span>
          </span>
          <Link
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-[#596064] transition-colors hover:bg-[#dce4e8] hover:text-[#006a71] dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-[#92f2fb]"
            href={urls.dashboard}
          >
            <FolderOpen aria-hidden className="size-5 shrink-0" />
            Health record
          </Link>
          <Link
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-[#596064] transition-colors hover:bg-[#dce4e8] hover:text-[#006a71] dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-[#92f2fb]"
            href={process.env.NEXT_PUBLIC_URL_WEB ?? "http://localhost:3000"}
          >
            <BarChart3 aria-hidden className="size-5 shrink-0" />
            Portal
          </Link>
          <span className="flex cursor-not-allowed items-center gap-3 rounded-lg px-4 py-3 text-sm text-[#596064]/50 dark:text-slate-500">
            <Settings aria-hidden className="size-5 shrink-0" />
            Settings
          </span>
        </nav>
        <div className="mt-auto rounded-xl bg-[#e3e9ed]/50 p-4 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#96f1fa] text-[#005b61]">
              <Stethoscope aria-hidden className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#2c3437] dark:text-slate-100">Medical AI companion</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#596064] dark:text-slate-400">
                Secure connection
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="ml-64 flex min-h-[calc(100dvh-3.75rem)] flex-1 flex-col bg-[#f7f9fb] dark:bg-slate-950">
        {children}
      </div>
    </div>
  );
}

export function PrivacyTrustCard() {
  return (
    <div className="mc-ai-glass pointer-events-auto rounded-2xl border border-white/20 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#92f2fb] text-[#005b61]">
          <ShieldCheck aria-hidden className="size-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#2c3437] dark:text-slate-100">Privacy</p>
          <p className="text-[10px] text-[#596064] dark:text-slate-400">Encrypted session (TLS / WebRTC)</p>
        </div>
      </div>
    </div>
  );
}
