import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ForbiddenPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <Card className="max-w-md">
        <CardContent className="space-y-4 p-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-lg bg-amber-100 text-amber-700">
            <ShieldAlert />
          </div>
          <h1 className="text-2xl font-semibold">403: Restricted area</h1>
          <p className="text-sm text-muted-foreground">
            Your role does not have access to this module.
          </p>
          <Button asChild><Link href="/dashboard">Back to dashboard</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
}
