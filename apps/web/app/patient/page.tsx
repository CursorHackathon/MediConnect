import { getCurrentUser } from "@mediconnect/auth";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@mediconnect/ui";

export const dynamic = "force-dynamic";

export default async function PatientAreaPage() {
  const user = await getCurrentUser();
  return (
    <main className="container py-12">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <CardTitle>Patient area</CardTitle>
          <Badge>{user?.role}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Signed in as {user?.email}</p>
        </CardContent>
      </Card>
    </main>
  );
}
