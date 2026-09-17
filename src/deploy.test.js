import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ADULT } from './data/words.js'

const root = resolve(import.meta.dirname, '..')
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const readBuffer = (path) => readFileSync(resolve(root, path))

describe('публікацыя на GitHub Pages', () => {
  it('CNAME трапляе ў зборку, інакш публікацыя сатрэ свой дамен', () => {
    expect(read('public/CNAME').trim()).toBe('alias.itbeard.com')
  })

  it('воркфлоў дэплою запускаецца пры пушы ў main і публікуе толькі пасля праверак', () => {
    const workflow = read('.github/workflows/deploy.yml')
    expect(workflow).toMatch(/push:\s*\n\s*branches: \[main\]/)
    // Крокі праверак жывуць у composite action; перад ім абавязкова checkout —
    // інакш файла на раннеры яшчэ няма. Артэфакт выкладаецца толькі пасля іх.
    const order = ['actions/checkout@', 'uses: ./.github/actions/checks', 'actions/upload-pages-artifact@'].map((step) => workflow.indexOf(step))
    order.forEach((index) => expect(index).toBeGreaterThan(-1))
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    expect(workflow).toContain('path: dist')
    // Публікацыя чакае праверак — без гэтага сайт абнаўляўся б і на чырвоных тэстах.
    expect(workflow).toMatch(/needs: check/)
    expect(workflow).toContain('actions/deploy-pages@')
    // Без гэтых дазволаў deploy-pages падае.
    expect(workflow).toMatch(/pages: write/)
    expect(workflow).toMatch(/id-token: write/)
  })

  it('агульныя праверкі ідуць па чарзе: Node, залежнасці, лінтар, тэсты, зборка', () => {
    const checks = read('.github/actions/checks/action.yml')
    expect(checks).toMatch(/using: composite/)
    const order = ['actions/setup-node@', 'npm ci', 'npm run lint', 'npm test', 'npm run build'].map((step) => checks.indexOf(step))
    order.forEach((index) => expect(index).toBeGreaterThan(-1))
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  it('у .github/workflows няма файлаў толькі пад workflow_call — кожны такі відзён у спісе Actions', () => {
    for (const file of readdirSync(resolve(root, '.github/workflows'))) {
      expect(read(`.github/workflows/${file}`), file).not.toMatch(/workflow_call/)
    }
  })

  it('CI для pull request і канфіг Dependabot на месцы', () => {
    expect(read('.github/workflows/ci.yml')).toMatch(/pull_request:/)
    expect(read('.github/workflows/ci.yml')).toContain('uses: ./.github/actions/checks')
    const dependabot = read('.github/dependabot.yml')
    expect(dependabot).toMatch(/package-ecosystem: npm/)
    expect(dependabot).toMatch(/package-ecosystem: github-actions/)
    // Са `/` Dependabot не бачыць composite action — каталог трэба назваць асобна.
    expect(dependabot).toContain('/.github/actions/checks')
    expect(existsSync(resolve(root, 'package-lock.json'))).toBe(true)
  })

  it('мае поўныя SEO- і social-метаданыя з кананічным даменам', () => {
    const html = read('index.html')
    expect(html).toContain('<link rel="canonical" href="https://alias.itbeard.com/" />')
    expect(html).toContain('<meta name="robots" content="index, follow, max-image-preview:large" />')
    expect(html).toContain('<meta property="og:image" content="https://alias.itbeard.com/og-image.png" />')
    expect(html).toContain('<meta property="og:image:width" content="1200" />')
    expect(html).toContain('<meta property="og:image:height" content="630" />')
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />')

    const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]
    const graph = JSON.parse(jsonLd)['@graph']
    expect(graph.some((item) => item['@type'] === 'WebApplication')).toBe(true)
    expect(graph.find((item) => item['@type'] === 'FAQPage').mainEntity).toHaveLength(3)
  })

  it('аддае robots, sitemap, GEO-апісанне і social preview патрэбнага памеру', () => {
    expect(read('public/robots.txt')).toContain('Sitemap: https://alias.itbeard.com/sitemap.xml')
    expect(read('public/sitemap.xml')).toContain('<loc>https://alias.itbeard.com/</loc>')
    expect(read('public/llms.txt')).toContain('886 унікальных беларускіх слоў')
    expect(read('public/llms.txt')).toContain(`${ADULT.length} слоў беларускай секс-лексікі`)
    expect(read('README.md')).toContain(`${ADULT.length} слоў беларускай секс-лексікі`)

    const image = readBuffer('public/og-image.png')
    expect(image.subarray(1, 4).toString()).toBe('PNG')
    expect(image.readUInt32BE(16)).toBe(1200)
    expect(image.readUInt32BE(20)).toBe(630)
  })
})
