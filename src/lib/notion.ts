// src/lib/notion.ts

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
  return value.trim();
}

const NOTION_TOKEN = getEnv("NOTION_TOKEN");
const NOTION_DB_ID = getEnv("NOTION_DB_ID");
const NOTION_VERSION = "2022-06-28";

// Helpers de propiedades (igual idea que en tu script)
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
  };
}

export async function fetchLinksFromNotion(): Promise<LinkItem[]> {
  const url = `https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({}), // sin filtros, trae todo
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Notion error response:", text);
    throw new Error(`Notion API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as any;
  const results = data.results ?? [];
  return results.map(pageToLink);
}
