// @vitest-environment jsdom

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DesktopApi } from '@/contracts/ipc/shared/desktop-api';
import { renderWithQuery } from '../../../shared/testing/render-with-query';
import { NotesPage } from '../ui/NotesPage';

describe('NotesPage', () => {
  beforeEach(() => {
    const notes = [
      {
        id: 'note-1',
        title: 'Existing note',
        body: 'Already stored',
        createdAt: 100,
        updatedAt: 100,
      },
    ];

    window.desktop = {
      appInfo: {
        get: vi.fn(),
      },
      workspaces: {
        pick: vi.fn(),
        list: vi.fn(),
      },
      agentRuns: {
        start: vi.fn(),
        list: vi.fn(),
        get: vi.fn(),
        getCommitDetails: vi.fn(),
        getCommitFileDiff: vi.fn(),
        cancel: vi.fn(),
        onEvent: vi.fn(() => () => undefined),
      },
      agentRuntime: {
        listProviderAuthStatuses: vi.fn(),
        listProfiles: vi.fn(),
        getProfile: vi.fn(),
        updateProfile: vi.fn(),
        duplicateStarterProfile: vi.fn(),
        getProfileDockerfile: vi.fn(),
        updateProfileDockerfile: vi.fn(),
        resetProfileDockerfile: vi.fn(),
        openProfileFolder: vi.fn(),
        getImageStatus: vi.fn(),
        buildImage: vi.fn(),
        onBuildEvent: vi.fn(() => () => undefined),
      },
      notes: {
        list: vi.fn(async () => notes),
        create: vi.fn(async (input) => {
          const note = {
            id: 'note-2',
            title: input.title,
            body: input.body ?? '',
            createdAt: 200,
            updatedAt: 200,
          };
          notes.unshift(note);
          return note;
        }),
        delete: vi.fn(async ({ id }) => {
          const index = notes.findIndex((note) => note.id === id);
          if (index >= 0) {
            notes.splice(index, 1);
          }
        }),
      },
    } satisfies DesktopApi;
  });

  it('renders notes and creates a note through the desktop bridge', async () => {
    renderWithQuery(<NotesPage />);

    expect(await screen.findByText('Existing note')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'New note' },
    });
    fireEvent.change(screen.getByLabelText('Body'), {
      target: { value: 'Created from renderer' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add note/i }));

    await waitFor(() => {
      expect(window.desktop.notes.create).toHaveBeenCalledWith({
        title: 'New note',
        body: 'Created from renderer',
      });
    });
  });
});
