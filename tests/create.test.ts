import { describe, expect, it, beforeEach } from 'vitest'
import { JSDOM } from 'jsdom'

import { create } from '../src/create'

const setupDom = () => {
  const dom = new JSDOM('<!DOCTYPE html><body></body>')
  Object.assign(globalThis, {
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
  })
  return dom.window.document
}

describe('create', () => {
  beforeEach(() => {
    setupDom()
  })

  it('creates element with strict typed props', () => {
    const button = create('button', {
      props: { className: 'btn', textContent: 'Click', dataset: { id: '42' } },
    })
    expect(button.node.tagName).toBe('BUTTON')
    expect(button.node.className).toBe('btn')
    expect(button.node.textContent).toBe('Click')
    expect(button.node.dataset.id).toBe('42')
  })

  it('appends nested children and resolves App to node', () => {
    const outer = create('div')
    const inner = create('span', { props: { textContent: 'hi' } })
    outer.append('text-', 42, inner)
    expect(outer.node.children.length).toBe(1)
    expect(outer.node.childNodes[0].textContent).toBe('text-')
    expect(outer.node.children[0].textContent).toBe('hi')
  })

  it('replace redraws children and drops falsy skips', () => {
    const wrap = create('div')
    wrap.append(create('b', { props: { textContent: 'a' } }), null, false)
    expect(wrap.node.children.length).toBe(1)
    wrap.replace(create('i', { props: { textContent: 'b' } }))
    expect(wrap.node.children.length).toBe(1)
    expect(wrap.node.textContent).toBe('b')
  })

  it('set updates props in place', () => {
    const el = create('div', { props: { className: 'a' } })
    el.set({ className: 'b', textContent: 'x' })
    expect(el.node.className).toBe('b')
    expect(el.node.textContent).toBe('x')
  })

  it('on wires a listener and dispose removes it and the node', () => {
    const document = globalThis.document
    let count = 0
    const el = create('button')
    el.on('click', () => (count += 1))
    document.body.append(el.node)
    el.node.click()
    expect(count).toBe(1)
    el.dispose()
    expect(document.body.contains(el.node)).toBe(false)
  })
})
