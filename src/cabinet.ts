/**
 * Cross-frame bridge for games running inside the Domin8 arcade cabinet iframe.
 *
 * Promoted into arcade-kit so every game speaks ONE protocol — versioned
 * alongside the shared button styles each game already pulls — instead of
 * carrying a divergent private copy. The hub (ton-domin8-hub) is the other end:
 * it whitelists game origins and handles each `domin8:*` message type.
 *
 * All functions are safe to call unconditionally: the `post*` helpers no-op when
 * the page isn't embedded in a parent frame.
 */

export type GameResult = "win" | "lose";

/**
 * True when running inside the cabinet — either embedded in a parent frame, or
 * launched with the `?cabinet` flag (covers same-origin dev embeds where
 * `window.parent === window` wouldn't otherwise distinguish).
 */
export function isCabinet(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.parent !== window ||
    new URLSearchParams(window.location.search).has("cabinet")
  );
}

/** True when the cabinet launched us in demo mode (`?demo=true`). */
export function isDemo(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("demo") === "true";
}

function post(data: Record<string, unknown>): void {
  if (typeof window === "undefined" || window.parent === window) return;
  // targetOrigin '*' is intentional: the hub validates origin on its end, and
  // these messages carry no sensitive data.
  window.parent.postMessage(data, "*");
}

/** Notify the hub of a game outcome so it can animate the cabinet.
 *  balance — the player's new absolute balance after the game (demo mode). */
export function postGameOver(result: GameResult, balance?: number): void {
  post({ type: "domin8:game-over", result, ...(balance !== undefined ? { balance } : {}) });
}

/** Signal that the player wants to leave the game and return to the hub. */
export function postExit(): void {
  post({ type: "domin8:exit" });
}

/**
 * Fire the shared "play for real" call-to-action. The hub opens its onboarding
 * flow (log in → connect wallet → deposit) as an overlay on top of the running
 * game, so an unconnected demo player converts without losing their place.
 */
export function postPlayForReal(): void {
  post({ type: "domin8:play-for-real" });
}
