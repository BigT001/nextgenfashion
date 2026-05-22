import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Loading() {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Loading...</p>
    </div>
  );
}
