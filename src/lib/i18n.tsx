import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "sv" | "en";

const STORAGE_KEY = "scentsnap.lang";

type Dict = Record<string, string>;

const sv: Dict = {
  // common
  "common.cancel": "Avbryt",
  "common.save": "Spara",
  "common.saving": "Sparar…",
  "common.wait": "Vänta…",
  "common.login": "Logga in",
  "common.logout": "Logga ut",
  "common.signup": "Skapa konto",
  "common.back_home": "Till startsidan",
  "common.something_wrong": "Något gick fel",
  "common.update": "Uppdatera",

  // nav
  "nav.scan": "Scan",
  "nav.history": "Historik",
  "nav.for_you": "För dig",
  "nav.me": "Jag",

  // index / scan
  "scan.tag": "AI-driven parfymigenkänning",
  "scan.title_1": "Fånga doften.",
  "scan.title_2": "Avslöja parfymen.",
  "scan.subtitle": "Fota flaskan eller etiketten — vi identifierar doftpyramid, ackord och liknande parfymer.",
  "scan.preview_alt": "Förhandsvisning av parfym",
  "scan.remove_image": "Ta bort bild",
  "scan.hero_alt": "Lyxig parfymflaska",
  "scan.hero_caption_eyebrow": "Redo att scanna",
  "scan.hero_caption": "Visa upp en flaska eller etikett",
  "scan.analyzing": "Analyserar parfymen…",
  "scan.identify": "Identifiera parfym",
  "scan.open_camera": "Öppna kamera",
  "scan.upload": "Ladda upp bild",
  "scan.manual_lookup": "Eller sök parfym manuellt",
  "scan.takes_seconds": "Detta kan ta upp till 20 sekunder…",
  "scan.image_too_large": "Bilden är för stor (max 10 MB)",
  "scan.how_it_works": "Så fungerar det",
  "scan.step1_title": "Fota flaskan eller etiketten",
  "scan.step1_sub": "Tydligt ljus och fokus ger bäst resultat",
  "scan.step2_title": "AI:n identifierar parfymen",
  "scan.step2_sub": "Märke, doftnoter, ackord och beskrivning",
  "scan.step3_title": "Spara, betygsätt, hitta liknande",
  "scan.step3_sub": "Bygg din personliga doftgarderob",

  // manual lookup
  "lookup.title": "Sök parfym manuellt",
  "lookup.desc": "Skriv märke och/eller namn — t.ex. \"Dior Sauvage\" eller \"Baccarat Rouge\".",
  "lookup.placeholder": "Märke och namn",
  "lookup.searching": "Letar upp…",
  "lookup.identify": "Identifiera",
  "lookup.not_found": "Kunde inte hitta parfymen",

  // login
  "login.welcome_back": "Välkommen åter",
  "login.create_account": "Skapa konto",
  "login.subtitle_login": "Logga in för att spara dina scanningar.",
  "login.subtitle_signup": "Börja bygga din doftgarderob.",
  "login.display_name": "Visningsnamn",
  "login.display_name_placeholder": "Hur vill du synas?",
  "login.email": "E-post",
  "login.password": "Lösenord",
  "login.no_account": "Ingen användare?",
  "login.have_account": "Har du redan konto?",
  "login.create_here": "Skapa ett här",
  "login.account_created": "Konto skapat — du är inloggad!",
  "login.welcome_short": "Välkommen tillbaka",

  // history
  "history.login_title": "Logga in för historik",
  "history.login_sub": "Spara dina scanningar och hitta dem igen senare.",
  "history.title": "Din doftgarderob",
  "history.count": "{n} parfymer",
  "history.search_placeholder": "Sök märke eller namn",
  "history.filter_all": "Alla",
  "history.filter_like": "Gillar",
  "history.filter_want": "Vill ha",
  "history.filter_dislike": "Ogillar",
  "history.all_families": "Alla doftfamiljer",
  "history.empty_none": "Inga parfymer än — börja på startsidan.",
  "history.empty_filter": "Inga träffar.",

  // for-you
  "fy.signed_out_title": "Personliga förslag",
  "fy.signed_out_sub": "Logga in för att få parfymer som matchar din smak.",
  "fy.eyebrow": "Kurerat åt dig",
  "fy.title": "För dig",
  "fy.composing": "Komponerar dina förslag…",
  "fy.scan_first": "Scanna några parfymer först så får du bättre förslag.",
  "fy.why_you": "Varför du",
  "fy.error": "Kunde inte generera rekommendationer",

  // me
  "me.signed_out_title": "Din doftgarderob",
  "me.signed_out_sub": "Logga in för att se din profil.",
  "me.your_profile": "Din profil",
  "me.stat_scanned": "Scannat",
  "me.stat_likes": "Gillar",
  "me.stat_wants": "Vill ha",
  "me.menu_new_scan": "Ny scanning",
  "me.menu_history": "Doftgarderob",
  "me.menu_for_you": "Personliga förslag",
  "me.menu_taste": "Smakprofil",
  "me.menu_about": "Om ScentSnap",
  "me.signed_out_toast": "Du är utloggad",
  "me.language": "Språk",
  "me.language_sv": "Svenska",
  "me.language_en": "English",

  // taste
  "taste.eyebrow": "Smakprofil",
  "taste.title": "Vad gillar du?",
  "taste.sub": "Hjälp oss förstå din doft — vi finslipar förslagen automatiskt baserat på dina reaktioner också.",
  "taste.favorites": "Favoritfamiljer",
  "taste.favorites_hint": "Välj så många du vill",
  "taste.avoid": "Undvik",
  "taste.avoid_hint": "Familjer du inte gillar",
  "taste.season": "Säsong",
  "taste.intensity": "Intensitet",
  "taste.direction": "Inriktning",
  "taste.save": "Spara smakprofil",
  "taste.saved": "Smakprofil sparad",
  "taste.save_failed": "Kunde inte spara",
  "taste.intensity_light": "Lätt & fräsch",
  "taste.intensity_balanced": "Balanserad",
  "taste.intensity_strong": "Stark & djup",

  // accords (taste UI)
  "acc.Träig": "Träig",
  "acc.Blommig": "Blommig",
  "acc.Citrus": "Citrus",
  "acc.Orientalisk": "Orientalisk",
  "acc.Gourmand": "Gourmand",
  "acc.Chypré": "Chypré",
  "acc.Fougère": "Fougère",
  "acc.Aquatic": "Aquatic",
  "acc.Pudrig": "Pudrig",
  "acc.Mossig": "Mossig",
  "acc.Krydda": "Krydda",
  "acc.Fruktig": "Fruktig",

  // seasons
  "season.Vår": "Vår",
  "season.Sommar": "Sommar",
  "season.Höst": "Höst",
  "season.Vinter": "Vinter",

  // genders
  "gender.Herr": "Herr",
  "gender.Dam": "Dam",
  "gender.Unisex": "Unisex",

  // reactions
  "reaction.like": "Gillar",
  "reaction.want": "Vill ha",
  "reaction.dislike": "Ogillar",

  // scent detail
  "scent.confidence": "Säkerhet {n}%",
  "scent.scanned": "Scannad {when}",
  "scent.plain_label": "På vanlig svenska",
  "scent.your_rating": "Ditt betyg",
  "scent.stars": "{n} stjärnor",
  "scent.pyramid": "Doftpyramid",
  "scent.pyr_top": "Topp",
  "scent.pyr_top_sub": "Första intrycket — flyktigt",
  "scent.pyr_heart": "Hjärta",
  "scent.pyr_heart_sub": "Personligheten — 1–4 h",
  "scent.pyr_base": "Bas",
  "scent.pyr_base_sub": "Grunden — flera timmar",
  "scent.character": "Karaktär",
  "scent.longevity": "Hållbarhet",
  "scent.sillage": "Sillage",
  "scent.accords": "Ackord",
  "scent.occasions": "Tillfällen",
  "scent.seasons": "Säsonger",
  "scent.similar": "Liknande parfymer",
  "scent.note": "Anteckning",
  "scent.note_placeholder": "Hur upplevde du doften?",
  "scent.note_save": "Spara anteckning",
  "scent.note_saved": "Anteckning sparad",
  "scent.delete": "Ta bort scanning",
  "scent.delete_confirm": "Ta bort denna scanning?",
  "scent.deleted": "Borttagen",
  "scent.not_found": "Kunde inte hitta scanningen",

  // intensity labels
  "intensity.very_strong": "Mycket stark",
  "intensity.strong": "Stark",
  "intensity.moderate": "Måttlig",
  "intensity.mild": "Mild",
  "intensity.weak": "Svag",

  // relative time
  "time.now": "Just nu",
  "time.min_ago": "{n} min sedan",
  "time.h_ago": "{n} h sedan",
  "time.d_ago": "{n} d sedan",

  // about
  "about.eyebrow": "Om",
  "about.title_1": "Doftens DNA — ",
  "about.title_2": "i fickan.",
  "about.intro": "ScentSnap använder avancerad AI-vision för att identifiera parfymer från bilder av flaskor och etiketter. Du får doftpyramid, ackord, hållbarhet och förslag på liknande parfymer — på sekunder.",
  "about.what_you_get": "Vad du får",
  "about.f1_t": "Komplett doftprofil",
  "about.f1_s": "Topp-, hjärt- och basnoter.",
  "about.f2_t": "Ackord-karta",
  "about.f2_s": "De olfaktoriska familjerna med intensitet.",
  "about.f3_t": "Personliga förslag",
  "about.f3_s": "AI komponerar parfymer som passar din smak.",
  "about.f4_t": "Privat historik",
  "about.f4_s": "Bara du ser dina scanningar och favoriter.",
  "about.tip_label": "Tips",
  "about.tip": "Tydligt ljus och fokus på etiketten ger AI:n bäst förutsättningar.",
  "about.cta": "Börja scanna",

  // 404
  "nf.title": "Sidan hittades inte",
  "nf.sub": "Sidan du letar efter finns inte eller har flyttats.",

  // meta
  "meta.title": "ScentSnap — Identifiera parfym med AI",
  "meta.desc": "Fota en parfymflaska eller etikett och låt AI:n identifiera doftnoter, ackord och liknande parfymer.",
  "meta.about_title": "Om ScentSnap",
  "meta.about_desc": "Identifiera parfymer med AI — så här fungerar ScentSnap.",
};

const en: Dict = {
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.saving": "Saving…",
  "common.wait": "Please wait…",
  "common.login": "Sign in",
  "common.logout": "Sign out",
  "common.signup": "Create account",
  "common.back_home": "Back to home",
  "common.something_wrong": "Something went wrong",
  "common.update": "Refresh",

  "nav.scan": "Scan",
  "nav.history": "Library",
  "nav.for_you": "For you",
  "nav.me": "Me",

  "scan.tag": "AI-powered perfume recognition",
  "scan.title_1": "Capture the scent.",
  "scan.title_2": "Reveal the perfume.",
  "scan.subtitle": "Photograph the bottle or label — we identify the fragrance pyramid, accords and similar perfumes.",
  "scan.preview_alt": "Perfume preview",
  "scan.remove_image": "Remove image",
  "scan.hero_alt": "Luxury perfume bottle",
  "scan.hero_caption_eyebrow": "Ready to scan",
  "scan.hero_caption": "Show a bottle or label",
  "scan.analyzing": "Analyzing the perfume…",
  "scan.identify": "Identify perfume",
  "scan.open_camera": "Open camera",
  "scan.upload": "Upload image",
  "scan.manual_lookup": "Or search manually",
  "scan.takes_seconds": "This may take up to 20 seconds…",
  "scan.image_too_large": "Image too large (max 10 MB)",
  "scan.how_it_works": "How it works",
  "scan.step1_title": "Photograph the bottle or label",
  "scan.step1_sub": "Clear light and focus give the best results",
  "scan.step2_title": "AI identifies the perfume",
  "scan.step2_sub": "Brand, notes, accords and description",
  "scan.step3_title": "Save, rate, find similar",
  "scan.step3_sub": "Build your personal scent wardrobe",

  "lookup.title": "Search a perfume manually",
  "lookup.desc": "Type brand and/or name — e.g. \"Dior Sauvage\" or \"Baccarat Rouge\".",
  "lookup.placeholder": "Brand and name",
  "lookup.searching": "Looking up…",
  "lookup.identify": "Identify",
  "lookup.not_found": "Couldn't find the perfume",

  "login.welcome_back": "Welcome back",
  "login.create_account": "Create account",
  "login.subtitle_login": "Sign in to save your scans.",
  "login.subtitle_signup": "Start building your scent wardrobe.",
  "login.display_name": "Display name",
  "login.display_name_placeholder": "How should we call you?",
  "login.email": "Email",
  "login.password": "Password",
  "login.no_account": "No account?",
  "login.have_account": "Already have an account?",
  "login.create_here": "Create one here",
  "login.account_created": "Account created — you're signed in!",
  "login.welcome_short": "Welcome back",

  "history.login_title": "Sign in to see history",
  "history.login_sub": "Save your scans and find them again later.",
  "history.title": "Your scent wardrobe",
  "history.count": "{n} perfumes",
  "history.search_placeholder": "Search brand or name",
  "history.filter_all": "All",
  "history.filter_like": "Like",
  "history.filter_want": "Want",
  "history.filter_dislike": "Dislike",
  "history.all_families": "All fragrance families",
  "history.empty_none": "No perfumes yet — start from the home page.",
  "history.empty_filter": "No matches.",

  "fy.signed_out_title": "Personal picks",
  "fy.signed_out_sub": "Sign in to get perfumes matching your taste.",
  "fy.eyebrow": "Curated for you",
  "fy.title": "For you",
  "fy.composing": "Composing your picks…",
  "fy.scan_first": "Scan a few perfumes first to get better suggestions.",
  "fy.why_you": "Why you",
  "fy.error": "Couldn't generate recommendations",

  "me.signed_out_title": "Your scent wardrobe",
  "me.signed_out_sub": "Sign in to see your profile.",
  "me.your_profile": "Your profile",
  "me.stat_scanned": "Scanned",
  "me.stat_likes": "Likes",
  "me.stat_wants": "Wants",
  "me.menu_new_scan": "New scan",
  "me.menu_history": "Scent wardrobe",
  "me.menu_for_you": "Personal picks",
  "me.menu_taste": "Taste profile",
  "me.menu_about": "About ScentSnap",
  "me.signed_out_toast": "You're signed out",
  "me.language": "Language",
  "me.language_sv": "Svenska",
  "me.language_en": "English",

  "taste.eyebrow": "Taste profile",
  "taste.title": "What do you like?",
  "taste.sub": "Help us understand your scent — we also fine-tune suggestions automatically based on your reactions.",
  "taste.favorites": "Favorite families",
  "taste.favorites_hint": "Pick as many as you like",
  "taste.avoid": "Avoid",
  "taste.avoid_hint": "Families you don't enjoy",
  "taste.season": "Season",
  "taste.intensity": "Intensity",
  "taste.direction": "Direction",
  "taste.save": "Save taste profile",
  "taste.saved": "Taste profile saved",
  "taste.save_failed": "Couldn't save",
  "taste.intensity_light": "Light & fresh",
  "taste.intensity_balanced": "Balanced",
  "taste.intensity_strong": "Strong & deep",

  "acc.Träig": "Woody",
  "acc.Blommig": "Floral",
  "acc.Citrus": "Citrus",
  "acc.Orientalisk": "Oriental",
  "acc.Gourmand": "Gourmand",
  "acc.Chypré": "Chypre",
  "acc.Fougère": "Fougère",
  "acc.Aquatic": "Aquatic",
  "acc.Pudrig": "Powdery",
  "acc.Mossig": "Mossy",
  "acc.Krydda": "Spicy",
  "acc.Fruktig": "Fruity",

  "season.Vår": "Spring",
  "season.Sommar": "Summer",
  "season.Höst": "Autumn",
  "season.Vinter": "Winter",

  "gender.Herr": "Men",
  "gender.Dam": "Women",
  "gender.Unisex": "Unisex",

  "reaction.like": "Like",
  "reaction.want": "Want",
  "reaction.dislike": "Dislike",

  "scent.confidence": "Confidence {n}%",
  "scent.scanned": "Scanned {when}",
  "scent.plain_label": "In plain English",
  "scent.your_rating": "Your rating",
  "scent.stars": "{n} stars",
  "scent.pyramid": "Fragrance pyramid",
  "scent.pyr_top": "Top",
  "scent.pyr_top_sub": "First impression — fleeting",
  "scent.pyr_heart": "Heart",
  "scent.pyr_heart_sub": "The personality — 1–4 h",
  "scent.pyr_base": "Base",
  "scent.pyr_base_sub": "The foundation — several hours",
  "scent.character": "Character",
  "scent.longevity": "Longevity",
  "scent.sillage": "Sillage",
  "scent.accords": "Accords",
  "scent.occasions": "Occasions",
  "scent.seasons": "Seasons",
  "scent.similar": "Similar perfumes",
  "scent.note": "Note",
  "scent.note_placeholder": "How did you experience the scent?",
  "scent.note_save": "Save note",
  "scent.note_saved": "Note saved",
  "scent.delete": "Delete scan",
  "scent.delete_confirm": "Delete this scan?",
  "scent.deleted": "Deleted",
  "scent.not_found": "Couldn't find the scan",

  "intensity.very_strong": "Very strong",
  "intensity.strong": "Strong",
  "intensity.moderate": "Moderate",
  "intensity.mild": "Mild",
  "intensity.weak": "Weak",

  "time.now": "Just now",
  "time.min_ago": "{n} min ago",
  "time.h_ago": "{n} h ago",
  "time.d_ago": "{n} d ago",

  "about.eyebrow": "About",
  "about.title_1": "The DNA of scent — ",
  "about.title_2": "in your pocket.",
  "about.intro": "ScentSnap uses advanced AI vision to identify perfumes from photos of bottles and labels. You get the fragrance pyramid, accords, longevity and similar suggestions — in seconds.",
  "about.what_you_get": "What you get",
  "about.f1_t": "Complete scent profile",
  "about.f1_s": "Top, heart and base notes.",
  "about.f2_t": "Accord map",
  "about.f2_s": "Olfactory families with intensity.",
  "about.f3_t": "Personal picks",
  "about.f3_s": "AI composes perfumes that match your taste.",
  "about.f4_t": "Private history",
  "about.f4_s": "Only you see your scans and favorites.",
  "about.tip_label": "Tip",
  "about.tip": "Clear light and focus on the label give the AI the best chance.",
  "about.cta": "Start scanning",

  "nf.title": "Page not found",
  "nf.sub": "The page you're looking for doesn't exist or has been moved.",

  "meta.title": "ScentSnap — Identify perfumes with AI",
  "meta.desc": "Photograph a perfume bottle or label and let AI identify notes, accords and similar perfumes.",
  "meta.about_title": "About ScentSnap",
  "meta.about_desc": "Identify perfumes with AI — how ScentSnap works.",
};

const dictionaries: Record<Lang, Dict> = { sv, en };

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx>({
  lang: "sv",
  setLang: () => {},
  t: (k) => k,
});

function detectInitial(): Lang {
  if (typeof window === "undefined") return "sv";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "sv" || stored === "en") return stored;
  } catch {}
  const nav = typeof navigator !== "undefined" ? navigator.language?.toLowerCase() ?? "" : "";
  if (nav.startsWith("sv")) return "sv";
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("sv");

  useEffect(() => {
    setLangState(detectInitial());
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const value = useMemo<I18nCtx>(() => {
    const dict = dictionaries[lang];
    return {
      lang,
      setLang: (l) => {
        setLangState(l);
        try {
          localStorage.setItem(STORAGE_KEY, l);
        } catch {}
      },
      t: (key, vars) => {
        let s = dict[key] ?? sv[key] ?? key;
        if (vars) {
          for (const [k, v] of Object.entries(vars)) {
            s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
          }
        }
        return s;
      },
    };
  }, [lang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
export const useT = () => useContext(Ctx).t;
