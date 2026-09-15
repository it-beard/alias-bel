import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Mark, Motif } from './Ornament.jsx'
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

describe('Mark', () => {
  it('малюе ромб з унутраным ромбам', () => {
    const { container } = render(<Mark size={30} className="brand__mark" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('mark', 'brand__mark')
    expect(svg).toHaveAttribute('width', '30')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg.querySelectorAll('path')).toHaveLength(2)
  })
})
