import { redirect } from "next/navigation";

import { getCurrentUser } from "@mediconnect/auth";
import { Badge, Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@mediconnect/ui";

export default async function AdminAppPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/api/auth/signin");
  }

  return (
    <main className="container space-y-6 py-12">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Admin-Konsole</h1>
        <Badge variant="outline">E5</Badge>
      </div>
      <Tabs defaultValue="rbac">
        <TabsList>
          <TabsTrigger value="rbac">RBAC</TabsTrigger>
          <TabsTrigger value="users">Nutzerverwaltung</TabsTrigger>
          <TabsTrigger value="meds">Medikamente</TabsTrigger>
        </TabsList>
        <TabsContent value="rbac">
          <Card>
            <CardHeader>
              <CardTitle>Rollen & Berechtigungen</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Shell für rollenbasierte Zugriffskontrolle.</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Benutzer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Verwaltung von Konten und Profilen.</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="meds">
          <Card>
            <CardHeader>
              <CardTitle>Medikamente</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Arzneimittelstammdaten (Anbindung DrugBank / intern).</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
