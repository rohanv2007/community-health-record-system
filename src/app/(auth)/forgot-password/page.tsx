"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Password reset email triggered.");
  }

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-5 p-6">
          <div>
            <h1 className="text-2xl font-semibold">Reset password</h1>
            <p className="text-sm text-muted-foreground">Supabase will send a reset link to this email.</p>
          </div>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid gap-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input id="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <Button className="w-full" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</Button>
          </form>
          <Button asChild variant="link" className="px-0"><Link href="/login">Back to sign in</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
}
