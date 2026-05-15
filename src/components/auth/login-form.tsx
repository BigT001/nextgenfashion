"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { LogIn, Mail, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getSession } from "next-auth/react";

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

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl");

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginValues) {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials. Please try again.");
      } else {
        toast.success("Welcome back! Access granted.");
        
        // Fetch current session to determine role-based redirect
        const session = await getSession();
        const role = (session?.user as any)?.role;
        
        const destination = callbackUrl || (role === "CUSTOMER" ? "/account" : "/dashboard");
        
        router.push(destination);
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="admin@nextgen.com" 
                    className="pl-10 h-12 bg-white/50 dark:bg-zinc-900/50 border-none shadow-sm focus-visible:ring-brand-navy rounded-xl" 
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 h-12 bg-white/50 dark:bg-zinc-900/50 border-none shadow-sm focus-visible:ring-brand-navy rounded-xl" 
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white h-12 font-black rounded-xl shadow-xl shadow-brand-navy/20 active:scale-95 transition-all"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" variant="white" />
          ) : (
            <>
              <LogIn className="mr-2 h-5 w-5" />
              Sign In to Account
            </>
          )}
        </Button>
      </form>
      <div className="mt-8 pt-8 border-t border-border/30 flex flex-col items-center gap-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              New Patron? {" "}
              <Link href="/auth/register" className="text-brand-navy hover:underline">Create an Identity</Link>
          </p>
          <Link href="/shop" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-brand-navy transition-colors flex items-center gap-2">
              <ArrowLeft className="size-3" />
              Return to Storefront
          </Link>
      </div>
    </Form>
  );
}
