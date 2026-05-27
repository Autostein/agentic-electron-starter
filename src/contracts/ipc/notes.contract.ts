import { z } from 'zod';

export const NOTES_IPC_CHANNELS = {
  list: 'notes:list',
  create: 'notes:create',
  delete: 'notes:delete',
} as const;

export const NoteResultSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string(),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
});

export const CreateNoteInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().max(10000).optional().default(''),
});

export const DeleteNoteInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const NotesListResultSchema = z.array(NoteResultSchema);

export type NoteResult = z.infer<typeof NoteResultSchema>;
export type CreateNoteInput = z.input<typeof CreateNoteInputSchema>;
export type DeleteNoteInput = z.input<typeof DeleteNoteInputSchema>;
