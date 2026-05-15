import { RegisterForm } from "@/components/auth/register-form";
import { Sparkles, ShieldCheck } from "lucide-react";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-mesh p-4 py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl" />
      
      <div className="w-full max-w-[600px] animate-slow-fade relative z-10">
        <div className="flex flex-col items-center mb-12 text-center">
          <div className="size-20 bg-brand-navy/10 rounded-3xl flex items-center justify-center mb-8 ring-8 ring-brand-navy/5 group">
            <Sparkles className="size-10 text-brand-navy animate-pulse" />
          </div>
          <h1 className="text-5xl font-black tracking-tight text-gradient mb-4">Customer Signup</h1>
          <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.3em]">NextGen Digital Account Protocol</p>
        </div>

        <div className="glass-card border-none p-10 md:p-16 rounded-[3rem] shadow-2xl shadow-brand-navy/5 relative overflow-hidden bg-white/80">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-navy to-brand-silver opacity-50" />
          
          <div className="mb-12">
            <h2 className="text-3xl font-black tracking-tight leading-none">Global Access</h2>
            <p className="text-sm text-muted-foreground mt-2 font-medium">Join our curated network of fashion enthusiasts.</p>
          </div>
          
          <Suspense fallback={<div className="h-[400px] flex items-center justify-center"><div className="animate-spin size-10 border-4 border-brand-navy border-t-transparent rounded-full" /></div>}>
            <RegisterForm />
          </Suspense>

          <div className="mt-12 pt-8 border-t border-border/30 flex items-center justify-center gap-4 opacity-40">
            <ShieldCheck className="size-4" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">NextGen Integrity Standard</span>
          </div>
        </div>

        <p className="text-center mt-12 text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest">
          &copy; {new Date().getFullYear()} NextGen Fashion. All rights reserved.
        </p>
      </div>
    </div>
  );
}
