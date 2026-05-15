"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function StoreSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="hidden md:flex items-center bg-muted/30 rounded-2xl px-4 py-2 glass-card border-none mr-2 group focus-within:ring-1 focus-within:ring-brand-navy transition-all">
      <Search className="size-4 text-muted-foreground group-focus-within:text-brand-navy" />
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Catalogue..." 
        className="bg-transparent border-none focus:ring-0 text-xs font-bold px-3 w-40 placeholder:text-muted-foreground/50 outline-none"
      />
    </form>
  );
}
