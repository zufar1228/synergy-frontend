// frontend/components/ui/copy-button.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface CopyButtonProps {
  textToCopy: string;
}

export const CopyButton = ({ textToCopy }: CopyButtonProps) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    toast.success("ID berhasil disalin ke clipboard!");
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" className="h-6 w-6" onClick={handleCopy}>
            <Copy className="h-3 w-3" />
            <span className="sr-only">Salin ID</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Salin ID</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
