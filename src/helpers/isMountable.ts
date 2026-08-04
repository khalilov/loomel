import { type Child } from '../types'

export const isMountable = (child: Child): child is Exclude<Child, null | false | Child[]> => {
  if (child === null) {
    return false
  }
  if (child === false) {
    return false
  }
  if (Array.isArray(child)) {
    return false
  }
  return true
}
