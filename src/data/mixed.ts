import type { PuzzleSet } from '../game/types'

/**
 * Mixed-bag rounds. Every item counts something different (pieces, inches,
 * pounds, calories…) and the order is by the bare number, whatever the unit.
 * Listed in the CORRECT order, like every other set. `sets.test.ts` checks
 * that each set uses five different units and keeps wide gaps.
 */
export const MIXED_KEY = 'mixed'
export const MIXED_RULE = 'Smallest number → biggest number'

type Stat = readonly [name: string, value: number, unit: string, display?: string]

const mixed = (stats: readonly Stat[], teaser: string): PuzzleSet => ({
  key: MIXED_KEY,
  rule: MIXED_RULE,
  unit: '',
  units: stats.map(([, , unit]) => unit),
  difficulty: 'medium',
  items: stats.map(([name, value, , display]) => [name, value, display] as const),
  teaser,
})

export const MIXED: PuzzleSet[] = [
  mixed([['Heaviest legal bowling ball', 16, 'lb'], ['A piano', 88, 'keys'], ['An NBA hoop', 120, 'inches off the floor'], ['A Big Mac', 580, 'kcal'], ['LEGO Titanic', 9090, 'pieces']],
    'A bowling ball takes on a Big Mac.'),
  mixed([['A marathon', 26.2, 'miles'], ['A deck of cards', 52, 'cards'], ['A cheetah at full sprint', 65, 'mph', 'about 65 mph'], ['Empire State Building', 102, 'floors'], ['Eiffel Tower', 1083, 'feet tall']],
    'A cheetah races a skyscraper.'),
  mixed([['A football team on the pitch', 11, 'players'], ['A can of Coca-Cola', 39, 'g of sugar'], ['A chessboard', 64, 'squares'], ['An adult human', 206, 'bones'], ['Mount Everest', 29032, 'feet high']],
    'Sugar, squares, bones and a mountain.'),
  mixed([['A full set of adult teeth', 32, 'teeth'], ['An Olympic pool', 50, 'metres long'], ['Perfect three-dart throw', 180, 'points'], ['A Snickers bar', 250, 'kcal'], ['Golden Gate Bridge towers', 746, 'feet above the water']],
    'Teeth against a chocolate bar.'),
  mixed([['Tour de France', 21, 'stages'], ['A Monopoly board', 40, 'spaces'], ['A baseball', 108, 'stitches'], ['A tall giraffe', 216, 'inches tall', 'about 216 inches tall'], ['International Space Station', 17500, 'mph', 'about 17,500 mph']],
    'A giraffe measured in inches.'),
  mixed([['Harry Potter', 7, 'books'], ['Starbucks venti hot coffee', 20, 'fl oz'], ['One week', 168, 'hours'], ['Great Pyramid of Giza', 455, 'feet tall', 'about 455 feet tall'], ['Boeing 747 at cruise', 567, 'mph', 'about 567 mph']],
    'A week takes on a pyramid.'),
  mixed([['An octopus', 3, 'hearts'], ['A golf hole', 4.25, 'inches wide'], ['A spider', 8, 'legs'], ['Tenpin bowling', 10, 'pins'], ['Each chess player', 16, 'pieces']],
    'Small numbers, close calls.'),
  mixed([['Burj Khalifa', 163, 'floors'], ['An avocado', 320, 'kcal', 'about 320 kcal'], ['Speed of sound', 767, 'mph', 'about 767 mph'], ['A hummingbird’s heart', 1200, 'beats a minute', 'about 1,200 beats a minute'], ['LEGO Eiffel Tower', 10001, 'pieces']],
    'A heartbeat races the speed of sound.'),
  mixed([['London Eye', 32, 'capsules'], ['A shot of espresso', 63, 'mg of caffeine', 'about 63 mg of caffeine'], ['Titanic', 882, 'feet long'], ['Concorde', 1350, 'mph', 'about 1,350 mph'], ['A male hippo', 3400, 'lb', 'about 3,400 lb']],
    'A hippo outweighs… Concorde’s speed?'),
  mixed([['Tyrannosaurus rex', 40, 'feet long', 'about 40 feet long'], ['Scrabble', 100, 'tiles'], ['Bugatti Chiron', 261, 'mph'], ['Bohemian Rhapsody', 355, 'seconds'], ['An ostrich egg', 2000, 'kcal', 'about 2,000 kcal']],
    'A rock anthem against a supercar.'),
  mixed([['A rainbow', 7, 'colours'], ['A baker’s dozen', 13, 'loaves'], ['Blackjack', 21, 'points'], ['An adult dog', 42, 'teeth'], ['A century in cricket', 100, 'runs']],
    'Loaves, teeth and a winning hand.'),
  mixed([['A table tennis ball', 2.7, 'grams'], ['Usain Bolt’s 100 m record', 9.58, 'seconds'], ['A greyhound', 45, 'mph', 'about 45 mph'], ['General Sherman sequoia', 275, 'feet tall'], ['A blue whale', 330000, 'lb', 'about 330,000 lb']],
    'From a ping-pong ball to a blue whale.'),
]
