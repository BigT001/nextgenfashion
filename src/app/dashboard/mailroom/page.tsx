"use client";

import { useEffect, useState } from "react";
import { getInboxMessagesAction, deleteMessageAction } from "@/modules/email/actions/email.actions";
import { markNotificationAsReadAction } from "@/modules/dashboard/actions/notifications.actions";
import { format } from "date-fns";
import { MailOpen, Inbox, Search, Trash2, CornerUpLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function MailroomInboxPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this email?")) return;
    try {
      const res = await deleteMessageAction(id);
      if (res.success) {
        toast.success("Email deleted successfully");
        setMessages((prev) => prev.filter((m) => m.id !== id));
        setSelectedMessage(null);
        // Dispatch custom events to notify layout and navbar counts
        window.dispatchEvent(new Event("mailroom_updated"));
        window.dispatchEvent(new Event("notifications_updated"));
      } else {
        toast.error(res.error || "Failed to delete email");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  const handleSelectMessage = async (msg: any) => {
    setSelectedMessage(msg);
    if (msg.status !== "OPENED") {
      try {
        // Optimistically update local state status to read
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status: "OPENED" } : m))
        );

        // Save to localStorage read list so Navbar doesn't show it as unread on mount/refetch
        const saved = localStorage.getItem("read_notifications");
        let readIds: string[] = [];
        if (saved) {
          try {
            readIds = JSON.parse(saved);
          } catch {}
        }
        if (!readIds.includes(`email-${msg.id}`)) {
          readIds.push(`email-${msg.id}`);
          localStorage.setItem("read_notifications", JSON.stringify(readIds));
        }

        // Trigger updates in database and dispatch custom events
        await markNotificationAsReadAction(`email-${msg.id}`);
        window.dispatchEvent(new Event("notifications_updated"));
        window.dispatchEvent(new Event("mailroom_updated"));
      } catch (err) {
        console.error("Failed to mark message as opened:", err);
      }
    }
  };

  useEffect(() => {
    async function load() {
      const res = await getInboxMessagesAction();
      if (res.success) {
        setMessages(res.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-zinc-500 font-bold animate-pulse">Loading inbox...</div>;
  }

  return (
    <div className="flex h-[600px] divide-x divide-border">
      {/* List Pane */}
      <div className="w-1/3 flex flex-col bg-zinc-50/50">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <Input placeholder="Search inbox..." className="pl-9 bg-white" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-8 text-center space-y-3">
              <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center">
                <Inbox className="size-6" />
              </div>
              <p className="font-bold">Your inbox is empty</p>
              <p className="text-xs">Incoming messages will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={cn(
                    "w-full text-left p-4 hover:bg-zinc-100 transition-colors relative",
                    selectedMessage?.id === msg.id
                      ? "bg-zinc-100 border-l-4 border-l-brand-navy"
                      : "border-l-4 border-l-transparent"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={cn(
                      "text-sm text-brand-navy truncate pr-2 flex items-center gap-1.5",
                      msg.status !== "OPENED" ? "font-extrabold animate-fade-in" : "font-semibold"
                    )}>
                      {msg.status !== "OPENED" && (
                        <span className="size-2 rounded-full bg-rose-500 shrink-0 inline-block animate-pulse" title="Unread" />
                      )}
                      {msg.fromEmail}
                    </span>
                    <span className="text-xs text-zinc-500 whitespace-nowrap">
                      {format(new Date(msg.createdAt), "MMM d")}
                    </span>
                  </div>
                  <h4 className={cn(
                    "text-sm truncate",
                    msg.status !== "OPENED" ? "font-bold text-zinc-900" : "font-medium text-zinc-600"
                  )}>
                    {msg.subject}
                  </h4>
                  <p className="text-xs text-zinc-500 truncate mt-1">
                    {msg.bodyText || "No preview available"}
                  </p>
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
                  <div className="size-10 rounded-full bg-brand-navy/10 flex items-center justify-center text-brand-navy font-bold">
                    {selectedMessage.fromEmail.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{selectedMessage.fromEmail}</p>
                    <p className="text-xs text-zinc-500">to {selectedMessage.toEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-500 mr-2">
                    {format(new Date(selectedMessage.createdAt), "PPP 'at' p")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const subjectLine = selectedMessage.subject.startsWith("Re:") 
                        ? selectedMessage.subject 
                        : `Re: ${selectedMessage.subject}`;
                      router.push(`/dashboard/mailroom/compose?to=${encodeURIComponent(selectedMessage.fromEmail)}&subject=${encodeURIComponent(subjectLine)}&threadId=${encodeURIComponent(selectedMessage.threadId || selectedMessage.id)}`);
                    }}
                    className="text-zinc-500 hover:text-brand-navy hover:bg-zinc-50 rounded-xl"
                    title="Reply to customer"
                  >
                    <CornerUpLeft className="size-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                    title="Delete email"
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
            <div className="p-4 border-t border-border bg-zinc-50 flex justify-center">
              <Button
                onClick={() => {
                  const subjectLine = selectedMessage.subject.startsWith("Re:") 
                    ? selectedMessage.subject 
                    : `Re: ${selectedMessage.subject}`;
                  router.push(`/dashboard/mailroom/compose?to=${encodeURIComponent(selectedMessage.fromEmail)}&subject=${encodeURIComponent(subjectLine)}&threadId=${encodeURIComponent(selectedMessage.threadId || selectedMessage.id)}`);
                }}
                className="bg-brand-navy hover:bg-brand-navy/90 text-white rounded-lg px-6 flex items-center gap-2 font-bold"
              >
                <CornerUpLeft className="size-4" />
                <span>Reply to Customer</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-4">
            <div className="size-16 rounded-full bg-zinc-50 flex items-center justify-center border border-dashed border-zinc-300">
              <MailOpen className="size-8 text-zinc-300" />
            </div>
            <p className="font-bold text-zinc-500">Select a message to read</p>
          </div>
        )}
      </div>
    </div>
  );
}
