import { LoginForm } from "@/components/auth/login-form";
import { Sparkles } from "lucide-react";
import { Suspense } from "react";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-mesh p-4">
      <div className="w-full max-w-[440px] animate-slow-fade">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="size-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-brand-navy/10 ring-1 ring-border/50 p-2">
            <Image 
                src="/images/logonextgen.png" 
                alt="NextGen Logo" 
                width={60} 
                height={60} 
                className="object-contain"
            />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-brand-navy mb-2">NextGen Fashion</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Customer Account Access</p>
        </div>

        <div className="glass-card border-none p-8 md:p-10 rounded-[32px] shadow-2xl shadow-brand-navy/5">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Welcome Back</h2>
            <p className="text-sm text-muted-foreground mt-1">Enter your credentials to access the dashboard</p>
          </div>
          
          <Suspense fallback={<div className="h-[280px] flex items-center justify-center"><div className="animate-spin size-8 border-4 border-brand-navy border-t-transparent rounded-full" /></div>}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center mt-8 text-xs text-muted-foreground/60 font-medium">
          &copy; {new Date().getFullYear()} NextGen Fashion. All rights reserved.
        </p>
      </div>
    </div>
  );
}
