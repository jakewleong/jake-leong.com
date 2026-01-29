// scripts/optimize-glbs.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, "..");
const MODELS_DIR = path.join(PROJECT_ROOT, "public", "models");

// Output pattern: file.glb -> file.opt.glb
const OUT_SUFFIX = ".opt.glb";

// Don't re-process outputs
const SKIP_SUFFIXES = [OUT_SUFFIX];

// Good “portfolio” defaults
const DRACO_ARGS = [
  "--draco.compressMeshes=true",
  "--draco.quantizePositionBits=14",
  "--draco.quantizeNormalBits=10",
  "--draco.quantizeTexcoordBits=12",
];

// If you want faster/stronger compression, change this:
// const DRACO_ARGS = ["--draco.compressMeshes=true", "--draco.compressionLevel=9", ...]
//
// If you want to *disable* Draco for skinned characters later, we can add rules.

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (e.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function isGlb(p) {
  return p.toLowerCase().endsWith(".glb");
}

function shouldSkip(p) {
  const lower = p.toLowerCase();
  return SKIP_SUFFIXES.some((s) => lower.endsWith(s));
}

function outPathFor(inPath) {
  const dir = path.dirname(inPath);
  const base = path.basename(inPath, ".glb");
  return path.join(dir, `${base}${OUT_SUFFIX}`);
}

function fmtBytes(n) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function runGltfPipeline(args) {
  return new Promise((resolve, reject) => {
    // Use the local binary in node_modules/.bin by running through npx
    const child = spawn("npx", ["--no-install", "gltf-pipeline", ...args], {
      cwd: PROJECT_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32", // helps Windows resolve npx
    });

    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `gltf-pipeline failed (code ${code})`));
    });
  });
}

async function optimizeOne(inPath) {
  if (shouldSkip(inPath)) return { status: "skipped", inPath };

  const outPath = outPathFor(inPath);

  // Incremental: if output exists and is newer, skip
  const outExists = await fileExists(outPath);
  if (outExists) {
    const [inStat, outStat] = await Promise.all([fs.stat(inPath), fs.stat(outPath)]);
    if (outStat.mtimeMs >= inStat.mtimeMs) {
      return { status: "up-to-date", inPath, outPath };
    }
  }

  await runGltfPipeline(["-i", inPath, "-o", outPath, ...DRACO_ARGS]);

  const [inStat2, outStat2] = await Promise.all([fs.stat(inPath), fs.stat(outPath)]);
  return {
    status: "optimized",
    inPath,
    outPath,
    inBytes: inStat2.size,
    outBytes: outStat2.size,
  };
}

async function main() {
  const exists = await fileExists(MODELS_DIR);
  if (!exists) {
    console.error(`❌ Could not find models directory: ${MODELS_DIR}`);
    process.exit(1);
  }

  const all = await walk(MODELS_DIR);
  const glbs = all.filter(isGlb);

  if (glbs.length === 0) {
    console.log(`No .glb files found under: ${MODELS_DIR}`);
    return;
  }

  console.log(`Found ${glbs.length} GLB(s). Optimizing...`);

  let optimized = 0;
  let uptodate = 0;
  let skipped = 0;
  let savedTotal = 0;

  for (const p of glbs) {
    try {
      const r = await optimizeOne(p);
      const relIn = path.relative(PROJECT_ROOT, r.inPath);

      if (r.status === "optimized") {
        optimized++;
        const saved = r.inBytes - r.outBytes;
        savedTotal += Math.max(0, saved);
        console.log(
          `✅ ${relIn}  (${fmtBytes(r.inBytes)} → ${fmtBytes(r.outBytes)}, saved ${fmtBytes(saved)})`
        );
      } else if (r.status === "up-to-date") {
        uptodate++;
        console.log(`↪️  ${relIn} (up-to-date)`);
      } else {
        skipped++;
        console.log(`⏭️  ${relIn} (skipped)`);
      }
    } catch (err) {
      console.error(`❌ Failed: ${path.relative(PROJECT_ROOT, p)}`);
      console.error(err?.message || err);
    }
  }

  console.log("\nDone.");
  console.log(`Optimized: ${optimized}, Up-to-date: ${uptodate}, Skipped: ${skipped}`);
  console.log(`Total saved: ${fmtBytes(savedTotal)}`);
}

main();
