import { onMounted, onUnmounted } from 'vue'

/**
 * Progressive, one-shot reveal behavior for editorial surfaces.
 * Content stays immediately visible when motion is reduced or observers are unavailable.
 */
export function useScrollReveal(selector = '[data-reveal]') {
  let observer: IntersectionObserver | undefined

  onMounted(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector))
    const reducedMotion = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'))
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer?.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    )

    elements.forEach((element) => observer?.observe(element))
  })

  onUnmounted(() => observer?.disconnect())
}
