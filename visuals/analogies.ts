/**
 * D6 — one analogy per misconception.
 *
 * Hard rule, enforced by the test next door: none of these may mention arrays,
 * maps, dictionaries, hashes, indices, loops, or code of any kind. The moment
 * an analogy reaches for the vocabulary of the thing it is explaining, it has
 * stopped being an analogy and become a restatement.
 *
 * Each one ends by handing the question back. The coach delivers these at
 * count 3, which is late enough that the learner has earned a concrete image
 * but early enough that they still get to make the connection themselves.
 */

import type { MisconceptionId } from '../shared/contracts';

export const ANALOGIES: Record<MisconceptionId, string> = {
  TS_BRUTE_FORCE_ONLY:
    "Imagine you're at a party trying to find two people whose ages add up to 60. " +
    'You could walk up to every possible pair and ask — but with a hundred guests ' +
    "that's thousands of conversations. Or, as you meet each person, you could just " +
    'remember their age and who they were. Then each new person you meet, you only ' +
    'have to ask yourself one question. What would that question be?',

  TS_COMPLEMENT_CONFUSION:
    "You're at a coat check with a ticket stub numbered 34. You don't wander the racks " +
    'comparing every coat against every other coat. You look at your stub, work out ' +
    "exactly what you're looking for, and ask for that one thing. Right now your code " +
    "is comparing things to each other. What's the one specific thing you could work " +
    'out first, before you go looking?',

  TS_MAP_DIRECTION_FLIPPED:
    'A phone book is sorted by name, because when you sit down with it you already know ' +
    'the name and you want the number. Nobody prints one sorted by number — it would be ' +
    "useless for the thing you actually came to do. Look at the moment you go searching: " +
    'what do you already have in your hand, and what are you trying to get back?',

  TS_INSERT_BEFORE_CHECK:
    "You walk into a room looking for someone the same height as you. If you sign the " +
    'guest book first and then read the guest book, you find your own name and declare ' +
    'success — you have matched yourself with yourself. Read the room first, then sign. ' +
    'Where in your code does the signing happen relative to the reading?',

  TS_RETURNS_VALUES_NOT_INDICES:
    'A librarian asks where the two books you borrowed are shelved. Telling them the ' +
    'titles is a perfectly true answer to a question nobody asked — they wanted the shelf ' +
    "numbers so they could go and get them. Read the last line of what you were asked for " +
    'again. Is it asking what, or where?',

  TS_OFF_BY_ONE_INNER_LOOP:
    "You're pairing up socks from a basket. You pick one up in your left hand, then reach " +
    'back into the basket with your right — but if you reach into the same spot, you pull ' +
    "out the very sock you're already holding and declare it a match. Your two hands are " +
    'reaching into the same place. Where does the second hand need to start?',

  NONE:
    "You've got it — you're keeping a running memory as you go instead of searching the " +
    'whole room every time. Go write it.',
};
