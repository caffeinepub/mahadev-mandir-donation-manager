import { Toaster } from "@/components/ui/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  FileText,
  LogOut,
  Settings,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Donation, Temple } from "./backend.d";
import { DonationForm } from "./components/DonationForm";
import { Ledger } from "./components/Ledger";
import { LoginScreen } from "./components/LoginScreen";
import { ReasonPrompt } from "./components/ReasonPrompt";
import { ReceiptPreview } from "./components/ReceiptPreview";
import { TempleManagement } from "./components/TempleManagement";
import { UserManagement } from "./components/UserManagement";
import { useActor } from "./hooks/useActor";
import type { UserSession } from "./types/temple";
import {
  DEFAULT_PASS,
  DEFAULT_TEMPLE,
  MASTER_RECOVERY_PASS,
  SESSION_KEY,
} from "./types/temple";

type TabId = "temples" | "volunteers" | "form" | "ledger";

type ReasonModalState =
  | { type: "delete"; data: Donation }
  | { type: "edit"; data: { oldData: Donation; newData: Donation } }
  | null;

function AppShell() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [tab, setTab] = useState<TabId>("form");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [previewDonation, setPreviewDonation] = useState<Donation | null>(null);
  const [editTarget, setEditTarget] = useState<Donation | null>(null);
  const [reasonModal, setReasonModal] = useState<ReasonModalState>(null);

  // Online/offline tracking
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Fetch temples (for master + seeding default)
  const { data: temples = [] } = useQuery<Temple[]>({
    queryKey: ["temples"],
    queryFn: async () => {
      if (!actor) return [];
      const list = await actor.getAllTemples();
      // Seed default temple if empty and actor is ready
      if (list.length === 0) {
        try {
          await actor.addTemple(DEFAULT_TEMPLE);
          return [DEFAULT_TEMPLE];
        } catch {
          return [];
        }
      }
      return list;
    },
    enabled: !!actor && !isFetching && !!user,
  });

  // Active temple for current user
  const activeTemple =
    user?.role === "master"
      ? temples[0] || null
      : temples.find((t) => t.id === user?.templeId) || temples[0] || null;

  // Login handler
  const handleLogin = useCallback(
    async (
      id: string,
      pass: string,
      role: "master" | "admin" | "volunteer",
    ) => {
      setIsLoggingIn(true);
      const uid = id.trim().toUpperCase();

      try {
        // Master hardcoded
        if (
          role === "master" &&
          uid === "MASTER" &&
          (pass === MASTER_RECOVERY_PASS || pass === DEFAULT_PASS)
        ) {
          const session: UserSession = {
            name: "मुख्य प्रबंधक",
            id: "MASTER",
            role: "master",
            templeId: DEFAULT_TEMPLE.id,
            passcode: pass,
          };
          setUser(session);
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
          setTab("temples");
          toast.success("स्वागत है, मुख्य प्रबंधक! 🙏");
          setIsLoggingIn(false);
          return;
        }

        // Admin/volunteer — lookup via backend
        if (!actor) {
          toast.error("बैकएंड तैयार नहीं है। कृपया प्रतीक्षा करें।");
          setIsLoggingIn(false);
          return;
        }

        const appUser = await actor.getUser(uid);
        if (!appUser || !appUser.id) {
          toast.error("यूजर नहीं मिला!");
          setIsLoggingIn(false);
          return;
        }

        if (
          pass !== (appUser.passcode || DEFAULT_PASS) &&
          pass !== MASTER_RECOVERY_PASS
        ) {
          toast.error("गलत पासवर्ड!");
          setIsLoggingIn(false);
          return;
        }

        if (appUser.status !== "active") {
          toast.error("यूजर निष्क्रिय है। एडमिन से संपर्क करें।");
          setIsLoggingIn(false);
          return;
        }

        const session: UserSession = {
          name: appUser.name || uid,
          id: uid,
          role: (appUser.role as "admin" | "volunteer") || role,
          templeId: appUser.templeId || DEFAULT_TEMPLE.id,
          passcode: pass,
        };
        setUser(session);
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));

        // Save profile to backend
        try {
          await actor.saveCallerUserProfile({
            name: session.name,
            role: session.role,
            appUserId: session.id,
            templeId: session.templeId,
          });
        } catch {
          // Non-critical
        }

        setTab("form");
        toast.success(`स्वागत है, ${session.name}! 🙏`);
      } catch (err) {
        console.error(err);
        // Offline fallback with recovery pass
        if (
          !isOnline &&
          (pass === MASTER_RECOVERY_PASS || pass === DEFAULT_PASS)
        ) {
          const session: UserSession = {
            name: uid,
            id: uid,
            role,
            templeId: DEFAULT_TEMPLE.id,
            passcode: pass,
          };
          setUser(session);
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
          setTab("form");
          toast.success("ऑफलाइन लॉगिन सफल!");
        } else {
          toast.error("लॉगिन विफल! पुनः प्रयास करें।");
        }
      }

      setIsLoggingIn(false);
    },
    [actor, isOnline],
  );

  // Logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    queryClient.clear();
    toast.info("लॉगआउट सफल।");
  };

  // Delete donation mutation
  const deleteMutation = useMutation({
    mutationFn: async ({
      formattedId,
      reason,
    }: {
      formattedId: string;
      reason: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteDonation(formattedId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      toast.success("रसीद हटा दी गई।");
      setReasonModal(null);
    },
    onError: () => toast.error("त्रुटि! पुनः प्रयास करें।"),
  });

  // Update donation mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      formattedId,
      donation,
      reason,
    }: {
      formattedId: string;
      donation: Donation;
      reason: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateDonation(formattedId, donation, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      toast.success("रसीद अपडेट हो गई।");
      setReasonModal(null);
      setEditTarget(null);
      setTab("ledger");
    },
    onError: () => toast.error("त्रुटि! पुनः प्रयास करें।"),
  });

  const handleReasonConfirm = (reason: string) => {
    if (!reasonModal) return;
    if (reasonModal.type === "delete") {
      deleteMutation.mutate({
        formattedId: reasonModal.data.formattedId,
        reason,
      });
    } else if (reasonModal.type === "edit") {
      updateMutation.mutate({
        formattedId: reasonModal.data.oldData.formattedId,
        donation: reasonModal.data.newData,
        reason,
      });
    }
  };

  // Role panel styles
  const rolePanelClass = {
    master: "bg-role-master border-b-4 border-role-master",
    admin: "bg-role-admin border-b-4 border-role-admin",
    volunteer: "bg-role-volunteer border-b-4 border-role-volunteer",
  }[user?.role || "volunteer"];

  // Tab definitions
  const tabs: {
    id: TabId;
    label: string;
    icon: React.ReactNode;
    roles: string[];
  }[] = [
    {
      id: "temples",
      label: "मैनेजमेंट",
      icon: <Settings className="w-3 h-3" />,
      roles: ["master"],
    },
    {
      id: "volunteers",
      label: "यूजर सेटअप",
      icon: <Users className="w-3 h-3" />,
      roles: ["master", "admin"],
    },
    {
      id: "form",
      label: "रसीद",
      icon: <FileText className="w-3 h-3" />,
      roles: ["master", "admin", "volunteer"],
    },
    {
      id: "ledger",
      label: "रिपोर्ट",
      icon: <BookOpen className="w-3 h-3" />,
      roles: ["master", "admin", "volunteer"],
    },
  ];

  // Show login screen
  if (!user) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        isLoggingIn={isLoggingIn}
        isOnline={isOnline}
      />
    );
  }

  const visibleTabs = tabs.filter((t) => t.roles.includes(user.role));

  return (
    <div className="min-h-screen temple-bg flex flex-col pb-10">
      {/* Navbar */}
      <nav
        className={`${rolePanelClass} text-white p-3 md:p-4 sticky top-0 z-[100] flex justify-between items-center shadow-2xl`}
        style={{
          borderColor:
            user.role === "master"
              ? "oklch(0.78 0.15 85)"
              : user.role === "admin"
                ? "oklch(0.42 0.20 22)"
                : "oklch(0.52 0.18 260)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* User avatar */}
          <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-xl shadow-inner">
            🛕
          </div>
          <div>
            <h1 className="font-black text-[10px] md:text-sm uppercase tracking-tighter line-clamp-1">
              {user.name}{" "}
              <span className="opacity-60">
                (
                {user.role === "master"
                  ? "मुख्य"
                  : user.role === "admin"
                    ? "प्रबंधक"
                    : "सदस्य"}
                )
              </span>
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isOnline ? "dot-online" : "dot-offline"}`}
              />
              <span className="text-[7px] font-black uppercase text-white/60 tracking-widest flex items-center gap-1">
                {isOnline ? (
                  <>
                    <Wifi className="w-2.5 h-2.5" /> Online Synced
                  </>
                ) : (
                  <>
                    <WifiOff className="w-2.5 h-2.5" /> Offline Access
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="bg-destructive p-2 px-3 rounded-xl hover:bg-destructive/80 active:scale-90 transition shadow-lg"
          title="लॉगआउट"
          data-ocid="nav.button"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </nav>

      <div className="max-w-4xl mx-auto w-full p-4 space-y-4">
        {/* Tab nav */}
        <div className="flex gap-1.5 bg-card p-1 rounded-2xl shadow-inner overflow-x-auto no-scrollbar border border-border">
          {visibleTabs.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center justify-center gap-1.5 flex-1 py-3 px-2 rounded-xl font-black text-[9px] uppercase transition-all whitespace-nowrap ${
                tab === t.id
                  ? "bg-foreground text-background shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              data-ocid={`nav.${t.id}.tab`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "temples" && user.role === "master" && (
              <TempleManagement />
            )}
            {tab === "volunteers" && user.role !== "volunteer" && (
              <UserManagement user={user} temples={temples} />
            )}
            {tab === "form" && (
              <DonationForm
                user={user}
                temples={temples}
                activeTemple={activeTemple}
                editTarget={editTarget}
                onCancelEdit={() => setEditTarget(null)}
                onPreview={setPreviewDonation}
                onSaveEdit={(old, next) => {
                  setReasonModal({
                    type: "edit",
                    data: { oldData: old, newData: next },
                  });
                }}
              />
            )}
            {tab === "ledger" && (
              <Ledger
                user={user}
                onPreview={setPreviewDonation}
                onEdit={(d) => {
                  setEditTarget(d);
                  setTab("form");
                }}
                onDelete={(d) => setReasonModal({ type: "delete", data: d })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-8 pb-4 text-center">
        <p className="text-[9px] text-muted-foreground font-bold">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent transition-colors"
          >
            Built with ❤️ using caffeine.ai
          </a>
        </p>
      </footer>

      {/* Modals */}
      {previewDonation && activeTemple && (
        <ReceiptPreview
          data={previewDonation}
          temple={activeTemple}
          onClose={() => setPreviewDonation(null)}
        />
      )}

      {reasonModal && (
        <ReasonPrompt
          type={reasonModal.type}
          onConfirm={handleReasonConfirm}
          onCancel={() => setReasonModal(null)}
        />
      )}

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: '"General Sans", sans-serif',
            fontWeight: 700,
            fontSize: "12px",
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return <AppShell />;
}
