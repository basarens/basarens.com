import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = path.join(rootDirectory, "treasure-hunt");
const templatesDirectory = path.join(sourceDirectory, "templates");
const staticDirectory = path.join(sourceDirectory, "static");
const outputDirectory = path.join(rootDirectory, "public", "games", "treasure-hunt");
const pagesDirectory = path.join(outputDirectory, "play");

const pageNames = [
  "start",
  "menu",
  "intro",
  "credits",
  "dedicatedto",
  "task1",
  "dialogue1",
  "task2",
  "task3",
  "dialogue2",
  "task4",
  "dialogue3",
  "task5",
  "retry",
  "dialogue4",
];

const outputFileForRoute = (route) => (route === "start" ? "index.html" : `${route}.html`);

function renderTemplate(template, baseTemplate) {
  // A few old task pages define a small task_title block inside their content.
  // Resolve it first, otherwise the outer content block would end too early.
  const normalizedTemplate = template.replace(/\{% block task_title %\}([\s\S]*?)\{% endblock %\}/g, "$1");
  const title = normalizedTemplate.match(/\{% block title %\}([\s\S]*?)\{% endblock %\}/)?.[1]?.trim() ?? "Treasure Hunt";
  const content = normalizedTemplate.match(/\{% block content %\}([\s\S]*?)\{% endblock %\}/)?.[1]?.trim() ?? "";

  const page = baseTemplate
    .replace(/\{% block title %\}[\s\S]*?\{% endblock %\}/, title)
    .replace(/\{% block content %\}[\s\S]*?\{% endblock %\}/, content);

  return page
    .replace(
      /\{\{\s*url_for\(\s*["']static["']\s*,\s*filename\s*=\s*["']([^"']+)["']\s*\)\s*\}\}/g,
      (_, assetPath) => `/games/treasure-hunt/assets/${assetPath}`,
    )
    .replace(/((?:window\.)?location\.href\s*=\s*["'])\/([a-z0-9]+)(["'])/gi, (_, before, route, after) => {
      return `${before}/games/treasure-hunt/play/${outputFileForRoute(route)}${after}`;
    });
}

async function exportTreasureHunt() {
  const baseTemplate = await readFile(path.join(templatesDirectory, "base.html"), "utf8");

  await rm(outputDirectory, { force: true, recursive: true });
  await mkdir(pagesDirectory, { recursive: true });
  await cp(staticDirectory, path.join(outputDirectory, "assets"), { recursive: true });

  // The source identifies this track as a commercial Metronomy song. Keep the
  // level, but do not distribute the audio without an appropriate licence.
  await rm(path.join(outputDirectory, "assets", "background-music", "the-look.mp3"), { force: true });

  await Promise.all(
    pageNames.map(async (pageName) => {
      const template = await readFile(path.join(templatesDirectory, `${pageName}.html`), "utf8");
      const renderedPage = renderTemplate(template, baseTemplate);

      await writeFile(path.join(pagesDirectory, outputFileForRoute(pageName)), renderedPage);
    }),
  );
}

await exportTreasureHunt();
