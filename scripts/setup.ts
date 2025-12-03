#!/usr/bin/env bun
import { writeFile, cp, access, readFile, mkdir, readdir, stat } from "fs/promises";
import { constants } from "fs";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = process.cwd();

const devDependencies = [
  // "@stylistic/eslint-plugin",
  // "eslint-plugin-import-x",
  // "eslint-plugin-perfectionist",
  // "eslint-plugin-solid",
  // "eslint-plugin-sonarjs",
  // "eslint-plugin-unicorn",
  // "eslint",
  // "globals",
  // "prettier",
  // "typescript",
  // "typescript-eslint",
];

const configFiles = [
  { name: "eslint.config.ts", target: "eslint.config.ts" },
  // { name: ".prettierrc.json", target: ".prettierrc.json" },
];

const scripts = {
  lint: "eslint 'src/**/*.{ts,mts,tsx}' --fix",
  format: "prettier --write 'src/**/*.{ts,mts,tsx,js,json,md}'",
  check: "bun run format && bun run lint",
};

const prettier = "@emilgramdk/web/prettier";
const tsconfig = "@emilgramdk/web/tsconfig";
const eslint = { extends: "@emilgramdk/web/eslint" };

async function fileExists(filePath: string) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function installDeps() {
  const deps = devDependencies.join(" ");
  console.log("📦 Installing dev dependencies...");
  execSync(`bun add -d ${deps}`, { stdio: "inherit" });
}

async function copyConfigs() {
  for (const file of configFiles) {
    const destPath = path.join(root, file.target);
    const alreadyExists = await fileExists(destPath);
    if (alreadyExists) {
      console.log(`⚠️  ${file.target} already exists. Skipped.`);
    } else {
      const srcPath = path.join(__dirname, "..", file.name);
      await cp(srcPath, destPath);
      console.log(`✅ Copied ${file.name}`);
    }
  }
}

async function updateTSConfig() {
  let tsconfigPath: string = path.join(root, "tsconfig.json");

  let json = {
    extends: tsconfig,
    compilerOptions: {
      baseUrl: "./",
      paths: {
        "@/*": ["./src/*"],
      },
      types: ["vite/client"],
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist"],
  };

  try {
    tsconfigPath = path.join(root, "tsconfig.json");
    const raw = await readFile(tsconfigPath, "utf8");
    json = JSON.parse(raw);
  } catch {}

  try {
    const apptsconfigPath = path.join(root, "tsconfig.app.json");
    const appRaw = await readFile(apptsconfigPath, "utf8");
    json = JSON.parse(appRaw);
    if (json) {
      tsconfigPath = apptsconfigPath;
    }
  } catch {}

  if (!json) {
    console.warn("⚠️  No tsconfig.json or tsconfig.app.json found. Creating a new one.");
  }

  if (!json.extends) {
    json.extends = tsconfig;
    console.log(`✅ Added "extends" field to tsconfig.json`);
  }

  await writeFile(tsconfigPath, JSON.stringify(json, null, 2) + "\n", "utf8");
}

async function updatePackageJsonScripts() {
  const packageJsonPath = path.join(root, "package.json");
  const raw = await readFile(packageJsonPath, "utf8");
  const json = JSON.parse(raw);

  let modified = false;
  if (!json.scripts) json.scripts = {};

  for (const [key, command] of Object.entries(scripts)) {
    if (!json.scripts[key]) {
      json.scripts[key] = command;
      console.log(`✅ Added "${key}" script to package.json`);
      modified = true;
    } else {
      console.log(`ℹ️  "${key}" script already exists, skipped.`);
    }
  }

  if (!json.prettier) {
    json.prettier = prettier;
    console.log(`✅ Added "prettier" config to package.json`);
    modified = true;
  }

  // if (!json.eslint) {
  //   json.eslint = eslint;
  //   console.log(`✅ Added "eslint" config to package.json`);
  //   modified = true;
  // }

  if (modified) {
    await writeFile(packageJsonPath, JSON.stringify(json, null, 2) + "\n", "utf8");
    console.log("📦 package.json updated.");
  }
}

async function copyVSCodeFiles() {
  const sourceDir = path.join(__dirname, "../.vscode");
  const destDir = path.join(root, ".vscode");

  try {
    await mkdir(destDir, { recursive: true });
    const files = await readdir(sourceDir);
    for (const file of files) {
      const src = path.join(sourceDir, file);
      const dest = path.join(destDir, file);

      if (!(await fileExists(dest))) {
        const stats = await stat(src);
        if (stats.isFile()) {
          await cp(src, dest);
          console.log(`✅ Copied .vscode/${file}`);
        }
      } else {
        console.log(`⚠️  .vscode/${file} already exists. Skipped.`);
      }
    }
  } catch (err) {
    console.error("⚠️  Skipping .vscode config copy. Reason:", err.message);
  }
}

(async () => {
  try {
    await installDeps();
    await copyConfigs();
    await updatePackageJsonScripts();
    await copyVSCodeFiles();
    await updateTSConfig();
    console.log("🎉 ESLint and Prettier setup complete!");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
})();
