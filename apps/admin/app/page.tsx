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
            <CardTitle>Admin-Bereich</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Setzen Sie in der Umgebung <code className="text-xs">SIMULATED_ROLE=ADMIN</code> (und DB-Seed), oder{" "}
              <code className="text-xs">SIMULATED_USER_ID</code> auf einen Admin-Nutzer.
            </p>
            {user ? <p className="text-xs">Aktuell simuliert: {user.email} ({user.role})</p> : null}
          </CardContent>
        </Card>
      </main>
    );
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
          <TabsTrigger value="kb">Wissensbasis</TabsTrigger>
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
        <TabsContent value="kb">
          <Card>
            <CardHeader>
              <CardTitle>Krankenhaus-Dokumente</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
              <p>PDF-Upload und Embeddings folgen in einem späteren Schritt. Jetzt: Text einfügen und chunken.</p>
              <Button asChild className="w-fit">
                <Link href="/knowledge">Zur Wissensbasis</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
