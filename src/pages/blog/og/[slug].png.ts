import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import satori from "satori";
import sharp from "sharp";

const fontDir = join(process.cwd(), "src", "assets", "fonts");
const fonts = [
  { name: "Inter", data: readFileSync(join(fontDir, "inter-400-cyr.woff")), weight: 400 as const, style: "normal" as const },
  { name: "Inter", data: readFileSync(join(fontDir, "inter-700-cyr.woff")), weight: 700 as const, style: "normal" as const },
];

export async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts.map((p) => ({ params: { slug: p.data.slug }, props: { title: p.data.title } }));
}

const W = 1200;
const H = 630;

function card(title: string): any {
  const t = title.length > 90 ? title.slice(0, 87) + "..." : title;
  return {
    type: "div",
    props: {
      style: { width: W, height: H, display: "flex", flexDirection: "column", justifyContent: "space-between", backgroundColor: "#0e4998", color: "#ffffff", fontFamily: "Inter", padding: "64px 72px" },
      children: [
        { type: "div", props: { style: { fontSize: 30, fontWeight: 700, color: "#bcd3f0" }, children: "ortopednn.ru" } },
        { type: "div", props: { style: { fontSize: 62, fontWeight: 700, lineHeight: 1.15 }, children: t } },
        { type: "div", props: { style: { fontSize: 30, color: "#bcd3f0" }, children: "Стоматолог-ортопед · Нижний Новгород" } },
      ],
    },
  };
}

export const GET: APIRoute = async ({ props }) => {
  const svg = await satori(card(props.title as string), { width: W, height: H, fonts });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(png as unknown as BodyInit, {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" },
  });
};
