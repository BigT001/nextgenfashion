"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpandableDescriptionProps {
  text: string;
  characterLimit?: number;
}

export function ExpandableDescription({ text, characterLimit = 280 }: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const previewText = text.substring(0, characterLimit);
  const hasMoreContent = text.length > characterLimit;

  // Find the last complete sentence in preview
  const lastPeriodIndex = previewText.lastIndexOf(".");
  const displayPreview = lastPeriodIndex > 0 ? previewText.substring(0, lastPeriodIndex + 1) : previewText;

  return (
    <div className="space-y-3">
      <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-slate-700">
        {isExpanded ? text : displayPreview}
      </p>

      {hasMoreContent && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 px-0"
        >
          {isExpanded ? "Show Less" : "Read More"}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </Button>
      )}
    </div>
  );
}
