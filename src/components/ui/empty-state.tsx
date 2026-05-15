import { LucideIcon, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = FileSearch,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-12 text-center rounded-3xl border-2 border-dashed border-muted-foreground/10 bg-muted/5 animate-slow-fade",
      className
    )}>
      <div className="size-20 bg-brand-navy/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-brand-navy/5">
        <Icon className="size-10 text-brand-navy" />
      </div>
      
      <h3 className="text-2xl font-bold tracking-tight mb-2">
        {title}
      </h3>
      
      <p className="text-muted-foreground max-w-[300px] mb-8 leading-relaxed">
        {description}
      </p>
      
      {action && (
        <Button 
          onClick={action.onClick}
          className="bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-brand-navy/20 transition-all active:scale-95"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
