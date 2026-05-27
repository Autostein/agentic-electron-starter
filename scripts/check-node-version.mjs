const requiredMajor = 24;
const current = process.versions.node;
const currentMajor = Number(current.split('.')[0]);

if (currentMajor !== requiredMajor) {
  console.error(
    `agentic-electron-starter requires Node ${requiredMajor}. Current Node is ${current}. Run: pnpm env use ${requiredMajor}`,
  );
  process.exit(1);
}
