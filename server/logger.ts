export function info(message: string, meta?: any) {
  try { console.log('[info]', message, meta ? JSON.stringify(meta) : ''); } catch (e) { console.log('[info]', message); }
}
export function warn(message: string, meta?: any) {
  try { console.warn('[warn]', message, meta ? JSON.stringify(meta) : ''); } catch (e) { console.warn('[warn]', message); }
}
export function error(message: string, meta?: any) {
  try { console.error('[error]', message, meta ? JSON.stringify(meta) : ''); } catch (e) { console.error('[error]', message); }
}
export function debug(message: string, meta?: any) {
  try { console.debug('[debug]', message, meta ? JSON.stringify(meta) : ''); } catch (e) { console.debug('[debug]', message); }
}
export default { info, warn, error, debug };
