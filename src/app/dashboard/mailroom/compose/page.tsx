"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sendDirectEmailAction } from "@/modules/email/actions/email.actions";
import { Send, ArrowLeft, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ComposeEmailPage() {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const toParam = params.get("to");
      const subjectParam = params.get("subject");
      if (toParam) setTo(toParam);
      if (subjectParam) setSubject(subjectParam);
    }
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await sendDirectEmailAction({
      to,
      subject,
      html: body.replace(/\n/g, '<br/>'), // Basic text to HTML conversion
    });

    setLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/mailroom/sent");
      }, 1500);
    } else {
      setError(res.error || "Failed to send email");
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white">
      <div className="p-4 border-b border-border flex items-center justify-between bg-zinc-50/50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-zinc-500 hover:text-brand-navy">
            <ArrowLeft className="size-5" />
          </Button>
          <h2 className="text-lg font-bold text-brand-navy">Compose Message</h2>
        </div>
        <Button 
          onClick={handleSend} 
          disabled={!to || !subject || !body || loading || success}
          className="bg-brand-navy hover:bg-brand-navy/90 text-white rounded-lg px-6"
        >
          {loading ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : success ? (
            "Sent!"
          ) : (
            <Send className="size-4 mr-2" />
          )}
          {loading ? "Sending..." : success ? "Message Sent" : "Send Email"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">To (Recipient Email)</label>
          <Input 
            type="email"
            placeholder="customer@example.com" 
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="text-base h-12"
            disabled={loading || success}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Subject</label>
          <Input 
            type="text"
            placeholder="Message subject..." 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="text-base h-12 font-semibold"
            disabled={loading || success}
          />
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-h-[300px]">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex justify-between">
            <span>Message Body</span>
            <span className="text-zinc-400 font-normal normal-case tracking-normal">Sent from support@nextgenkiddies.com</span>
          </label>
          <Textarea 
            placeholder="Type your message here..." 
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-1 resize-none p-4 text-base"
            disabled={loading || success}
          />
        </div>
        
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
            <Info className="size-5 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-800">
              Emails sent from here will appear to the customer as coming from <span className="font-bold">support@nextgenkiddies.com</span>. When they reply, their message will be delivered to your official email client.
            </p>
        </div>
      </div>
    </div>
  );
}
