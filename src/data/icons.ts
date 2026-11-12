import type { RuleKey } from './sets'

/** Icon and short name for each kind of round, shown on the start screen. */
const CATEGORIES: Record<RuleKey, readonly [icon: string, name: string]> = {
  weight: ['⚖️', 'Weight'],
  speed: ['💨', 'Speed'],
  year: ['📅', 'History'],
  lifespan: ['⏳', 'Lifespans'],
  height: ['📏', 'Height'],
  length: ['📐', 'Length'],
  size: ['🌍', 'Size'],
  people: ['👥', 'Crowds'],
  count: ['🔢', 'Counting'],
  calories: ['🍔', 'Calories'],
  temp: ['🌡️', 'Temperature'],
  time: ['⏱️', 'Time'],
  distance: ['🧭', 'Distance'],
  serving: ['🍪', 'Snacks'],
  subs: ['▶️', 'Subscribers'],
  pieces: ['🧩', 'Pieces'],
  strength: ['💪', 'Strength'],
  spicy: ['🌶️', 'Heat'],
  caffeine: ['☕', 'Caffeine'],
  sugar: ['🍬', 'Sugar'],
}

export const categoryFor = (key: string) => CATEGORIES[key as RuleKey] ?? (['❓', 'Mystery'] as const)
