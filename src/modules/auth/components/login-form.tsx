"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        toast.error("Authentication failed");
      } else {
        toast.success("Welcome back!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-none shadow-2xl shadow-brand-navy/5 overflow-hidden rounded-[2rem] bg-white/80 backdrop-blur-xl">
      <CardHeader className="space-y-4 pt-10 pb-6 text-center">
        <div className="flex justify-center">
            <div className="flex aspect-square size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-navy to-brand-silver text-white shadow-xl shadow-brand-navy/20 animate-in zoom-in duration-500">
                <Zap className="size-8 fill-white" />
            </div>
        </div>
        <div className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight">Staff Login</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
                Enter your credentials to access the OS
            </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-8 pb-10">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/5 py-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Work Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@nextgen.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:ring-brand-navy"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button type="button" className="text-xs text-brand-navy font-bold hover:underline">
                Forgot?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:ring-brand-navy"
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-14 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl text-lg font-bold shadow-lg shadow-brand-navy/20 transition-all active:scale-[0.98] mt-4"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Authenticating...
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
        
        <div className="mt-8 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                NextGen Fashion Operating System v1.0
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
