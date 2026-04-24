import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider, useT } from "@/lib/i18n";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  const t = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-foreground">404</h1>
        <h2 className="mt-4 font-display text-xl text-foreground">{t("nf.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("nf.sub")}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("common.back_home")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "ScentSnap — Identifiera parfym med AI" },
      { name: "description", content: "Fota en parfymflaska eller etikett och låt AI:n identifiera doftnoter, ackord och liknande parfymer." },
      { name: "theme-color", content: "#1a1410" },
      { property: "og:title", content: "ScentSnap — Identifiera parfym med AI" },
      { property: "og:description", content: "Fota en parfymflaska eller etikett och låt AI:n identifiera doftnoter, ackord och liknande parfymer." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "ScentSnap — Identifiera parfym med AI" },
      { name: "twitter:description", content: "Fota en parfymflaska eller etikett och låt AI:n identifiera doftnoter, ackord och liknande parfymer." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/37fe6988-2c95-4f35-b746-0910afc2ea7d/id-preview-1f9ddd89--c03b1172-69ed-478b-aa86-0be85c2db286.lovable.app-1777034910671.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/37fe6988-2c95-4f35-b746-0910afc2ea7d/id-preview-1f9ddd89--c03b1172-69ed-478b-aa86-0be85c2db286.lovable.app-1777034910671.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <I18nProvider>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-center" />
      </AuthProvider>
    </I18nProvider>
  );
}
