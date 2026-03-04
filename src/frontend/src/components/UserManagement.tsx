import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Temple } from "../backend.d";
import { useActor } from "../hooks/useActor";
import type { UserSession } from "../types/temple";
import { DEFAULT_PASS } from "../types/temple";

interface UserManagementProps {
  user: UserSession;
  temples: Temple[];
}

export function UserManagement({ user, temples }: UserManagementProps) {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"volunteer" | "admin">("volunteer");
  const [selectedTemple, setSelectedTemple] = useState(
    temples[0]?.id || "NAGNATH01",
  );
  const [formKey, setFormKey] = useState(0);

  const templeIdForQuery =
    user.role === "master" ? selectedTemple : user.templeId;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", templeIdForQuery],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUsersByTemple(templeIdForQuery);
    },
    enabled: !!actor && !isFetching,
  });

  const filteredUsers = users.filter((u) => u.role === mode);

  const addMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      passcode: string;
      role: string;
      templeId: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.addUser(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(
        `${mode === "volunteer" ? "सदस्य" : "एडमिन"} सफलतापूर्वक जोड़ा गया!`,
      );
      setFormKey((k) => k + 1);
    },
    onError: () => toast.error("त्रुटि! पुनः प्रयास करें।"),
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.toggleUserStatus(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("स्थिति अपडेट की गई!");
    },
    onError: () => toast.error("त्रुटि! पुनः प्रयास करें।"),
  });

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    const uid = (f.elements.namedItem("uid") as HTMLInputElement).value
      .trim()
      .toUpperCase();
    const name = (
      f.elements.namedItem("uname") as HTMLInputElement
    ).value.trim();
    const passcode =
      (f.elements.namedItem("upass") as HTMLInputElement).value || DEFAULT_PASS;
    const tid =
      user.role === "master"
        ? (f.elements.namedItem("utid") as HTMLSelectElement).value
        : user.templeId;

    addMutation.mutate({ id: uid, name, passcode, role: mode, templeId: tid });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-muted to-card border-b border-border px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-accent" />
            <h3 className="text-base font-black text-foreground uppercase tracking-tight">
              🧑‍💼 {mode === "volunteer" ? "सदस्य" : "एडमिन"} सेटअप
            </h3>
          </div>

          {/* Mode toggle */}
          <div
            className="flex bg-secondary p-1 rounded-xl"
            data-ocid="users.toggle"
          >
            {(["volunteer", "admin"] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                  mode === m
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid={`users.${m}.tab`}
              >
                {m === "volunteer" ? "Members" : "Admins"}
              </button>
            ))}
          </div>
        </div>

        {/* Add user form */}
        <form
          key={formKey}
          onSubmit={handleAdd}
          className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-muted-foreground uppercase">
              पूरा नाम
            </Label>
            <Input
              name="uname"
              required
              placeholder="नाम दर्ज करें"
              className="bg-secondary border-border font-bold text-sm focus:border-temple-crimson"
              data-ocid="users.input"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-muted-foreground uppercase">
              User ID
            </Label>
            <Input
              name="uid"
              required
              placeholder="यूजर आईडी"
              className="bg-secondary border-border font-black text-sm uppercase focus:border-temple-crimson"
              data-ocid="users.input"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-muted-foreground uppercase">
              Password
            </Label>
            <Input
              name="upass"
              placeholder={`पासवर्ड (डिफ़ॉल्ट: ${DEFAULT_PASS})`}
              className="bg-secondary border-border font-bold text-sm focus:border-temple-crimson"
              data-ocid="users.input"
            />
          </div>

          {user.role === "master" && (
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-muted-foreground uppercase">
                मंदिर
              </Label>
              <select
                name="utid"
                required
                value={selectedTemple}
                onChange={(e) => setSelectedTemple(e.target.value)}
                className="w-full p-2.5 bg-secondary border border-border rounded-lg text-sm font-bold text-foreground focus:outline-none focus:border-temple-crimson"
                data-ocid="users.select"
              >
                {temples.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            type="submit"
            disabled={addMutation.isPending}
            className="sm:col-span-2 lg:col-span-4 py-4 font-black uppercase text-sm tracking-widest bg-foreground text-background hover:opacity-90 shadow-lg active:scale-95 transition-transform"
            data-ocid="users.submit_button"
          >
            {addMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">☸️</span> जोड़ा जा रहा है...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> जोड़ें
              </span>
            )}
          </Button>
        </form>

        {/* User list */}
        <div className="border-t border-border mx-0">
          {isLoading ? (
            <div
              className="p-8 text-center text-muted-foreground"
              data-ocid="users.loading_state"
            >
              <span className="animate-spin text-2xl block mb-2">☸️</span>
              लोड हो रहा है...
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto no-scrollbar divide-y divide-border">
              {filteredUsers.map((u, idx) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
                  data-ocid={`users.item.${idx + 1}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black bg-muted text-muted-foreground px-2 py-0.5 rounded">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-black text-foreground uppercase">
                        {u.name}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-bold">
                        ID: {u.id} • {u.templeId}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleMutation.mutate(u.id)}
                    disabled={toggleMutation.isPending}
                    className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all active:scale-90 ${
                      u.status === "active"
                        ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                        : "bg-destructive/15 text-destructive hover:bg-destructive/25"
                    }`}
                    data-ocid={`users.toggle.${idx + 1}`}
                  >
                    {u.status === "active" ? "✓ Active" : "✕ Inactive"}
                  </button>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div
                  className="p-8 text-center text-muted-foreground"
                  data-ocid="users.empty_state"
                >
                  <p className="text-sm font-bold">
                    कोई {mode === "volunteer" ? "सदस्य" : "एडमिन"} नहीं
                  </p>
                  <p className="text-xs opacity-60 mt-1">ऊपर फॉर्म से जोड़ें</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
