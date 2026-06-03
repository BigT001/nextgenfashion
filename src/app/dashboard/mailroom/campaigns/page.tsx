"use client";

import { useEffect, useState } from "react";
import { getCampaignsAction, createAndDispatchCampaignAction } from "@/modules/email/actions/email.actions";
import { format } from "date-fns";
import { Megaphone, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function MailroomCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComposing, setIsComposing] = useState(false);

  // New Campaign Form State
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("CUSTOMERS"); // "ALL", "CUSTOMERS", "SUBSCRIBERS"
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    setLoading(true);
    const res = await getCampaignsAction();
    if (res.success) setCampaigns(res.data);
    setLoading(false);
  }

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");

    const res = await createAndDispatchCampaignAction({
      name,
      subject,
      bodyHtml: body.replace(/\n/g, '<br/>'),
      audience
    });

    setSending(false);

    if (res.success) {
      setIsComposing(false);
      setName("");
      setSubject("");
      setBody("");
      loadCampaigns(); // Reload list
    } else {
      setError(res.error || "Failed to dispatch campaign");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500 font-bold animate-pulse">Loading campaigns...</div>;
  }

  if (isComposing) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="p-4 border-b border-border flex items-center justify-between bg-zinc-50/50">
          <h2 className="text-lg font-bold text-brand-navy">New Broadcast Campaign</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsComposing(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleDispatch} disabled={!name || !subject || !body || sending} className="bg-brand-navy hover:bg-brand-navy/90 text-white">
              {sending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Megaphone className="size-4 mr-2" />}
              {sending ? "Dispatching..." : "Dispatch Campaign"}
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Internal Campaign Name</label>
              <Input 
                placeholder="e.g. Summer Flash Sale" 
                value={name} onChange={(e) => setName(e.target.value)} disabled={sending}
                className="text-base h-12"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Target Audience</label>
              <select 
                value={audience} 
                onChange={(e) => setAudience(e.target.value)} 
                disabled={sending}
                className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="ALL">All Contacts (Customers & Subscribers)</option>
                <option value="CUSTOMERS">Registered Customers Only</option>
                <option value="SUBSCRIBERS">Newsletter Subscribers Only</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email Subject</label>
            <Input 
              placeholder="Sale starts now!" 
              value={subject} onChange={(e) => setSubject(e.target.value)} disabled={sending}
              className="text-base h-12 font-semibold"
            />
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-h-[250px]">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email Body (HTML/Text)</label>
            <Textarea 
              placeholder="Write your marketing email here..." 
              value={body} onChange={(e) => setBody(e.target.value)} disabled={sending}
              className="flex-1 resize-none p-4 text-base"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white">
      <div className="p-4 border-b border-border flex items-center justify-between bg-zinc-50/50">
        <h2 className="text-lg font-bold text-brand-navy">Broadcast Campaigns</h2>
        <Button onClick={() => setIsComposing(true)} className="bg-brand-navy hover:bg-brand-navy/90 text-white rounded-lg">
          <Plus className="size-4 mr-2" />
          New Campaign
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-4">
            <div className="size-16 rounded-full bg-zinc-50 flex items-center justify-center border border-dashed border-zinc-300">
              <Megaphone className="size-6 text-zinc-300" />
            </div>
            <p className="font-bold text-zinc-500">No campaigns yet</p>
            <p className="text-sm">Create a broadcast to reach all your customers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((camp) => (
              <div key={camp.id} className="border border-border rounded-xl p-5 hover:border-brand-navy/30 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black text-brand-navy">{camp.name}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                    camp.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {camp.status}
                  </span>
                </div>
                <p className="text-sm font-semibold text-zinc-700 mb-1 truncate">Subj: {camp.subject}</p>
                <p className="text-xs text-zinc-500 mb-4">Audience: {camp.audience}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-xs text-zinc-400 font-bold uppercase">Sent</p>
                    <p className="text-lg font-black text-brand-navy">{camp.totalSent}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-400 font-bold uppercase">Opened</p>
                    <p className="text-lg font-black text-brand-navy">{camp.totalOpened}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-400 font-bold uppercase">Date</p>
                    <p className="text-xs font-bold text-zinc-600 mt-1">
                      {camp.createdAt ? format(new Date(camp.createdAt), "MMM d") : "-"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
