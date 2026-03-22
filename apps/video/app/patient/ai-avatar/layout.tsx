import { Inter, Manrope } from "next/font/google";

import "./ai-avatar-shell.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-mc-ai-body",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-mc-ai-display",
  display: "swap",
});

export default function PatientAiAvatarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${inter.variable} ${manrope.variable} bg-[#f7f9fb] font-[family-name:var(--font-mc-ai-body)] text-[#2c3437] antialiased`}
    >
      {children}
    </div>
  );
}
