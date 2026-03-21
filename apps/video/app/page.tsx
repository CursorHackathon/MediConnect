import { Badge, Card, CardContent, CardHeader, CardTitle } from "@mediconnect/ui";

export default function VideoAppPage() {
  return (
    <main className="container py-12">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <CardTitle>Video-Sprechstunde</CardTitle>
          <Badge>E1</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Next.js App Router — Telemedizin-Video.</p>
        </CardContent>
      </Card>
    </main>
  );
}
