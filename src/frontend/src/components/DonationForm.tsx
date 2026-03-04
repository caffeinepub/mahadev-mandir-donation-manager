import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Donation, Temple } from "../backend.d";
import { useActor } from "../hooks/useActor";
import type { UserSession } from "../types/temple";
import { PREFS_KEY_PREFIX, TEMPLE_TYPES_DATA } from "../types/temple";

interface DonationFormProps {
  user: UserSession;
  temples: Temple[];
  activeTemple: Temple | null;
  editTarget: Donation | null;
  onCancelEdit: () => void;
  onPreview: (donation: Donation) => void;
  onSaveEdit: (old: Donation, next: Donation) => void;
}

export function DonationForm({
  user,
  temples,
  activeTemple,
  editTarget,
  onCancelEdit,
  onPreview,
  onSaveEdit,
}: DonationFormProps) {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const storedPrefs = (() => {
    try {
      return (
        JSON.parse(
          localStorage.getItem(`${PREFS_KEY_PREFIX}${user.id}`) || "null",
        ) || {
          templeType: "शिव मंदिर",
          donationType: "शिवरात्रि पूजा महोत्सव",
        }
      );
    } catch {
      return { templeType: "शिव मंदिर", donationType: "शिवरात्रि पूजा महोत्सव" };
    }
  })();

  const [templeId, setTempleId] = useState(
    editTarget?.templeId || activeTemple?.id || user.templeId,
  );
  const [templeType, setTempleType] = useState(
    editTarget?.templeType || storedPrefs.templeType,
  );
  const [donationType, setDonationType] = useState(
    editTarget?.event || storedPrefs.donationType,
  );
  const [otherDetail, setOtherDetail] = useState("");
  const [saveDefault, setSaveDefault] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Sync templeId to activeTemple when not editing
  useEffect(() => {
    if (!editTarget && activeTemple) {
      setTempleId(activeTemple.id);
    }
  }, [activeTemple, editTarget]);

  const { data: nextRecNo = BigInt(108) } = useQuery<bigint>({
    queryKey: ["receiptNumber", templeId],
    queryFn: async () => {
      if (!actor) return BigInt(108);
      return actor.getCurrentReceiptNumber(templeId);
    },
    enabled: !!actor && !isFetching && !editTarget,
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      volunteerName: string;
      formattedId: string;
      date: string;
      donorName: string;
      time: string;
      templeType: string;
      event: string;
      address: string;
      templeId: string;
      amount: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const isMasterUser = user.role === "master";
      const masterPin = user.passcode || "1234";
      if (isMasterUser) {
        return actor.createDonationForTemple(data, masterPin);
      }
      return actor.createDonation(data);
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      queryClient.invalidateQueries({ queryKey: ["receiptNumber"] });
      toast.success("रसीद सफलतापूर्वक सुरक्षित!");
      onPreview(created);
      setFormKey((k) => k + 1);
    },
    onError: () => toast.error("त्रुटि! पुनः प्रयास करें।"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    const donorName = (
      f.elements.namedItem("name") as HTMLInputElement
    ).value.toUpperCase();
    const amount = BigInt(
      Number.parseInt(
        (f.elements.namedItem("amount") as HTMLInputElement).value,
      ) || 0,
    );
    const date = (f.elements.namedItem("date") as HTMLInputElement).value;
    const address =
      (f.elements.namedItem("addr") as HTMLInputElement).value ||
      activeTemple?.address ||
      "";
    const finalEvent = donationType === "अन्य" ? otherDetail : donationType;

    if (saveDefault) {
      localStorage.setItem(
        `${PREFS_KEY_PREFIX}${user.id}`,
        JSON.stringify({ templeType, donationType }),
      );
    }

    const recNo = editTarget ? editTarget.recNo : nextRecNo;
    const fmtId = editTarget
      ? editTarget.formattedId
      : `${user.id}/${recNo.toString()}`;
    const time = editTarget
      ? editTarget.time
      : new Date().toLocaleTimeString("hi-IN", { hour12: true }).toUpperCase();

    if (editTarget) {
      const donationData: Donation = {
        volunteerName: user.name,
        formattedId: fmtId,
        date,
        donorName,
        time,
        templeType,
        event: finalEvent,
        address,
        templeId,
        amount,
        recNo,
        timestamp: editTarget.timestamp,
      };
      onSaveEdit(editTarget, donationData);
    } else {
      const createData = {
        volunteerName: user.name,
        formattedId: fmtId,
        date,
        donorName,
        time,
        templeType,
        event: finalEvent,
        address,
        templeId,
        amount,
      };
      createMutation.mutate(createData);
    }
  };

  const events = TEMPLE_TYPES_DATA[templeType] || [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
        {/* Header */}
        <div
          className={`border-b border-border px-6 py-4 flex justify-between items-center ${
            editTarget
              ? "bg-gradient-to-r from-amber-900/30 to-card border-l-4 border-l-amber-500"
              : "bg-gradient-to-r from-muted to-card"
          }`}
        >
          <div className="flex items-center gap-3">
            <FileText
              className={`w-5 h-5 ${editTarget ? "text-amber-400" : "text-accent"}`}
            />
            <h2
              className={`text-base font-black uppercase tracking-tight ${editTarget ? "text-amber-400" : "text-temple-crimson"}`}
            >
              🚩 {editTarget ? "सुधार मोड" : "रसीद प्रविष्टि"}
            </h2>
          </div>
          {editTarget && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelEdit}
              className="text-destructive hover:text-destructive text-xs font-black"
              data-ocid="form.cancel_button"
            >
              <X className="w-4 h-4 mr-1" /> रद्द
            </Button>
          )}
        </div>

        <form key={formKey} onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Temple selector (master only) */}
          {user.role === "master" && (
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                मंदिर चुनें
              </Label>
              <select
                value={templeId}
                onChange={(e) => setTempleId(e.target.value)}
                className="w-full p-3 bg-secondary border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:border-temple-crimson"
                data-ocid="form.select"
              >
                {temples.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Receipt No + Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                रसीद सं०
              </Label>
              <div
                className="p-3 bg-muted border border-border rounded-xl text-center font-black text-temple-crimson text-lg shadow-inner"
                data-ocid="form.input"
              >
                #
                {editTarget
                  ? editTarget.recNo.toString()
                  : nextRecNo.toString()}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                दिनांक
              </Label>
              <Input
                name="date"
                type="date"
                required
                defaultValue={
                  editTarget?.date || new Date().toISOString().split("T")[0]
                }
                className="bg-secondary border-border text-sm focus:border-temple-crimson"
                data-ocid="form.input"
              />
            </div>
          </div>

          {/* Temple type + Donation event */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                मंदिर प्रकार
              </Label>
              <select
                value={templeType}
                onChange={(e) => {
                  setTempleType(e.target.value);
                  setDonationType(TEMPLE_TYPES_DATA[e.target.value][0]);
                }}
                className="w-full p-3 bg-secondary border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:border-temple-crimson"
                data-ocid="form.select"
              >
                {Object.keys(TEMPLE_TYPES_DATA).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                चंदा प्रकार
              </Label>
              <select
                value={donationType}
                onChange={(e) => setDonationType(e.target.value)}
                className="w-full p-3 bg-secondary border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:border-temple-crimson"
                data-ocid="form.select"
              >
                {events.map((ev) => (
                  <option key={ev} value={ev}>
                    {ev}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Other detail */}
          {donationType === "अन्य" && (
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                विवरण
              </Label>
              <Input
                value={otherDetail}
                onChange={(e) => setOtherDetail(e.target.value)}
                placeholder="विस्तृत विवरण लिखें..."
                className="bg-amber-900/20 border-amber-600/40 text-sm focus:border-amber-500"
                data-ocid="form.input"
              />
            </div>
          )}

          {/* Donor name */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
              दानदाता नाम
            </Label>
            <Input
              name="name"
              required
              placeholder="दानदाता का नाम दर्ज करें"
              defaultValue={editTarget?.donorName}
              className="bg-secondary border-border font-black text-base uppercase focus:border-temple-crimson shadow-sm"
              data-ocid="form.input"
            />
          </div>

          {/* Amount + Address row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                राशि (₹)
              </Label>
              <Input
                name="amount"
                type="number"
                min="1"
                required
                placeholder="0"
                defaultValue={editTarget ? editTarget.amount.toString() : ""}
                className="bg-secondary border-border text-xl text-emerald-400 font-black focus:border-emerald-500 shadow-inner"
                data-ocid="form.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                ग्राम/पता
              </Label>
              <Input
                name="addr"
                placeholder="गाँव / शहर"
                defaultValue={editTarget?.address}
                className="bg-secondary border-border text-sm focus:border-temple-crimson"
                data-ocid="form.input"
              />
            </div>
          </div>

          {/* Save as default */}
          <div className="flex items-center gap-2 py-1">
            <Checkbox
              id="saveDefault"
              checked={saveDefault}
              onCheckedChange={(v) => setSaveDefault(!!v)}
              className="border-muted-foreground data-[state=checked]:bg-temple-crimson data-[state=checked]:border-temple-crimson"
              data-ocid="form.checkbox"
            />
            <label
              htmlFor="saveDefault"
              className="text-[9px] text-muted-foreground font-bold cursor-pointer"
            >
              इन विकल्पों को डिफ़ॉल्ट सेट करें
            </label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-6 font-black text-lg uppercase tracking-widest bg-temple-crimson hover:bg-temple-crimson-light text-white shadow-crimson-glow active:scale-95 transition-transform mt-2 border-b-4 border-temple-crimson-dark"
            data-ocid="form.submit_button"
          >
            {createMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">☸️</span> सुरक्षित हो रहा है...
              </span>
            ) : (
              "रसीद सुरक्षित करें ✅"
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
