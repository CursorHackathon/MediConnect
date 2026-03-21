import { Badge, Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mediconnect/ui";

export default function DashboardPage() {
  return (
    <main className="container space-y-6 py-12">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Klinisches Dashboard</h1>
        <Badge>E2</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kennzahl</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Beispielmetrik</TableCell>
                <TableCell>—</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
