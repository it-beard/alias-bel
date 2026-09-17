import { describe, expect, it, vi } from 'vitest'
import { fillNames, motifForName, pickRandomNames, teamNamesFor } from './teamNames.js'
import { makeTeams, reducer, initialState } from './gameState.js'
import { ADULT_TEAM_NAMES, MAX_TEAMS, RANDOM_TEAM_NAMES, TEAM_COLORS, TEAM_MOTIFS } from './constants.js'

describe('спіс выпадковых назваў', () => {
  it('змест зафіксаваны', () => {
    expect(RANDOM_TEAM_NAMES).toEqual([
      'Вусы Мулявіна',
      'Крынж Еўфрасінні',
      'Каласы пад сярпом ШІ',
      'Жонкі Ягайлы',
      'Коні караля Стаха',
      'Карона Вітаўта',
      'Косы Касцюшкі',
      'Барада Барадуліна',
      'Ваўчыцы Усяслава',
      'Вусы Скарыны',
      'Вусы Купалы',
    ])
  })

  it('юрлівыя назвы для рэжыму 18+ зафіксаваныя', () => {
    expect(ADULT_TEAM_NAMES).toEqual([
      'Смочкі Барадуліна',
      'Мара Глобуса',
      'Каханкі Пясецкага',
      'Любошчы Пане Каханку',
      'Таемны ход да Барбары',
      'Дудка Багушэвіча',
      'Паўстане Каліноўскага',
      'Першы раз Скарыны',
      'Аголеныя Шагалы',
      'Папараць-кветка Купалы',
      'Пяць мужчын у леснічоўцы',
    ])
  })

  it.each([
    ['звычайныя', RANDOM_TEAM_NAMES],
    ['юрлівыя', ADULT_TEAM_NAMES],
  ])('%s назвы ўнікальныя, не задаўгія для табліцы і іх хапае на ўсе каманды двойчы', (_, pool) => {
    expect(new Set(pool).size).toBe(pool.length)
    expect(pool.length).toBeGreaterThanOrEqual(MAX_TEAMS * 2)
    for (const name of pool) {
      expect(name.length, name).toBeLessThanOrEqual(24)
      expect(name, name).toBe(name.trim())
    }
  })

  it('спісы не перасякаюцца, і ў кожнай назвы ёсць знак', () => {
    for (const name of ADULT_TEAM_NAMES) expect(RANDOM_TEAM_NAMES).not.toContain(name)
    expect(Object.keys(TEAM_MOTIFS)).toEqual([...RANDOM_TEAM_NAMES, ...ADULT_TEAM_NAMES])
  })

  it('teamNamesFor дае юрлівы спіс толькі для рэжыму 18+', () => {
    expect(teamNamesFor('adult')).toBe(ADULT_TEAM_NAMES)
    for (const level of ['easy', 'medium', 'hard', 'all', undefined, 'wat']) expect(teamNamesFor(level)).toBe(RANDOM_TEAM_NAMES)
  })

  it('стандартных назваў няма: пачатковыя каманды таксама са спіса', () => {
    initialState.teams.forEach((team) => expect(RANDOM_TEAM_NAMES).toContain(team.name))
    for (const legacy of ['Зубры', 'Буслы', 'Ваўкі', 'Вожыкі', 'Рысі']) {
      expect(RANDOM_TEAM_NAMES).not.toContain(legacy)
    }
  })
})

describe('motifForName', () => {
  it('для невядомых назваў выкарыстоўвае сонца', () => {
    for (const name of ['Свае', '', undefined, 'toString', '__proto__']) {
      expect(motifForName(name)).toBe('sun')
    }
  })
})

describe('pickRandomNames', () => {
  it('вяртае патрэбную колькасць розных назваў са спіса', () => {
    for (let count = 1; count <= MAX_TEAMS; count++) {
      const names = pickRandomNames(count)
      expect(names).toHaveLength(count)
      expect(new Set(names).size).toBe(count)
      names.forEach((name) => expect(RANDOM_TEAM_NAMES).toContain(name))
    }
  })

  it('не паўтарае назвы, якія ўжо ёсць', () => {
    const avoid = RANDOM_TEAM_NAMES.slice(0, 5)
    for (let i = 0; i < 20; i++) {
      pickRandomNames(5, avoid).forEach((name) => expect(avoid).not.toContain(name))
    }
  })

  it('калі новых не хапае, дабірае з ужо ўжытых без паўтораў', () => {
    const avoid = RANDOM_TEAM_NAMES.slice(0, -2)
    const names = pickRandomNames(4, avoid)
    expect(new Set(names).size).toBe(4)
    expect(names.slice(0, 2).every((name) => !avoid.includes(name))).toBe(true)
    expect(names.slice(2).every((name) => avoid.includes(name))).toBe(true)
  })

  it('бярэ назвы з перададзенага спіса', () => {
    for (let i = 0; i < 20; i++) {
      pickRandomNames(MAX_TEAMS, [], ADULT_TEAM_NAMES).forEach((name) => expect(ADULT_TEAM_NAMES).toContain(name))
    }
  })

  it('выбар залежыць ад Math.random', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const first = pickRandomNames(2)
    expect(first).toEqual(pickRandomNames(2))
    vi.mocked(Math.random).mockReturnValue(0.999)
    expect(pickRandomNames(2)).not.toEqual(first)
  })
})

describe('fillNames', () => {
  it('пакідае радкі, а пустыя месцы запаўняе назвамі са спіса без паўтораў', () => {
    const names = fillNames(['Свае', undefined, 'Вусы Купалы', null, 42])
    expect(names[0]).toBe('Свае')
    expect(names[2]).toBe('Вусы Купалы')
    ;[names[1], names[3], names[4]].forEach((name) => {
      expect(RANDOM_TEAM_NAMES).toContain(name)
      expect(name).not.toBe('Вусы Купалы')
    })
    expect(new Set(names).size).toBe(5)
  })

  it('пустыя месцы можна запаўняць з іншага спіса', () => {
    const names = fillNames(['Мара Глобуса', undefined, null], ADULT_TEAM_NAMES)
    expect(names[0]).toBe('Мара Глобуса')
    names.slice(1).forEach((name) => expect(ADULT_TEAM_NAMES).toContain(name))
    expect(new Set(names).size).toBe(3)
  })

  it('пусты радок — гэта свая назва, яна не замяняецца', () => {
    expect(fillNames(['', undefined])[0]).toBe('')
  })

  it('без пустых месцаў нічога не мяняе', () => {
    expect(fillNames(['а', 'б'])).toEqual(['а', 'б'])
    expect(fillNames([])).toEqual([])
  })
})

describe('reducer: randomizeTeamNames', () => {
  it('раздае розныя назвы разам з іх знакамі, захоўвае колеры і рахунак', () => {
    const state = {
      ...initialState,
      teams: makeTeams(5).map((team, i) => ({ ...team, score: i * 3 })),
    }
    const next = reducer(state, { type: 'randomizeTeamNames' })
    const names = next.teams.map((team) => team.name)
    expect(new Set(names).size).toBe(5)
    names.forEach((name) => expect(RANDOM_TEAM_NAMES).toContain(name))
    next.teams.forEach((team, i) => {
      expect(team).toMatchObject({ id: i, color: TEAM_COLORS[i], motif: TEAM_MOTIFS[team.name], score: i * 3 })
      expect(team.motif).not.toBe(state.teams[i].motif)
    })
  })

  it('кожны націск дае назвы, якіх не было на экране', () => {
    let state = reducer({ ...initialState, teams: makeTeams(3) }, { type: 'randomizeTeamNames' })
    for (let i = 0; i < 20; i++) {
      const before = state.teams.map((team) => team.name)
      state = reducer(state, { type: 'randomizeTeamNames' })
      state.teams.forEach((team) => expect(before).not.toContain(team.name))
    }
  })
})

describe('reducer: назвы ў рэжыме 18+', () => {
  const adult = (state) => reducer(state, { type: 'setSetting', key: 'level', value: 'adult' })
  const names = (state) => state.teams.map((team) => team.name)

  it('уваход у рэжым 18+ раздае юрлівыя назвы, захоўваючы колеры і рахунак', () => {
    const state = { ...initialState, teams: makeTeams(5).map((team, i) => ({ ...team, score: i * 2 })) }
    const next = adult(state)
    expect(new Set(names(next)).size).toBe(5)
    next.teams.forEach((team, i) => {
      expect(ADULT_TEAM_NAMES).toContain(team.name)
      expect(team).toMatchObject({ id: i, color: TEAM_COLORS[i], motif: TEAM_MOTIFS[team.name], score: i * 2 })
    })
  })

  it('выхад з рэжыму 18+ вяртае звычайныя назвы', () => {
    const next = reducer(adult({ ...initialState, teams: makeTeams(4) }), { type: 'setSetting', key: 'level', value: 'hard' })
    expect(next.settings.level).toBe('hard')
    names(next).forEach((name) => expect(RANDOM_TEAM_NAMES).toContain(name))
  })

  it('змена ўзроўню паміж звычайнымі і іншыя налады назваў не чапаюць', () => {
    const state = { ...initialState, teams: makeTeams(3) }
    expect(reducer(state, { type: 'setSetting', key: 'level', value: 'all' }).teams).toBe(state.teams)
    expect(reducer(state, { type: 'setSetting', key: 'roundSeconds', value: 45 }).teams).toBe(state.teams)
    const hot = adult(state)
    expect(adult(hot).teams).toBe(hot.teams)
    expect(reducer(hot, { type: 'setSetting', key: 'sound', value: false }).teams).toBe(hot.teams)
  })

  it('у рэжыме 18+ костка і новыя каманды таксама бяруць юрлівыя назвы', () => {
    let state = adult({ ...initialState, teams: makeTeams(2) })
    for (let i = 0; i < 10; i++) {
      state = reducer(state, { type: 'randomizeTeamNames' })
      names(state).forEach((name) => expect(ADULT_TEAM_NAMES).toContain(name))
    }
    const more = reducer(state, { type: 'setTeamCount', count: 5 })
    expect(names(more).slice(0, 2)).toEqual(names(state))
    expect(new Set(names(more)).size).toBe(5)
    names(more).forEach((name) => expect(ADULT_TEAM_NAMES).toContain(name))
  })
})

describe('makeTeams і назвы са спіса', () => {
  it('новыя каманды таксама атрымліваюць выпадковыя назвы без паўтораў', () => {
    const rolled = reducer({ ...initialState, teams: makeTeams(2) }, { type: 'randomizeTeamNames' })
    const more = reducer(rolled, { type: 'setTeamCount', count: 5 })
    const names = more.teams.map((team) => team.name)
    expect(names.slice(0, 2)).toEqual(rolled.teams.map((team) => team.name))
    expect(new Set(names).size).toBe(5)
    names.forEach((name) => expect(RANDOM_TEAM_NAMES).toContain(name))
  })

  it('побач са сваімі назвамі новыя каманды таксама атрымліваюць назвы са спіса', () => {
    const previous = [{ name: 'Вусы Купалы' }, { name: 'Суседзі' }]
    const names = makeTeams(5, previous).map((team) => team.name)
    expect(names.slice(0, 2)).toEqual(['Вусы Купалы', 'Суседзі'])
    names.slice(2).forEach((name) => expect(RANDOM_TEAM_NAMES).toContain(name))
    expect(new Set(names).size).toBe(5)
  })

  it('без папярэдніх камандаў усе назвы са спіса і без паўтораў', () => {
    for (let i = 0; i < 20; i++) {
      const names = makeTeams(MAX_TEAMS).map((team) => team.name)
      expect(new Set(names).size).toBe(MAX_TEAMS)
      names.forEach((name) => expect(RANDOM_TEAM_NAMES).toContain(name))
    }
  })

  it('памяншэнне колькасці не мяняе назвы', () => {
    const rolled = reducer({ ...initialState, teams: makeTeams(4) }, { type: 'randomizeTeamNames' })
    const fewer = reducer(rolled, { type: 'setTeamCount', count: 2 })
    expect(fewer.teams).toEqual(rolled.teams.slice(0, 2))
  })
})
