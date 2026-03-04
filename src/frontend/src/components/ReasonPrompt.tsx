import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Check, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface ReasonPromptProps {
  type: "delete" | "edit";
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function ReasonPrompt({ type, onConfirm, onCancel }: ReasonPromptProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (reason.trim().length < 4) {
      toast.error("कम से कम 4 अक्षर का कारण लिखें।");
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/85 z-[8000] flex items-center justify-center p-4 backdrop-blur-sm"
        data-ocid="reason.modal"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl border-t-4 border-t-destructive"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground uppercase">
                पुष्टि आवश्यक
              </h3>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                {type === "delete" ? "हटाने का कारण लिखें" : "सुधार का कारण लिखें"}
              </p>
            </div>
          </div>

          {/* Reason textarea */}
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="कारण लिखें (कम से कम 4 अक्षर)..."
            className="w-full h-24 bg-secondary border-border font-bold text-sm focus:border-destructive resize-none mb-4"
            autoFocus
            data-ocid="reason.textarea"
          />

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleConfirm}
              className="flex-1 py-4 bg-destructive hover:bg-destructive/90 text-white font-black uppercase text-xs tracking-wider shadow-lg active:scale-95 transition-transform"
              data-ocid="reason.confirm_button"
            >
              <Check className="w-4 h-4 mr-1" />
              {type === "delete" ? "हटाएं" : "सुरक्षित"}
            </Button>
            <Button
              onClick={onCancel}
              variant="secondary"
              className="flex-1 py-4 font-black uppercase text-xs tracking-wider active:scale-95 transition-transform"
              data-ocid="reason.cancel_button"
            >
              <X className="w-4 h-4 mr-1" />
              रद्द
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
