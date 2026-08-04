import { type Child } from '../types'
import { isMountable } from './isMountable'

export const flatten = (children: Child[]): Exclude<Child, null | false | Child[]>[] => {
  return children.flatMap((child) => {
    if (Array.isArray(child)) {
      return flatten(child)
    }
    return child
  }).filter(isMountable)
}
