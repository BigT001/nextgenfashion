"use client";

import { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { User, Mail, Phone, MapPin, Trash2, ShieldAlert, Lock, ArrowLeft, KeyRound } from "lucide-react";
import { updatePatronDetailsAction, archiveCustomerAction, changePatronPasswordAction } from "../actions/customer.actions";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface PatronSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    patron: {
        id: string;
        name: string;
        email: string;
        phone: string;
        address?: string;
    };
    onUpdate: () => void;
}

type ModalView = "profile" | "password" | "delete";

export function PatronSettingsModal({ isOpen, onClose, patron, onUpdate }: PatronSettingsModalProps) {
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<ModalView>("profile");

    const handleSubmitProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await updatePatronDetailsAction({
            customerId: patron.id,
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            address: formData.get("address") as string,
        });

        if (result.success) {
            toast.success("Account details updated successfully.");
            onUpdate();
            onClose();
        } else {
            toast.error(result.error || "Failed to update account.");
        }
        setLoading(false);
    };

    const handleSubmitPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const oldPassword = formData.get("oldPassword") as string;
        const newPassword = formData.get("newPassword") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match.");
            setLoading(false);
            return;
        }

        const result = await changePatronPasswordAction({
            customerId: patron.id,
            oldPassword,
            newPassword,
        });

        if (result.success) {
            toast.success("Security credentials modified successfully.");
            setView("profile");
        } else {
            toast.error(result.error || "Failed to update password.");
        }
        setLoading(false);
    };

    const handleDeleteAccount = async () => {
        setLoading(true);
        const result = await archiveCustomerAction(patron.id);
        if (result.success) {
            toast.success("Account archived successfully.");
            signOut({ callbackUrl: "/" });
        } else {
            toast.error(result.error || "Failed to archive account.");
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if(!open) { setView("profile"); onClose(); } }}>
            <DialogContent className="max-w-[500px] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
                <div className="bg-brand-mesh h-32 relative overflow-hidden flex items-center px-10">
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-3xl" />
                    <DialogHeader className="relative z-10">
                        {view !== "profile" && (
                            <button onClick={() => setView("profile")} className="absolute -left-6 top-1/2 -translate-y-1/2 p-2 hover:bg-black/5 rounded-full transition-all">
                                <ArrowLeft className="size-5" />
                            </button>
                        )}
                        <DialogTitle className="text-3xl font-black tracking-tight">
                            {view === "profile" && "Account Settings"}
                            {view === "password" && "Security Logic"}
                            {view === "delete" && "Account Termination"}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-600 font-bold uppercase text-[9px] tracking-widest">
                            {view === "profile" && "Global Protocol Management"}
                            {view === "password" && "Credential Authentication"}
                            {view === "delete" && "Identity Deletion Protocol"}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-10 space-y-8 bg-white">
                    {view === "profile" && (
                        <form onSubmit={handleSubmitProfile} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-2 opacity-60">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                                        <Input name="name" defaultValue={patron.name} className="h-14 pl-12 rounded-2xl bg-zinc-50 border-none font-bold shadow-inner" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-2 opacity-60">Digital Account</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                                            <Input name="email" type="email" defaultValue={patron.email} className="h-14 pl-12 rounded-2xl bg-zinc-50 border-none font-bold shadow-inner" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest ml-2 opacity-60">Mobile Contact</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                                            <Input name="phone" defaultValue={patron.phone} className="h-14 pl-12 rounded-2xl bg-zinc-50 border-none font-bold shadow-inner" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-2 opacity-60">Shipping Address</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                                        <Input name="address" defaultValue={patron.address} className="h-14 pl-12 rounded-2xl bg-zinc-50 border-none font-bold shadow-inner" placeholder="Enter physical location" />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full h-14 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-brand-navy/20">
                                {loading ? <LoadingSpinner size="sm" variant="white" /> : "Save Profile Changes"}
                            </Button>

                            <div className="space-y-4 pt-6 px-6 pb-6 border border-zinc-100 bg-zinc-50/50 rounded-3xl">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 bg-brand-navy rounded-full animate-pulse" />
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-navy">Identity & Security</h4>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground font-medium">Update your security credentials or manage account status.</p>
                                </div>
                                <div className="flex gap-3">
                                    <Button 
                                        type="button" 
                                        onClick={() => setView("password")} 
                                        className="flex-1 h-14 bg-white border-2 border-zinc-100 hover:border-brand-navy/30 hover:bg-zinc-50 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-brand-navy flex items-center justify-center gap-3 shadow-sm active:scale-95"
                                    >
                                        <Lock className="size-4" />
                                        Change Account Password
                                    </Button>
                                    <Button 
                                        type="button" 
                                        onClick={() => setView("delete")} 
                                        variant="outline" 
                                        className="size-14 rounded-2xl border-none bg-red-50 text-red-500 hover:bg-red-100 transition-all flex-shrink-0 flex items-center justify-center shadow-sm active:scale-95"
                                    >
                                        <Trash2 className="size-5" />
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}

                    {view === "password" && (
                        <form onSubmit={handleSubmitPassword} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-2 opacity-60">Current Secret</Label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                                        <Input name="oldPassword" type="password" required className="h-14 pl-12 rounded-2xl bg-zinc-50 border-none font-bold shadow-inner" placeholder="••••••••" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-2 opacity-60">New Security Code</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                                        <Input name="newPassword" type="password" required className="h-14 pl-12 rounded-2xl bg-zinc-50 border-none font-bold shadow-inner" placeholder="Min 6 characters" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-2 opacity-60">Confirm New Code</Label>
                                    <div className="relative">
                                        <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                                        <Input name="confirmPassword" type="password" required className="h-14 pl-12 rounded-2xl bg-zinc-50 border-none font-bold shadow-inner" placeholder="Re-enter new code" />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full h-14 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-brand-navy/20">
                                {loading ? <LoadingSpinner size="sm" variant="white" /> : "Modify Credentials"}
                            </Button>
                        </form>
                    )}

                    {view === "delete" && (
                        <div className="space-y-8 py-4 animate-in fade-in zoom-in duration-300">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="size-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                                    <ShieldAlert className="size-10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black tracking-tight text-red-600">Archive Account?</h3>
                                    <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                                        This action will archive your purchase history and personal data.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button onClick={handleDeleteAccount} disabled={loading} className="h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-200">
                                    {loading ? <LoadingSpinner size="sm" variant="white" /> : "YES, ARCHIVE MY ACCOUNT"}
                                </Button>
                                <Button onClick={() => setView("profile")} variant="ghost" className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all">
                                    CANCEL
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
