import type { FormEvent } from 'react';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatRendererError } from '@/electron/renderer/shared/errors';
import { useCreateNote, useDeleteNote, useNotes } from '../hooks/use-notes';

export function NotesPage() {
  const notes = useNotes();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createNote.mutate(
      { title, body },
      {
        onSuccess: () => {
          setTitle('');
          setBody('');
        },
      },
    );
  };

  return (
    <section className="grid max-w-5xl grid-cols-[minmax(280px,360px)_1fr] gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-300">
          Golden feature
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Notes</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          Notes demonstrate route, React Query, typed preload IPC, Zod validation,
          use-cases, and SQLite persistence.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-zinc-200">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
              placeholder="Decision log"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-200">Body</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="mt-2 min-h-28 w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
              placeholder="Write a short note"
            />
          </label>
          <button
            type="submit"
            disabled={!title.trim() || createNote.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-3 py-2 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add note
          </button>
          {createNote.error && (
            <p className="text-sm text-red-300">{formatRendererError(createNote.error)}</p>
          )}
        </form>
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h3 className="font-medium text-zinc-100">Saved notes</h3>
        </div>
        <div className="divide-y divide-zinc-800">
          {notes.isLoading && <p className="p-4 text-sm text-zinc-400">Loading notes</p>}
          {notes.error && (
            <p className="p-4 text-sm text-red-300">{formatRendererError(notes.error)}</p>
          )}
          {notes.data?.length === 0 && (
            <p className="p-4 text-sm text-zinc-400">No notes yet.</p>
          )}
          {notes.data?.map((note) => (
            <article key={note.id} className="group grid grid-cols-[1fr_auto] gap-3 p-4">
              <div>
                <h4 className="font-medium text-zinc-100">{note.title}</h4>
                {note.body && <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">{note.body}</p>}
                <p className="mt-3 text-xs text-zinc-500">
                  Updated {new Date(note.updatedAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Delete ${note.title}`}
                onClick={() => deleteNote.mutate({ id: note.id })}
                className="h-9 w-9 rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-red-300"
              >
                <Trash2 aria-hidden="true" className="mx-auto h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
