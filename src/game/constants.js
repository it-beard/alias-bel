/** Назва гульні і загаловак укладкі ў абодвух алфавітах. */
export const APP_NAME = { cyr: 'Аліяс', lat: 'Alias' }
export const APP_TITLE = { cyr: 'Аліяс па-беларуску', lat: 'Alias pa-biełarusku' }

export const MIN_TEAMS = 1
export const MAX_TEAMS = 5

/** Колеры камандаў: чырвань, васілёк, лес, бурштын, верас. */
export const TEAM_COLORS = ['#c1272d', '#2b6cc4', '#2f8a4b', '#c58a12', '#6b4fa3']

/** Назвы камандаў: кожная каманда атрымлівае выпадковую назву з гэтага спіса. */
export const RANDOM_TEAM_NAMES = [
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
  'Смочкі Барадуліна',
  'Вусы Купалы',
  'Мары Глобуса',
]

/** Найбольшая даўжыня назвы каманды ў полі ўводу. */
export const TEAM_NAME_MAX = 24

/** Матыў арнаменту кожнай каманды (гл. src/ornament/motifs.js). */
export const TEAM_MOTIFS = ['sun', 'star', 'tree', 'field', 'hooks']

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
  sound: true,
  vibration: true,
  script: 'cyr',
  theme: 'auto',
}
