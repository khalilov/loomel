export const apply = <T extends HTMLElement>(element: T, props: Partial<T>): void => {
  Object.entries(props).forEach(([key, value]) => {
    if (value === undefined) return

    switch (key) {
      case 'className': {
        element.className = String(value)
        break
      }
      case 'style': {
        Object.assign(element.style, value)
        break
      }
      case 'dataset': {
        Object.assign(element.dataset, value)
        break
      }
      case 'textContent': {
        element.textContent = String(value)
        break
      }
      default: {
        Reflect.set(element, key, value)
      }
    }
  })
}
