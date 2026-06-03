import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <div className="pt-40 pb-40 min-h-screen bg-brand-mesh bg-opacity-5">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            
            {/* Contact Information */}
            <div className="space-y-10">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-brand-navy">
                  Let's Connect <br />
                  <span className="text-muted-foreground/30 italic">Directly.</span>
                </h1>
                <p className="text-lg text-muted-foreground font-medium max-w-md leading-relaxed">
                  Have a question about a collection or a custom request? Our concierge team is standing by.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  { icon: Mail, label: "Email Concierge", value: "support@nextgenkiddies.com" },
                  { icon: Phone, label: "Direct Line", value: "07040913003" },
                  { icon: MapPin, label: "Global HQ", value: "4 ALHAJI LUKMAN STREET OFF CHIVITA AVENUE AJAO ESTATE LAGOS." }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-5 group">
                    <div className="size-12 shrink-0 bg-white shadow-xl shadow-brand-navy/5 rounded-2xl flex items-center justify-center text-brand-navy ring-1 ring-border/50 group-hover:bg-brand-navy group-hover:text-white transition-all">
                      <item.icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">{item.label}</p>
                      <p className="text-sm font-black tracking-tight leading-snug max-w-xs uppercase">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-4">
                <a href="https://www.facebook.com/share/1ESMAQhQjd/" target="_blank" rel="noopener noreferrer" className="size-14 bg-white shadow-xl shadow-brand-navy/5 rounded-2xl flex items-center justify-center text-brand-navy ring-1 ring-border/50 hover:bg-[#1877F2] hover:text-white transition-all group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a href="https://www.instagram.com/nextgenfashion_official?igsh=MWlzbWV3bG1iZHc4eg==" target="_blank" rel="noopener noreferrer" className="size-14 bg-white shadow-xl shadow-brand-navy/5 rounded-2xl flex items-center justify-center text-brand-navy ring-1 ring-border/50 hover:bg-[#E1306C] hover:text-white transition-all group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
                <a href="https://t.me/+yhEgNe0Ir4tkMTgx" target="_blank" rel="noopener noreferrer" className="size-14 bg-white shadow-xl shadow-brand-navy/5 rounded-2xl flex items-center justify-center text-brand-navy ring-1 ring-border/50 hover:bg-[#0088cc] hover:text-white transition-all group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="glass-card p-8 md:p-10 rounded-[2.5rem] border-none shadow-2xl">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest ml-1">First Name</label>
                    <input type="text" className="w-full h-12 px-5 rounded-xl bg-zinc-50 border border-border/50 focus:ring-1 focus:ring-brand-navy outline-none font-bold text-xs" placeholder="PATRON" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest ml-1">Last Name</label>
                    <input type="text" className="w-full h-12 px-5 rounded-xl bg-zinc-50 border border-border/50 focus:ring-1 focus:ring-brand-navy outline-none font-bold text-xs" placeholder="NAME" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1">Email Address</label>
                  <input type="email" className="w-full h-12 px-5 rounded-xl bg-zinc-50 border border-border/50 focus:ring-1 focus:ring-brand-navy outline-none font-bold text-xs" placeholder="EMAIL@NEXTGEN.COM" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1">Message Detail</label>
                  <textarea className="w-full h-32 px-5 py-4 rounded-xl bg-zinc-50 border border-border/50 focus:ring-1 focus:ring-brand-navy outline-none font-bold text-xs resize-none" placeholder="HOW CAN WE ASSIST YOUR COLLECTION?" />
                </div>

                <Button className="w-full h-12 bg-brand-navy hover:bg-brand-navy/90 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-2xl shadow-brand-navy/20 group transition-all">
                  <Send className="mr-2 size-3.5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  INITIALIZE MESSAGE
                </Button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
