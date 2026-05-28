import { ipcRenderer } from 'electron';
import { unwrapIpcResult } from './ipc-result';

export async function invokeIpc<T>(channel: string, ...args: unknown[]): Promise<T> {
  return unwrapIpcResult<T>(await ipcRenderer.invoke(channel, ...args));
}
