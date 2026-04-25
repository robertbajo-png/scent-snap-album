import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown, Loader2, Search, Shield, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  searchUsers,
  listPremiumUsers,
  grantPremium,
  revokePremium,
  setAdminRole,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

interface FoundUser {
  id: string;
  email: string;
  isAdmin: boolean;
  hasGrant: boolean;
  grantExpiresAt: string | null;
}

interface PremiumUser {
  id: string;
  email: string;
  grantedAt: string;
  expiresAt: string | null;
  note: string | null;
}

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();

  const search = useServerFn(searchUsers);
  const listPremium = useServerFn(listPremiumUsers);
  const grant = useServerFn(grantPremium);
  const revoke = useServerFn(revokePremium);
  const setRole = useServerFn(setAdminRole);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoundUser[]>([]);
  const [premium, setPremium] = useState<PremiumUser[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate({ to: "/login" });
      } else if (!isAdmin) {
        navigate({ to: "/" });
      }
    }
  }, [authLoading, roleLoading, user, isAdmin, navigate]);

  const refreshPremium = async () => {
    try {
      const res = await listPremium();
      setPremium(res.users);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load premium users");
    }
  };

  useEffect(() => {
    if (isAdmin) refreshPremium();
  }, [isAdmin]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await search({ data: { query: query.trim() } });
      setResults(res.users);
    } catch (e: any) {
      toast.error(e?.message ?? "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const doGrant = async (userId: string) => {
    setBusy(userId);
    try {
      await grant({ data: { userId, expiresAt: null } });
      toast.success("Premium granted");
      await Promise.all([refreshPremium(), query ? handleSearch() : Promise.resolve()]);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to grant premium");
    } finally {
      setBusy(null);
    }
  };

  const doRevoke = async (userId: string) => {
    setBusy(userId);
    try {
      await revoke({ data: { userId } });
      toast.success("Premium revoked");
      await Promise.all([refreshPremium(), query ? handleSearch() : Promise.resolve()]);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to revoke premium");
    } finally {
      setBusy(null);
    }
  };

  const doToggleAdmin = async (userId: string, makeAdmin: boolean) => {
    setBusy(userId);
    try {
      await setRole({ data: { userId, makeAdmin } });
      toast.success(makeAdmin ? "Admin role granted" : "Admin role removed");
      if (query) await handleSearch();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update role");
    } finally {
      setBusy(null);
    }
  };

  if (authLoading || roleLoading || !user || !isAdmin) {
    return (
      <AppShell>
        <Logo />
        <div className="mt-20 grid place-items-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Logo />

      <div className="mt-6 flex items-center gap-2">
        <Shield className="h-5 w-5 text-gold" strokeWidth={1.7} />
        <h1 className="font-display text-2xl">Admin</h1>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Grant Premium access manually and manage admin roles.
      </p>

      {/* Search */}
      <section className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-4">
        <p className="text-sm font-medium">Find user by email</p>
        <div className="mt-3 flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="user@example.com"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={searching} className="rounded-xl">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {results.length > 0 && (
          <ul className="mt-4 space-y-2">
            {results.map((u) => (
              <li
                key={u.id}
                className="rounded-xl border border-border/60 bg-background/60 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{u.email}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {u.isAdmin && (
                        <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-medium text-gold">
                          Admin
                        </span>
                      )}
                      {u.hasGrant && (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {u.hasGrant ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === u.id}
                        onClick={() => doRevoke(u.id)}
                        className="rounded-lg"
                      >
                        {busy === u.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="mr-1 h-3 w-3" /> Revoke
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={busy === u.id}
                        onClick={() => doGrant(u.id)}
                        className="rounded-lg"
                      >
                        {busy === u.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Crown className="mr-1 h-3 w-3" /> Grant Premium
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === u.id}
                      onClick={() => doToggleAdmin(u.id, !u.isAdmin)}
                      className="rounded-lg"
                    >
                      <UserPlus className="mr-1 h-3 w-3" />
                      {u.isAdmin ? "Remove admin" : "Make admin"}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Current premium grants */}
      <section className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-4">
        <p className="text-sm font-medium">Manually granted Premium ({premium.length})</p>
        {premium.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No manual grants yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {premium.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{u.email}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Granted {new Date(u.grantedAt).toLocaleDateString()}
                    {u.expiresAt
                      ? ` · expires ${new Date(u.expiresAt).toLocaleDateString()}`
                      : " · no expiry"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === u.id}
                  onClick={() => doRevoke(u.id)}
                  className="rounded-lg"
                >
                  {busy === u.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        to="/me"
        className="mt-6 block text-center text-xs text-muted-foreground hover:text-foreground"
      >
        ← Back to profile
      </Link>
    </AppShell>
  );
}
