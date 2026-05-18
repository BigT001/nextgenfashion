"use client";

import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface StoreSearchProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function StoreSearch({ open, setOpen }: StoreSearchProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop?q=${encodeURIComponent(query)}`);
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] bg-white p-0 overflow-hidden border-none shadow-2xl">
        <DialogTitle className="sr-only">Search Catalogue</DialogTitle>
        <form onSubmit={handleSearch} className="relative flex items-center p-6 bg-white border-b border-zinc-100 pr-16">
          <Search className="absolute left-10 size-6 text-zinc-400" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search our premium collection..." 
            className="w-full pl-14 pr-4 py-4 text-xl font-bold bg-transparent outline-none text-zinc-900 placeholder:text-zinc-300"
            autoFocus
          />
        </form>
        <div className="p-8 bg-zinc-50/50">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">Quick Search</p>
          <div className="flex flex-wrap gap-2">
            {["New Arrivals", "Best Sellers", "Boys", "Girls", "Summer Vibes"].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  router.push(`/shop?q=${encodeURIComponent(tag)}`);
                  setOpen(false);
                }}
                className="px-4 py-2 rounded-full bg-white border border-zinc-200 text-xs font-bold text-zinc-600 hover:border-brand-navy hover:text-brand-navy transition-all shadow-sm"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
