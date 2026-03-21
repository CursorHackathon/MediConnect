import { Badge, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@mediconnect/ui";

export default function AppointmentsPage() {
  return (
    <main className="container space-y-6 py-12">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Termine & Warteschlange</h1>
        <Badge variant="secondary">E3</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Warteschlange</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </main>
  );
}
