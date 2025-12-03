// src/lib/notion.ts
import { Client } from "@notionhq/client";

export type LinkItem = {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  badge: string;
  image: string;
  marketplace: string;
  highlight: boolean;
};

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value.trim(); // 👈 importante por si hay espacios o saltos de línea
}

const notion = new Client({
  auth: getEnv("NOTION_TOKEN"),
});

const dbId = getEnv("NOTION_DB_ID");

function getTitle(prop: any): string {
  const arr = prop?.title ?? [];
  return arr[0]?.plain_text ?? "";
}

function getRichText(prop: any): string {
  const arr = prop?.rich_text ?? [];
  return arr[0]?.plain_text ?? "";
}

function getSelect(prop: any): string {
  const sel = prop?.select;
  return sel?.name ?? "";
}

function getUrl(prop: any): string {
  return prop?.url ?? "";
}

function getCheckbox(prop: any): boolean {
  return Boolean(prop?.checkbox ?? false);
}

function getNumber(prop: any): number {
  return typeof prop?.number === "number" ? prop.number : 0;
}

function pageToLink(page: any): LinkItem {
  const props = page.properties ?? {};

  return {
    id: page.id,
    title: getTitle(props["Title"]),
    url: getUrl(props["URL"]),
    description: getRichText(props["Description"]),
    category: getSelect(props["Category"]) || "Producto",
    badge: getRichText(props["Badge"]),
    image: getUrl(props["Image"]),
    marketplace: getSelect(props["Marketplace"]).toLowerCase(),
    highlight: getCheckbox(props["Highlight"]),
    // aunque ya no mostramos clicks, lo podemos ignorar sin problema
  };
}

export async function fetchLinksFromNotion(): Promise<LinkItem[]> {
  const anyNotion = notion as any;

  // 1) Intentar API clásica: databases.query
  if (anyNotion.databases && typeof anyNotion.databases.query === "function") {
    const res = await anyNotion.databases.query({ database_id: dbId });
    return (res.results ?? []).map(pageToLink);
  }

  // 2) Fallback robusto: llamada manual a la ruta v1/databases/.../query
  const res = await notion.request({
    path: `v1/databases/${dbId}/query`, // 👈 aquí estaba el fallo: faltaba "v1/"
    method: "post",
    body: {},
  });

  return (res as any).results.map(pageToLink);
}
