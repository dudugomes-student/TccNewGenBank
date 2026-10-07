export const MOTION_KEY = 'ngb2:motion';
export type MotionPreference = 'system' | 'reduced' | 'full';
export const parseMotionPreference = (value: string | null): MotionPreference =>
  value === 'reduced' || value === 'full' ? value : 'system';
export const resolveReducedMotion = (preference: MotionPreference, systemReduced: boolean) =>
  preference === 'system' ? systemReduced : preference === 'reduced';
export function getMotionPreference(): MotionPreference {
  try { return parseMotionPreference(localStorage.getItem(MOTION_KEY)); }
  catch { return 'system'; }
}
