import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Settings2, Heart, Camera, Sparkles, Sliders } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/me")({
  component: MePage,
});

function MePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, likes: 0, wants: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { count: total }, { count: likes }, { count: wants }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("scans").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("scans").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("reaction", "like"),
        supabase.from("scans").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("reaction", "want"),
      ]);
      setProfile(p);
      setStats({ total: total ?? 0, likes: likes ?? 0, wants: wants ?? 0 });
    })();
  }, [user]);

  if (!authLoading && !user) {
    return (
      <AppShell>
        <Logo />
        <div className="mt-20 text-center">
          <h1 className="font-display text-3xl">Din doftgarderob</h1>
          <p className="mt-2 text-sm text-muted-foreground">Logga in för att se din profil.</p>
          <Link
            to="/login"
            className="mt-6 inline-flex h-12 items-center rounded-2xl bg-gradient-luxe px-6 text-sm font-medium text-primary-foreground shadow-elegant"
          >
            Logga in
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Logo />

      <div className="mt-8 flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-luxe text-2xl font-display text-primary-foreground shadow-elegant">
          {profile?.display_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl">{profile?.display_name ?? "Din profil"}</h1>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Scannat</p>
          <p className="mt-1 font-display text-3xl">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Gillar</p>
          <p className="mt-1 font-display text-3xl">{stats.likes}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Vill ha</p>
          <p className="mt-1 font-display text-3xl">{stats.wants}</p>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <MenuLink to="/" icon={Camera} label="Ny scanning" />
        <MenuLink to="/history" icon={Heart} label="Doftgarderob" />
        <MenuLink to="/for-you" icon={Sparkles} label="Personliga förslag" />
        <MenuLink to="/taste" icon={Sliders} label="Smakprofil" />
        <MenuLink to="/about" icon={Settings2} label="Om ScentSnap" />
      </div>

      <Button
        variant="outline"
        className="mt-6 h-12 w-full rounded-2xl"
        onClick={async () => {
          await signOut();
          toast.success("Du är utloggad");
          navigate({ to: "/" });
        }}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logga ut
      </Button>
    </AppShell>
  );
}

function MenuLink({ to, icon: Icon, label }: { to: any; icon: any; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 transition hover:bg-card"
    >
      <Icon className="h-4 w-4 text-gold" strokeWidth={1.7} />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
