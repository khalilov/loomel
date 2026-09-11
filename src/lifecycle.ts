const cleanups = new WeakMap<Element, Set<() => void>>()

export const registerLifecycle = (element: Element, cleanup: () => void): (() => void) => {
  const elementCleanups = cleanups.get(element) ?? new Set()

  elementCleanups.add(cleanup)
  cleanups.set(element, elementCleanups)

  return () => {
    elementCleanups.delete(cleanup)

    if (elementCleanups.size === 0) {
      cleanups.delete(element)
    }
  }
}

export const watch = (root: Document | Element | ShadowRoot): (() => void) => {
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const removedNode of record.removedNodes) {
        if (removedNode instanceof Element && !removedNode.isConnected) {
          cleanups.get(removedNode)?.forEach((cleanup) => cleanup())

          removedNode.querySelectorAll('*').forEach((element) => {
            if (!element.isConnected) {
              cleanups.get(element)?.forEach((cleanup) => cleanup())
            }
          })
        }
      }
    }
  })

  observer.observe(root, { childList: true, subtree: true })

  return () => observer.disconnect()
}
