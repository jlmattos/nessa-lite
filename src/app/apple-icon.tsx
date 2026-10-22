import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// iOS home-screen icon, rendered from the same SVG mascot as the favicon —
// Next serves this as apple-touch-icon automatically.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const svg = readFileSync(join(process.cwd(), "src", "app", "icon.svg"), "utf-8");
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img src={dataUrl} width={180} height={180} alt="" />,
    size
  );
}
