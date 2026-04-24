import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success(t("login.account_created"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("login.welcome_short"));
      }
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e?.message ?? t("common.something_wrong"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell hideNav>
      <div className="flex items-center justify-between">
        <Logo />
        <Link to="/" className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">
          {t("common.cancel")}
        </Link>
      </div>

      <div className="mt-12 text-center">
        <h1 className="font-display text-3xl">
          {mode === "login" ? t("login.welcome_back") : t("login.create_account")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "login" ? t("login.subtitle_login") : t("login.subtitle_signup")}
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="dn">{t("login.display_name")}</Label>
            <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t("login.display_name_placeholder")} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("login.email")}</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t("login.password")}</Label>
          <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button
          type="submit"
          disabled={busy}
          className="h-12 w-full rounded-2xl bg-gradient-luxe text-primary-foreground shadow-elegant hover:opacity-90"
        >
          {busy ? t("common.wait") : mode === "login" ? t("common.login") : t("common.signup")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "login" ? t("login.no_account") : t("login.have_account")}{" "}
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {mode === "login" ? t("login.create_here") : t("common.login")}
        </button>
      </p>
    </AppShell>
  );
}
