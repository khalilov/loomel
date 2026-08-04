import type { Child } from '../types'
import { isMountable } from './isMountable'

export const flatten = (children: Child[]): Exclude<Child, null | false | Child[]>[] =>
  children.flatMap((child) => (Array.isArray(child) ? flatten(child) : child)).filter(isMountable)
