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
  "scan.search_by_name": "Sök på namn",
  "scan.manual_lookup": "Eller sök parfym manuellt",
  "scan.takes_seconds": "Detta kan ta upp till 20 sekunder…",
  "scan.image_too_large": "Bilden är för stor (max 10 MB)",
  "scan.how_it_works": "Så fungerar det",
  "scan.step1_title": "Fota flaskan eller etiketten",
  "scan.step1_sub": "Tydligt ljus och fokus ger bäst resultat",
  "scan.step2_title": "AI:n identifierar parfymen",
  "scan.step2_sub": "Ta ett foto eller skriv namnet — vi tar fram resten",
  "scan.step3_title": "Spara, betygsätt, hitta liknande",
  "scan.step3_sub": "Bygg din personliga doftgarderob",

  // manual lookup
  "lookup.title": "Sök på namn",
  "lookup.desc": "Skriv märke och/eller namn — vi hittar parfymen även med stavfel.",
  "lookup.placeholder": "t.ex. Dior Sauvage, Baccarat Rouge 540",
  "lookup.searching": "Letar upp…",
  "lookup.fetching_image": "Hämtar bild…",
  "lookup.identify": "Identifiera",
  "lookup.not_found": "Kunde inte hitta parfymen",
  "lookup.hint": "AI:n hittar parfymen och en bild på flaskan automatiskt.",

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
  "history.filter_owned": "Äger",
  "history.all_families": "Alla doftfamiljer",
  "history.empty_none": "Inga parfymer än — börja på startsidan.",
  "history.empty_filter": "Inga träffar.",

  // collection (owned perfumes)
  "collection.title": "Min samling",
  "collection.count": "{n} parfymer i din samling",
  "collection.empty_title": "Din samling är tom",
  "collection.empty_sub": "Markera en parfym som ”Äger” på dess sida så dyker den upp här.",
  "collection.empty_cta": "Bläddra i doftgarderoben",
  "collection.size_unknown": "Storlek ej angiven",
  "collection.signed_out_title": "Din parfymsamling",
  "collection.signed_out_sub": "Logga in för att spara parfymerna du äger.",

  // owned toggle on scent page
  "owned.toggle_label": "Äger jag den här",
  "owned.toggle_off_desc": "Slå på för att lägga till i din samling.",
  "owned.toggle_on_desc": "Med i din samling.",
  "owned.size_label": "Storlek/koncentration",
  "owned.size_placeholder": "t.ex. EdT 50ml",
  "owned.size_save": "Spara storlek",
  "owned.size_saved": "Sparat",
  "owned.added": "Tillagd i samlingen",
  "owned.removed": "Borttagen från samlingen",

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
  "me.menu_collection": "Min samling",
  "me.menu_for_you": "Personliga förslag",
  "me.menu_taste": "Smakprofil",
  "me.menu_about": "Om ScentSnap",
  "me.signed_out_toast": "Du är utloggad",
  "me.language": "Språk",
  "me.language_sv": "Svenska",
  "me.language_en": "English",
  "me.premium_active": "Premium aktiv",
  "me.premium_manage": "Hantera",
  "me.premium_active_desc": "Obegränsade skanningar, full historik och rekommendationer.",
  "me.premium_manual_desc": "Premium tilldelad manuellt — inget att hantera här.",
  "me.premium_upgrade": "Uppgradera till Premium",
  "me.premium_from": "Från 49 kr/mån",
  "me.premium_remaining": "Du har {remaining} av {limit} gratis-skanningar kvar idag.",

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

  // account deletion
  "account.danger_zone": "Riskzon",
  "account.delete_title": "Radera kontot",
  "account.delete_desc": "Tar permanent bort ditt konto, dina scanningar, smakprofil och all data. Kan inte ångras.",
  "account.delete_button": "Radera mitt konto",
  "account.delete_confirm_title": "Är du helt säker?",
  "account.delete_confirm_desc": "Detta raderar permanent ditt konto och all data. Skriv RADERA nedan för att bekräfta.",
  "account.delete_confirm_placeholder": "Skriv RADERA",
  "account.delete_confirm_word": "RADERA",
  "account.delete_confirm_action": "Radera permanent",
  "account.delete_in_progress": "Raderar…",
  "account.delete_success": "Ditt konto är raderat",
  "account.delete_failed": "Kunde inte radera kontot",
  "account.delete_blocked_sub": "Du har en aktiv premium-prenumeration. Säg upp den under \"Hantera\" först, vänta tills perioden är slut, och försök sedan igen.",
  "account.legal_privacy": "Integritetspolicy",
  "account.legal_terms": "Användarvillkor",

  // privacy
  "privacy.title": "Integritetspolicy",
  "privacy.updated": "Uppdaterad: april 2026",
  "privacy.intro": "ScentSnap respekterar din integritet. Den här policyn beskriver vilka uppgifter vi samlar in, varför, och hur du styr dem.",
  "privacy.h_data": "Vad vi sparar",
  "privacy.p_data": "Konto-uppgifter (e-post, visningsnamn), bilder du laddar upp för identifiering, samt resultaten från scanningarna (parfymdata, ditt betyg, dina anteckningar och din smakprofil).",
  "privacy.h_ai": "Bildanalys",
  "privacy.p_ai": "Bilder du fotar skickas till Google Gemini via Lovable AI Gateway för identifiering. Bilden lagras i din privata bucket i Lovable Cloud så att du kan se din historik. Den delas inte med andra användare.",
  "privacy.h_payments": "Betalningar",
  "privacy.p_payments": "Premium hanteras av Stripe. Vi sparar prenumerations-status men inga kortuppgifter — Stripe är personuppgiftsansvarig för betalningsdata.",
  "privacy.h_share": "Vi säljer inte din data",
  "privacy.p_share": "Vi säljer eller delar aldrig dina personuppgifter med tredje part i marknadsföringssyfte.",
  "privacy.h_rights": "Dina rättigheter",
  "privacy.p_rights": "Du kan när som helst radera ditt konto i appen — då tas alla dina uppgifter bort permanent. Du kan också begära ett dataregister via e-post.",
  "privacy.h_contact": "Kontakt",
  "privacy.p_contact": "Frågor? Mejla {email}.",

  // terms
  "terms.title": "Användarvillkor",
  "terms.updated": "Uppdaterad: april 2026",
  "terms.intro": "Genom att använda ScentSnap accepterar du dessa villkor.",
  "terms.h_use": "Användning",
  "terms.p_use": "ScentSnap är en hobbyapp som identifierar parfymer från bilder med AI. Resultaten är vägledande och kan vara fel — använd dem inte som beslutsunderlag för dyra köp utan att dubbelkolla.",
  "terms.h_account": "Ditt konto",
  "terms.p_account": "Du ansvarar för ditt lösenord och allt som sker via ditt konto. Använd inte tjänsten för att ladda upp olagligt eller stötande material.",
  "terms.h_premium": "Premium",
  "terms.p_premium": "Premium debiteras månadsvis eller årsvis via Stripe. Du kan säga upp när som helst — du behåller åtkomsten resten av perioden men får ingen återbetalning för pågående period.",
  "terms.h_liability": "Ansvarsbegränsning",
  "terms.p_liability": "Tjänsten levereras \"som den är\". Vi tar inget ansvar för felaktig identifiering eller för indirekt skada till följd av användning.",
  "terms.h_changes": "Ändringar",
  "terms.p_changes": "Vi kan uppdatera dessa villkor — väsentliga ändringar meddelas i appen.",
  "terms.h_contact": "Kontakt",
  "terms.p_contact": "Frågor? Mejla {email}.",

  // meta
  "meta.title": "ScentSnap — Identifiera parfym med AI",
  "meta.desc": "Fota en parfymflaska eller etikett och låt AI:n identifiera doftnoter, ackord och liknande parfymer.",
  "meta.about_title": "Om ScentSnap",
  "meta.about_desc": "Identifiera parfymer med AI — så här fungerar ScentSnap.",
  "meta.privacy_title": "Integritetspolicy — ScentSnap",
  "meta.privacy_desc": "Hur ScentSnap hanterar dina uppgifter, bilder och betalningar.",
  "meta.terms_title": "Användarvillkor — ScentSnap",
  "meta.terms_desc": "Villkor för att använda ScentSnap.",
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
  "scan.search_by_name": "Search by name",
  "scan.manual_lookup": "Or search manually",
  "scan.takes_seconds": "This may take up to 20 seconds…",
  "scan.image_too_large": "Image too large (max 10 MB)",
  "scan.how_it_works": "How it works",
  "scan.step1_title": "Photograph the bottle or label",
  "scan.step1_sub": "Clear light and focus give the best results",
  "scan.step2_title": "AI identifies the perfume",
  "scan.step2_sub": "Take a photo or type the name — we fetch the rest",
  "scan.step3_title": "Save, rate, find similar",
  "scan.step3_sub": "Build your personal scent wardrobe",

  "lookup.title": "Search by name",
  "lookup.desc": "Type brand and/or name — we'll find it even with typos.",
  "lookup.placeholder": "e.g. Dior Sauvage, Baccarat Rouge 540",
  "lookup.searching": "Looking up…",
  "lookup.fetching_image": "Fetching image…",
  "lookup.identify": "Identify",
  "lookup.not_found": "Couldn't find the perfume",
  "lookup.hint": "AI finds the perfume and a bottle image automatically.",

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
  "history.filter_owned": "Own",
  "history.all_families": "All fragrance families",
  "history.empty_none": "No perfumes yet — start from the home page.",
  "history.empty_filter": "No matches.",

  "collection.title": "My collection",
  "collection.count": "{n} perfumes in your collection",
  "collection.empty_title": "Your collection is empty",
  "collection.empty_sub": "Mark a perfume as \"Own\" on its page and it'll show up here.",
  "collection.empty_cta": "Browse your wardrobe",
  "collection.size_unknown": "Size not set",
  "collection.signed_out_title": "Your perfume collection",
  "collection.signed_out_sub": "Sign in to track the perfumes you own.",

  "owned.toggle_label": "I own this one",
  "owned.toggle_off_desc": "Turn on to add it to your collection.",
  "owned.toggle_on_desc": "In your collection.",
  "owned.size_label": "Size / concentration",
  "owned.size_placeholder": "e.g. EdT 50ml",
  "owned.size_save": "Save size",
  "owned.size_saved": "Saved",
  "owned.added": "Added to your collection",
  "owned.removed": "Removed from your collection",

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
  "me.menu_collection": "My collection",
  "me.menu_for_you": "Personal picks",
  "me.menu_taste": "Taste profile",
  "me.menu_about": "About ScentSnap",
  "me.signed_out_toast": "You're signed out",
  "me.language": "Language",
  "me.language_sv": "Svenska",
  "me.language_en": "English",
  "me.premium_active": "Premium active",
  "me.premium_manage": "Manage",
  "me.premium_active_desc": "Unlimited scans, full history and recommendations.",
  "me.premium_manual_desc": "Premium granted manually — nothing to manage here.",
  "me.premium_upgrade": "Upgrade to Premium",
  "me.premium_from": "From 49 kr/mo",
  "me.premium_remaining": "You have {remaining} of {limit} free scans left today.",

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

  "account.danger_zone": "Danger zone",
  "account.delete_title": "Delete account",
  "account.delete_desc": "Permanently removes your account, scans, taste profile and all data. This cannot be undone.",
  "account.delete_button": "Delete my account",
  "account.delete_confirm_title": "Are you absolutely sure?",
  "account.delete_confirm_desc": "This permanently deletes your account and all data. Type DELETE below to confirm.",
  "account.delete_confirm_placeholder": "Type DELETE",
  "account.delete_confirm_word": "DELETE",
  "account.delete_confirm_action": "Delete permanently",
  "account.delete_in_progress": "Deleting…",
  "account.delete_success": "Your account has been deleted",
  "account.delete_failed": "Could not delete the account",
  "account.delete_blocked_sub": "You have an active premium subscription. Cancel it under \"Manage\" first, wait until the period ends, then try again.",
  "account.legal_privacy": "Privacy Policy",
  "account.legal_terms": "Terms of Service",

  "privacy.title": "Privacy Policy",
  "privacy.updated": "Updated: April 2026",
  "privacy.intro": "ScentSnap respects your privacy. This policy explains what data we collect, why, and how you control it.",
  "privacy.h_data": "What we store",
  "privacy.p_data": "Account data (email, display name), images you upload for identification, and your scan results (perfume data, your rating, your notes and your taste profile).",
  "privacy.h_ai": "Image analysis",
  "privacy.p_ai": "Photos you take are sent to Google Gemini via the Lovable AI Gateway for identification. The image is stored in your private bucket in Lovable Cloud so you can revisit your history. It is never shared with other users.",
  "privacy.h_payments": "Payments",
  "privacy.p_payments": "Premium is handled by Stripe. We store subscription status but never card details — Stripe is the data controller for payment data.",
  "privacy.h_share": "We don't sell your data",
  "privacy.p_share": "We never sell or share your personal data with third parties for marketing.",
  "privacy.h_rights": "Your rights",
  "privacy.p_rights": "You can delete your account at any time from inside the app — all your data is removed permanently. You can also request a data export by email.",
  "privacy.h_contact": "Contact",
  "privacy.p_contact": "Questions? Email {email}.",

  "terms.title": "Terms of Service",
  "terms.updated": "Updated: April 2026",
  "terms.intro": "By using ScentSnap you accept these terms.",
  "terms.h_use": "Use of the service",
  "terms.p_use": "ScentSnap is a hobby app that identifies perfumes from photos using AI. Results are indicative and may be wrong — don't use them as the sole basis for expensive purchases without double-checking.",
  "terms.h_account": "Your account",
  "terms.p_account": "You're responsible for your password and everything that happens through your account. Don't use the service to upload illegal or offensive material.",
  "terms.h_premium": "Premium",
  "terms.p_premium": "Premium is billed monthly or yearly through Stripe. You can cancel anytime — you keep access for the rest of the period but won't be refunded for the current one.",
  "terms.h_liability": "Liability",
  "terms.p_liability": "The service is provided \"as is\". We accept no responsibility for misidentification or for indirect damages arising from use.",
  "terms.h_changes": "Changes",
  "terms.p_changes": "We may update these terms — material changes will be announced in the app.",
  "terms.h_contact": "Contact",
  "terms.p_contact": "Questions? Email {email}.",

  "meta.title": "ScentSnap — Identify perfumes with AI",
  "meta.desc": "Photograph a perfume bottle or label and let AI identify notes, accords and similar perfumes.",
  "meta.about_title": "About ScentSnap",
  "meta.about_desc": "Identify perfumes with AI — how ScentSnap works.",
  "meta.privacy_title": "Privacy Policy — ScentSnap",
  "meta.privacy_desc": "How ScentSnap handles your data, images and payments.",
  "meta.terms_title": "Terms of Service — ScentSnap",
  "meta.terms_desc": "Terms for using ScentSnap.",
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
