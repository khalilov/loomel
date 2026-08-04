import type { Child } from '../types'

export const isMountable = (child: Child): child is Exclude<Child, null | false | Child[]> =>
  child !== null && child !== false && !Array.isArray(child)
