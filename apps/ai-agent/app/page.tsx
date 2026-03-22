import Link from "next/link";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@mediconnect/ui";

export default function AiAgentPage() {
  return (
    <main className="container py-12">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <CardTitle>Doctor AI Agent</CardTitle>
          <Badge>E4</Badge>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            App Router API unter <code className="rounded bg-muted px-1">/api/v1/*</code> für Cloud Run.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/chat">Clinical assistant (doctors — hospital KB + chart tools)</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
