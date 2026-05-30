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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { User, Mail, Phone, MapPin, Trash2, ShieldAlert, Lock, ArrowLeft, KeyRound, MoreVertical } from "lucide-react";
import { updatePatronDetailsAction, archiveCustomerAction, changePatronPasswordAction } from "../actions/customer.actions";
import { signOut } from "next-auth/react";
import { cn, getSignOutRedirectUrl } from "@/lib/utils";

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

type ModalView = "profile" | "password" | "delete" | "confirm-delete";

export function PatronSettingsModal({ isOpen, onClose, patron, onUpdate }: PatronSettingsModalProps) {
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<ModalView>("profile");
    const [deletePassword, setDeletePassword] = useState("");

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

    const handleDeleteAccount = async (password: string) => {
        if (!password || password.trim() === "") {
            toast.error("Please enter your password to confirm deletion.");
            return;
        }
        
        setLoading(true);
        const result = await archiveCustomerAction(patron.id, password);
        if (result.success) {
            toast.success("Account deleted successfully.");
            setDeletePassword("");
            signOut({ callbackUrl: getSignOutRedirectUrl("/") });
        } else {
            toast.error(result.error || "Failed to delete account.");
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if(!open) { setView("profile"); setDeletePassword(""); onClose(); } }}>
            <DialogContent className="max-w-[95vw] sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl max-h-[95vh] overflow-y-auto">
                <div className="bg-brand-mesh h-20 sm:h-28 relative overflow-hidden flex items-center px-4 sm:px-10">
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-3xl" />
                    <DialogHeader className="relative z-10">
                        {view !== "profile" && (
                            <button onClick={() => {
                                if (view === "confirm-delete") {
                                    setView("delete");
                                    setDeletePassword("");
                                } else {
                                    setView("profile");
                                }
                            }} className="absolute -left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-black/5 rounded-full transition-all">
                                <ArrowLeft className="size-4 sm:size-5" />
                            </button>
                        )}
                        <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight">
                            {view === "profile" && "Account Settings"}
                            {view === "password" && "Security Logic"}
                            {view === "delete" && "Account Termination"}
                            {view === "confirm-delete" && "Confirm Account Deletion"}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-600 font-bold uppercase text-[8px] sm:text-[9px] tracking-widest">
                            {view === "profile" && "Global Protocol Management"}
                            {view === "password" && "Credential Authentication"}
                            {view === "delete" && "Identity Deletion Protocol"}
                            {view === "confirm-delete" && "Password Verification Required"}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 bg-white">
                    {view === "profile" && (
                        <form onSubmit={handleSubmitProfile} className="space-y-3 sm:space-y-4">
                            <div className="space-y-3 sm:space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest ml-2 opacity-60">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                                        <Input name="name" defaultValue={patron.name} className="h-10 sm:h-12 pl-12 rounded-xl sm:rounded-2xl bg-zinc-50 border-none font-bold shadow-inner text-sm" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest ml-2 opacity-60">Digital Account</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                                            <Input name="email" type="email" defaultValue={patron.email} className="h-10 sm:h-12 pl-12 rounded-xl sm:rounded-2xl bg-zinc-50 border-none font-bold shadow-inner text-sm" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest ml-2 opacity-60">Mobile Contact</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                                            <Input name="phone" defaultValue={patron.phone} className="h-10 sm:h-12 pl-12 rounded-xl sm:rounded-2xl bg-zinc-50 border-none font-bold shadow-inner text-sm" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest ml-2 opacity-60">Shipping Address</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-4 size-4 text-zinc-400 pointer-events-none" />
                                        <Textarea name="address" defaultValue={patron.address} className="min-h-[60px] max-h-[80px] pl-12 rounded-xl sm:rounded-2xl bg-zinc-50 border-none font-bold shadow-inner text-sm resize-none focus:ring-2 focus:ring-brand-navy/20" placeholder="Enter your complete physical location or delivery address" />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full h-10 sm:h-12 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl sm:rounded-2xl font-black text-[8px] sm:text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-brand-navy/20">
                                {loading ? <LoadingSpinner size="sm" variant="white" /> : "Save Profile Changes"}
                            </Button>

                            <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 px-3 sm:px-4 pb-3 sm:pb-4 border border-zinc-100 bg-zinc-50/50 rounded-2xl sm:rounded-3xl">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="size-1.5 sm:size-2 bg-brand-navy rounded-full animate-pulse" />
                                        <h4 className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-brand-navy">Identity & Security</h4>
                                    </div>
                                    <p className="text-[7px] sm:text-[8px] text-muted-foreground font-medium leading-snug">Update credentials or manage account.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        type="button" 
                                        onClick={() => setView("password")} 
                                        className="h-12 sm:h-13 bg-white border-2 border-zinc-100 hover:border-brand-navy/30 hover:bg-zinc-50 rounded-lg sm:rounded-2xl font-black text-[8px] sm:text-[9px] uppercase tracking-widest transition-all text-brand-navy flex items-center justify-center gap-2 sm:gap-2.5 shadow-sm active:scale-95 flex-1"
                                    >
                                        <Lock className="size-4" />
                                        <span>Change Password</span>
                                    </Button>
                                    <button 
                                        type="button" 
                                        onClick={() => setView("delete")} 
                                        className="p-2 rounded-lg hover:bg-zinc-100 transition-all text-zinc-400 hover:text-red-500 shrink-0"
                                    >
                                        <MoreVertical className="size-5" />
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {view === "password" && (
                        <form onSubmit={handleSubmitPassword} className="space-y-3 sm:space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2 sm:space-y-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest ml-2 opacity-60">Current Secret</Label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                                        <Input name="oldPassword" type="password" required className="h-10 sm:h-12 pl-12 rounded-xl sm:rounded-2xl bg-zinc-50 border-none font-bold shadow-inner text-sm" placeholder="••••••••" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest ml-2 opacity-60">New Security Code</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                                        <Input name="newPassword" type="password" required className="h-10 sm:h-12 pl-12 rounded-xl sm:rounded-2xl bg-zinc-50 border-none font-bold shadow-inner text-sm" placeholder="Min 6 characters" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest ml-2 opacity-60">Confirm New Code</Label>
                                    <div className="relative">
                                        <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                                        <Input name="confirmPassword" type="password" required className="h-10 sm:h-12 pl-12 rounded-xl sm:rounded-2xl bg-zinc-50 border-none font-bold shadow-inner text-sm" placeholder="Re-enter new code" />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full h-10 sm:h-12 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl sm:rounded-2xl font-black text-[8px] sm:text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-brand-navy/20">
                                {loading ? <LoadingSpinner size="sm" variant="white" /> : "Modify Credentials"}
                            </Button>
                        </form>
                    )}

                    {view === "delete" && (
                        <div className="space-y-4 sm:space-y-5 py-3 animate-in fade-in zoom-in duration-300">
                            <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                                <div className="size-14 sm:size-16 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                                    <ShieldAlert className="size-7 sm:size-8" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg sm:text-xl font-black tracking-tight text-red-600">Delete Account?</h3>
                                    <p className="text-zinc-500 text-[10px] sm:text-xs font-medium leading-relaxed px-2">
                                        This will permanently delete your account and all data. Cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button onClick={() => setView("confirm-delete")} className="h-10 sm:h-11 bg-red-600 hover:bg-red-700 text-white rounded-lg sm:rounded-2xl font-black text-[8px] sm:text-[9px] uppercase tracking-widest shadow-xl shadow-red-200">
                                    YES, DELETE MY ACCOUNT
                                </Button>
                                <Button onClick={() => setView("profile")} variant="ghost" className="h-10 sm:h-11 rounded-lg sm:rounded-2xl font-black text-[8px] sm:text-[9px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all">
                                    CANCEL
                                </Button>
                            </div>
                        </div>
                    )}

                    {view === "confirm-delete" && (
                        <form onSubmit={(e) => { e.preventDefault(); handleDeleteAccount(deletePassword); }} className="space-y-3 sm:space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex flex-col items-center text-center space-y-2 pb-3 sm:pb-4 border-b border-red-100">
                                <div className="space-y-1">
                                    <h3 className="text-base sm:text-lg font-black tracking-tight text-red-600">Confirm Your Password</h3>
                                    <p className="text-zinc-500 text-[9px] sm:text-[10px] font-medium leading-relaxed px-2">
                                        Enter password to confirm permanent deletion.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest ml-2 opacity-60">Account Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                                        <Input 
                                            type="password" 
                                            value={deletePassword}
                                            onChange={(e) => setDeletePassword(e.target.value)}
                                            required 
                                            className="h-10 sm:h-12 pl-12 rounded-xl sm:rounded-2xl bg-zinc-50 border-none font-bold shadow-inner text-sm" 
                                            placeholder="••••••••" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button type="submit" disabled={loading || !deletePassword} className="h-10 sm:h-11 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg sm:rounded-2xl font-black text-[8px] sm:text-[9px] uppercase tracking-widest shadow-xl shadow-red-200">
                                    {loading ? <LoadingSpinner size="sm" variant="white" /> : "PERMANENTLY DELETE"}
                                </Button>
                                <Button type="button" onClick={() => { setView("profile"); setDeletePassword(""); }} variant="ghost" className="h-10 sm:h-11 rounded-lg sm:rounded-2xl font-black text-[8px] sm:text-[9px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all">
                                    CANCEL
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
