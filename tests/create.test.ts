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

  it('clear removes children and subscriptions but keeps the node', () => {
    const document = globalThis.document
    let count = 0
    const el = create('div')
    el.on('click', () => (count += 1))
    el.append(create('span', { props: { textContent: 'a' } }), create('span', { props: { textContent: 'b' } }))
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
    const el = create('div')
    el.append(
      create('span', { props: { className: 'target' } }),
      create('span', { props: { className: 'other' } }),
    )
    const found = el.query('.target')
    expect(found).toBeInstanceOf(globalThis.HTMLElement)
    expect(found!.className).toBe('target')
  })

  it('queryAll returns all matching elements', () => {
    const el = create('div')
    el.append(
      create('span', { props: { className: 'item' } }),
      create('span', { props: { className: 'item' } }),
      create('span', { props: { className: 'other' } }),
    )
    const found = el.queryAll('.item')
    expect(found.length).toBe(2)
  })

  it('query returns null when no match', () => {
    const el = create('div')
    el.append(create('span', { props: { className: 'a' } }))
    expect(el.query('.missing')).toBeNull()
  })
})
