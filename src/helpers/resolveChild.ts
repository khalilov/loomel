import { type App } from '../types'

export const resolveChild = (child: Element | App<Element> | string | number): string | Node => {
  if (child instanceof Element) {
    return child
  }
  if (typeof child === 'object') {
    return child.node
  }
  return String(child)
}
