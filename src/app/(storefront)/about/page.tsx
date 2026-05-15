import { Sparkles, Globe, ShieldCheck, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="pt-40 pb-40">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto space-y-32">
          
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-brand-navy">
              Architecture for the <br />
              <span className="text-muted-foreground/30 italic">Next Generation.</span>
            </h1>
            <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              NextGen Fashion is not just a brand; it's a structural evolution in children's retail. We engineer high-performance style for the icons of tomorrow.
            </p>
          </div>

          {/* Core Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[
              {
                icon: ShieldCheck,
                title: "Quality Engineering",
                description: "Every thread is stress-tested. Every seam is reinforced. We build for the reality of play."
              },
              {
                icon: Sparkles,
                title: "Elite Aesthetics",
                description: "Curation that rivals luxury adult fashion, scaled down for the ultimate children's wardrobe."
              },
              {
                icon: Globe,
                title: "Global Vision",
                description: "Sustainable logistics and ethical manufacturing. We care for the world our children will inherit."
              },
              {
                icon: Heart,
                title: "Community First",
                description: "Our patrons are our partners. We're building a network of forward-thinking families."
              }
            ].map((value, i) => (
              <div key={i} className="glass-card p-10 rounded-[2.5rem] space-y-6 hover:shadow-2xl hover:shadow-brand-navy/5 transition-all group">
                <div className="size-14 bg-brand-navy/10 rounded-2xl flex items-center justify-center text-brand-navy group-hover:rotate-12 transition-transform">
                  <value.icon className="size-6" />
                </div>
                <h3 className="text-2xl font-black tracking-tight">{value.title}</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>

          {/* Mission Statement */}
          <div className="bg-zinc-950 rounded-[4rem] p-16 md:p-24 text-white text-center space-y-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-mesh opacity-10 pointer-events-none" />
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                Our mission is to empower the next generation with confidence, quality, and structural style.
              </h2>
              <div className="h-px w-20 bg-brand-navy mx-auto" />
              <p className="text-zinc-500 uppercase tracking-[0.4em] font-black text-xs">Since 2024</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
