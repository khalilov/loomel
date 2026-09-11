import { type App, type DataValue, type SetProps } from '../types'
import { registerLifecycle } from '../lifecycle'
import { apply } from './apply'
import { applySvg } from './applySvg'
import { applyStyle } from './applyStyle'
import { flatten } from './flatten'
import { resolveChild } from './resolveChild'

export const makeApp = <T extends HTMLElement | SVGElement>(
  node: T,
  setProps: (props: SetProps<T>) => void,
): App<T> => {
  const subscriptions: Array<() => void> = []
  const cleanup = (): void => {
    subscriptions.forEach((off) => off())
    subscriptions.length = 0
  }
  const unregisterLifecycle = registerLifecycle(node, cleanup)
  const data = ((keyOrValues?: string | Record<string, DataValue>, value?: DataValue) => {
    if (keyOrValues === undefined) {
      return node.dataset
    } else if (typeof keyOrValues === 'string') {
      if (value === undefined) {
        return node.dataset[keyOrValues]
      } else if (value === null) {
        delete node.dataset[keyOrValues]
      } else {
        node.dataset[keyOrValues] = String(value)
      }
    } else {
      for (const [key, nextValue] of Object.entries(keyOrValues)) {
        if (nextValue === null) {
          delete node.dataset[key]
        } else {
          node.dataset[key] = String(nextValue)
        }
      }
    }

    return app
  }) as App<T>['data']

  const app: App<T> = {
    node,
    get connected() {
      return node.isConnected
    },
    set(props) {
      setProps(props)
      return app
    },
    style(props) {
      applyStyle(node, props)
      return app
    },
    text(value) {
      node.textContent = String(value)
      return app
    },
    data,
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
      cleanup()
      node.replaceChildren()
      return app
    },
    on(type, handler, options) {
      const listener = handler as EventListener
      node.addEventListener(type, listener, options)
      const off = () => node.removeEventListener(type, listener, options)
      subscriptions.push(off)
      return off
    },
    query(sel) {
      console.warn('query() is potentially deprecated; use find() instead')
      return node.querySelector(sel)
    },
    queryAll(sel) {
      console.warn('queryAll() is potentially deprecated; use findAll() instead')
      return node.querySelectorAll(sel)
    },
    find(sel): App<HTMLElement> | App<SVGElement> | null {
      const element = node.querySelector(sel)

      if (element instanceof HTMLElement) {
        return makeApp(element, (props) => apply(element, props))
      } else if (element instanceof SVGElement) {
        return makeApp(element, (props) => applySvg(element, props))
      }

      return null
    },
    findAll(sel): Array<App<HTMLElement> | App<SVGElement>> {
      const found: Array<App<HTMLElement> | App<SVGElement>> = []

      for (const element of node.querySelectorAll(sel)) {
        if (element instanceof HTMLElement) {
          found.push(makeApp(element, (props) => apply(element, props)))
        } else if (element instanceof SVGElement) {
          found.push(makeApp(element, (props) => applySvg(element, props)))
        }
      }

      return found
    },
    dispose() {
      cleanup()
      unregisterLifecycle()
      node.remove()
    },
  }

  return app
}
