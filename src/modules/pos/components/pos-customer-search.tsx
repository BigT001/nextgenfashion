"use client";

import { useState, useEffect } from "react";
import { Search, User, X, Check, UserPlus } from "lucide-react";
import { usePOSStore } from "@/modules/pos/store/pos.store";
import { searchCustomersAction } from "@/modules/customers/actions/customer.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createPOSCustomerAction } from "@/modules/customers/actions/customer.actions";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function POSCustomerSearch() {
  const { customer, setCustomer } = usePOSStore();
  const [open, setOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // New Customer State
  const [isCreating, setIsCreating] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: ""
  });

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.email || !newCustomer.phone) {
        toast.error("Please fill all required fields");
        return;
    }

    setIsCreating(true);
    const result = await createPOSCustomerAction(newCustomer);
    setIsCreating(false);

    if (result.success) {
        const data = (result as any).data;
        toast.success("Customer created and linked successfully");
        setCustomer({
            id: data.id,
            name: newCustomer.name,
            email: newCustomer.email,
            phone: newCustomer.phone
        });
        setAddDialogOpen(false);
        setNewCustomer({ name: "", email: "", phone: "" });
    } else {
        toast.error((result as any).error || "Failed to create customer");
    }
  };

  useEffect(() => {
    if (!open) return;
    
    const fetchCustomers = async () => {
      setIsLoading(true);
      const result = await searchCustomersAction(query);
      if (result.success) {
        setCustomers(result.data || []);
      }
      setIsLoading(false);
    };

    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [query, open]);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger 
            render={(props) => (
                <Button
                    {...props}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="flex-1 justify-between h-14 px-5 rounded-2xl border-none bg-white dark:bg-zinc-950 shadow-sm hover:bg-zinc-50 transition-all font-bold text-sm"
                >
                    {customer ? (
                    <div className="flex items-center gap-3">
                        <div className="size-7 rounded-full bg-brand-navy text-white flex items-center justify-center text-[10px]">
                            {customer.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="truncate">{customer.name}</span>
                    </div>
                    ) : (
                    <span className="text-muted-foreground flex items-center gap-3">
                        <Search className="size-4 opacity-50" />
                        Type customer name...
                    </span>
                    )}
                    <div className="flex items-center gap-2">
                        {customer && (
                            <div 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCustomer(null);
                                }}
                                className="p-1 hover:bg-zinc-200 rounded-md"
                            >
                                <X className="size-3 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                </Button>
            )}
        />
        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] glass-card border-none shadow-2xl rounded-2xl overflow-hidden" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
                placeholder="Search database..." 
                value={query}
                onValueChange={setQuery}
                className="h-12 border-none focus:ring-0"
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty className="p-4 text-center">
                <p className="text-xs text-muted-foreground font-medium mb-3">No patron found in records.</p>
                <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-9 rounded-xl gap-2 text-[10px] font-black uppercase tracking-widest border-dashed"
                    onClick={() => {
                        setOpen(false);
                        setAddDialogOpen(true);
                    }}
                >
                    <UserPlus className="size-3" />
                    Add New Customer
                </Button>
              </CommandEmpty>
              <CommandGroup>
                {customers.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.id}
                    onSelect={() => {
                      setCustomer({
                        id: c.id,
                        name: c.name,
                        email: c.email,
                        phone: c.phone
                      });
                      setOpen(false);
                    }}
                    className="p-3 cursor-pointer flex items-center justify-between group rounded-xl mx-2 my-1"
                  >
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">{c.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{c.phone || c.email || "No contact info"}</span>
                    </div>
                    {customer?.id === c.id && <Check className="size-4 text-brand-navy" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogTrigger render={(props) => (
            <Button 
                {...props}
                size="icon" 
                className="h-14 w-14 rounded-2xl bg-brand-navy/5 text-brand-navy hover:bg-brand-navy/10 border-none shrink-0"
            >
                <UserPlus className="size-5" />
            </Button>
        )} />
        <DialogContent className="max-w-md rounded-[2rem] glass-card border-none p-8">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">Register New Patron</DialogTitle>
                <p className="text-xs text-muted-foreground font-medium">Quickly add a customer to the CRM. Default password: <span className="font-bold text-brand-navy">123456</span></p>
            </DialogHeader>
            <form onSubmit={handleAddCustomer} className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                    <Input 
                        placeholder="John Doe" 
                        className="h-12 rounded-xl border-zinc-200" 
                        required
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address</Label>
                    <Input 
                        type="email" 
                        placeholder="john@example.com" 
                        className="h-12 rounded-xl border-zinc-200" 
                        required
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                    <Input 
                        placeholder="+234..." 
                        className="h-12 rounded-xl border-zinc-200" 
                        required
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    />
                </div>
                <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl bg-brand-navy text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-navy/20"
                    disabled={isCreating}
                >
                    {isCreating ? <LoadingSpinner size="sm" variant="white" /> : "Link & Save Customer"}
                </Button>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
