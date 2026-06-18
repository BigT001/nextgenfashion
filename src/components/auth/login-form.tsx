"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { LogIn, Mail, Lock, ArrowLeft, KeyRound, KeySquare } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import {
  requestPasswordResetAction,
  verifyOtpAction,
  resetPasswordAction,
} from "@/modules/auth/actions/password-reset.actions";
import { PasswordResetService } from "@/modules/auth/services/password-reset.service";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

type ViewState = "LOGIN" | "FORGOT_PASSWORD_EMAIL" | "FORGOT_PASSWORD_OTP";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<ViewState>("LOGIN");
  const callbackUrl = searchParams.get("callbackUrl");

  // Forgot password state
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onLoginSubmit(values: LoginValues) {
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

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }
    setIsLoading(true);
    try {
      const res = await requestPasswordResetAction(resetEmail);
      if (res.success) {
        toast.success(res.message);
        setView("FORGOT_PASSWORD_OTP");
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Failed to request reset code");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const validation = PasswordResetService.validatePassword(newPassword);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    setIsLoading(true);
    try {
      // First verify OTP, then reset
      const verifyRes = await verifyOtpAction(resetEmail, otp);
      if (!verifyRes.success) {
        toast.error(verifyRes.error);
        setIsLoading(false);
        return;
      }

      const resetRes = await resetPasswordAction(resetEmail, otp, newPassword);
      if (resetRes.success) {
        toast.success(resetRes.message);
        setView("LOGIN");
        setResetEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        form.setValue("email", resetEmail);
      } else {
        toast.error(resetRes.error);
      }
    } catch (error) {
      toast.error("Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  }

  const animationVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="w-full relative overflow-hidden min-h-[350px]">
      <AnimatePresence mode="wait">
        {view === "LOGIN" && (
          <motion.div
            key="login"
            variants={animationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onLoginSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Enter email address" 
                            className="pl-12 h-12 bg-zinc-50 border-none shadow-sm focus-visible:ring-brand-navy rounded-xl font-bold" 
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
                      <div className="flex items-center justify-between ml-2">
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</FormLabel>
                        <button 
                          type="button" 
                          onClick={() => setView("FORGOT_PASSWORD_EMAIL")}
                          className="text-[10px] font-bold text-brand-navy hover:underline uppercase tracking-wider"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-12 h-12 bg-zinc-50 border-none shadow-sm focus-visible:ring-brand-navy rounded-xl font-bold" 
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
            </Form>
            
            <div className="mt-8 pt-8 border-t border-zinc-100 flex flex-col items-center gap-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    New Patron? {" "}
                    <Link href={`/auth/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="text-brand-navy hover:underline">Create an Account</Link>
                </p>
                <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-brand-navy transition-colors flex items-center gap-2">
                    <ArrowLeft className="size-3" />
                    Return Home
                </Link>
            </div>
          </motion.div>
        )}

        {view === "FORGOT_PASSWORD_EMAIL" && (
          <motion.div
            key="forgot_password_email"
            variants={animationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6 text-center">
              <KeyRound className="h-12 w-12 text-brand-navy mx-auto mb-4" />
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">Reset Password</h2>
              <p className="text-sm text-zinc-500 font-medium mt-2">Enter your email to receive a 6-digit verification code.</p>
            </div>

            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter email address" 
                    className="pl-12 h-12 bg-zinc-50 border-none shadow-sm focus-visible:ring-brand-navy rounded-xl font-bold" 
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || !resetEmail}
                className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white h-12 font-black rounded-xl shadow-xl shadow-brand-navy/20 active:scale-95 transition-all"
              >
                {isLoading ? <LoadingSpinner size="sm" variant="white" /> : "Send Reset Code"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => setView("LOGIN")}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-brand-navy transition-colors flex items-center justify-center w-full gap-2"
              >
                <ArrowLeft className="size-3" /> Back to Login
              </button>
            </div>
          </motion.div>
        )}

        {view === "FORGOT_PASSWORD_OTP" && (
          <motion.div
            key="forgot_password_otp"
            variants={animationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6 text-center">
              <KeySquare className="h-12 w-12 text-brand-navy mx-auto mb-4" />
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">Verify & Reset</h2>
              <p className="text-sm text-zinc-500 font-medium mt-2">Enter the 6-digit code sent to <strong>{resetEmail}</strong> and your new password.</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Verification Code</Label>
                <Input 
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="000000" 
                  className="h-12 bg-zinc-50 border-none shadow-sm focus-visible:ring-brand-navy rounded-xl font-black tracking-[0.5em] text-center text-lg" 
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="pl-12 h-12 bg-zinc-50 border-none shadow-sm focus-visible:ring-brand-navy rounded-xl font-bold" 
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="pl-12 h-12 bg-zinc-50 border-none shadow-sm focus-visible:ring-brand-navy rounded-xl font-bold" 
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || otp.length !== 6 || !newPassword || !confirmPassword}
                className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white h-12 font-black rounded-xl shadow-xl shadow-brand-navy/20 active:scale-95 transition-all mt-2"
              >
                {isLoading ? <LoadingSpinner size="sm" variant="white" /> : "Reset Password"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => setView("LOGIN")}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-brand-navy transition-colors flex items-center justify-center w-full gap-2"
              >
                <ArrowLeft className="size-3" /> Cancel Reset
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
