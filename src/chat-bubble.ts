import { assetUrl } from "./asset-url";
import chatBubblePng from "./assets/d8-chat-bubble.png";

/** Resolved URL for the chat-bubble icon (14×15 native) — used as the collapsed
 *  chat tab in the hub. Render with `image-rendering: pixelated` and scale by an
 *  integer-ish factor to stay crisp. */
export const CHAT_BUBBLE_URL = assetUrl(chatBubblePng);
