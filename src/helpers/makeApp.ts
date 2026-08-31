import { type App, type SetProps } from '../types'
import { flatten } from './flatten'
import { resolveChild } from './resolveChild'

export const makeApp = <T extends Element>(node: T, setProps: (props: SetProps<T>) => void): App<T> => {
  const subscriptions: Array<() => void> = []

  const app: App<T> = {
    node,
    set(props) {
      setProps(props)
      return app
    },
    append(...children) {
      node.append(...flatten(children).map(resolveChild))
      return app
    },
    prepend(...children) {
      node.prepend(...flatten(children).map(resolveChild))
      return app
    },
    replace(...children) {
      node.replaceChildren(...flatten(children).map(resolveChild))
      return app
    },
    clear() {
      subscriptions.forEach((off) => off())
      subscriptions.length = 0
      node.replaceChildren()
      return app
    },
    on(type, handler) {
      const listener = handler as EventListener
      node.addEventListener(type, listener)
      const off = () => node.removeEventListener(type, listener)
      subscriptions.push(off)
      return off
    },
    query(sel) {
      return node.querySelector(sel)
    },
    queryAll(sel) {
      return node.querySelectorAll(sel)
    },
    dispose() {
      subscriptions.forEach((off) => off())
      node.remove()
    },
  }

  return app
}
