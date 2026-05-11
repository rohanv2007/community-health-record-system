"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HeartPulse, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoCredentials } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@healthpoint.com");
  const [password, setPassword] = useState("Demo@1234");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error("Invalid credentials. Please check the email and password.");
      return;
    }

    toast.success("Signed in successfully.");
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next ?? "/dashboard");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen bg-[#0F172A] lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(13,148,136,0.38),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.82))]" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-lg bg-teal">
            <HeartPulse className="size-5" />
          </div>
          <div>
            <p className="font-heading text-lg font-semibold">HealthPoint CHRS</p>
            <p className="text-sm text-slate-300">Medical-grade clinic operations</p>
          </div>
        </div>
        <div className="relative z-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-200">Community care, coordinated</p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight">
            Patient records, appointments, prescriptions, and billing in one calm workspace.
          </h1>
          <div className="mt-8 grid grid-cols-3 gap-3 text-sm text-slate-200">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">RLS secured by clinic</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">Role-aware workflows</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">Live Supabase backend</div>
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md shadow-soft">
          <CardContent className="p-6">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal">Secure sign in</p>
              <h2 className="mt-2 text-2xl font-semibold">Welcome back</h2>
              <p className="mt-1 text-sm text-muted-foreground">Use one of the demo roles or your clinic account.</p>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9" />
                </div>
              </div>
              <Button className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
            </form>
            <div className="mt-4 text-right">
              <Button asChild variant="link" className="px-0"><a href="/forgot-password">Forgot password?</a></Button>
            </div>
            <div className="mt-6 rounded-lg border bg-muted/40 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Demo credentials</p>
              <div className="space-y-2">
                {demoCredentials.map((item) => (
                  <button
                    key={item.email}
                    className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition hover:bg-background"
                    onClick={() => {
                      setEmail(item.email);
                      setPassword(item.password);
                    }}
                  >
                    <span className="font-medium">{item.role}</span>
                    <span className="text-muted-foreground">{item.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
