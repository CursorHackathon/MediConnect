import { getCurrentUser } from "@mediconnect/auth";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@mediconnect/ui";

export default async function DoctorAreaPage() {
  const user = await getCurrentUser();
  return (
    <main className="container py-12">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <CardTitle>Ärztlicher Bereich</CardTitle>
          <Badge variant="secondary">{user?.role}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Angemeldet als {user?.email}</p>
        </CardContent>
      </Card>
    </main>
  );
}
