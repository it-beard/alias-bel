import { describe, expect, it } from 'vitest'
import { isCyrillic, toLatin } from './latin.js'
import { EASY, HARD, MEDIUM } from '../data/words.js'
import { ADULT_TEAM_NAMES, APP_NAME, APP_TITLE, RANDOM_TEAM_NAMES } from '../game/constants.js'

const cases = [
  // базавыя літары
  ['хлеб', 'chleb'],
  ['гульня', 'hulnia'],
  ['жыццё', 'žyccio'],
  ['шчотка', 'ščotka'],
  ['чайнік', 'čajnik'],
  ['вожык', 'vožyk'],
  ['сэрца', 'serca'],
  ['цукар', 'cukar'],
  // ў
  ['воўк', 'voŭk'],
  ['Ваўчыца', 'Vaŭčyca'],
  ['Магілёў', 'Mahiloŭ'],
  ['Барысаў', 'Barysaŭ'],
  // цвёрдае і мяккае л
  ['малако', 'małako'],
  ['лес', 'les'],
  ['соль', 'sol'],
  ['стол', 'stoł'],
  ['люстэрка', 'lusterka'],
  ['лёд', 'lod'],
  ['ляжаць', 'lažać'],
  ['ложак', 'łožak'],
  ['Гомель', 'Homiel'],
  ['Зэльва', 'Zelva'],
  ['Лёзна', 'Lozna'],
  ['Ляхавічы', 'Lachavičy'],
  ['Жлобін', 'Žłobin'],
  ['калёсы', 'kalosy'],
  ['алея', 'aleja'],
  ['Ілля', 'Illa'],
  // ётаваныя: пачатак слова, пасля галосных, пасля зычных
  ['яблык', 'jabłyk'],
  ['яйка', 'jajka'],
  ['мяса', 'miasa'],
  ['Ежа', 'Ježa'],
  ['ёлка', 'jołka'],
  ['юнак', 'junak'],
  ['маё', 'majo'],
  ['свае', 'svaje'],
  ['Марыя', 'Maryja'],
  ['Іўе', 'Iŭje'],
  ['вясёлка', 'viasiołka'],
  ['Няміга', 'Niamiha'],
  ['Зялёны', 'Zialony'],
  ['Астравец', 'Astraviec'],
  ['Сянно', 'Sianno'],
  ['Дзякуй', 'Dziakuj'],
  ['Маладзечна', 'Maładziečna'],
  // мяккі знак
  ['дзень', 'dzień'],
  ['восень', 'vosień'],
  ['цень', 'cień'],
  ['агонь', 'ahoń'],
  ['мядзведзь', 'miadzviedź'],
  ['Беларусь', 'Biełaruś'],
  ['восьмы', 'vośmy'],
  ['мільён', 'milion'],
  ['павільён', 'pavilion'],
  ['каньён', 'kańjon'],
  // апостраф
  ["сям'я", 'siamja'],
  ['сям’я', 'siamja'],
  ["з'ява", 'zjava'],
  ["надвор'е", 'nadvorje'],
  ["пад'езд", 'padjezd'],
  ["з'інтэграваць", 'zjintehravać'],
  // г → h, х → ch
  ['Гродна', 'Hrodna'],
  ['Хата', 'Chata'],
  ['ХАТА', 'CHATA'],
  ['Верхнядзвінск', 'Vierchniadzvinsk'],
  ['Шчучын', 'Ščučyn'],
  ['Свіслач', 'Svisłač'],
  ['Раўбічы', 'Raŭbičy'],
  // жывёлы
  ['зубр', 'zubr'],
  ['бусел', 'busieł'],
  ['рысь', 'ryś'],
  ['ласі', 'łasi'],
  // фразы інтэрфейсу
  ['Пачаць гульню', 'Pačać hulniu'],
  ['Правілы', 'Praviły'],
  ['Адгадана', 'Adhadana'],
  ['Апошняе слова!', 'Apošniaje słova!'],
  ['Гуляем да', 'Hulajem da'],
  ['Раунд 3', 'Raund 3'],
  ['60 с', '60 s'],
  ['тлумач словы па-беларуску', 'tłumač słovy pa-biełarusku'],
  ['Скончыць гульню?', 'Skončyć hulniu?'],
  ['Штраф за пас', 'Štraf za pas'],
]

describe('toLatin', () => {
  it.each(cases)('%s → %s', (input, expected) => {
    expect(toLatin(input)).toBe(expected)
  })

  it('пакідае некірылічны тэкст без зменаў', () => {
    expect(toLatin('Alias 2024, ok!')).toBe('Alias 2024, ok!')
    expect(toLatin('')).toBe('')
    expect(toLatin('«лапкі»')).toBe('«łapki»')
  })

  it('не падае на нерадковых значэннях', () => {
    expect(toLatin(undefined)).toBeUndefined()
    expect(toLatin(null)).toBeNull()
    expect(toLatin(42)).toBe(42)
  })

  it('кірылічныя знакі па-за беларускім алфавітам застаюцца як ёсць', () => {
    expect(toLatin('ђак')).toBe('ђak')
    expect(toLatin('слова Ѣ')).toBe('słova Ѣ')
  })

  it('пакідае апостраф-лапкі, якія не стаяць паміж літарамі', () => {
    expect(toLatin("'цытата'")).toBe("'cytata'")
  })

  it('пераводзіць увесь слоўнік без рэштак кірыліцы', () => {
    for (const word of [...EASY, ...MEDIUM, ...HARD]) {
      const latin = toLatin(word)
      expect(latin, word).not.toMatch(/[Ѐ-ӿ]/)
      expect(latin.length, word).toBeGreaterThan(0)
    }
  })

  it('пераводзіць слоўнік дэтэрмінавана', () => {
    for (const word of EASY.slice(0, 50)) expect(toLatin(word)).toBe(toLatin(word))
  })
})

describe('isCyrillic', () => {
  it('распазнае кірылічныя знакі', () => {
    expect(isCyrillic('а')).toBe(true)
    expect(isCyrillic('Ў')).toBe(true)
    expect(isCyrillic('ё')).toBe(true)
    expect(isCyrillic('a')).toBe(false)
    expect(isCyrillic('1')).toBe(false)
    expect(isCyrillic(undefined)).toBe(false)
  })
})

describe('выпадковыя назвы камандаў на лацінцы', () => {
  const expectedNames = [
    ['Вусы Мулявіна', 'Vusy Mulavina'],
    ['Крынж Еўфрасінні', 'Krynž Jeŭfrasinni'],
    ['Каласы пад сярпом ШІ', 'Kałasy pad siarpom ŠI'],
    ['Жонкі Ягайлы', 'Žonki Jahajły'],
    ['Коні караля Стаха', 'Koni karala Stacha'],
    ['Карона Вітаўта', 'Karona Vitaŭta'],
    ['Косы Касцюшкі', 'Kosy Kasciuški'],
    ['Барада Барадуліна', 'Barada Baradulina'],
    ['Ваўчыцы Усяслава', 'Vaŭčycy Usiasłava'],
    ['Вусы Скарыны', 'Vusy Skaryny'],
    ['Вусы Купалы', 'Vusy Kupały'],
    // юрлівыя, для рэжыму 18+
    ['Смочкі Барадуліна', 'Smočki Baradulina'],
    ['Мара Глобуса', 'Mara Hłobusa'],
    ['Каханкі Пясецкага', 'Kachanki Piasieckaha'],
    ['Любошчы Пане Каханку', 'Luboščy Panie Kachanku'],
    ['Таемны ход да Барбары', 'Tajemny chod da Barbary'],
    ['Дудка Багушэвіча', 'Dudka Bahuševiča'],
    ['Паўстанне Каліноўскага', 'Paŭstannie Kalinoŭskaha'],
    ['Першы раз Скарыны', 'Pieršy raz Skaryny'],
    ['Аголеная Шагала', 'Aholenaja Šahała'],
    ['Папараць-кветка Купалы', 'Paparać-kvietka Kupały'],
    ['Пяць мужчын у леснічоўцы', 'Piać mužčyn u lesničoŭcy'],
  ]

  it.each(expectedNames)('%s → %s', (input, expected) => {
    expect(toLatin(input)).toBe(expected)
  })

  it('праверана кожная назва са спіса', () => {
    const all = [...RANDOM_TEAM_NAMES, ...ADULT_TEAM_NAMES]
    expect(expectedNames.map(([name]) => name)).toEqual(all)
    for (const name of all) expect(toLatin(name), name).not.toMatch(/[\u0400-\u04ff]/)
  })
})

describe('назва гульні на лацінцы', () => {
  it('загаловак адпавядае транслітарацыі, а «Аліяс» пішацца міжнародна як Alias', () => {
    expect(APP_TITLE.cyr.startsWith(APP_NAME.cyr)).toBe(true)
    expect(APP_TITLE.lat.startsWith(APP_NAME.lat)).toBe(true)
    expect(APP_TITLE.lat).toBe(toLatin(APP_TITLE.cyr).replace(toLatin(APP_NAME.cyr), APP_NAME.lat))
  })
})
