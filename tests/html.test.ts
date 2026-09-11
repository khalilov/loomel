import { describe, expect, it, beforeEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'

import { html } from '../src/html'

const setupDom = () => {
  const dom = new JSDOM('<!DOCTYPE html><body></body>')
  Object.assign(globalThis, {
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Element: dom.window.Element,
    SVGElement: dom.window.SVGElement,
    MutationObserver: dom.window.MutationObserver,
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

  it('text updates text content and chains', () => {
    const el = html('div').append(html('span'))

    expect(el.text(42)).toBe(el)
    expect(el.node.textContent).toBe('42')
    expect(el.node.children.length).toBe(0)
  })

  it('data reads, writes, deletes and chains dataset values', () => {
    const el = html('div')

    expect(el.data()).toBe(el.node.dataset)
    expect(el.data('missing')).toBeUndefined()
    expect(el.data('buildingId', 42).data('buildingReady', true)).toBe(el)
    expect(el.data('buildingId')).toBe('42')
    expect(el.data('buildingReady')).toBe('true')
    expect(el.data({ level: 3, selected: false, buildingReady: null })).toBe(el)
    expect(el.data('level')).toBe('3')
    expect(el.data('selected')).toBe('false')
    expect(el.data('buildingReady')).toBeUndefined()
  })

  it('style merges CSS properties in place and chains', () => {
    const el = html('div')
    expect(el.style({ width: 10, opacity: 0.5, margin: 0, '--gap': '2rem' })).toBe(el)
    expect(el.node.style.width).toBe('10px')
    expect(el.node.style.opacity).toBe('0.5')
    expect(el.node.style.margin).toBe('0px')
    expect(el.node.style.getPropertyValue('--gap')).toBe('2rem')
    el.style({ height: '5px' })
    expect(el.node.style.height).toBe('5px')
    expect(el.node.style.width).toBe('10px')
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

  it('on passes event listener options and keeps manual unsubscribe', () => {
    const el = html('button')
    let count = 0

    el.on('click', () => (count += 1), { once: true })
    el.node.click()
    el.node.click()
    expect(count).toBe(1)

    const off = el.on('click', () => (count += 1), { capture: true })
    off()
    el.node.click()
    expect(count).toBe(1)
  })

  it('watch cleans listeners when external code removes an App', async () => {
    const { watch } = await import('../src/lifecycle')
    const document = globalThis.document
    const button = html('button')
    const nextParent = document.createElement('div')
    let count = 0

    button.on('click', () => (count += 1))
    document.body.append(button.node, nextParent)
    expect(button.connected).toBe(true)

    const stop = watch(document.body)
    nextParent.append(button.node)
    await new Promise<void>((resolve) => queueMicrotask(resolve))
    button.node.click()
    expect(count).toBe(1)

    button.node.remove()
    await new Promise<void>((resolve) => queueMicrotask(resolve))
    button.node.click()

    expect(button.connected).toBe(false)
    expect(count).toBe(1)
    stop()
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
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const el = html('div')
    el.append(
      html('span', { props: { className: 'target' } }),
      html('span', { props: { className: 'other' } }),
    )
    const found = el.query('.target')
    expect(found).toBeInstanceOf(globalThis.HTMLElement)
    expect(found!.className).toBe('target')
    expect(warn).toHaveBeenCalledWith('query() is potentially deprecated; use find() instead')
    warn.mockRestore()
  })

  it('queryAll returns all matching elements', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const el = html('div')
    el.append(
      html('span', { props: { className: 'item' } }),
      html('span', { props: { className: 'item' } }),
      html('span', { props: { className: 'other' } }),
    )
    const found = el.queryAll('.item')
    expect(found.length).toBe(2)
    expect(warn).toHaveBeenCalledWith('queryAll() is potentially deprecated; use findAll() instead')
    warn.mockRestore()
  })

  it('query returns null when no match', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const el = html('div')
    el.append(html('span', { props: { className: 'a' } }))
    expect(el.query('.missing')).toBeNull()
    warn.mockRestore()
  })

  it('find returns an App with the full API', () => {
    const el = html('div')
    el.append(html('span', { props: { className: 'a' } }))
    const found = el.find('.a')
    expect(found).not.toBeNull()
    found!.replace(html('span', { props: { className: 'b', textContent: 'x' } }))
    expect(found!.node.textContent).toBe('x')
    expect(found!.node.children[0].className).toBe('b')
  })

  it('find returns null when no match', () => {
    const el = html('div')
    expect(el.find('.missing')).toBeNull()
  })

  it('findAll returns Apps for all matching HTML elements', () => {
    const el = html('div')
    el.append(
      html('span', { props: { className: 'item' } }),
      html('span', { props: { className: 'item' } }),
    )
    const found = el.findAll('.item')
    found.forEach((item) => item.style({ opacity: 0.5 }))
    expect(found.length).toBe(2)
    expect(found.every((item) => item.node.style.opacity === '0.5')).toBe(true)
    expect(el.findAll('.missing')).toEqual([])
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
