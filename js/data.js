// Places, activities and the rules of a weekend at the château.
// Times are minutes since Friday 00:00. Days: 0 = Friday, 1 = Saturday, 2 = Sunday.

export const DAY = 1440;
export const START = 18 * 60;                 // Friday 18:00, arrival
export const END = 2 * DAY + 17 * 60;         // Sunday 17:00, check-out
export const DAYS = ['Friday', 'Saturday', 'Sunday'];

const hm = s => { const [h, m] = s.split(':').map(Number); return h * 60 + (m || 0); };
// win(days, from, to): the activity can be *started* in that window.
const win = (days, from, to) => days.map(d => ({ from: d * DAY + hm(from), to: d * DAY + hm(to) }));

// kind: 'meal' scales with hunger; 'sleep' is special; others are flat.
// e: energy delta, s: satiety delta, pts: base points, dur: minutes
export const places = [
  {
    id: 'ferme', name: 'La Ferme · La Table', icon: '🍽️', door: [13, 31],
    blurb: 'The farmhouse restaurant. Generous, local, all-inclusive cooking — and the bar.',
    acts: [
      { id: 'breakfast', name: 'Breakfast buffet', kind: 'meal', dur: 45, e: 8, s: 55, pts: 40, when: win([1, 2], '7:30', '10:30'), say: 'Croissants, farm yoghurt, a mountain of fruit.' },
      { id: 'lunch', name: 'Lunch at La Table', kind: 'meal', dur: 75, e: -4, s: 65, pts: 55, when: win([1, 2], '12:00', '14:30'), say: 'Roast chicken from the Vexin and a garden salad.' },
      { id: 'dinner', name: 'Dinner at La Table', kind: 'meal', dur: 90, e: -6, s: 75, pts: 75, when: win([0, 1], '19:30', '22:00'), say: 'Candlelight, a long table and a very good Chinon.' },
      { id: 'goûter', name: 'Goûter: crêpes & cider', kind: 'meal', dur: 25, e: 4, s: 25, pts: 25, when: win([1, 2], '16:00', '17:30'), say: 'Salted-butter caramel crêpes. Obviously.' },
      { id: 'snack', name: 'Snack at the bar', kind: 'meal', dur: 15, e: 2, s: 15, pts: 8, when: win([0, 1, 2], '10:00', '23:00'), say: 'Some comté, a few radishes.' },
      { id: 'coffee', name: 'Espresso at the bar', dur: 5, e: 12, s: 0, pts: 4, when: win([0, 1, 2], '7:00', '23:30'), say: 'Tiny cup, big effect.' },
      { id: 'basket', name: 'Pick up a picnic basket', dur: 5, e: 0, s: 0, pts: 0, give: 'basket', when: win([1, 2], '11:30', '14:00'), say: 'Packed for two. Head for the red blanket by the pond.' },
    ],
  },
  {
    id: 'grange', name: 'La Grange', icon: '🎭', door: [15, 26],
    blurb: 'The timber barn: salons, a big fireplace, the cinema and Friday arty nights.',
    acts: [
      { id: 'arty', name: 'Vendredi Arty: magic & live music', dur: 90, e: -10, s: -6, pts: 65, when: win([0], '21:00', '22:00'), say: 'A close-up magician makes your ring vanish. It comes back. Mostly.' },
      { id: 'cinema', name: 'Cinema night', dur: 110, e: -6, s: -5, pts: 45, when: win([1], '20:45', '21:30'), say: 'A classic on the big screen, popcorn included.' },
      { id: 'boardgames', name: 'Board games by the fire', dur: 45, e: -3, s: -4, pts: 22, when: win([0, 1, 2], '10:00', '23:30'), say: 'You win at Scrabble with QI. Nobody is pleased.' },
    ],
  },
  {
    id: 'cottage', name: 'Le Cottage · Grenier de Gustave', icon: '🧸', door: [21, 15],
    blurb: 'Home of the Grenier de Gustave — costumes, clay and a lot of lost toys.',
    acts: [
      { id: 'workshop', name: 'Saturday creative workshop', dur: 60, e: -5, s: -6, pts: 35, when: win([1], '14:00', '17:00'), say: 'You make a lopsided clay bowl. It is perfect.' },
      { id: 'costume', name: 'Costume photo booth', dur: 15, e: 0, s: -1, pts: 12, when: win([0, 1, 2], '9:00', '19:00'), say: 'Musketeer hat. Very 1642.' },
      { id: 'gustave', name: 'Ask about Gustave\'s toys', dur: 5, e: 0, s: 0, pts: 0, repeat: true, when: win([0, 1, 2], '8:00', '22:00'), special: 'toys', say: '' },
    ],
  },
  {
    id: 'room', name: 'Le Château · your room', icon: '🛏️', door: [37, 29],
    blurb: 'A room under the château\'s roof beams, with a view over the moat.',
    acts: [
      { id: 'sleep', name: 'Sleep until 8:00', kind: 'sleep', until: '8:00', dur: 0, e: 0, s: 0, pts: 0, repeat: true, when: win([0, 1, 2], '20:00', '23:59').concat(win([1, 2], '0:00', '6:00')) },
      { id: 'liein', name: 'Sleep in until 9:30', kind: 'sleep', until: '9:30', dur: 0, e: 0, s: 0, pts: 0, repeat: true, when: win([0, 1, 2], '20:00', '23:59').concat(win([1, 2], '0:00', '8:30')) },
      { id: 'nap', name: 'Afternoon nap', dur: 45, e: 28, s: -4, pts: 10, repeat: true, when: win([1, 2], '13:00', '17:30'), say: 'Shutters half closed, a bee somewhere. Bliss.' },
      { id: 'shower', name: 'Shower & change', dur: 20, e: 6, s: 0, pts: 5, repeat: true, when: win([0, 1, 2], '6:00', '23:59'), say: 'Fresh as a daisy.' },
    ],
  },
  {
    id: 'library', name: 'Le Château · Library', icon: '📚', door: [41, 29],
    blurb: 'Panelled walls, deep armchairs and more books than one weekend allows.',
    acts: [
      { id: 'read', name: 'Read in an armchair', dur: 60, e: 8, s: -5, pts: 22, when: win([0, 1, 2], '8:00', '23:30'), say: 'Three chapters and a gentle doze.' },
      { id: 'history', name: 'Leaf through the château archives', dur: 30, e: -2, s: -3, pts: 18, when: win([1, 2], '10:00', '18:00'), say: 'Built in 1642 on the ruins of a 13th-century fortress.' },
    ],
  },
  {
    id: 'fountain', name: 'Cour d\'honneur', icon: '⛲', door: [39, 32],
    blurb: 'The château courtyard and its fountain.',
    acts: [
      { id: 'wish', name: 'Toss a coin & make a wish', dur: 5, e: 0, s: 0, pts: 10, daily: true, when: win([0, 1, 2], '0:00', '23:59'), say: 'Plink. You wish for another weekend.' },
    ],
  },
  {
    id: 'spa', name: 'Spa Nuxe', icon: '💆', door: [40, 17],
    blurb: '700 m² of calm: heated indoor pool under a glass roof, sauna, hammam, gym.',
    acts: [
      { id: 'swim', name: 'Laps in the indoor pool', dur: 45, e: -14, s: -10, pts: 30, when: win([0, 1, 2], '9:00', '20:00'), say: '14 metres, glass roof, sky above.' },
      { id: 'sauna', name: 'Sauna & hammam', dur: 40, e: 16, s: -6, pts: 28, when: win([0, 1, 2], '9:00', '20:00'), say: 'Eucalyptus steam. Every muscle says merci.' },
      { id: 'massage', name: 'Nuxe massage (60 min)', dur: 60, e: 30, s: -5, pts: 55, when: win([0, 1, 2], '10:00', '19:00'), say: 'Huile Prodigieuse. You may have snored.' },
      { id: 'gym', name: 'Fitness room', dur: 45, e: -24, s: -14, pts: 25, when: win([0, 1, 2], '7:00', '21:00'), say: 'Rowing machine, sweat, pride.' },
    ],
  },
  {
    id: 'remise', name: 'La Remise des Sports', icon: '🏸', door: [41, 10],
    blurb: 'The self-service equipment shed. Free rackets, golf clubs and balls.',
    acts: [
      { id: 'racket', name: 'Borrow tennis rackets', dur: 3, e: 0, s: 0, pts: 0, give: 'racket', when: win([0, 1, 2], '7:00', '22:00'), say: 'Two rackets and a tube of fresh balls.' },
      { id: 'clubs', name: 'Borrow golf clubs', dur: 3, e: 0, s: 0, pts: 0, give: 'clubs', when: win([0, 1, 2], '7:00', '22:00'), say: 'A slightly bent 7-iron. Character.' },
    ],
  },
  {
    id: 'tennis', name: 'Tennis courts', icon: '🎾', door: [48, 9],
    blurb: 'Two outdoor courts behind the trees.',
    acts: [
      { id: 'tennis', name: 'Play a set of tennis', dur: 60, e: -28, s: -18, pts: 45, need: 'racket', when: win([0, 1, 2], '8:00', '20:30'), say: '6–4. You call your own lines generously.' },
    ],
  },
  {
    id: 'pool', name: 'Outdoor pool', icon: '🏊', door: [49, 17],
    blurb: 'Open in summer, 8:00–20:00. Loungers and a lot of sun.',
    acts: [
      { id: 'outdoorswim', name: 'Swim in the outdoor pool', dur: 40, e: -14, s: -10, pts: 32, when: win([0, 1, 2], '8:00', '20:00'), say: 'Cannonball. The lifeguard pretends not to see.' },
      { id: 'lounge', name: 'Lounge in the sun', dur: 45, e: 10, s: -4, pts: 18, when: win([0, 1, 2], '9:00', '19:00'), say: 'Sunglasses, a novel, zero plans.' },
    ],
  },
  {
    id: 'yoga', name: 'La Pelouse', icon: '🧘', door: [33, 16],
    blurb: 'The big lawn: yoga at 10:00, Réveil Musculaire at 11:00 on Saturday.',
    acts: [
      { id: 'yoga', name: 'Yoga & relaxation', dur: 60, e: 12, s: -8, pts: 38, when: win([1, 2], '9:50', '10:15'), say: 'Sun salutation facing the château.' },
      { id: 'reveil', name: 'Réveil Musculaire', dur: 60, e: -18, s: -12, pts: 32, when: win([1], '10:55', '11:15'), say: 'Multigenerational squats. A grandmother out-squats you.' },
      { id: 'croquet', name: 'Lawn games', dur: 30, e: -6, s: -5, pts: 15, when: win([0, 1, 2], '9:00', '20:30'), say: 'Mölkky. Ruthless.' },
    ],
  },
  {
    id: 'ducks', name: 'The pond', icon: '🦆', door: [33, 11],
    blurb: 'Reeds, ducks and a very still surface.',
    acts: [
      { id: 'ducks', name: 'Feed the ducks', dur: 15, e: 0, s: 0, pts: 12, daily: true, when: win([0, 1, 2], '7:00', '20:30'), say: 'Seeds, not bread. The ducks approve.' },
    ],
  },
  {
    id: 'picnic', name: 'Picnic blanket', icon: '🧺', door: [30, 13],
    blurb: 'A red gingham blanket with a view of the water.',
    acts: [
      { id: 'picnic', name: 'Picnic by the pond', kind: 'meal', dur: 60, e: 4, s: 65, pts: 70, need: 'basket', consume: true, when: win([1, 2], '11:30', '15:30'), say: 'Baguette, rillettes, strawberries, cider. Sun.' },
    ],
  },
  {
    id: 'fire', name: 'Campfire', icon: '🔥', door: [38, 10],
    blurb: 'Saturday evening fire by the pond. Marshmallows provided.',
    acts: [
      { id: 'campfire', name: 'Campfire & marshmallows', kind: 'meal', dur: 60, e: -4, s: 12, pts: 40, when: win([1], '20:00', '22:30'), say: 'Golden, not burnt. OK, one burnt.' },
      { id: 'stars', name: 'Stargazing', dur: 30, e: 2, s: -2, pts: 20, when: win([0, 1], '22:00', '23:59').concat(win([1, 2], '0:00', '1:30')), say: 'No city lights. The Milky Way, for real.' },
    ],
  },
  {
    id: 'dock', name: 'Boat dock', icon: '🚣', door: [30, 27],
    blurb: 'Rowboats on the moats (it rained enough this week).',
    acts: [
      { id: 'row', name: 'Row around the château moat', dur: 40, e: -16, s: -8, pts: 42, when: win([1, 2], '9:00', '19:00'), say: 'The château reflected in still water. Oars slightly out of sync.' },
    ],
  },
  {
    id: 'golf', name: 'Golf practice', icon: '⛳', door: [12, 21],
    blurb: 'A meadow with a flag. Ambition encouraged.',
    acts: [
      { id: 'golf', name: 'Hit a bucket of balls', dur: 50, e: -16, s: -10, pts: 38, need: 'clubs', when: win([0, 1, 2], '8:00', '20:00'), say: 'One perfect shot out of forty. That one counts.' },
    ],
  },
  {
    id: 'trail', name: 'Woodland trail', icon: '🌳', door: [45, 21],
    blurb: 'A loop through the 12-hectare park and the woods.',
    acts: [
      { id: 'walk', name: 'Walk the woodland loop', dur: 55, e: -8, s: -8, pts: 26, when: win([0, 1, 2], '7:00', '21:00'), golden: true, say: 'Deer tracks, mushrooms, the smell of moss.' },
      { id: 'run', name: 'Morning run', dur: 35, e: -22, s: -14, pts: 34, when: win([1, 2], '6:30', '10:00'), say: 'Dew on your shoes, château in the mist.' },
    ],
  },
  {
    id: 'chapelle', name: 'La Chapelle', icon: '🕯️', door: [28, 4],
    blurb: 'A tiny chapel at the end of the drive.',
    acts: [
      { id: 'quiet', name: 'A quiet moment', dur: 15, e: 6, s: 0, pts: 10, daily: true, when: win([0, 1, 2], '8:00', '20:00'), say: 'Cool stone and silence.' },
    ],
  },
  {
    id: 'parking', name: 'Parking · check-out', icon: '🚗', door: [24, 44],
    blurb: 'Where the weekend began — and where it ends.',
    acts: [
      { id: 'leave', name: 'Check out and drive home', kind: 'leave', dur: 0, e: 0, s: 0, pts: 0, repeat: true, when: win([2], '9:00', '17:00') },
    ],
  },
];

// Gustave's lost toys — walk over them to pick them up.
export const toys = [
  { x: 5, y: 24, name: 'wooden horse', icon: '🐴' },
  { x: 52, y: 22, name: 'spinning top', icon: '🪀' },
  { x: 41, y: 36, name: 'tin knight', icon: '🛡️' },
  { x: 20, y: 5, name: 'kite', icon: '🪁' },
  { x: 36, y: 42, name: 'toy sailboat', icon: '⛵' },
  { x: 55, y: 13, name: 'teddy bear', icon: '🧸' },
  { x: 10, y: 38, name: 'marbles', icon: '🔮' },
  { x: 30, y: 36, name: 'rag doll', icon: '🪆' },
];

// Bonus achievements, checked after each activity. `test(s)` sees game state.
export const badges = [
  { id: 'threemeals', name: 'Three meals on Saturday', pts: 60, test: s => ['breakfast', 'lunch|picnic', 'dinner'].every(k => k.split('|').some(a => s.doneOn(a, 1))) },
  { id: 'friday', name: 'Friday night fever', pts: 30, test: s => s.doneOn('dinner', 0) && s.doneOn('arty', 0) },
  { id: 'spa', name: 'Full spa circuit', pts: 50, test: s => [0, 1, 2].some(d => ['swim', 'sauna', 'massage'].every(a => s.doneOn(a, d))) },
  { id: 'yogi', name: 'Sun salutations, both days', pts: 40, test: s => s.doneOn('yoga', 1) && s.doneOn('yoga', 2) },
  { id: 'allround', name: 'All-rounder: tennis, golf & rowing', pts: 45, test: s => ['tennis', 'golf', 'row'].every(a => s.done(a)) },
  { id: 'pond', name: 'Pond life: ducks, picnic & campfire', pts: 40, test: s => ['ducks', 'picnic', 'campfire'].every(a => s.done(a)) },
  { id: 'toys', name: 'Found all of Gustave\'s toys', pts: 80, test: s => s.toys.size === toys.length },
  { id: 'rested', name: 'Well rested (8h+ both nights)', pts: 40, test: s => s.sleeps.filter(h => h >= 8).length >= 2 },
  { id: 'explorer', name: 'Explorer: 15 different activities', pts: 60, test: s => s.distinct() >= 15 },
];

export const ranks = [
  [0, 'Stressed Parisian', 'You were technically in the countryside.'],
  [400, 'Day tripper', 'A nice breather. Next time, stay for dinner.'],
  [800, 'Weekend guest', 'A proper weekend: well fed, well rested.'],
  [1200, 'Regular', 'The staff know your coffee order.'],
  [1650, 'Lord of the manor', 'You squeezed every drop out of that weekend.'],
  [2100, 'Châtelain·e', 'Legendary. They are naming a room after you.'],
];
