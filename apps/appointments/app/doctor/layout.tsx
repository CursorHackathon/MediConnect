import { Header } from "@/app/components/header";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Header
        links={[
          { href: "/doctor/queue", labelKey: "appt.nav.queue" },
          { href: "/doctor/availability", labelKey: "appt.nav.availability" },
        ]}
      />
      <div className="container relative z-10 py-8">{children}</div>
    </div>
  );
}
