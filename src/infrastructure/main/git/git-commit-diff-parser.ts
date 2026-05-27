import type {
  AgentRunCommitFileDiff,
  AgentRunDiffHunk,
} from '../../../application/use-cases/agent-runs/commit-read-models';

export type ParsedNumstat = {
  filesChanged: number;
  additions: number;
  deletions: number;
};

export function parseNumstat(output: string): ParsedNumstat {
  let filesChanged = 0;
  let additions = 0;
  let deletions = 0;

  for (const line of output.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }

    const [added, deleted] = line.split('\t');
    filesChanged += 1;

    if (isNumericStat(added)) {
      additions += Number(added);
    }

    if (isNumericStat(deleted)) {
      deletions += Number(deleted);
    }
  }

  return { filesChanged, additions, deletions };
}

export function parseUnifiedDiff(
  output: string,
  options: { largeFileLineThreshold: number },
): AgentRunCommitFileDiff[] {
  return parseUnifiedDiffInternal(output, options.largeFileLineThreshold);
}

export function parseUnifiedFileDiff(output: string): AgentRunCommitFileDiff {
  const [file] = parseUnifiedDiffInternal(output, Number.POSITIVE_INFINITY);

  if (!file) {
    throw new Error('No diff found for file.');
  }

  return file;
}

function parseUnifiedDiffInternal(
  output: string,
  largeFileLineThreshold: number,
): AgentRunCommitFileDiff[] {
  const files: AgentRunCommitFileDiff[] = [];
  let currentFile: MutableFileDiff | null = null;
  let currentHunk: AgentRunDiffHunk | null = null;
  let oldLine = 0;
  let newLine = 0;

  for (const line of output.split(/\r?\n/)) {
    if (line.startsWith('diff --git ')) {
      currentFile = createFileDiff(line);
      files.push(currentFile);
      currentHunk = null;
      continue;
    }

    if (!currentFile) {
      continue;
    }

    if (line.startsWith('new file mode')) {
      currentFile.status = 'added';
      currentFile.oldPath = null;
      continue;
    }

    if (line.startsWith('deleted file mode')) {
      currentFile.status = 'deleted';
      currentFile.newPath = null;
      continue;
    }

    if (line.startsWith('rename from ')) {
      currentFile.status = 'renamed';
      currentFile.oldPath = line.slice('rename from '.length);
      continue;
    }

    if (line.startsWith('rename to ')) {
      currentFile.status = 'renamed';
      currentFile.newPath = line.slice('rename to '.length);
      continue;
    }

    if (line.startsWith('copy from ')) {
      currentFile.status = 'copied';
      currentFile.oldPath = line.slice('copy from '.length);
      continue;
    }

    if (line.startsWith('copy to ')) {
      currentFile.status = 'copied';
      currentFile.newPath = line.slice('copy to '.length);
      continue;
    }

    if (line.startsWith('Binary files ') || line === 'GIT binary patch') {
      currentFile.status = 'binary';
      currentHunk = null;
      continue;
    }

    if (line.startsWith('@@ ')) {
      const hunkStart = parseHunkStart(line);
      oldLine = hunkStart.oldLine;
      newLine = hunkStart.newLine;
      currentHunk = { header: line, lines: [] };
      currentFile.hunks.push(currentHunk);
      continue;
    }

    if (!currentHunk) {
      continue;
    }

    if (line.startsWith('+') && !line.startsWith('+++')) {
      currentHunk.lines.push({
        type: 'addition',
        content: line.slice(1),
        oldLineNumber: null,
        newLineNumber: newLine,
      });
      currentFile.additions += 1;
      newLine += 1;
      continue;
    }

    if (line.startsWith('-') && !line.startsWith('---')) {
      currentHunk.lines.push({
        type: 'deletion',
        content: line.slice(1),
        oldLineNumber: oldLine,
        newLineNumber: null,
      });
      currentFile.deletions += 1;
      oldLine += 1;
      continue;
    }

    if (line.startsWith(' ')) {
      currentHunk.lines.push({
        type: 'context',
        content: line.slice(1),
        oldLineNumber: oldLine,
        newLineNumber: newLine,
      });
      oldLine += 1;
      newLine += 1;
    }
  }

  return files.map((file) => collapseLargeFile(file, largeFileLineThreshold));
}

type MutableFileDiff = AgentRunCommitFileDiff;

function createFileDiff(line: string): MutableFileDiff {
  const paths = parseDiffGitPaths(line);

  return {
    oldPath: paths.oldPath,
    newPath: paths.newPath,
    status: 'modified',
    additions: 0,
    deletions: 0,
    isLarge: false,
    hunks: [],
  };
}

function parseDiffGitPaths(line: string): { oldPath: string; newPath: string } {
  const body = line.slice('diff --git '.length);

  if (body.startsWith('"')) {
    const match = body.match(/^"a\/(.+)" "b\/(.+)"$/);
    if (match) {
      return {
        oldPath: unescapeQuotedPath(match[1] ?? ''),
        newPath: unescapeQuotedPath(match[2] ?? ''),
      };
    }
  }

  const match = body.match(/^a\/(.+) b\/(.+)$/);

  if (!match) {
    return { oldPath: body, newPath: body };
  }

  return { oldPath: match[1] ?? '', newPath: match[2] ?? '' };
}

function parseHunkStart(line: string): { oldLine: number; newLine: number } {
  const match = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);

  if (!match) {
    return { oldLine: 0, newLine: 0 };
  }

  return { oldLine: Number(match[1]), newLine: Number(match[2]) };
}

function collapseLargeFile(
  file: AgentRunCommitFileDiff,
  largeFileLineThreshold: number,
): AgentRunCommitFileDiff {
  const lineCount = file.hunks.reduce((total, hunk) => total + hunk.lines.length, 0);

  if (lineCount <= largeFileLineThreshold) {
    return file;
  }

  return {
    ...file,
    isLarge: true,
    hunks: [],
  };
}

function unescapeQuotedPath(path: string): string {
  return path
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function isNumericStat(value: string | undefined): boolean {
  return Boolean(value && /^\d+$/.test(value));
}
