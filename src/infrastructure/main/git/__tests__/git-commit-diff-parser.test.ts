import { describe, expect, it } from 'vitest';
import {
  parseNumstat,
  parseUnifiedDiff,
  parseUnifiedFileDiff,
} from '../git-commit-diff-parser';

describe('git commit diff parser', () => {
  it('parses modified files with hunk line numbers', () => {
    const files = parseUnifiedDiff(
      [
        'diff --git a/README.md b/README.md',
        'index 111..222 100644',
        '--- a/README.md',
        '+++ b/README.md',
        '@@ -1,2 +1,3 @@',
        ' Existing',
        '-Old',
        '+New',
        '+More',
      ].join('\n'),
      { largeFileLineThreshold: 400 },
    );

    expect(files).toEqual([
      {
        oldPath: 'README.md',
        newPath: 'README.md',
        status: 'modified',
        additions: 2,
        deletions: 1,
        isLarge: false,
        hunks: [
          {
            header: '@@ -1,2 +1,3 @@',
            lines: [
              {
                type: 'context',
                content: 'Existing',
                oldLineNumber: 1,
                newLineNumber: 1,
              },
              {
                type: 'deletion',
                content: 'Old',
                oldLineNumber: 2,
                newLineNumber: null,
              },
              {
                type: 'addition',
                content: 'New',
                oldLineNumber: null,
                newLineNumber: 2,
              },
              {
                type: 'addition',
                content: 'More',
                oldLineNumber: null,
                newLineNumber: 3,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('parses added, deleted, renamed, copied, and binary file statuses', () => {
    const files = parseUnifiedDiff(
      [
        'diff --git a/new.md b/new.md',
        'new file mode 100644',
        '@@ -0,0 +1 @@',
        '+new',
        'diff --git a/old.md b/old.md',
        'deleted file mode 100644',
        '@@ -1 +0,0 @@',
        '-old',
        'diff --git a/from.md b/to.md',
        'similarity index 88%',
        'rename from from.md',
        'rename to to.md',
        'diff --git a/source.md b/copy.md',
        'similarity index 100%',
        'copy from source.md',
        'copy to copy.md',
        'diff --git a/image.png b/image.png',
        'Binary files a/image.png and b/image.png differ',
      ].join('\n'),
      { largeFileLineThreshold: 400 },
    );

    expect(files.map((file) => file.status)).toEqual([
      'added',
      'deleted',
      'renamed',
      'copied',
      'binary',
    ]);
    expect(files.at(0)?.oldPath).toBeNull();
    expect(files.at(1)?.newPath).toBeNull();
    expect(files.at(2)?.oldPath).toBe('from.md');
    expect(files.at(2)?.newPath).toBe('to.md');
  });

  it('collapses large files and can parse one file without the threshold', () => {
    const patch = [
      'diff --git a/large.ts b/large.ts',
      '@@ -1,1 +1,3 @@',
      ' line',
      '+one',
      '+two',
    ].join('\n');

    expect(parseUnifiedDiff(patch, { largeFileLineThreshold: 2 })[0]).toMatchObject({
      newPath: 'large.ts',
      isLarge: true,
      hunks: [],
    });
    expect(parseUnifiedFileDiff(patch).hunks.at(0)?.lines).toHaveLength(3);
  });

  it('summarizes numeric numstat lines and ignores binary counts', () => {
    expect(parseNumstat('3\t1\tREADME.md\n-\t-\timage.png\n')).toEqual({
      filesChanged: 2,
      additions: 3,
      deletions: 1,
    });
  });
});
