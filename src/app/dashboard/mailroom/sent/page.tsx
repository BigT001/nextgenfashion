"use client";

import { useEffect, useState } from "react";
import { getSentMessagesAction, deleteMessageAction } from "@/modules/email/actions/email.actions";
import { format } from "date-fns";
import { Send, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MailroomSentPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sent email?")) return;
    try {
      const res = await deleteMessageAction(id);
      if (res.success) {
        toast.success("Email deleted successfully");
        setMessages((prev) => prev.filter((m) => m.id !== id));
        setSelectedMessage(null);
        // Dispatch custom events to notify layout
        window.dispatchEvent(new Event("mailroom_updated"));
      } else {
        toast.error(res.error || "Failed to delete email");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  useEffect(() => {
    async function load() {
      const res = await getSentMessagesAction();
      if (res.success) {
        setMessages(res.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-zinc-500 font-bold animate-pulse">Loading sent messages...</div>;
  }

  return (
    <div className="flex h-[600px] divide-x divide-border">
      {/* List Pane */}
      <div className="w-1/3 flex flex-col bg-zinc-50/50">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <Input placeholder="Search sent..." className="pl-9 bg-white" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-8 text-center space-y-3">
              <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center">
                <Send className="size-5" />
              </div>
              <p className="font-bold">No sent messages</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`w-full text-left p-4 hover:bg-zinc-100 transition-colors ${
                    selectedMessage?.id === msg.id ? "bg-zinc-100 border-l-4 border-l-brand-navy" : "border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm text-brand-navy truncate pr-2">To: {msg.toEmail}</span>
                    <span className="text-xs text-zinc-500 whitespace-nowrap">
                      {format(new Date(msg.createdAt), "MMM d")}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-800 truncate">{msg.subject}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        {msg.status}
                    </span>
                    <p className="text-xs text-zinc-500 truncate">
                        {msg.bodyText || "No preview available"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Pane */}
      <div className="w-2/3 flex flex-col bg-white">
        {selectedMessage ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-black text-brand-navy mb-4">{selectedMessage.subject}</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold">
                    {selectedMessage.toEmail.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm">To: {selectedMessage.toEmail}</p>
                    <p className="text-xs text-zinc-500">From {selectedMessage.fromEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-zinc-500">
                    {format(new Date(selectedMessage.createdAt), "PPP 'at' p")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 className="size-5" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {selectedMessage.bodyHtml ? (
                <div 
                  className="prose prose-sm max-w-none text-zinc-700"
                  dangerouslySetInnerHTML={{ __html: selectedMessage.bodyHtml }}
                />
              ) : (
                <div className="whitespace-pre-wrap font-sans text-sm text-zinc-700">
                  {selectedMessage.bodyText || "No content"}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-4">
            <div className="size-16 rounded-full bg-zinc-50 flex items-center justify-center border border-dashed border-zinc-300">
              <Send className="size-6 text-zinc-300" />
            </div>
            <p className="font-bold text-zinc-500">Select a sent message to read</p>
          </div>
        )}
      </div>
    </div>
  );
}
