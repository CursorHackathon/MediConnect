"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button, GlassAuthShell, Input } from "@mediconnect/ui";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/" });
    setLoading(false);
    if (result?.error) setError("Invalid email or password.");
    else if (result?.url) window.location.href = result.url;
  }

  return (
    <GlassAuthShell
      hubCurrent="admin"
      title="Sign in — Admin"
      description="Administrator account required."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white/60 backdrop-blur-sm"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-white/60 backdrop-blur-sm"
          />
        </div>
        {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full shadow-md" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </GlassAuthShell>
  );
}
