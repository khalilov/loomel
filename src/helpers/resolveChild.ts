import { type App } from '../types'

export const resolveChild = (child: HTMLElement | App | string | number): string | Node => {
  if (child instanceof HTMLElement) {
    return child
  }
  if (typeof child === 'object') {
    return child.node
  }
  return String(child)
}
