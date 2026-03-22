"use client";

import { signOut } from "next-auth/react";
import { useMemo, useState } from "react";

import { getAppHubUrls, getDoctorAiChatUrl } from "@mediconnect/ui";

import { DashboardShell } from "./dashboard-shell";
import { PatientList } from "./patient-list";

type UserLite = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function demoMetrics(seed: string) {
  const h = hashString(seed);
  return {
    totalPatients: 1100 + (h % 400),
    todayVisits: 6 + (h % 10),
    activeMonitors: 35 + (h % 30),
    urgentLabs: h % 5,
    heartRate: 68 + (h % 12),
    bpSys: 115 + (h % 15),
    bpDia: 78 + (h % 10),
    glucose: 88 + (h % 20),
  };
}

type NavId =
  | "overview"
  | "patients"
  | "health"
  | "schedule"
  | "ai"
  | "messages"
  | "settings"
  | "video";

export function MediConnectGlassApp({
  user,
  patientId,
  mode,
}: {
  user: UserLite;
  patientId: string | null;
  mode: "patient" | "clinical";
}) {
  const urls = getAppHubUrls();
  const aiChatUrl = getDoctorAiChatUrl();
  const [nav, setNav] = useState<NavId>("overview");
  const demo = useMemo(() => demoMetrics(user.id), [user.id]);
  const displayName = user.name?.trim() || user.email.split("@")[0] || "User";

  const isClinical = mode === "clinical";

  const sidebarItems: { id: NavId; label: string; icon: string; external?: string }[] = isClinical
    ? [
        { id: "overview", label: "Overview", icon: "dashboard" },
        { id: "patients", label: "Patients", icon: "personal_injury" },
        { id: "schedule", label: "Schedule", icon: "calendar_today", external: urls.appointments },
        { id: "ai", label: "AI Assistant", icon: "auto_awesome", external: aiChatUrl },
        { id: "video", label: "Video visits", icon: "video_call", external: urls.video },
      ]
    : [
        { id: "overview", label: "Overview", icon: "dashboard" },
        { id: "health", label: "Health records", icon: "folder_open" },
        { id: "messages", label: "Messages", icon: "forum" },
        { id: "schedule", label: "Schedule", icon: "calendar_today", external: urls.appointments },
        { id: "ai", label: "AI assistant", icon: "auto_awesome", external: aiChatUrl },
        { id: "settings", label: "Settings", icon: "settings" },
      ];

  return (
    <div className="bg-ether-surface font-ether-body text-ether-on-surface relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-40">
        <div className="absolute -right-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-[#0058bb]/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-[#006a26]/10 blur-[100px]" />
      </div>

      <aside className="ether-sidebar fixed left-0 top-0 z-40 flex h-screen w-72 flex-col space-y-2 p-4 shadow-xl backdrop-blur-3xl">
        <div className="mb-4 px-4 py-6">
          <h1 className="font-ether-headline text-xl font-black tracking-tight text-blue-800">MediConnect</h1>
          <p className="text-xs font-medium text-ether-on-surface-variant">Clinical dashboard</p>
        </div>
        <nav className="flex-1 space-y-1">
          {sidebarItems.map((item) => {
            const active = nav === item.id;
            const content = (
              <>
                <span className="material-symbols-outlined mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </>
            );
            if (item.external) {
              return (
                <a
                  key={item.id}
                  href={item.external}
                  rel="noopener noreferrer"
                  className="flex items-center rounded-xl px-4 py-3 text-slate-600 transition-all duration-300 hover:bg-white/40 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-blue-400"
                >
                  {content}
                </a>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setNav(item.id)}
                className={`flex w-full items-center rounded-xl px-4 py-3 text-left transition-transform ${
                  active
                    ? "translate-x-1 bg-blue-600/10 font-semibold text-blue-700 dark:text-blue-400"
                    : "text-slate-600 hover:bg-white/40 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800/60"
                }`}
              >
                {content}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto space-y-2 border-t border-ether-outline-variant/20 pt-6">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold text-ether-on-surface-variant transition-colors hover:bg-white/30"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="relative ml-72 min-h-screen">
        <header className="sticky top-0 z-30 flex w-full items-center justify-between px-8 py-4 shadow-[0_20px_40px_rgba(45,47,51,0.06)] backdrop-blur-xl bg-white/60 dark:bg-slate-900/50">
          <h2 className="font-ether-headline text-2xl font-bold tracking-tight text-blue-700 dark:text-blue-300">
            {isClinical ? `Overview — ${displayName}` : `My health — ${displayName}`}
          </h2>
          <div className="flex items-center space-x-6">
            <span className="material-symbols-outlined cursor-pointer text-ether-on-surface-variant hover:text-[#0058bb]">
              notifications
            </span>
            <div className="flex items-center space-x-3 rounded-full border border-ether-outline-variant/10 bg-ether-surface-container-low px-4 py-2">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="h-8 w-8 rounded-full object-cover" width={32} height={32} />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-semibold">{displayName}</span>
            </div>
          </div>
        </header>

        <div className="space-y-8 p-8">
          {isClinical && nav === "overview" ? (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                {[
                  { label: "Total patients", value: demo.totalPatients, icon: "group", delta: "+4%" },
                  { label: "Today's visits", value: demo.todayVisits, icon: "clinical_notes" },
                  { label: "Active monitors", value: demo.activeMonitors, icon: "monitoring", pulse: true },
                  { label: "Urgent labs", value: String(demo.urgentLabs).padStart(2, "0"), icon: "emergency", danger: true },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="ether-glass-card rounded-2xl border border-white/20 p-6 shadow-sm"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <span
                        className={`material-symbols-outlined rounded-xl p-2 ${
                          m.danger ? "bg-red-500/10 text-red-600" : "bg-[#0058bb]/10 text-[#0058bb]"
                        }`}
                      >
                        {m.icon}
                      </span>
                      {m.delta ? (
                        <span className="flex items-center rounded-full bg-[#6ffb85]/15 px-2 py-1 text-xs font-bold text-[#006a26]">
                          {m.delta}
                        </span>
                      ) : null}
                      {m.pulse ? <span className="ether-pulse-dot mt-2 h-2 w-2 rounded-full bg-[#006a26]" /> : null}
                    </div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-widest text-ether-on-surface-variant">
                      {m.label}
                    </p>
                    <h3
                      className={`font-ether-headline text-3xl font-extrabold ${m.danger ? "text-red-600" : ""}`}
                    >
                      {m.value}
                    </h3>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <section className="space-y-6 lg:col-span-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="font-ether-headline text-xl font-bold">Daily schedule</h4>
                    <a href={urls.appointments} className="text-sm font-semibold text-[#0058bb] hover:underline">
                      Open calendar
                    </a>
                  </div>
                  <div className="space-y-4">
                    {[
                      { time: "09:00 AM", room: "Room 402", name: "Marcus Thorne", note: "Post-op consultation", color: "border-l-[#0058bb]" },
                      { time: "10:30 AM", room: "Room 311", name: "Elena Rodriguez", note: "Diabetic checkup", color: "border-l-[#006a26]", tag: "STABLE" },
                      { time: "11:15 AM", room: "Telehealth", name: "James P. Sullivan", note: "Lab review", color: "border-l-[#0058bb] opacity-80" },
                    ].map((row) => (
                      <div
                        key={row.name}
                        className={`ether-glass-panel cursor-pointer rounded-2xl border-l-4 p-5 shadow-sm transition-transform hover:translate-x-1 ${row.color}`}
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <span className="rounded-full bg-[#0058bb]/10 px-3 py-1 text-xs font-bold text-[#0058bb]">
                            {row.time}
                          </span>
                          <span className="text-xs font-medium text-ether-on-surface-variant">{row.room}</span>
                        </div>
                        <h5 className="font-ether-headline mb-1 text-lg font-bold">{row.name}</h5>
                        <p className="mb-4 text-sm text-ether-on-surface-variant">{row.note}</p>
                        {row.tag ? (
                          <span className="rounded-full bg-[#6ffb85]/30 px-2 py-0.5 text-[10px] font-bold text-[#005d21]">
                            {row.tag}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-8 lg:col-span-8">
                  <div className="ether-glass-panel relative overflow-hidden rounded-3xl p-8 shadow-lg">
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0058bb]/5 blur-3xl" />
                    <div className="relative z-10">
                      <div className="mb-8 flex items-center justify-between">
                        <div>
                          <h4 className="font-ether-headline text-xl font-bold">Selected patient</h4>
                          <p className="text-sm text-ether-on-surface-variant">Monitoring ID: #DEMO-{hashString(user.id) % 9000 + 1000}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {[
                          { label: "Heart rate", value: demo.heartRate, unit: "bpm", icon: "favorite", w: "75%" },
                          { label: "Blood pressure", value: `${demo.bpSys}/${demo.bpDia}`, unit: "mmHg", icon: "speed", w: "50%" },
                          { label: "Blood sugar", value: demo.glucose, unit: "mg/dL", icon: "opacity", w: "66%" },
                        ].map((v) => (
                          <div key={v.label} className="rounded-2xl bg-ether-surface-container-low p-6">
                            <div className="mb-4 flex items-center justify-between">
                              <span className="text-xs font-bold uppercase text-ether-on-surface-variant">{v.label}</span>
                              <span className="material-symbols-outlined text-sm text-[#0058bb]">{v.icon}</span>
                            </div>
                            <div className="flex items-baseline space-x-2">
                              <span className="font-ether-headline text-4xl font-bold text-[#0058bb]">{v.value}</span>
                              <span className="text-sm font-medium text-ether-on-surface-variant">{v.unit}</span>
                            </div>
                            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-ether-outline-variant/20">
                              <div className="h-full rounded-full bg-[#0058bb]" style={{ width: v.w }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="ether-glass-panel rounded-3xl p-6 shadow-md">
                      <div className="mb-6 flex items-center justify-between">
                        <h4 className="font-ether-headline text-lg font-bold">Recent lab results</h4>
                        <span className="material-symbols-outlined text-ether-on-surface-variant">biotech</span>
                      </div>
                      <div className="space-y-4">
                        {[
                          { name: "Comprehensive metabolic panel", sub: "Completed 2h ago", icon: "check_circle", ok: true },
                          { name: "Lipid profile", sub: "Pending — Lab-A", icon: "hourglass_empty", ok: false },
                          { name: "Hemoglobin A1c", sub: "Completed yesterday", icon: "check_circle", ok: true },
                        ].map((lab) => (
                          <div
                            key={lab.name}
                            className="flex items-center justify-between rounded-2xl bg-white/80 p-4 dark:bg-slate-800/40"
                          >
                            <div>
                              <p className="text-sm font-bold">{lab.name}</p>
                              <p className="text-xs text-ether-on-surface-variant">{lab.sub}</p>
                            </div>
                            <span
                              className={`material-symbols-outlined ${lab.ok ? "text-[#006a26]" : "animate-pulse text-ether-on-surface-variant"}`}
                            >
                              {lab.icon}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-3xl border border-white/40 bg-gradient-to-br from-[#4c49c9]/10 to-[#0058bb]/5 p-6 shadow-md">
                      <div className="mb-6 flex items-center space-x-2 text-[#4c49c9]">
                        <span className="material-symbols-outlined">auto_awesome</span>
                        <h4 className="font-ether-headline text-lg font-bold">Clinical insights</h4>
                      </div>
                      <p className="text-sm italic leading-relaxed text-ether-on-surface-variant">
                        Demo insight: vitals trending stable. Use AI Assistant for protocol lookup.
                      </p>
                      <div className="mt-4 rounded-2xl border border-white/20 bg-white/40 p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#4c49c9]">Suggested actions</p>
                        <ul className="space-y-2 text-xs text-ether-on-surface">
                          <li className="flex items-center">
                            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[#4c49c9]" />
                            <a href={aiChatUrl} className="underline hover:text-[#0058bb]">
                              Open clinical assistant
                            </a>
                          </li>
                          <li className="flex items-center">
                            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[#4c49c9]" />
                            <a href={urls.video} className="underline hover:text-[#0058bb]">
                              Start a video visit
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </>
          ) : null}

          {isClinical && nav === "patients" ? (
            <div className="ether-glass-panel rounded-3xl p-6 shadow-md">
              <h3 className="font-ether-headline mb-4 text-lg font-bold">Patients</h3>
              <PatientList />
            </div>
          ) : null}

          {!isClinical && nav === "overview" && patientId ? (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                  <h1 className="font-ether-headline mb-2 text-4xl font-extrabold tracking-tight">
                    My health — {displayName}
                  </h1>
                  <p className="max-w-lg text-ether-on-surface-variant">
                    Welcome back. Your vitals look stable in this demo view.
                  </p>
                </div>
                <a
                  href={urls.video}
                  className="group flex items-center gap-4 rounded-full bg-white/60 p-2 pr-6 shadow-[0_20px_40px_rgba(45,47,51,0.06)] backdrop-blur-xl transition-all hover:bg-white/90"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0058bb] to-[#6c9fff] text-[#f0f2ff]">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      videocam
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#0058bb]">Connect</p>
                    <p className="text-sm font-bold">Video visit</p>
                  </div>
                </a>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                <div className="grid grid-cols-1 gap-6 md:col-span-8 sm:grid-cols-2">
                  <div className="ether-glass-panel flex h-48 flex-col justify-between rounded-xl border border-white/40 p-8 shadow-[0_20px_40px_rgba(45,47,51,0.06)]">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-ether-on-surface-variant">Heart rate</p>
                        <h3 className="font-ether-headline mt-2 text-5xl font-bold text-[#0058bb]">
                          {demo.heartRate}{" "}
                          <span className="text-lg font-normal text-ether-on-surface-variant">bpm</span>
                        </h3>
                      </div>
                      <span className="material-symbols-outlined rounded-lg bg-[#0058bb]/10 p-2 text-[#0058bb]">favorite</span>
                    </div>
                    <span className="inline-flex w-fit items-center rounded-full bg-[#6ffb85]/25 px-2 py-0.5 text-xs font-medium text-[#005d21]">
                      Stable
                    </span>
                  </div>
                  <div className="ether-glass-panel flex h-48 flex-col justify-between rounded-xl border border-white/40 p-8 shadow-[0_20px_40px_rgba(45,47,51,0.06)]">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-ether-on-surface-variant">Blood pressure</p>
                        <h3 className="font-ether-headline mt-2 text-5xl font-bold text-[#0058bb]">
                          {demo.bpSys}/{demo.bpDia}{" "}
                          <span className="text-lg font-normal text-ether-on-surface-variant">mmHg</span>
                        </h3>
                      </div>
                      <span className="material-symbols-outlined rounded-lg bg-[#0058bb]/10 p-2 text-[#0058bb]">speed</span>
                    </div>
                    <span className="inline-flex w-fit items-center rounded-full bg-[#6ffb85]/25 px-2 py-0.5 text-xs font-medium text-[#005d21]">
                      Normal
                    </span>
                  </div>
                </div>
                <div className="ether-glass-panel flex flex-col rounded-xl border border-white/40 p-6 shadow-[0_20px_40px_rgba(45,47,51,0.06)] md:col-span-4">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="font-ether-headline text-xl font-bold">Upcoming</h2>
                    <a href={urls.appointments} className="text-sm font-semibold text-[#0058bb] hover:underline">
                      View all
                    </a>
                  </div>
                  <div className="space-y-6">
                    <div className="flex cursor-pointer gap-4 rounded-xl p-4 transition-colors hover:bg-white/40">
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#6c9fff]/20 text-[#0058bb]">
                        <span className="text-xs font-bold uppercase">Soon</span>
                        <span className="text-xl font-bold">—</span>
                      </div>
                      <div>
                        <p className="font-bold">Follow-up</p>
                        <p className="mt-0.5 text-xs text-ether-on-surface-variant">Book in Appointments</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ether-glass-panel rounded-xl border border-white/40 p-8 shadow-[0_20px_40px_rgba(45,47,51,0.06)] md:col-span-7">
                  <h2 className="font-ether-headline mb-6 text-xl font-bold">Medication schedule (demo)</h2>
                  <div className="space-y-4 text-sm">
                    <p className="text-ether-on-surface-variant">
                      Open <strong>Health records</strong> for your real medication list from the chart.
                    </p>
                  </div>
                </div>
                <div className="ether-glass-panel rounded-xl border border-white/40 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 p-8 shadow-[0_20px_40px_rgba(45,47,51,0.06)] md:col-span-5 dark:from-slate-800/40 dark:to-slate-900/40">
                  <h2 className="font-ether-headline mb-4 text-xl font-bold">Daily insights</h2>
                  <p className="text-xs text-ether-on-surface-variant">
                    Demo wellness copy — connect wearables in a future release.
                  </p>
                  <div className="mt-8">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/40">
                      <div className="h-full w-3/4 rounded-full bg-[#0058bb]" />
                    </div>
                    <p className="mt-2 text-xs font-bold text-[#0058bb]">75% daily goal (demo)</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {!isClinical && !patientId ? (
            <div className="ether-glass-panel rounded-2xl p-8 text-center">
              <p className="text-ether-on-surface-variant">No patient profile is linked to this account yet.</p>
            </div>
          ) : null}

          {!isClinical && nav === "health" && patientId ? (
            <div className="ether-glass-panel rounded-3xl p-6 shadow-md">
              <DashboardShell patientId={patientId} role={user.role} />
            </div>
          ) : null}

          {!isClinical && nav === "messages" ? (
            <div className="ether-glass-panel rounded-3xl p-8 text-sm text-ether-on-surface-variant">
              Messages are not configured in this demo — use your care team&apos;s usual channels.
            </div>
          ) : null}

          {!isClinical && nav === "settings" ? (
            <div className="ether-glass-panel rounded-3xl p-8 text-sm text-ether-on-surface-variant">
              Account settings placeholder.
            </div>
          ) : null}
        </div>
      </main>

      <div className="fixed bottom-10 right-10 z-50">
        <a
          href={aiChatUrl}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0058bb] text-[#f0f2ff] shadow-2xl transition-all hover:scale-110 active:scale-95"
          aria-label="Open AI assistant"
        >
          <span className="material-symbols-outlined text-3xl">edit_square</span>
        </a>
      </div>
    </div>
  );
}
