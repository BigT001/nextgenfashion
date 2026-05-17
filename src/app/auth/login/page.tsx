import { LoginForm } from "@/components/auth/login-form";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductQueries } from "@/modules/products/queries/product.queries";

export default async function LoginPage() {
  // Fetch a real product image from the database
  const featuredProducts = await ProductQueries.findFeatured(10);
  // Pick one that has an image
  const productWithImage = featuredProducts.find(p => p.images && p.images.length > 0);
  const displayImage = productWithImage?.images[0] || "https://images.unsplash.com/photo-1621330396173-e41b1cafd17f?auto=format&fit=crop&q=80&w=1000";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] p-4 md:p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-navy/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-6xl bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.08)] border border-white overflow-hidden flex flex-col lg:flex-row h-full max-h-[850px] relative z-10">
        
        {/* Left: Creative Side */}
        <div className="lg:w-[45%] relative overflow-hidden bg-brand-navy group hidden lg:block">
          <Image 
            src={displayImage}
            alt="NextGen Kiddies Product"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-[5s] ease-out"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/60 via-transparent to-transparent" />
          
          <div className="absolute bottom-12 left-12 right-12">
             <p className="text-white text-lg font-black leading-relaxed tracking-tight max-w-xs drop-shadow-xl">
               {productWithImage ? `Featuring our ${productWithImage.name} collection.` : "Welcome back to the elite network of parents."}
             </p>
          </div>
          
          {/* Logo overlay */}
          <div className="absolute top-12 left-12">
            <Link href="/" className="flex items-center gap-3 group/logo">
                <div className="size-10 bg-white rounded-xl p-1 shadow-2xl group-hover/logo:scale-110 transition-transform">
                    <Image src="/images/logonextgen.png" alt="Logo" width={40} height={40} className="object-contain h-full w-full" />
                </div>
                <span className="text-white font-black tracking-tighter text-sm">NEXTGEN KIDDIES</span>
            </Link>
          </div>
        </div>

        {/* Right: Functional Side */}
        <div className="flex-1 p-8 lg:p-16 flex flex-col justify-center relative bg-white overflow-y-auto">
          <div className="max-w-[440px] mx-auto w-full space-y-6 lg:space-y-8">
            <div className="space-y-3">
               <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-zinc-900 leading-none">Welcome Back</h1>
               <p className="text-zinc-500 text-sm font-medium">Access your curated dashboard below.</p>
            </div>

            <Suspense fallback={<div className="h-[300px] flex items-center justify-center"><div className="animate-spin size-10 border-4 border-brand-navy border-t-transparent rounded-full" /></div>}>
              <LoginForm />
            </Suspense>

            <div className="pt-2 text-center lg:text-left">
                <p className="text-xs text-zinc-400 font-medium tracking-tight">
                    &copy; {new Date().getFullYear()} NextGen Kiddies. All rights reserved.
                </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating back to home */}
      <Link href="/" className="absolute top-6 left-6 lg:top-8 lg:left-8 z-20 hidden lg:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-brand-navy transition-colors">
        <ArrowLeft className="size-4" />
        Return Home
      </Link>
    </div>
  );
}
