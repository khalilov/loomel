import { type Child } from '../types'

export const resolveChild = (child: Exclude<Child, null | false | Child[]>): string | Node => {
  if (child instanceof Element) {
    return child
  }
  if (typeof child === 'object') {
    return child.node
  }
  return String(child)
}
