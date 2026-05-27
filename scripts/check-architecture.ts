import fs from 'node:fs';
import path from 'node:path';

type Violation = {
  file: string;
  importPath: string;
  rule: string;
};

const root = process.cwd();
const sourceRoot = path.join(root, 'src');
const sourceFiles = listSourceFiles(sourceRoot);
const violations = sourceFiles.flatMap(checkFile);

if (violations.length > 0) {
  console.error('Architecture boundary violations:');
  for (const violation of violations) {
    console.error(
      `- ${path.relative(root, violation.file)} imports "${violation.importPath}" (${violation.rule})`,
    );
  }
  process.exit(1);
}

console.log('Architecture boundaries passed.');

function checkFile(file: string): Violation[] {
  const relativeFile = path.relative(root, file);
  const imports = extractImports(fs.readFileSync(file, 'utf8'));

  return imports.flatMap((importPath) => {
    const resolvedPath = resolveImportPath(file, importPath);
    const checks: Violation[] = [];

    if (relativeFile.startsWith('src/electron/renderer/')) {
      if (isNodeOrElectronImport(importPath) || startsWithAny(resolvedPath, [
        'src/core/',
        'src/electron/main/',
        'src/electron/preload/',
        'src/infrastructure/main/',
      ])) {
        checks.push({ file, importPath, rule: 'renderer cannot import privileged runtime code' });
      }
    }

    if (relativeFile.startsWith('src/electron/preload/')) {
      if ((isNodeImport(importPath) || importPath === '@ai-hero/sandcastle') || startsWithAny(resolvedPath, [
        'src/core/',
        'src/infrastructure/main/',
        'src/electron/main/',
        'src/electron/renderer/',
      ])) {
        checks.push({ file, importPath, rule: 'preload can only import Electron and IPC contracts' });
      }
    }

    if (relativeFile.startsWith('src/contracts/ipc/')) {
      if (isNodeOrElectronImport(importPath) || startsWithAny(resolvedPath, [
        'src/core/',
        'src/infrastructure/',
        'src/electron/',
      ])) {
        checks.push({ file, importPath, rule: 'IPC contracts must stay runtime-free' });
      }
    }

    if (relativeFile.startsWith('src/core/')) {
      if (isNodeOrElectronImport(importPath) || importPath === 'react' || importPath === 'react-dom' || startsWithAny(resolvedPath, [
        'src/contracts/',
        'src/electron/',
        'src/infrastructure/',
      ])) {
        checks.push({ file, importPath, rule: 'core must stay runtime-free' });
      }
    }

    if (
      (relativeFile.startsWith('src/electron/main/') || relativeFile.startsWith('src/infrastructure/main/')) &&
      startsWithAny(resolvedPath, ['src/electron/renderer/', 'src/electron/preload/'])
    ) {
      checks.push({ file, importPath, rule: 'main must not import renderer/preload code' });
    }

    return checks;
  });
}

function listSourceFiles(directory: string): string[] {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return listSourceFiles(entryPath);
    }

    return entry.isFile() && /\.(ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}

function extractImports(source: string): string[] {
  const imports: string[] = [];
  const patterns = [
    /import\s+(?:type\s+)?(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g,
    /export\s+(?:type\s+)?[^'"]+\s+from\s+['"]([^'"]+)['"]/g,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source))) {
      if (match[1]) {
        imports.push(match[1]);
      }
    }
  }

  return imports;
}

function resolveImportPath(file: string, importPath: string): string {
  if (importPath.startsWith('@/')) {
    return `src/${importPath.slice(2)}`;
  }

  if (importPath.startsWith('.')) {
    return normalizePath(path.relative(root, path.resolve(path.dirname(file), importPath)));
  }

  return importPath;
}

function isNodeImport(importPath: string): boolean {
  return (
    importPath.startsWith('node:') ||
    ['fs', 'path', 'crypto', 'os', 'child_process'].includes(importPath)
  );
}

function isNodeOrElectronImport(importPath: string): boolean {
  return (
    importPath === 'electron' ||
    isNodeImport(importPath)
  );
}

function startsWithAny(value: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => value.startsWith(prefix));
}

function normalizePath(value: string): string {
  return value.split(path.sep).join('/');
}
