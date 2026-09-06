import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async () => {
  const posts = await getCollection("blog");
  const lines: string[] = [
    "# ortopednn.ru",
    "",
    "> Стоматолог-ортопед Никитина М.Г., Нижний Новгород: протезирование зубов, коронки, импланты, виниры.",
    "",
    "## Разделы",
    "",
    "- [Услуги](https://ortopednn.ru/services/): протезирование зубов",
    "- [О враче](https://ortopednn.ru/about/): Никитина Марина Георгиевна",
    "- [Блог](https://ortopednn.ru/blog/): статьи о протезировании",
    "",
    "## Статьи",
    "",
  ];
  const sorted = [...posts].sort((a, b) => (a.data.date < b.data.date ? 1 : -1));
  for (const p of sorted) {
    lines.push("- [" + p.data.title + "](https://ortopednn.ru/blog/" + p.data.slug + "/): " + p.data.desc);
  }
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
