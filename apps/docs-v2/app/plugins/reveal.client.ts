/**
 * Scroll-reveal driver for the landing page.
 *
 * Elements marked `.reveal` (or `.reveal-stagger` for staggered children) get
 * a `.reveal-in` class the moment they enter the viewport, which plays the
 * `landing-rise` keyframe defined in main.css. The CSS never hides `.reveal`
 * by default, so this is pure progressive enhancement: no JS / no-motion users
 * just see the content, with no first-paint flash.
 *
 * We re-scan after every navigation because the landing renders through
 * <ContentRenderer>, so its `.reveal` nodes only exist once the page mounts.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) return

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('reveal-in')
        observer.unobserve(entry.target)
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  )

  const scan = () => {
    const targets = document.querySelectorAll('.reveal:not(.reveal-in), .reveal-stagger:not(.reveal-in)')
    targets.forEach((el) => {
      // With motion disabled, reveal immediately so nothing depends on scroll.
      if (reduce) {
        el.classList.add('reveal-in')
        return
      }
      observer.observe(el)
    })
  }

  // Rescan after each page render (initial mount + every client navigation).
  // On client-side navigation the landing renders through <ContentRenderer>
  // after its useAsyncData resolves, so the nodes can appear a few frames
  // after `page:finish`. Retry a handful of times to catch them; observing an
  // already-observed element is a no-op, so repeats are harmless.
  nuxtApp.hook('page:finish', () => {
    let tries = 0
    const tick = () => {
      scan()
      if (++tries < 6) setTimeout(tick, 120)
    }
    requestAnimationFrame(() => requestAnimationFrame(tick))
  })
})
