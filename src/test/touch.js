/**
 * Touch-падзея для jsdom, дзе TouchEvent не прымае спісы дотыкаў.
 * `touches` — пальцы на экране пасля падзеі, `changed` — тыя, што яе выклікалі.
 */
export function touchEvent(el, type, changed, touches = type === 'touchend' || type === 'touchcancel' ? [] : changed) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  const point = ({ id = 0, x = 0, y = 0 }) => ({ identifier: id, clientX: x, clientY: y })
  Object.assign(event, { touches: touches.map(point), changedTouches: changed.map(point) })
  el.dispatchEvent(event)
  return event
}

/** Адзін палец праводзіць уніз на `distance` пікселяў і адпускае. */
export function swipeDown(el, distance) {
  touchEvent(el, 'touchstart', [{ x: 100, y: 100 }])
  touchEvent(el, 'touchmove', [{ x: 100, y: 100 + distance / 2 }])
  touchEvent(el, 'touchmove', [{ x: 100, y: 100 + distance }])
  touchEvent(el, 'touchend', [{ x: 100, y: 100 + distance }])
}
