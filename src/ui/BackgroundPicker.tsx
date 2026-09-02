import { useEffect, useState } from "react";

export interface BackgroundOption {
  id: string;
  name: string;
  url: string;
}

/**
 * Champion splash art from Riot's Data Dragon CDN (ddragon.leagueoflegends.com) — Riot's own
 * public, stable asset API made specifically for third-party fan tools to hotlink (see Riot's Legal
 * Jibber Jabber fan content policy), the same reasoning src/cards/types.ts's Card.imageUrl already
 * relies on for card art: this file only ever stores a URL string, the actual image bytes are
 * fetched by each PLAYER's own browser directly from Riot, never downloaded/hosted by this
 * codebase. This sandbox's own outbound network is blocked (see the proxy status log), so none of
 * these URLs could be verified to resolve from inside this session — Data Dragon's splash-art path
 * convention (`/cdn/img/champion/splash/{Key}_0.jpg`) is stable and long-standing, but a real
 * browser check after deploy is the only way to be sure none 404 silently.
 *
 * Picked from champions this simulator's own preset decks (decks/presets.ts) already feature, so
 * the background options feel like part of the same game rather than a random art dump.
 */
export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  { id: "lillia", name: "Lillia", url: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Lillia_0.jpg" },
  { id: "viktor", name: "Viktor", url: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Viktor_0.jpg" },
  { id: "ornn", name: "Ornn", url: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ornn_0.jpg" },
  { id: "leesin", name: "Lee Sin", url: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/LeeSin_0.jpg" },
  { id: "sivir", name: "Sivir", url: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Sivir_0.jpg" },
  { id: "sett", name: "Sett", url: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Sett_0.jpg" },
  { id: "rengar", name: "Rengar", url: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Rengar_0.jpg" },
  { id: "lucian", name: "Lucian", url: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Lucian_0.jpg" },
  { id: "akali", name: "Akali", url: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Akali_0.jpg" },
  { id: "xinzhao", name: "Xin Zhao", url: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/XinZhao_0.jpg" },
  { id: "vi", name: "Vi", url: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Vi_0.jpg" },
  { id: "hwei", name: "Hwei", url: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Hwei_0.jpg" },
];

const STORAGE_KEY = "rb-sim:background";

function getStoredBackgroundId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredBackgroundId(id: string | null): void {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private browsing / storage disabled — the picker still works for the session, just doesn't persist.
  }
}

/**
 * Always-mounted (see App.tsx) so the picker tab and the active background are available on every
 * screen (menu, deck builder, in-game) — not just the board. Renders a fixed full-viewport image
 * layer BEHIND everything (z-index:0) when a background is chosen; .rb-app/.rb-page turn
 * transparent in that state (see the `rb-has-custom-bg` class toggle + cards.css) so it shows
 * through the gaps between panels while every panel's own opaque background keeps card text and
 * UI fully legible on top of it.
 */
export function BackgroundPicker() {
  const [selectedId, setSelectedId] = useState<string | null>(() => getStoredBackgroundId());
  const [open, setOpen] = useState(false);
  const selected = BACKGROUND_OPTIONS.find((b) => b.id === selectedId) ?? null;

  useEffect(() => {
    document.documentElement.classList.toggle("rb-has-custom-bg", Boolean(selected));
  }, [selected]);

  function choose(id: string | null) {
    setSelectedId(id);
    setStoredBackgroundId(id);
    setOpen(false);
  }

  return (
    <>
      {/* Darkening happens once, on .rb-app/.rb-page's own background (see cards.css) — not
          baked in here too — so it applies uniformly to loose page text and boxed panels alike,
          not just wherever this raw image layer happens to show through. */}
      {selected && <div className="rb-bg-layer" style={{ backgroundImage: `url(${selected.url})` }} />}
      <button className="rb-bg-tab" onClick={() => setOpen((o) => !o)} title="Hintergrund wählen">
        🎨
      </button>
      {open && (
        <div className="rb-bg-panel">
          <div className="rb-bg-panel-title">Hintergrund</div>
          <div className="rb-bg-grid">
            <button
              className={`rb-bg-swatch rb-bg-swatch-none${selected ? "" : " active"}`}
              onClick={() => choose(null)}
              title="Kein Hintergrund"
            >
              ✕
            </button>
            {BACKGROUND_OPTIONS.map((bg) => (
              <button
                key={bg.id}
                className={`rb-bg-swatch${selectedId === bg.id ? " active" : ""}`}
                style={{ backgroundImage: `url(${bg.url})` }}
                onClick={() => choose(bg.id)}
                title={bg.name}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
