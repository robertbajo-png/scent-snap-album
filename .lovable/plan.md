# ScentSnap — Ny appikon

## Problemet
Den nuvarande Codex-ikonen är en platt orange cirkel på beige bakgrund — generisk och matchar inte appens lyxiga brons/guld/champagne-estetik.

## Lösning
Generera en ny appikon med Lovable AI:s bildgenererings-modell (google/gemini-3-pro-image-preview) via en edge function-anrop.

### Ikonkoncept
- **Motiv**: Stiliserad parfymflaska/droppe i guld/brons mot en djup mörk bakgrund (natt-svart/djup champagne)
- **Stil**: Lyxig, minimalistisk — tänk parfymhus-branding (Tom Ford, Le Labo-vibbar)
- **Färgpalett**: Guld (#C8A555), djup brons (#6B4226), mörk bakgrund (#0A0A0A / #1A1510)
- **Form**: Rund ikon (Android adaptive icon-format, 1024x1024)
- **Detaljer**: Subtil glow/shimmer-effekt, ren typografi om text inkluderas

### Steg
1. Köra ett script som anropar AI-bildgenerering med en detaljerad prompt baserad på ScentSnaps design-tokens
2. Generera ikonen i 1024x1024 PNG
3. Spara till `/mnt/documents/` för nedladdning
4. Om resultatet inte är tillräckligt bra — iterera med justerad prompt

### Leverans
- `scentsnap-icon.png` (1024x1024) redo att använda som Android adaptive icon foreground och Play Store-ikon
