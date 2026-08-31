import { describe, expect, it, beforeEach } from 'vitest'
import { JSDOM } from 'jsdom'

import { svg } from '../src/svg'
import { html } from '../src/html'

const setupDom = () => {
  const dom = new JSDOM('<!DOCTYPE html><body></body>')
  Object.assign(globalThis, {
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Element: dom.window.Element,
    SVGElement: dom.window.SVGElement,
    Node: dom.window.Node,
    Event: dom.window.Event,
  })
  return dom.window.document
}

describe('svg', () => {
  beforeEach(() => {
    setupDom()
  })

  it('creates an element in the SVG namespace', () => {
    const icon = svg('svg', { props: { viewBox: '0 0 24 24' } })
    expect(icon.node.namespaceURI).toBe('http://www.w3.org/2000/svg')
    expect(icon.node.getAttribute('viewBox')).toBe('0 0 24 24')
  })

  it('sets presentation attributes via setAttribute', () => {
    const path = svg('path', {
      props: { d: 'M0 0L10 10', fill: 'currentColor', 'stroke-width': 2 },
    })
    expect(path.node.getAttribute('d')).toBe('M0 0L10 10')
    expect(path.node.getAttribute('fill')).toBe('currentColor')
    expect(path.node.getAttribute('stroke-width')).toBe('2')
  })

  it('updates attributes in place through set()', () => {
    const circle = svg('circle')
    circle.set({ r: 5, cx: 10, cy: 10 })
    expect(circle.node.getAttribute('r')).toBe('5')
    circle.set({ r: 8 })
    expect(circle.node.getAttribute('r')).toBe('8')
    expect(circle.node.getAttribute('cx')).toBe('10')
  })

  it('applies style through set()', () => {
    const rect = svg('rect', { props: { style: { fill: 'red' } } })
    expect(rect.node.style.fill).toBe('red')
    rect.set({ style: { stroke: 'blue' } })
    expect(rect.node.style.stroke).toBe('blue')
  })

  it('nests SVG inside HTML', () => {
    const icon = html('span', {
      children: [
        svg('svg', {
          props: { viewBox: '0 0 24 24' },
          children: [svg('path', { props: { d: 'M0 0' } })],
        }),
      ],
    })
    document.body.append(icon.node)
    const path = icon.node.querySelector('path')
    expect(path).not.toBeNull()
    expect(path!.namespaceURI).toBe('http://www.w3.org/2000/svg')
  })

  it('wires and disposes events', () => {
    const document = globalThis.document
    let count = 0
    const circle = svg('circle')
    circle.on('click', () => (count += 1))
    document.body.append(circle.node)
    circle.node.dispatchEvent(new Event('click'))
    expect(count).toBe(1)
    circle.dispose()
    circle.node.dispatchEvent(new Event('click'))
    expect(count).toBe(1)
    expect(document.body.contains(circle.node)).toBe(false)
  })
})
