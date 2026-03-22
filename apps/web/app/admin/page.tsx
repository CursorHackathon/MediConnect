import { getCurrentUser } from "@mediconnect/auth";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@mediconnect/ui";

export const dynamic = "force-dynamic";

export default async function AdminAreaPage() {
  const user = await getCurrentUser();
  return (
    <main className="container py-12">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <CardTitle>Administration</CardTitle>
          <Badge variant="outline">{user?.role}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">RBAC and user management — shell.</p>
        </CardContent>
      </Card>
    </main>
  );
}
