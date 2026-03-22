import Link from "next/link";

import { getCurrentUser } from "@mediconnect/auth";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@mediconnect/ui";

export default async function AdminAppPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return (
      <main className="container py-12">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Admin area</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Set <code className="text-xs">SIMULATED_ROLE=ADMIN</code> in the environment (and seed the DB), or{" "}
              <code className="text-xs">SIMULATED_USER_ID</code> to an admin user.
            </p>
            {user ? <p className="text-xs">Currently simulated: {user.email} ({user.role})</p> : null}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container space-y-6 py-12">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Admin console</h1>
        <Badge variant="outline">E5</Badge>
      </div>
      <Tabs defaultValue="rbac">
        <TabsList>
          <TabsTrigger value="rbac">RBAC</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="meds">Medications</TabsTrigger>
          <TabsTrigger value="kb">Knowledge base</TabsTrigger>
        </TabsList>
        <TabsContent value="rbac">
          <Card>
            <CardHeader>
              <CardTitle>Roles & permissions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Shell for role-based access control.</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Account and profile management.</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="meds">
          <Card>
            <CardHeader>
              <CardTitle>Medications</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Drug master data (DrugBank / internal integration).
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="kb">
          <Card>
            <CardHeader>
              <CardTitle>Hospital documents</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
              <p>PDF upload and embeddings will follow. For now: paste text and chunk.</p>
              <Button asChild className="w-fit">
                <Link href="/knowledge">Open knowledge base</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
