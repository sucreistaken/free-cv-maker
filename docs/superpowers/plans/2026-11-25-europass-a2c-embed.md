# Europass template + A2C embed/print mode Implementation Plan

> **For agentic workers:** executed natively by the feature lead (no subagents, no commits; the controller reviews).

**Goal:** NextCV gets a German `europass` template and two URL modes (`/?embed=a2c` editor, `/?embed=a2c&print=1` print) so Apply2Campus can render and edit a student's German Europass CV without any data leaving the browser.

**Architecture:** Pure logic (CEFR/hobby/skill parsing, CV normalization of the new optional fields, embed mode detection, message validation) lives in `src/utils` and `src/embed` and is unit tested. `main.tsx` picks one of three shells (`App`, `EmbedApp`, `PrintApp`) from the URL. In embed modes every zustand persist store uses an in-memory storage, cloud sync and event logging are switched off, and no consent banner or footer is rendered.

**Tech Stack:** Vite + React 19 + TS, Tailwind v4, Zustand 5 (persist), vitest, lucide-react.

**Spec:** `scratchpad/features/cv-contract.md` (binding) + `scratchpad/features/cv-nextcv.md` (brief).

## Global Constraints

- Contract message types: `nextcv:ready`, `a2c:load {cv}`, `nextcv:loaded`, `nextcv:save {cv}`; print flag `window.__NEXTCV_READY__` (false until rendered, then true).
- Allowed origins: env `VITE_A2C_ORIGINS` (comma list), default `https://apply2campus.com,http://localhost:3007,http://localhost:3008,http://localhost:3009,http://localhost:3010,http://localhost:3011`; print mode also accepts the page's own origin.
- Embed/print: no cloud sync, no logEvent/upload, no consent banner, no localStorage writes.
- New CVData fields are optional; well-formed old data must come back deep-equal from `normalizeCVData`.
- German labels on the CV; Turkish UI text; English code; no em-dash; no EU/Europass logo; invented test data only.

## Decisions

1. `europass` is also listed in the normal template dropdown: it is an ordinary TemplateType and costs one option.
2. CV labels and section headings are fixed German strings, ignoring custom section titles: the contract fixes German labels.
3. Europass-only editor inputs (gender, education location/website, native flag via proficiency, CEFR grid, hobby grouping hint) render only while the `europass` template is active: other templates do not print them, so the normal app stays unchanged.
4. The template has a fixed Europass look (Open Sans, grey sidebar, blue accents); it ignores theme colors/font but honours font scale and photo visibility; ThemePanel is hidden in embed mode: few controls for staff.
5. CEFR levels are read with `/[ABC][12]/i` (so "b1+" becomes "B1"); a grid is kept only when all five skills are valid, otherwise dropped and the German proficiency label is shown: a half grid cannot be printed honestly.
6. Native language = `isNative ?? proficiency === 'native'`; clicking a proficiency chip in the editor also sets `isNative` when it was defined: one source of truth in the UI.
7. CEFR editor: five selects with an empty option; the first level picked on an empty grid fills all five (adjust the rest); picking empty removes the grid: most students have even levels.
8. Hobbies: one item per line, `# ` starts a group; a single line without `#` is split on commas outside parentheses (legacy NextCV comma format); leading `-`/`•` bullets stripped.
9. Skills: one line per category, items split on commas outside parentheses, joined by a light `|` glyph (kept as text for ATS).
10. No "(Privatwohnsitz)" under the address: `location` may be a city only.
11. Embed/print stores use a no-op in-memory storage, so the iframe never reads or writes the visitor's own NextCV profiles.
12. `nextcv:ready` is posted with targetOrigin `*` (it carries no data); `nextcv:save` and `nextcv:loaded` go only to the origin that sent `a2c:load`.
13. Edit mode shows a spinner until the first `a2c:load`; the save button is the only header control and shows "Gönderildi" for 2 s after a click.
14. Print listener is attached synchronously in `main.tsx` before React renders, and `__NEXTCV_READY__ = false` is set right then, so a headless sender can post as soon as the page has loaded.
15. Print output forces page breaks with `computePageBreaks` (same rule as the preview and the app's PDF export) and paints the sidebar colour on the root canvas so every page keeps the grey column.
16. Preview headings get `data-section-type` so clicking a German heading still opens the right form.

## Review Focus

- A2C sends an http(s) photo URL: CSP `img-src 'self' data: blob:` blocks it; photo must be a data URL (documented in report; template shows no broken image icon because it renders the `<img>` only when set).
- `a2c:load` from a non-allowed origin or with a non-object `cv`: ignored, no state change (tested in messages test).
- Partial/odd CEFR values (`"B1+"`, lowercase, missing skill): normalized or dropped, never crash (tested in normalizeCV test).
- Multi-page CV in print: page 2 keeps sidebar colour and top padding (checked visually on the PDF).
- Old profiles without the new fields: unchanged by normalize (deep-equal test kept).

---

### Task 1: Types + normalizeCV for the optional fields

**Files:** Modify `src/types/cv.ts`, `src/utils/normalizeCV.ts`; Test `src/utils/__tests__/normalizeCV.test.ts`.

**Produces:** `type CefrLevel = 'A1'|'A2'|'B1'|'B2'|'C1'|'C2'`, `CEFR_SKILLS = ['listening','reading','writing','spokenProduction','spokenInteraction'] as const`, `type CefrGrid = Record<CefrSkill, CefrLevel>`, `PersonalInfo.gender?`, `EducationEntry.location?/website?`, `LanguageEntry.isNative?/cefr?`, `TemplateType` + `'europass'`; `parseCefrLevel(v: unknown): CefrLevel | null` exported from `normalizeCV.ts`.

- [ ] Test: new fields survive (`gender`, education `location`/`website`, `isNative`, full `cefr`); `"b1+"` -> `"B1"`; grid with a missing/invalid skill is dropped; non-boolean `isNative` dropped; `defaultCV` still deep-equal.
- [ ] Run `npx vitest run src/utils/__tests__/normalizeCV.test.ts`: FAIL.
- [ ] Implement (only add a key when present and valid, like `experience.link`).
- [ ] Run again: PASS.

### Task 2: Europass pure helpers

**Files:** Create `src/utils/europass.ts`; Test `src/utils/__tests__/europass.test.ts`.

**Produces:** `splitListItems(text: string): string[]`, `parseHobbies(text: string): { title: string; items: string[] }[]`, `isNativeLanguage(l: LanguageEntry): boolean`, `formatDateRange(start?: string, end?: string): string` (en dash), `cefrFromProficiency`-free.

- [ ] Tests: groups with `# Kunst` / `# Sport`; ungrouped lines -> one untitled group; single comma line split, commas inside parentheses kept; bullets stripped; empty -> `[]`; native rule from Decision 6.
- [ ] FAIL, implement, PASS.

### Task 3: Embed mode + message handling

**Files:** Create `src/embed/mode.ts`, `src/embed/messages.ts`; Test `src/embed/__tests__/messages.test.ts`.

**Produces:** `getEmbedMode(search: string): 'edit' | 'print' | null`; `currentEmbedMode` (from `window.location.search`, `null` outside a browser); `DEFAULT_A2C_ORIGINS`; `parseAllowedOrigins(raw?: string): string[]`; `readLoadMessage(msg: { origin: string; data: unknown }, ctx: { mode: EmbedMode; allowedOrigins: string[]; selfOrigin: string }): CVData | null` (normalized).

- [ ] Tests: `?embed=a2c` -> edit, `&print=1` -> print, other values -> null; env parsing trims/drops empties/falls back to defaults; allowed origin accepted; unknown origin, unknown `type`, missing/non-object `cv`, non-object data rejected; same origin accepted only in print mode.
- [ ] FAIL, implement, PASS.

### Task 4: No persistence / no network in embed modes

**Files:** Create `src/store/storage.ts` (`persistStorage`); Modify the four persist stores, `src/utils/cloudSync.ts` (`hasConsent` false when embedded), `src/i18n/index.ts` (Turkish, no localStorage read when embedded), `src/main.tsx` (skip `initCloudSync`, choose shell).

- [ ] Verified by tests from Task 3 + build/lint; manual check in print run (no `/api/*` requests).

### Task 5: Europass template + editor inputs

**Files:** Create `src/components/templates/EuropassTemplate.tsx`, `src/components/templates/europass/labels.ts`; Modify `CVDocument.tsx`, `constants/templates.ts`, i18n `tr.json`/`en.json`, `PersonalInfoForm`, `EducationEntryForm`, `LanguageEntryForm`, `HobbiesForm`, `useCVStore` (`updateLanguage` generic value), `PreviewPanel` (data-section-type), `EditorPanel` (`showTheme` prop).

- [ ] Render in print mode with invented CV, compare PNG to the reference, iterate.

### Task 6: Embed and print shells

**Files:** Create `src/embed/embedStore.ts`, `src/embed/applyCV.ts`, `src/embed/EmbedApp.tsx`, `src/embed/PrintApp.tsx`, `src/embed/printListener.ts`; Modify `src/index.css` (print-mode rules).

- [ ] Headless Chrome script posts `a2c:load`, waits for `__NEXTCV_READY__`, prints A4 PDF; pdftoppm PNG inspected.
- [ ] `npm test`, `npm run lint` (no new errors beyond the 4 pre-existing), `npm run build`.
