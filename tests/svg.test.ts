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

  it('style merges CSS properties in place', () => {
    const rect = svg('rect')
    expect(rect.style({ fill: 'red', opacity: 0.5, strokeWidth: 2 })).toBe(rect)
    expect(rect.node.style.fill).toBe('red')
    expect(rect.node.style.opacity).toBe('0.5')
    expect(rect.node.style.strokeWidth).toBe('2')
    rect.style({ stroke: 'blue' })
    expect(rect.node.style.stroke).toBe('blue')
    expect(rect.node.style.fill).toBe('red')
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

  it('find and findAll wrap SVG elements with the full API', () => {
    const icon = svg('svg', {
      children: [svg('rect', { props: { className: 'shape' } }), svg('circle', { props: { className: 'shape' } })],
    })
    const rect = icon.find('rect')
    const shapes = icon.findAll('.shape')

    expect(rect?.node).toBeInstanceOf(globalThis.SVGElement)
    rect?.set({ fill: 'red' }).text('x')
    expect(rect?.node.getAttribute('fill')).toBe('red')
    expect(rect?.node.textContent).toBe('x')
    expect(rect?.data('kind', 'shape')).toBe(rect)
    expect(rect?.data('kind')).toBe('shape')
    expect(shapes.length).toBe(2)
    expect(shapes.every((shape) => shape.node instanceof globalThis.SVGElement)).toBe(true)
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
