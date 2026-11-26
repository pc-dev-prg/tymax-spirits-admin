# AGENTS.md – Tymax Spirits Admin

Tento repozitář obsahuje administrační rozhraní **Tymax Spirits Admin** pro správu zboží, objednávek, plateb, nastavení e-shopu a **Hlavního skladu**.
Kompletní sdílenou dokumentaci obou aplikací a protokol vyřešených chyb najdeš v kořenovém souboru `../agents.md`.

## Klíčové zásady pro tento repozitář

- **Stack:** SvelteKit 3 + Svelte 5 (runes mode vynucen), TypeScript, Tailwind CSS v4, `@sveltejs/adapter-vercel`, `pnpm`, Node.js `>=22.17`.
- **Žádné monolity:** Rozděluj obrazovky a formuláře na malé, znovupoužitelné komponenty (`src/lib/components/ui/`, `layout/`, `features/`). Business logiku a databázové operace drž v `src/lib/server/` a `src/lib/utils/`.
- **Minimální závislosti:** Nepřidávej těžké UI frameworky ani neudržované knihovny. Preferuj nativní webové API a Tailwind CSS v4.
- **Hlavní sklad → E-shop:** Veškeré skladové pohyby (příjem na hlavní sklad, převodky na e-shop, korekce) musí být auditovatelné přes historii pohybů (ledger).
- **Nastavení DPH:** Administrace musí umožnit přepínání režimu plátce / neplátce DPH bez ovlivnění historických objednávek.
- **Bezpečnost:** Přístup pouze pro autentizované administrátory (kontrola v `hooks.server.ts` i v Supabase RLS). Citlivé klíče výhradně v `$env/*/private`.

## Ověření před commitem

```bash
pnpm check
pnpm lint
pnpm build
```
