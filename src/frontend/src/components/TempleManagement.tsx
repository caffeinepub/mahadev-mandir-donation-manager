import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Save, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Temple } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { DEFAULT_TEMPLE, PREDEFINED_TEMPLATES } from "../types/temple";

interface TempleManagementProps {
  userPasscode: string;
}

export function TempleManagement({ userPasscode }: TempleManagementProps) {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Temple | null>(null);
  const [appeal1, setAppeal1] = useState(DEFAULT_TEMPLE.appeal1);
  const [appeal2, setAppeal2] = useState(DEFAULT_TEMPLE.appeal2);
  const [appeal3, setAppeal3] = useState(DEFAULT_TEMPLE.appeal3);
  const [rules, setRules] = useState(DEFAULT_TEMPLE.rules);
  const [formKey, setFormKey] = useState(0);

  const { data: temples = [], isLoading } = useQuery<Temple[]>({
    queryKey: ["temples"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTemples();
    },
    enabled: !!actor && !isFetching,
  });

  useEffect(() => {
    if (editing) {
      setAppeal1(editing.appeal1);
      setAppeal2(editing.appeal2);
      setAppeal3(editing.appeal3);
      setRules(editing.rules);
    }
  }, [editing]);

  const saveMutation = useMutation({
    mutationFn: async (data: Temple) => {
      if (!actor) throw new Error("Actor not ready");
      const isMasterPin =
        userPasscode === "Shankar@123" || userPasscode === "1234";
      if (editing) {
        if (isMasterPin) {
          await actor.updateTempleWithPin(data, userPasscode);
        } else {
          await actor.updateTemple(data);
        }
      } else {
        if (isMasterPin) {
          await actor.addTempleWithPin(data, userPasscode);
        } else {
          await actor.addTemple(data);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["temples"] });
      toast.success("मंदिर सेटअप सुरक्षित!");
      setEditing(null);
      setFormKey((k) => k + 1);
      setAppeal1(DEFAULT_TEMPLE.appeal1);
      setAppeal2(DEFAULT_TEMPLE.appeal2);
      setAppeal3(DEFAULT_TEMPLE.appeal3);
      setRules(DEFAULT_TEMPLE.rules);
    },
    onError: () => toast.error("त्रुटि! पुनः प्रयास करें।"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    const tid = (
      f.elements.namedItem("tid") as HTMLInputElement
    ).value.toUpperCase();
    const tname = (f.elements.namedItem("tname") as HTMLInputElement).value;
    const taddr = (f.elements.namedItem("taddr") as HTMLInputElement).value;
    saveMutation.mutate({
      id: tid,
      name: tname,
      address: taddr,
      appeal1,
      appeal2,
      appeal3,
      rules,
      updatedAt: BigInt(Date.now()),
    });
  };

  const textAreas = [
    {
      label: "Paragraph 1 (अपील 1)",
      val: appeal1,
      set: setAppeal1,
      opts: PREDEFINED_TEMPLATES.appeal1,
      key: "appeal1",
    },
    {
      label: "Paragraph 2 (अपील 2)",
      val: appeal2,
      set: setAppeal2,
      opts: PREDEFINED_TEMPLATES.appeal2,
      key: "appeal2",
    },
    {
      label: "Paragraph 3 (अपील 3)",
      val: appeal3,
      set: setAppeal3,
      opts: PREDEFINED_TEMPLATES.appeal3,
      key: "appeal3",
    },
    {
      label: "सेवा संकल्प",
      val: rules,
      set: setRules,
      opts: PREDEFINED_TEMPLATES.rules,
      key: "rules",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Form card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-muted to-card border-b border-border px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-accent" />
            <h3 className="text-base font-black text-foreground uppercase tracking-tight">
              🏛️ मंदिर मैटर प्रबंधन
            </h3>
          </div>
          {editing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormKey((k) => k + 1);
              }}
              className="text-destructive hover:text-destructive text-xs font-black"
              data-ocid="temple.cancel_button"
            >
              <X className="w-4 h-4 mr-1" /> रद्द
            </Button>
          )}
        </div>

        <form
          key={formKey}
          onSubmit={handleSubmit}
          className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-black text-muted-foreground uppercase">
              मंदिर ID
            </Label>
            <Input
              name="tid"
              required
              placeholder="e.g. SHIVA01"
              defaultValue={editing?.id}
              readOnly={!!editing}
              className="bg-secondary border-border uppercase font-black text-sm focus:border-temple-crimson"
              data-ocid="temple.input"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black text-muted-foreground uppercase">
              मंदिर का नाम
            </Label>
            <Input
              name="tname"
              required
              placeholder="मंदिर का नाम"
              defaultValue={editing?.name}
              className="bg-secondary border-border font-black text-sm focus:border-temple-crimson"
              data-ocid="temple.input"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-black text-muted-foreground uppercase">
              पता
            </Label>
            <Input
              name="taddr"
              required
              placeholder="पूरा पता"
              defaultValue={editing?.address}
              className="bg-secondary border-border font-bold text-sm focus:border-temple-crimson"
              data-ocid="temple.input"
            />
          </div>

          {textAreas.map((item) => (
            <div key={item.key} className="md:col-span-2 space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                  {item.label}
                </Label>
                <select
                  onChange={(e) => {
                    if (e.target.value) item.set(e.target.value);
                  }}
                  className="text-[9px] bg-secondary border border-border px-2 py-1 rounded-lg font-bold outline-none cursor-pointer text-foreground"
                  data-ocid="temple.select"
                >
                  <option value="">-- टेम्पलेट चुनें --</option>
                  {item.opts.map((opt, idx) => (
                    <option key={opt} value={opt}>
                      मैटर {idx + 1}
                    </option>
                  ))}
                </select>
              </div>
              <Textarea
                value={item.val}
                onChange={(e) => item.set(e.target.value)}
                className="w-full h-24 bg-secondary border-border font-bold text-sm focus:border-temple-crimson resize-none"
                placeholder="मैटर लिखें..."
                data-ocid="temple.textarea"
              />
            </div>
          ))}

          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="md:col-span-2 py-5 bg-foreground text-background hover:opacity-90 font-black uppercase tracking-widest text-sm shadow-lg active:scale-95 transition-transform"
            data-ocid="temple.submit_button"
          >
            {saveMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">☸️</span> सुरक्षित हो रहा है...
              </span>
            ) : editing ? (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" /> सुरक्षित
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> रजिस्टर
              </span>
            )}
          </Button>
        </form>
      </div>

      {/* Temple list */}
      {isLoading ? (
        <div
          className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground"
          data-ocid="temple.loading_state"
        >
          <span className="animate-spin text-2xl block mb-2">☸️</span>
          लोड हो रहा है...
        </div>
      ) : (
        <div className="space-y-3">
          {temples.map((temple, idx) => (
            <motion.div
              key={temple.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4 hover:border-temple-crimson/40 transition-colors"
              data-ocid={`temple.item.${idx + 1}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black bg-muted text-muted-foreground px-2 py-1 rounded-md">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-black text-sm text-foreground">
                    {temple.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    ID: {temple.id} • {temple.address}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(temple)}
                className="text-[10px] font-black uppercase border-temple-crimson/40 text-temple-crimson hover:bg-temple-crimson hover:text-white"
                data-ocid={`temple.edit_button.${idx + 1}`}
              >
                संपादित
              </Button>
            </motion.div>
          ))}
          {temples.length === 0 && (
            <div
              className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground"
              data-ocid="temple.empty_state"
            >
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">कोई मंदिर पंजीकृत नहीं है</p>
              <p className="text-xs opacity-60 mt-1">ऊपर फॉर्म से नया मंदिर जोड़ें</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
