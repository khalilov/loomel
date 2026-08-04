import { apply } from './apply'
import { type App, type Child, type ElementConfig } from './types'

const isMountable = (child: Child): child is Exclude<Child, null | false | Child[]> => child !== null && child !== false && !Array.isArray(child)

const flatten = (children: Child[]): Exclude<Child, null | false | Child[]>[] =>
  children.flatMap((child) => (Array.isArray(child) ? flatten(child) : child)).filter(isMountable)

export const create = <Tag extends keyof HTMLElementTagNameMap>(
  tag: Tag,
  config?: ElementConfig<Tag>
): App<HTMLElementTagNameMap[Tag]> => {
  const node = document.createElement(tag)
  const subscriptions: Array<() => void> = []

  const app: App<HTMLElementTagNameMap[Tag]> = {
    node,
    set(props) {
      apply(node, props)
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

  if (config) {
    if (config.props) apply(node, config.props)

    if (config.on) {
      for (const [type, handler] of Object.entries(config.on)) {
        app.on(type as keyof HTMLElementEventMap, handler as EventListener)
      }
    }

    if (config.children) {
      const children = Array.isArray(config.children) ? config.children : [config.children]
      app.append(...children)
    }
  }

  return app
}

const resolveChild = (child: HTMLElement | App | string | number): string | Node => {
  if (child instanceof HTMLElement) return child
  if (typeof child === 'object') return child.node
  return String(child)
}
