import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Eye, FileBarChart2, Pencil, Search, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Donation } from "../backend.d";
import { useActor } from "../hooks/useActor";
import type { UserSession } from "../types/temple";

interface LedgerProps {
  user: UserSession;
  onPreview: (d: Donation) => void;
  onEdit: (d: Donation) => void;
  onDelete: (d: Donation) => void;
}

export function Ledger({ user, onPreview, onEdit, onDelete }: LedgerProps) {
  const { actor, isFetching } = useActor();
  const [query, setQuery] = useState("");

  const { data: donations = [], isLoading } = useQuery<Donation[]>({
    queryKey: ["donations", user.templeId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDonationsByTemple(user.templeId);
    },
    enabled: !!actor && !isFetching,
  });

  const sorted = [...donations].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp),
  );

  const filtered = sorted.filter(
    (d) =>
      d.donorName.includes(query.toUpperCase()) ||
      d.formattedId.toLowerCase().includes(query.toLowerCase()),
  );

  const total = filtered.reduce((s, d) => s + Number(d.amount), 0);

  const isAdmin = user.role !== "volunteer";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="खोजें (नाम या रसीद ID)..."
          className="pl-10 bg-card border-border font-bold text-sm uppercase focus:border-temple-crimson"
          data-ocid="ledger.search_input"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
        {/* Header */}
        <div className="px-4 py-3 bg-foreground text-background flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileBarChart2 className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              📜 खाता रिपोर्ट
            </span>
          </div>
          <span className="text-[10px] font-black text-accent uppercase tracking-wider">
            कुल: ₹{total.toLocaleString("en-IN")}
          </span>
        </div>

        {isLoading ? (
          <div
            className="p-12 text-center text-muted-foreground"
            data-ocid="ledger.loading_state"
          >
            <span className="animate-spin text-3xl block mb-3">☸️</span>
            <p className="text-sm font-bold">डेटा लोड हो रहा है...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="p-12 text-center text-muted-foreground"
            data-ocid="ledger.empty_state"
          >
            <FileBarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold">
              {query ? "कोई परिणाम नहीं मिला" : "कोई रसीद नहीं है"}
            </p>
            <p className="text-xs opacity-60 mt-1">
              {query ? "अलग शब्द से खोजें" : "रसीद टैब से नई रसीद जोड़ें"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full text-[10px] font-black uppercase text-center"
              data-ocid="ledger.table"
            >
              <thead className="bg-muted border-b border-border">
                <tr className="h-10">
                  <th className="px-3 text-muted-foreground">#</th>
                  <th className="px-2 text-muted-foreground">ID / समय</th>
                  <th className="px-2 text-left text-muted-foreground">
                    विवरण
                  </th>
                  <th className="px-2 text-muted-foreground">राशि</th>
                  <th className="px-3 text-muted-foreground">क्रिया</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((d, idx) => (
                  <motion.tr
                    key={d.formattedId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="h-14 hover:bg-muted/50 transition-colors"
                    data-ocid={`ledger.row.${idx + 1}`}
                  >
                    <td className="px-3">
                      <span className="text-[9px] font-black bg-muted text-muted-foreground px-2 py-0.5 rounded">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-2">
                      <div className="text-temple-crimson font-black text-[9px]">
                        #{d.formattedId}
                      </div>
                      <div className="text-[7px] text-muted-foreground font-bold">
                        {d.time}
                      </div>
                    </td>
                    <td className="px-2 text-left max-w-[130px]">
                      <div className="font-black text-foreground text-[10px] truncate">
                        {d.donorName}
                      </div>
                      <div className="text-[7px] text-accent italic truncate">
                        ॥ {d.event || "दान"} ॥
                      </div>
                    </td>
                    <td className="px-2">
                      <span className="text-emerald-400 font-black">
                        ₹{Number(d.amount).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onPreview(d)}
                          className="bg-blue-600 text-white p-1.5 rounded-lg text-[8px] hover:bg-blue-500 active:scale-90 transition-all shadow-sm"
                          title="रसीद देखें"
                          data-ocid={`ledger.item.${idx + 1}`}
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(d)}
                          className="bg-amber-600 text-white p-1.5 rounded-lg hover:bg-amber-500 active:scale-90 transition-all shadow-sm"
                          title="सुधार"
                          data-ocid={`ledger.edit_button.${idx + 1}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => onDelete(d)}
                            className="bg-destructive/20 text-destructive p-1.5 rounded-lg hover:bg-destructive hover:text-white active:scale-90 transition-all"
                            title="हटाएं"
                            data-ocid={`ledger.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
