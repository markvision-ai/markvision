import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { AIAssistant } from "@/components/analytics/AIAssistant";
import { cn } from "@/lib/utils";

interface FloatingChatProps {
  context: {
    spend: number;
    impressions: number;
    clicks: number;
    leads: number;
    visits: number;
    sales: number;
    revenue: number;
    romi: number;
    projectId?: string;
  };
}

export const AIFloatingChat = ({ context }: FloatingChatProps) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="default" size="lg" className={cn("gap-2 rounded-full shadow-md hover:shadow-lg transition-all")}>
            <Bot className="w-5 h-5" />
            AI Ассистент
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="sm:max-w-md w-full h-[80vh]">
          <div className="h-full">
            <AIAssistant hideDashboard context={context} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
