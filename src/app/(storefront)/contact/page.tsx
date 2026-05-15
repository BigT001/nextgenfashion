import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <div className="pt-40 pb-40 min-h-screen bg-brand-mesh bg-opacity-5">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
            
            {/* Contact Information */}
            <div className="space-y-16">
              <div className="space-y-6">
                <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-brand-navy">
                  Let's Connect <br />
                  <span className="text-muted-foreground/30 italic">Directly.</span>
                </h1>
                <p className="text-xl text-muted-foreground font-medium max-w-md leading-relaxed">
                  Have a question about a collection or a custom request? Our concierge team is standing by.
                </p>
              </div>

              <div className="space-y-8">
                {[
                  { icon: Mail, label: "Email Concierge", value: "hello@nextgenfashion.com" },
                  { icon: Phone, label: "Direct Line", value: "+234 800 NEXTGEN" },
                  { icon: MapPin, label: "Global HQ", value: "Fashion District, Lagos, NG" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-6 group">
                    <div className="size-14 bg-white shadow-xl shadow-brand-navy/5 rounded-2xl flex items-center justify-center text-brand-navy ring-1 ring-border/50 group-hover:bg-brand-navy group-hover:text-white transition-all">
                      <item.icon className="size-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">{item.label}</p>
                      <p className="text-xl font-black tracking-tight">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-10 bg-brand-navy rounded-[2.5rem] text-white space-y-6 shadow-2xl shadow-brand-navy/20">
                <div className="flex items-center gap-4">
                  <MessageSquare className="size-6" />
                  <h4 className="font-black text-sm uppercase tracking-widest">Live Intelligence</h4>
                </div>
                <p className="text-xs text-brand-silver font-medium leading-relaxed">
                  Our digital assistants are available 24/7 to help with order tracking and style advice.
                </p>
                <Button variant="outline" className="w-full h-14 bg-white/10 border-none hover:bg-white/20 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl">
                  OPEN LIVE CHAT
                </Button>
              </div>
            </div>

            {/* Contact Form */}
            <div className="glass-card p-10 md:p-16 rounded-[3.5rem] border-none shadow-2xl">
              <form className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest ml-1">First Name</label>
                    <input type="text" className="w-full h-14 px-6 rounded-2xl bg-zinc-50 border border-border/50 focus:ring-1 focus:ring-brand-navy outline-none font-bold text-sm" placeholder="PATRON" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest ml-1">Last Name</label>
                    <input type="text" className="w-full h-14 px-6 rounded-2xl bg-zinc-50 border border-border/50 focus:ring-1 focus:ring-brand-navy outline-none font-bold text-sm" placeholder="NAME" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest ml-1">Email Address</label>
                  <input type="email" className="w-full h-14 px-6 rounded-2xl bg-zinc-50 border border-border/50 focus:ring-1 focus:ring-brand-navy outline-none font-bold text-sm" placeholder="EMAIL@NEXTGEN.COM" />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest ml-1">Message Detail</label>
                  <textarea className="w-full h-40 px-6 py-4 rounded-2xl bg-zinc-50 border border-border/50 focus:ring-1 focus:ring-brand-navy outline-none font-bold text-sm resize-none" placeholder="HOW CAN WE ASSIST YOUR COLLECTION?" />
                </div>

                <Button className="w-full h-16 bg-brand-navy hover:bg-brand-navy/90 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-2xl shadow-brand-navy/20 group transition-all">
                  <Send className="mr-3 size-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
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
