// Servidor estático mínimo para probar el index.html de la raíz: `npm run servir`
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const PORT = Number(process.env.PORT) || 3300;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".png": "image/png",
};

createServer(async (req, res) => {
  let url = decodeURIComponent((req.url || "/").split("?")[0]);
  if (url.endsWith("/")) url += "index.html";
  const file = normalize(join(process.cwd(), url));
  if (!file.startsWith(process.cwd())) {
    res.statusCode = 403;
    return res.end("403");
  }
  try {
    const data = await readFile(file);
    res.setHeader("content-type", TYPES[extname(file)] || "application/octet-stream");
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end("404");
  }
}).listen(PORT, () => console.log(`TRENO en http://localhost:${PORT}`));
