import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn, Wifi, WifiOff } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface LoginScreenProps {
  onLogin: (
    id: string,
    pass: string,
    role: "master" | "admin" | "volunteer",
  ) => Promise<void>;
  isLoggingIn: boolean;
  isOnline: boolean;
}

export function LoginScreen({
  onLogin,
  isLoggingIn,
  isOnline,
}: LoginScreenProps) {
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState<"master" | "admin" | "volunteer">(
    "volunteer",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(id, pass, role);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background overflow-y-auto p-4">
      {/* Gold dot background pattern */}
      <div className="absolute inset-0 gold-dot-pattern opacity-100 pointer-events-none" />

      {/* Radial gradient overlays */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, oklch(0.42 0.20 22 / 0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, oklch(0.72 0.18 55 / 0.08) 0%, transparent 60%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Main card */}
        <div className="bg-card border-2 border-temple-crimson/40 rounded-3xl p-8 shadow-crimson-glow shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-[10px] font-bold text-accent tracking-[0.3em] uppercase mb-3">
              ॥ श्री गणेशाय नमः ॥
            </p>

            {/* Temple icon with pulsing ring */}
            <div className="relative mx-auto w-24 h-24 mb-4">
              <div
                className={`absolute inset-0 rounded-full border-2 ${isOnline ? "border-emerald-500 pulse-online" : "border-temple-crimson pulse-offline"}`}
              />
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-5xl shadow-inner">
                🛕
              </div>
            </div>

            <h1 className="font-display text-3xl font-black text-temple-crimson tracking-tight mb-1">
              System Login
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              {isOnline ? (
                <Wifi className="w-3 h-3 text-emerald-400" />
              ) : (
                <WifiOff className="w-3 h-3 text-temple-crimson" />
              )}
              <span
                className={`text-[9px] font-bold uppercase tracking-widest ${isOnline ? "text-emerald-400" : "text-temple-crimson"}`}
              >
                {isOnline ? "Cloud Sync Enabled" : "Authorized Offline Login"}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                भूमिका (Role)
              </Label>
              <div
                className="grid grid-cols-3 gap-1 p-1 bg-secondary rounded-xl"
                data-ocid="login.select"
              >
                {(
                  [
                    { val: "volunteer", label: "सदस्य", icon: "🧑‍💼" },
                    { val: "admin", label: "प्रबंधक", icon: "🛡️" },
                    { val: "master", label: "मुख्य", icon: "👑" },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.val}
                    type="button"
                    onClick={() => setRole(r.val)}
                    className={`py-2 px-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                      role === r.val
                        ? "bg-temple-crimson text-white shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="text-sm mb-0.5">{r.icon}</div>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* User ID */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                User ID
              </Label>
              <Input
                value={id}
                onChange={(e) => setId(e.target.value.toUpperCase())}
                placeholder="यूजर आईडी दर्ज करें"
                required
                className="bg-secondary border-border text-center font-black text-sm uppercase tracking-widest placeholder:text-muted-foreground/50 focus:border-temple-crimson focus:ring-temple-crimson/20"
                data-ocid="login.input"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  name="pwd"
                  placeholder="पासवर्ड"
                  required
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="bg-secondary border-border text-center font-black text-sm pr-10 focus:border-temple-crimson focus:ring-temple-crimson/20"
                  data-ocid="login.input"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoggingIn}
              className={`w-full py-6 rounded-2xl font-black text-base uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                isOnline
                  ? "bg-temple-crimson hover:bg-temple-crimson-light text-white shadow-crimson-glow"
                  : "bg-muted text-foreground"
              }`}
              data-ocid="login.primary_button"
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin text-lg">☸️</span> लोड हो रहा
                  है...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  {isOnline ? "Login 🕉️" : "Authorized Login"}
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-border" />
            <span className="flex-shrink mx-4 text-muted-foreground font-bold text-[8px] uppercase tracking-[0.3em]">
              Sync Link
            </span>
            <div className="flex-grow border-t border-border" />
          </div>

          {/* Google button (cosmetic) */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              className="w-12 h-12 rounded-full bg-white shadow-lg border-2 border-border flex items-center justify-center hover:scale-110 hover:border-blue-400 transition-all cursor-pointer"
              title="Link Google Account (Coming Soon)"
              data-ocid="login.secondary_button"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6"
                role="img"
                aria-label="Google"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </button>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
              Login with Google to Restore Backup
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-[9px] text-muted-foreground/50 mt-4 font-bold uppercase tracking-wider">
            ॥ हर हर महादेव ॥
          </p>
        </div>
      </motion.div>
    </div>
  );
}
