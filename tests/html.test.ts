import { describe, expect, it, beforeEach } from 'vitest'
import { JSDOM } from 'jsdom'

import { html } from '../src/html'

const setupDom = () => {
  const dom = new JSDOM('<!DOCTYPE html><body></body>')
  Object.assign(globalThis, {
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Element: dom.window.Element,
    Node: dom.window.Node,
  })
  return dom.window.document
}

describe('html', () => {
  beforeEach(() => {
    setupDom()
  })

  it('creates element with strict typed props', () => {
    const button = html('button', {
      props: { className: 'btn', textContent: 'Click', dataset: { id: '42' } },
    })
    expect(button.node.tagName).toBe('BUTTON')
    expect(button.node.className).toBe('btn')
    expect(button.node.textContent).toBe('Click')
    expect(button.node.dataset.id).toBe('42')
  })

  it('appends nested children and resolves App to node', () => {
    const outer = html('div')
    const inner = html('span', { props: { textContent: 'hi' } })
    outer.append('text-', 42, inner)
    expect(outer.node.children.length).toBe(1)
    expect(outer.node.childNodes[0].textContent).toBe('text-')
    expect(outer.node.children[0].textContent).toBe('hi')
  })

  it('replace redraws children and drops falsy skips', () => {
    const wrap = html('div')
    wrap.append(html('b', { props: { textContent: 'a' } }), null, false)
    expect(wrap.node.children.length).toBe(1)
    wrap.replace(html('i', { props: { textContent: 'b' } }))
    expect(wrap.node.children.length).toBe(1)
    expect(wrap.node.textContent).toBe('b')
  })

  it('prepend adds children to the beginning', () => {
    const el = html('div')
    el.append(html('span', { props: { textContent: 'b' } }))
    el.prepend(html('span', { props: { textContent: 'a' } }))
    expect(el.node.children.length).toBe(2)
    expect(el.node.textContent).toBe('ab')
  })

  it('set updates props in place', () => {
    const el = html('div', { props: { className: 'a' } })
    el.set({ className: 'b', textContent: 'x' })
    expect(el.node.className).toBe('b')
    expect(el.node.textContent).toBe('x')
  })

  it('on wires a listener and dispose removes it and the node', () => {
    const document = globalThis.document
    let count = 0
    const el = html('button')
    el.on('click', () => (count += 1))
    document.body.append(el.node)
    el.node.click()
    expect(count).toBe(1)
    el.dispose()
    expect(document.body.contains(el.node)).toBe(false)
  })

  it('clear removes children and subscriptions but keeps the node', () => {
    const document = globalThis.document
    let count = 0
    const el = html('div')
    el.on('click', () => (count += 1))
    el.append(html('span', { props: { textContent: 'a' } }), html('span', { props: { textContent: 'b' } }))
    document.body.append(el.node)
    el.node.click()
    expect(count).toBe(1)
    expect(el.node.children.length).toBe(2)
    el.clear()
    expect(el.node.children.length).toBe(0)
    expect(document.body.contains(el.node)).toBe(true)
    el.node.click()
    expect(count).toBe(1)
  })

  it('query returns a single element', () => {
    const el = html('div')
    el.append(
      html('span', { props: { className: 'target' } }),
      html('span', { props: { className: 'other' } }),
    )
    const found = el.query('.target')
    expect(found).toBeInstanceOf(globalThis.HTMLElement)
    expect(found!.className).toBe('target')
  })

  it('queryAll returns all matching elements', () => {
    const el = html('div')
    el.append(
      html('span', { props: { className: 'item' } }),
      html('span', { props: { className: 'item' } }),
      html('span', { props: { className: 'other' } }),
    )
    const found = el.queryAll('.item')
    expect(found.length).toBe(2)
  })

  it('query returns null when no match', () => {
    const el = html('div')
    el.append(html('span', { props: { className: 'a' } }))
    expect(el.query('.missing')).toBeNull()
  })

  it('find returns an App with the full API', () => {
    const el = html('div')
    el.append(html('span', { props: { className: 'a' } }))
    const found = el.find('.a')
    expect(found).not.toBeNull()
    found!.replace(html('span', { props: { className: 'b', textContent: 'x' } }))
    expect(el.query('.a')!.textContent).toBe('x')
    expect(el.query('.a')!.children[0].className).toBe('b')
  })

  it('find returns null when no match', () => {
    const el = html('div')
    expect(el.find('.missing')).toBeNull()
  })

  it('flattens nested Child arrays recursively', () => {
    const el = html('ul')
    const a = html('li', { props: { textContent: 'a' } })
    const b = html('li', { props: { textContent: 'b' } })
    const c = html('li', { props: { textContent: 'c' } })
    el.append(a, [b, [c]])
    expect(el.node.children.length).toBe(3)
    expect(el.node.textContent).toBe('abc')
  })

  it('drops falsy values inside nested arrays', () => {
    const el = html('ul')
    el.append([html('li', { props: { textContent: 'a' } }), null, [false, html('li', { props: { textContent: 'b' } })]])
    expect(el.node.children.length).toBe(2)
    expect(el.node.textContent).toBe('ab')
  })
})
