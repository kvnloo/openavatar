export const ALGORITHM = "openavatar-person-mark/v1";
const SEED = "openavatar-sigil:v1:";

export async function sigilHash(handle) {
  const data = new TextEncoder().encode(`${SEED}${handle}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function byte(digest, index) {
  return digest[index % digest.length];
}

export async function sigilSvg(handle) {
  const hex = await sigilHash(handle);
  const digest = Uint8Array.from(hex.match(/../g).map((h) => parseInt(h, 16)));
  const ink = "#1c1812";
  const paper = byte(digest, 0) % 2 === 0 ? "#efe4d0" : "#d7e4ea";
  const brass = "#c4a574";
  const headR = 28 + (byte(digest, 3) % 10);
  const headY = 118 + (byte(digest, 4) % 12);
  const shoulder = 58 + (byte(digest, 5) % 18);
  const marks = [];
  for (let i = 0; i < 3; i += 1) {
    const x = 40 + (byte(digest, 8 + i * 3) % 160);
    const y = 40 + (byte(digest, 9 + i * 3) % 70);
    const kind = byte(digest, 10 + i * 3) % 3;
    if (kind === 0) {
      marks.push(
        `<circle cx="${x}" cy="${y}" r="5" fill="none" stroke="${brass}" stroke-width="1.4"/>`,
      );
    } else if (kind === 1) {
      marks.push(
        `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" fill="none" stroke="${brass}" stroke-width="1.4"/>`,
      );
    } else {
      marks.push(
        `<path d="M${x},${y - 6} L${x + 6},${y + 5} L${x - 6},${y + 5} Z" fill="none" stroke="${brass}" stroke-width="1.4"/>`,
      );
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" role="img" aria-label="Open Avatar sigil for ${handle}">
  <rect width="240" height="320" rx="14" fill="${paper}"/>
  <rect x="12" y="12" width="216" height="296" rx="8" fill="none" stroke="${ink}" stroke-width="1.2"/>
  <text x="20" y="36" font-family="ui-monospace, monospace" font-size="9" letter-spacing="2.4" fill="${ink}">OPEN IDENTITY CARD</text>
  <text x="220" y="36" text-anchor="end" font-family="ui-monospace, monospace" font-size="9" letter-spacing="1.6" fill="${ink}">PERSON</text>
  <circle cx="120" cy="${headY}" r="${headR}" fill="none" stroke="${ink}" stroke-width="2.2"/>
  <path d="M${120 - shoulder},${headY + headR + 18} C${120 - shoulder + 8},${headY + headR + 4} ${120 + shoulder - 8},${headY + headR + 4} ${120 + shoulder},${headY + headR + 18} L${120 + shoulder + 8},268 L${120 - shoulder - 8},268 Z" fill="none" stroke="${ink}" stroke-width="2.2"/>
    ${marks.join("\n    ")}
  <text x="20" y="292" font-family="ui-monospace, monospace" font-size="14">@${handle}</text>
  <text x="20" y="306" font-family="ui-monospace, monospace" font-size="8" fill="${ink}">${ALGORITHM}</text>
</svg>
`;
}
