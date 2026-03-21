import { Header } from "@/app/components/header";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Header
        links={[
          { href: "/patient/book", labelKey: "appt.nav.book" },
          { href: "/patient/queue", labelKey: "appt.nav.patient_queue" },
        ]}
      />
      <div className="container py-8">{children}</div>
    </div>
  );
}
