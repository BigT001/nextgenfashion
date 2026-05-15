"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ShieldAlert, Lock, Mail, Activity, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Image from "next/image";

const staffLoginSchema = z.object({
  email: z.string().email("Invalid administrative email"),
  password: z.string().min(1, "Access key is required"),
});

type StaffLoginValues = z.infer<typeof staffLoginSchema>;

function StaffLoginForm() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const form = useForm<StaffLoginValues>({
    resolver: zodResolver(staffLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: StaffLoginValues) {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("ACCESS DENIED: Invalid Administrative Credentials");
      } else {
        toast.success("AUTHENTICATED: Establishing Secure Session...");
        window.location.href = callbackUrl;
      }
    } catch (error) {
      toast.error("SYSTEM ERROR: Failed to establish executive session");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md relative z-10">
      <div className="flex items-center justify-center gap-8 mb-12">
        <div className="size-20 bg-white rounded-3xl flex items-center justify-center shadow-[0_0_50px_-12px_rgba(11,30,63,0.5)] p-2 shrink-0">
          <Image 
            src="/images/logonextgen.png" 
            alt="NextGen Logo" 
            width={60} 
            height={60} 
            className="object-contain"
          />
        </div>
        <div className="flex flex-col text-left">
          <h1 className="text-3xl font-black tracking-[0.2em] uppercase leading-none text-brand-silver">EXECUTIVE</h1>
          <h2 className="text-xl font-bold tracking-[0.4em] uppercase text-zinc-500 mt-1">BUSINESS SUITE</h2>
        </div>
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-navy to-transparent shadow-[0_0_30px_rgba(11,30,63,0.8)] animate-pulse" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-brand-navy shadow-[0_0_40px_10px_rgba(11,30,63,0.4)]" />
        
        <div className="flex items-center gap-4 mb-10 text-zinc-400">
          <ShieldAlert className="size-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Authorized Personnel Only</span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Admin Email</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-brand-silver transition-colors" />
                      <Input 
                        placeholder="ADMIN@NEXTGEN.OS" 
                        className="pl-12 h-14 bg-black/50 border-white/5 rounded-xl font-bold text-zinc-300 focus-visible:ring-brand-navy/50 focus-visible:border-brand-navy/50 transition-all" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-rose-500 text-[10px] uppercase font-bold" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Access Key</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-brand-silver transition-colors" />
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-12 h-14 bg-black/50 border-white/5 rounded-xl font-bold text-zinc-300 focus-visible:ring-brand-navy/50 focus-visible:border-brand-navy/50 transition-all" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-rose-500 text-[10px] uppercase font-bold" />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-14 bg-brand-navy hover:bg-brand-navy/80 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_20px_50px_-12px_rgba(11,30,63,0.3)] active:scale-95 transition-all mt-4"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" variant="white" />
              ) : (
                <>
                  <Cpu className="mr-2 h-4 w-4" />
                  GAIN ACCESS
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
          <div className="flex items-center gap-6 opacity-40">
            <Activity className="size-4 text-brand-silver" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Network Status: Secure</span>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-[11px] text-zinc-400 uppercase tracking-[0.2em] font-bold leading-relaxed max-w-sm mx-auto">
          Warning: Unauthorized access attempts are monitored and logged.
        </p>
      </div>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden font-mono">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0B1E3F,black)]" />
        <div className="grid grid-cols-20 h-full w-full opacity-20">
          {Array.from({ length: 400 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-brand-navy/10 h-20 w-full" />
          ))}
        </div>
      </div>

      <Suspense fallback={<LoadingSpinner variant="white" />}>
        <StaffLoginForm />
      </Suspense>
    </div>
  );
}
