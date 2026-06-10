import { 
  Sparkles, 
  Globe, 
  ShieldCheck, 
  Heart, 
  Shirt, 
  BookOpen, 
  Gift, 
  Store, 
  Award, 
  Smile, 
  CheckCircle2 
} from "lucide-react";
import { AnimatedSection } from "@/components/ui/animated-section";

export const metadata = {
  title: "About Us | NextGen Fashion (Everything Kiddies)",
  description: "Learn about NextGen Fashion, Nigeria's trusted brand for premium baby wear, children's fashion, footwear, toys, and mother-care essentials.",
};

export default function AboutPage() {
  const offerings = [
    {
      icon: Sparkles,
      title: "Premium Baby Wear",
      age: "0–24 Months",
      description: "Soft, breathable, and highly comfortable clothing designed specifically for your baby's delicate growth stages."
    },
    {
      icon: Shirt,
      title: "Children's Fashion & Clothing",
      age: "0–15 Years",
      description: "Trendy, durable, and stylish collections that keep toddlers, young children, and teens looking great."
    },
    {
      icon: Award,
      title: "School & Casual Footwear",
      age: "Active Support",
      description: "Premium footwear designed for structural support, built to handle everyday play, school, and adventures."
    },
    {
      icon: Smile,
      title: "Children's Accessories",
      age: "Style Accents",
      description: "Fun, fashionable accessories carefully curated to add comfort and personality to any outfit."
    },
    {
      icon: Heart,
      title: "Mother-Care Essentials",
      age: "Mother & Baby",
      description: "High-quality products selected with care to support mothers and newborns through early development."
    },
    {
      icon: BookOpen,
      title: "Educational & Learning Toys",
      age: "Cognitive Growth",
      description: "Toys thoughtfully chosen to encourage creativity, early learning, problem-solving, and imagination."
    },
    {
      icon: Globe,
      title: "Play Toys & Recreational Products",
      age: "Recreational Play",
      description: "Fun and safe recreational toys designed to encourage active movement and endless happiness."
    },
    {
      icon: Gift,
      title: "Newborn Gift Sets",
      age: "Perfect Gifting",
      description: "Beautifully presented combinations of essential wear and products, ready to welcome new bundle of joys."
    },
    {
      icon: Store,
      title: "Wholesale & Retail Supply",
      age: "Flexible Options",
      description: "Reliable bulk supply and retail services catering to families, retailers, schools, and corporate buyers."
    }
  ];

  const partnerTypes = [
    "Parents & Guardians",
    "Retailers & Wholesalers",
    "Schools & Corporate Buyers"
  ];

  return (
    <div id="about-page" className="pt-28 md:pt-36 pb-20 md:pb-32 min-h-screen relative overflow-hidden bg-brand-mesh">
      {/* Visual background blobs for premium feel */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 rounded-full bg-brand-navy/5 filter blur-3xl pointer-events-none animate-blob-1" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 rounded-full bg-brand-silver/10 filter blur-3xl pointer-events-none animate-blob-2" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-5xl mx-auto space-y-20 md:space-y-28">
          
          {/* Hero Header Section */}
          <AnimatedSection animation="fade-up" delay={100} className="text-center space-y-6">
            <div id="motto-badge" className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-navy/5 dark:bg-white/5 border border-brand-navy/10 dark:border-white/10 text-brand-navy dark:text-brand-silver">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Motto: Trust to Satisfy</span>
            </div>
            
            <div className="space-y-4">
              <h1 id="about-heading" className="text-3xl md:text-5xl font-black tracking-tight text-brand-navy dark:text-white leading-tight">
                About NextGen Fashion
              </h1>
              <p className="text-sm md:text-base text-zinc-500 font-extrabold uppercase tracking-[0.25em]">
                Everything Kiddies, All in One Place
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-medium">
                At NextGen Fashion (Everything Kiddies), we are passionate about providing premium-quality products that support the growth, comfort, happiness, and development of children from birth through 15 years of age.
              </p>
            </div>
          </AnimatedSection>

          {/* Intro Story Grid */}
          <AnimatedSection animation="fade-up" delay={200}>
            <div id="about-story" className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
              <div className="glass-card p-6 md:p-8 rounded-3xl flex flex-col justify-between hover:shadow-xl hover:shadow-brand-navy/5 transition-all">
                <div className="space-y-4">
                  <div className="size-10 bg-brand-navy/10 dark:bg-white/10 rounded-2xl flex items-center justify-center text-brand-navy dark:text-brand-silver">
                    <Globe className="size-5" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-brand-navy dark:text-white tracking-tight">Nigeria's Trusted Destination</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    As one of Nigeria's trusted destinations for children's fashion and essentials, we offer a carefully selected range of baby wear, children's clothing, footwear, accessories, educational toys, play toys, and mother-care products designed to meet the everyday needs of modern families.
                  </p>
                </div>
              </div>

              <div className="glass-card p-6 md:p-8 rounded-3xl flex flex-col justify-between hover:shadow-xl hover:shadow-brand-navy/5 transition-all">
                <div className="space-y-4">
                  <div className="size-10 bg-brand-navy/10 dark:bg-white/10 rounded-2xl flex items-center justify-center text-brand-navy dark:text-brand-silver">
                    <ShieldCheck className="size-5" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-brand-navy dark:text-white tracking-tight">Quality & Early Growth</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    Our collections combine quality, comfort, style, durability, and affordability, ensuring that every child looks great while enjoying the comfort they deserve. From newborn essentials and infant wear to trendy outfits for toddlers, young children, and teenagers, we provide products that cater to every stage of childhood.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Early Learning Statement */}
          <AnimatedSection animation="fade-up" delay={150}>
            <div id="learning-focus" className="glass-card p-6 md:p-8 rounded-3xl bg-linear-to-r from-brand-navy/5 to-brand-silver/5 border border-brand-navy/15 flex flex-col md:flex-row items-center gap-6">
              <div className="size-12 bg-brand-navy/10 rounded-2xl flex items-center justify-center text-brand-navy dark:text-brand-silver shrink-0">
                <Sparkles className="size-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm md:text-base font-bold text-brand-navy dark:text-white">Cognitive Development & Play</h4>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  We also understand the importance of early learning and development. That's why our educational and play toys are thoughtfully chosen to encourage creativity, learning, imagination, and cognitive growth while providing endless fun.
                </p>
              </div>
            </div>
          </AnimatedSection>

          {/* What We Offer Section */}
          <div id="offerings-section" className="space-y-10">
            <AnimatedSection animation="fade-up" className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-brand-navy dark:text-white">What We Offer</h2>
              <p className="text-xs md:text-sm text-muted-foreground max-w-lg mx-auto">
                A carefully curated range of premium products and wholesale solutions for modern families.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {offerings.map((item, index) => (
                <AnimatedSection 
                  key={index} 
                  animation="fade-up" 
                  delay={50 * (index % 3)}
                  className="group"
                >
                  <div className="glass-card p-6 rounded-2xl h-full flex flex-col justify-between hover:shadow-lg hover:shadow-brand-navy/5 border border-border/60 hover:border-brand-navy/20 dark:hover:border-white/20 transition-all">
                    <div className="space-y-3">
                      <div className="size-10 bg-brand-navy/5 group-hover:bg-brand-navy/10 dark:bg-white/5 dark:group-hover:bg-white/10 rounded-xl flex items-center justify-center text-brand-navy dark:text-brand-silver transition-all duration-300">
                        <item.icon className="size-5 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500">{item.age}</span>
                        <h4 className="text-sm md:text-base font-bold text-brand-navy dark:text-white tracking-tight">{item.title}</h4>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-normal">{item.description}</p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>

          {/* Commitment & Partnering */}
          <AnimatedSection animation="fade-up">
            <div id="commitment-section" className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-6 md:p-8 border border-border/50">
              <div className="md:col-span-7 space-y-4">
                <h3 className="text-xl md:text-2xl font-black text-brand-navy dark:text-white tracking-tight">Our Commitment</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  At NextGen Fashion, we are committed to delivering exceptional quality, outstanding customer service, and value for money. We source our products from reputable manufacturers and trusted suppliers to ensure every item meets high standards of safety, quality, and durability.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  Whether you are a parent, guardian, retailer, wholesaler, school, or corporate buyer, our goal is to provide a seamless shopping experience and become your preferred partner for everything children's fashion and care.
                </p>
              </div>
              <div className="md:col-span-5 space-y-4 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-border/40 shadow-xs">
                <h4 className="text-xs font-black uppercase tracking-widest text-brand-navy dark:text-white">Serving Partners Across</h4>
                <ul className="space-y-2.5">
                  {partnerTypes.map((partner, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs md:text-sm font-semibold text-muted-foreground">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>{partner}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </AnimatedSection>

          {/* Vision & Mission Cards */}
          <div id="vision-mission" className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <AnimatedSection animation="fade-up" delay={50}>
              <div className="h-full bg-brand-navy text-white rounded-3xl p-6 md:p-8 relative overflow-hidden border border-white/5 shadow-xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/2 rounded-full -mr-8 -mt-8" />
                <div className="space-y-4 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-silver">The Future</span>
                  <h3 className="text-lg md:text-xl font-bold tracking-tight text-white">Our Vision</h3>
                  <p className="text-xs md:text-sm text-brand-silver leading-relaxed font-medium">
                    To become Africa's leading children's fashion and lifestyle brand, providing quality products that inspire confidence, comfort, learning, and happiness in every child.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="fade-up" delay={100}>
              <div className="h-full bg-zinc-900 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden border border-white/5 shadow-xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/2 rounded-full -mr-8 -mt-8" />
                <div className="space-y-4 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-silver">The Operations</span>
                  <h3 className="text-lg md:text-xl font-bold tracking-tight text-white">Our Mission</h3>
                  <p className="text-xs md:text-sm text-brand-silver leading-relaxed font-medium">
                    To deliver premium-quality children's products, exceptional customer service, and innovative solutions that support families and contribute positively to child development.
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>

        </div>
      </div>
    </div>
  );
}
