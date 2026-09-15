import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Band, Motif } from './Ornament.jsx'
import { MOTIFS, pathFor } from '../ornament/motifs.js'

describe('Motif', () => {
  it('малюе матыў адным шляхам у зададзеным памеры', () => {
    const { container } = render(<Motif name="star" size={40} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('data-motif', 'star')
    expect(svg).toHaveAttribute('width', '40')
    expect(svg).toHaveAttribute('viewBox', '0 0 9 9')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg.querySelector('path')).toHaveAttribute('d', pathFor(MOTIFS.star.rows))
  })

  it('з подпісам становіцца выявай для чытачоў экрана', () => {
    const { getByRole } = render(<Motif name="sun" title="Знак каманды" />)
    expect(getByRole('img', { name: 'Знак каманды' })).toBeInTheDocument()
  })

  it('невядомы матыў адкатваецца да сонца', () => {
    const { container } = render(<Motif name="nope" />)
    expect(container.querySelector('path')).toHaveAttribute('d', pathFor(MOTIFS.sun.rows))
  })
})

describe('Band', () => {
  it('будуе паўтаральны ўзор на ўсю шырыню', () => {
    const { container } = render(<Band pattern="chain" height={14} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('data-band', 'chain')
    expect(svg).toHaveAttribute('width', '100%')
    expect(svg).toHaveAttribute('height', '14')
    expect(svg.querySelector('pattern')).toHaveAttribute('width', '12')
    expect(svg.querySelectorAll('rect')).toHaveLength(1)
    expect(svg.querySelector('rect').getAttribute('fill')).toMatch(/^url\(#/)
  })

  it('з лініямі дадае абрамленне зверху і знізу', () => {
    const { container } = render(<Band pattern="dotted" height={14} lines />)
    const svg = container.querySelector('svg')
    expect(svg.querySelectorAll('rect')).toHaveLength(3)
    expect(svg).toHaveAttribute('height', '22')
  })

  it('невядомая стужка адкатваецца да ланцужка', () => {
    const { container } = render(<Band pattern="nope" />)
    expect(container.querySelector('svg')).toHaveAttribute('data-band', 'nope')
    expect(container.querySelector('pattern path')).toHaveAttribute('d', expect.stringContaining('M'))
  })
})
