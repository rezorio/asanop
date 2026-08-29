/** Dispatched after project create / rename / archive so the sidebar can refresh. */
export const PROJECTS_CHANGED_EVENT = 'asanop:projects-changed'

export function notifyProjectsChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(PROJECTS_CHANGED_EVENT))
}
