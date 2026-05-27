import childProcess from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const electronPackagePath = path.dirname(require.resolve('electron/package.json'));
const electronRequire = createRequire(path.join(electronPackagePath, 'package.json'));
const { downloadArtifact } = electronRequire('@electron/get');
const { version } = electronRequire('./package.json');

const platform = process.env.ELECTRON_INSTALL_PLATFORM ?? process.env.npm_config_platform ?? process.platform;
let arch = process.env.ELECTRON_INSTALL_ARCH ?? process.env.npm_config_arch ?? process.arch;

if (
  platform === 'darwin' &&
  process.platform === 'darwin' &&
  arch === 'x64' &&
  process.env.npm_config_arch === undefined
) {
  try {
    if (childProcess.execSync('sysctl -in sysctl.proc_translated').toString().trim() === '1') {
      arch = 'arm64';
    }
  } catch {
    // Not running under Rosetta, or sysctl unavailable.
  }
}

const platformPath = getPlatformPath(platform);
const distPath = process.env.ELECTRON_OVERRIDE_DIST_PATH ?? path.join(electronPackagePath, 'dist');
const executablePath = path.join(distPath, platformPath);

if (!isElectronInstallComplete()) {
  fs.rmSync(distPath, { recursive: true, force: true });
  fs.mkdirSync(distPath, { recursive: true });

  const zipPath = await downloadArtifact({
    version,
    artifactName: 'electron',
    force: process.env.force_no_cache === 'true',
    cacheRoot: process.env.electron_config_cache,
    checksums:
      process.env.electron_use_remote_checksums || process.env.npm_config_electron_use_remote_checksums
        ? undefined
        : electronRequire('./checksums.json'),
    platform,
    arch,
  });

  extractElectronZip(zipPath, distPath);

  const extractedTypesPath = path.join(distPath, 'electron.d.ts');
  const packageTypesPath = path.join(electronPackagePath, 'electron.d.ts');

  if (fs.existsSync(extractedTypesPath)) {
    fs.renameSync(extractedTypesPath, packageTypesPath);
  }
}

if (!isElectronInstallComplete()) {
  throw new Error(`Electron executable was not installed at ${executablePath}`);
}

fs.writeFileSync(path.join(electronPackagePath, 'path.txt'), platformPath);
fs.writeFileSync(path.join(distPath, 'version'), version);

function getPlatformPath(targetPlatform) {
  switch (targetPlatform) {
    case 'mas':
    case 'darwin':
      return 'Electron.app/Contents/MacOS/Electron';
    case 'freebsd':
    case 'openbsd':
    case 'linux':
      return 'electron';
    case 'win32':
      return 'electron.exe';
    default:
      throw new Error(`Electron builds are not available on platform: ${targetPlatform}`);
  }
}

function isElectronInstallComplete() {
  if (!fs.existsSync(executablePath)) {
    return false;
  }

  if (platform === 'darwin') {
    return fs.existsSync(
      path.join(distPath, 'Electron.app/Contents/Frameworks/Electron Framework.framework/Electron Framework'),
    );
  }

  return true;
}

function extractElectronZip(zipPath, destinationPath) {
  const result =
    process.platform === 'win32'
      ? childProcess.spawnSync(
          'powershell.exe',
          [
            '-NoProfile',
            '-Command',
            `Expand-Archive -LiteralPath '${escapePowerShellPath(zipPath)}' -DestinationPath '${escapePowerShellPath(
              destinationPath,
            )}' -Force`,
          ],
          { stdio: 'inherit' },
        )
      : childProcess.spawnSync('unzip', ['-q', '-o', zipPath, '-d', destinationPath], {
          stdio: 'inherit',
        });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Failed to extract Electron archive at ${zipPath}`);
  }
}

function escapePowerShellPath(value) {
  return value.replaceAll("'", "''");
}
