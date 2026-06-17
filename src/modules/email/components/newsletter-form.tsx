"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { subscribeNewsletterAction } from "@/modules/email/actions/email.actions";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const res = await subscribeNewsletterAction(email);
      if (res.success) {
        toast.success("Subscribed successfully! The subscription notification has been received in your mailroom inbox.");
        setEmail("");
      } else {
        toast.error(res.error || "Subscription failed. Please try again.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto w-full px-4 md:px-0">
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        className="w-full sm:flex-1 h-16 md:h-14 px-8 rounded-full bg-zinc-100 border-2 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 text-base font-bold focus:outline-none focus:border-brand-navy focus:ring-4 focus:ring-brand-navy/10 transition-all shadow-inner disabled:opacity-50"
        required
      />
      <Button
        type="submit"
        disabled={loading}
        className="h-16 md:h-14 px-10 rounded-full font-black text-sm md:text-base border-0 text-white whitespace-nowrap shadow-lg hover:scale-105 active:scale-95 transition-all bg-brand-navy hover:bg-brand-navy/90 w-full sm:w-auto disabled:opacity-50"
      >
        {loading ? "SUBSCRIBING..." : "JOIN THE CLUB"}
      </Button>
    </form>
  );
}
