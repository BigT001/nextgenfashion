"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, Mail, Lock, User, Phone, ArrowRight } from "lucide-react";
import Link from "next/link";

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
import { registerCustomerAction } from "@/modules/customers/actions/customer.actions";

const registerSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Valid phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterValues) {
    setIsLoading(true);
    try {
      const result = await registerCustomerAction({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });

      if (result.success) {
        toast.success("Account created successfully. Accessing dashboard...");
        // Automatically sign in
        const authResult = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
        });
        
        if (authResult?.error) {
            router.push("/auth/login");
        } else {
            router.push("/account");
            router.refresh();
        }
      } else {
        toast.error(result.error || "Registration failed.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Full Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="ENTER FULL NAME" 
                    className="pl-12 h-14 bg-white/50 dark:bg-zinc-900/50 border-none shadow-sm focus-visible:ring-brand-navy rounded-2xl font-bold" 
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Digital Identity (Email)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="NAME@DOMAIN.COM" 
                        className="pl-12 h-14 bg-white/50 dark:bg-zinc-900/50 border-none shadow-sm focus-visible:ring-brand-navy rounded-2xl font-bold" 
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Mobile Contact</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="+234 ..." 
                        className="pl-12 h-14 bg-white/50 dark:bg-zinc-900/50 border-none shadow-sm focus-visible:ring-brand-navy rounded-2xl font-bold" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Secret Code</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-12 h-14 bg-white/50 dark:bg-zinc-900/50 border-none shadow-sm focus-visible:ring-brand-navy rounded-2xl font-bold" 
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
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Confirm Code</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-12 h-14 bg-white/50 dark:bg-zinc-900/50 border-none shadow-sm focus-visible:ring-brand-navy rounded-2xl font-bold" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full h-16 bg-brand-navy hover:bg-brand-navy/90 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-2xl shadow-brand-navy/20 active:scale-95 transition-all mt-4"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" variant="white" />
          ) : (
            <>
              <UserPlus className="mr-2 h-5 w-5" />
              CREATE CUSTOMER ACCOUNT
            </>
          )}
        </Button>

        <div className="text-center pt-6 border-t border-border/30">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Already have an account? {" "}
                <Link href="/auth/login" className="text-brand-navy hover:underline">SIGN IN HERE</Link>
            </p>
        </div>
      </form>
    </Form>
  );
}
