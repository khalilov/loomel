import { apply } from './apply'
import { type App, type Child, type ElementConfig } from './types'

const isMountable = (child: Child): child is Exclude<Child, null | false> => child !== null && child !== false

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
      node.append(...children.filter(isMountable).map(resolveChild))
      return app
    },
    prepend(...children) {
      node.prepend(...children.filter(isMountable).map(resolveChild))
      return app
    },
    replace(...children) {
      node.replaceChildren(...children.filter(isMountable).map(resolveChild))
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

const resolveChild = (child: Exclude<Child, null | false>): string | Node => {
  if (child instanceof HTMLElement) return child
  if (typeof child === 'object') return child.node
  return String(child)
}
