/** Назва гульні і загаловак укладкі ў абодвух алфавітах. */
export const APP_NAME = { cyr: 'Аліяс', lat: 'Alias' }
export const APP_TITLE = {
  cyr: 'Аліяс па-беларуску — анлайн-гульня ў словы',
  lat: 'Alias pa-biełarusku — anłajn-hulnia ŭ słovy',
}

export const MIN_TEAMS = 1
export const MAX_TEAMS = 5

/** Колеры камандаў: чырвань, васілёк, лес, бурштын, верас. */
export const TEAM_COLORS = ['#c1272d', '#2b6cc4', '#2f8a4b', '#c58a12', '#6b4fa3']

const FAMILY_TEAM_MOTIFS = {
  'Вусы Мулявіна': 'mulavin-mustache',
  'Крынж Еўфрасінні': 'facepalm',
  'Каласы пад сярпом ШІ': 'wheat-sickle',
  'Жонкі Ягайлы': 'wedding-rings',
  'Коні караля Стаха': 'horse',
  'Карона Вітаўта': 'crown',
  'Косы Касцюшкі': 'scythes',
  'Барада Барадуліна': 'beard',
  'Ваўчыцы Усяслава': 'wolf',
  'Вусы Скарыны': 'skaryna-mustache',
  'Вусы Купалы': 'kupala-mustache',
}

/** Юрлівыя назвы — толькі для рэжыму 18+. */
const ADULT_TEAM_MOTIFS = {
  'Смочкі Барадуліна': 'nipples',
  'Мара Глобуса': 'dream',
  'Каханкі Пясецкага': 'orion-heart',
  'Любошчы Пане Каханку': 'lips',
  'Таемны ход да Барбары': 'keyhole',
  'Дудка Багушэвіча': 'pipe',
  'Паўстане Каліноўскага': 'rising',
  'Першы раз Скарыны': 'first-time',
  'Аголеныя Шагалы': 'fig-leaf',
  'Папараць-кветка Купалы': 'fern-flower',
  'Пяць мужчын у леснічоўцы': 'lodge',
}

/** Кожная назва мае свой піксельны знак (гл. src/ornament/teamLogos.js). */
export const TEAM_MOTIFS = { ...FAMILY_TEAM_MOTIFS, ...ADULT_TEAM_MOTIFS }

/** Назвы і знакі захоўваюцца разам, каб новыя назвы не заставаліся без лагатыпа. */
export const RANDOM_TEAM_NAMES = Object.keys(FAMILY_TEAM_MOTIFS)
export const ADULT_TEAM_NAMES = Object.keys(ADULT_TEAM_MOTIFS)

export const ROUND_TIMES = [30, 45, 60, 90]
export const TARGET_SCORES = [20, 30, 50, 75]

export const SCRIPTS = [
  { id: 'cyr', label: 'Кірыліца' },
  { id: 'lat', label: 'Лацінка' },
]

export const THEMES = [
  { id: 'auto', label: 'Аўта' },
  { id: 'light', label: 'Светлая' },
  { id: 'dark', label: 'Цёмная' },
]

export const STORAGE_KEY = 'alias-bel/state/v1'

/** Затрымка перад пачаткам раунда (3, 2, 1), мс на крок. */
export const COUNTDOWN_STEP_MS = 800

/** Абарона ад падвойнага націску на кнопкі адказу, мс. */
export const ANSWER_LOCK_MS = 300

export const DEFAULT_SETTINGS = {
  level: 'easy',
  roundSeconds: 60,
  targetScore: 30,
  skipPenalty: true,
  lastWordRule: true,
  hints: true,
  sound: true,
  vibration: true,
  script: 'cyr',
  theme: 'auto',
}
