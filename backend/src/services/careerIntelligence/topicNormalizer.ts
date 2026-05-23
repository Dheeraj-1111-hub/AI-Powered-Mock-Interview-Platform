/**
 * TOPIC NORMALIZATION ENGINE
 * 
 * Canonical topic registry for HireIQ Career Intelligence.
 * All data sources (Coding Lab, Interview Engine, AI Audit, Resume AI)
 * must map to these canonical keys to prevent matrix fragmentation.
 */

export type CanonicalTopic =
  | 'arrays'
  | 'strings'
  | 'hashing'
  | 'two_pointers'
  | 'sliding_window'
  | 'binary_search'
  | 'linked_lists'
  | 'stacks_queues'
  | 'trees'
  | 'graphs'
  | 'dynamic_programming'
  | 'recursion_backtracking'
  | 'sorting_searching'
  | 'heaps'
  | 'tries'
  | 'bit_manipulation'
  | 'math'
  | 'system_design'
  | 'behavioral';

export interface CanonicalTopicMeta {
  key: CanonicalTopic;
  label: string;
  icon: string;
  color: string;
  faangWeight: number; // How critical at FAANG (0-100)
  recommendedOrder: number; // Ideal learning order (1 = first)
}

// The single source of truth for all topics in HireIQ
export const TOPIC_REGISTRY: Record<CanonicalTopic, CanonicalTopicMeta> = {
  arrays:                  { key: 'arrays',                  label: 'Arrays',               icon: '▦', color: 'indigo',   faangWeight: 95, recommendedOrder: 1 },
  strings:                 { key: 'strings',                 label: 'Strings',              icon: '"', color: 'indigo',   faangWeight: 90, recommendedOrder: 2 },
  hashing:                 { key: 'hashing',                 label: 'Hashing',              icon: '#', color: 'violet',   faangWeight: 92, recommendedOrder: 3 },
  two_pointers:            { key: 'two_pointers',            label: 'Two Pointers',         icon: '↔', color: 'cyan',     faangWeight: 88, recommendedOrder: 4 },
  sliding_window:          { key: 'sliding_window',          label: 'Sliding Window',       icon: '□', color: 'cyan',     faangWeight: 85, recommendedOrder: 5 },
  binary_search:           { key: 'binary_search',           label: 'Binary Search',        icon: '⊘', color: 'amber',    faangWeight: 87, recommendedOrder: 6 },
  linked_lists:            { key: 'linked_lists',            label: 'Linked Lists',         icon: '⛓', color: 'slate',    faangWeight: 80, recommendedOrder: 7 },
  stacks_queues:           { key: 'stacks_queues',           label: 'Stacks & Queues',      icon: '☰', color: 'orange',   faangWeight: 82, recommendedOrder: 8 },
  trees:                   { key: 'trees',                   label: 'Trees',                icon: '🌲', color: 'emerald',  faangWeight: 93, recommendedOrder: 9 },
  graphs:                  { key: 'graphs',                  label: 'Graphs',               icon: '⬡', color: 'rose',     faangWeight: 91, recommendedOrder: 10 },
  dynamic_programming:     { key: 'dynamic_programming',     label: 'Dynamic Programming',  icon: '◈', color: 'purple',   faangWeight: 97, recommendedOrder: 11 },
  recursion_backtracking:  { key: 'recursion_backtracking',  label: 'Recursion / BT',       icon: '↻', color: 'fuchsia',  faangWeight: 88, recommendedOrder: 12 },
  sorting_searching:       { key: 'sorting_searching',       label: 'Sorting & Search',     icon: '↕', color: 'yellow',   faangWeight: 78, recommendedOrder: 13 },
  heaps:                   { key: 'heaps',                   label: 'Heaps / Priority Q',   icon: '△', color: 'orange',   faangWeight: 83, recommendedOrder: 14 },
  tries:                   { key: 'tries',                   label: 'Tries',                icon: '⊕', color: 'teal',     faangWeight: 70, recommendedOrder: 15 },
  bit_manipulation:        { key: 'bit_manipulation',        label: 'Bit Manipulation',     icon: '⊻', color: 'lime',     faangWeight: 65, recommendedOrder: 16 },
  math:                    { key: 'math',                    label: 'Math & Number Theory', icon: 'π', color: 'slate',    faangWeight: 60, recommendedOrder: 17 },
  system_design:           { key: 'system_design',           label: 'System Design',        icon: '⬡', color: 'sky',      faangWeight: 95, recommendedOrder: 18 },
  behavioral:              { key: 'behavioral',              label: 'Behavioral',           icon: '☻', color: 'pink',     faangWeight: 80, recommendedOrder: 19 },
};

// Alias map: maps all known variant strings → canonical key
// This prevents "Sliding Window" vs "Window Optimization" vs "Two Pointer Windows" mismatches
const ALIAS_MAP: Record<string, CanonicalTopic> = {
  // Arrays
  'array': 'arrays', 'arrays': 'arrays', 'array manipulation': 'arrays',
  'prefix sum': 'arrays', 'matrix': 'arrays',

  // Strings
  'string': 'strings', 'strings': 'strings', 'string manipulation': 'strings',
  'pattern matching': 'strings',

  // Hashing
  'hash': 'hashing', 'hashing': 'hashing', 'hash map': 'hashing', 'hashmap': 'hashing',
  'hash table': 'hashing', 'hash set': 'hashing', 'dictionary': 'hashing',
  'maps and sets': 'hashing', 'key-value': 'hashing',

  // Two Pointers
  'two pointer': 'two_pointers', 'two pointers': 'two_pointers',
  'dual pointer': 'two_pointers', 'pointer technique': 'two_pointers',

  // Sliding Window
  'sliding window': 'sliding_window', 'window': 'sliding_window',
  'window optimization': 'sliding_window', 'two pointer windows': 'sliding_window',
  'fixed window': 'sliding_window', 'variable window': 'sliding_window',

  // Binary Search
  'binary search': 'binary_search', 'bsearch': 'binary_search', 'divide and conquer': 'binary_search',
  'log n search': 'binary_search',

  // Linked Lists
  'linked list': 'linked_lists', 'linked lists': 'linked_lists', 'singly linked': 'linked_lists',
  'doubly linked': 'linked_lists', 'list node': 'linked_lists',

  // Stacks & Queues
  'stack': 'stacks_queues', 'queue': 'stacks_queues', 'deque': 'stacks_queues',
  'stacks': 'stacks_queues', 'queues': 'stacks_queues', 'monotonic stack': 'stacks_queues',

  // Trees
  'tree': 'trees', 'trees': 'trees', 'binary tree': 'trees', 'bst': 'trees',
  'binary search tree': 'trees', 'dfs': 'trees', 'bfs': 'trees',
  'tree traversal': 'trees', 'n-ary tree': 'trees',

  // Graphs
  'graph': 'graphs', 'graphs': 'graphs', 'graph traversal': 'graphs',
  'topological sort': 'graphs', 'union find': 'graphs', 'disjoint set': 'graphs',
  'shortest path': 'graphs', 'dijkstra': 'graphs', 'bellman-ford': 'graphs',

  // Dynamic Programming
  'dynamic programming': 'dynamic_programming', 'dp': 'dynamic_programming',
  'memoization': 'dynamic_programming', 'tabulation': 'dynamic_programming',
  'knapsack': 'dynamic_programming', 'lcs': 'dynamic_programming',

  // Recursion / Backtracking
  'recursion': 'recursion_backtracking', 'backtracking': 'recursion_backtracking',
  'recursive': 'recursion_backtracking', 'permutations': 'recursion_backtracking',
  'combinations': 'recursion_backtracking', 'subsets': 'recursion_backtracking',

  // Sorting & Searching
  'sorting': 'sorting_searching', 'searching': 'sorting_searching',
  'merge sort': 'sorting_searching', 'quick sort': 'sorting_searching',
  'counting sort': 'sorting_searching', 'sort': 'sorting_searching',

  // Heaps
  'heap': 'heaps', 'heaps': 'heaps', 'priority queue': 'heaps',
  'min heap': 'heaps', 'max heap': 'heaps', 'k-th largest': 'heaps',

  // Tries
  'trie': 'tries', 'tries': 'tries', 'prefix tree': 'tries',

  // Bit Manipulation
  'bit manipulation': 'bit_manipulation', 'bits': 'bit_manipulation',
  'bitwise': 'bit_manipulation', 'xor': 'bit_manipulation',

  // Math
  'math': 'math', 'mathematics': 'math', 'number theory': 'math',
  'prime': 'math', 'gcd': 'math', 'modular arithmetic': 'math',

  // System Design
  'system design': 'system_design', 'design': 'system_design',
  'scalability': 'system_design', 'distributed systems': 'system_design',

  // Behavioral
  'behavioral': 'behavioral', 'communication': 'behavioral',
  'soft skills': 'behavioral', 'leadership': 'behavioral',
};

/**
 * Normalizes any topic string to its canonical key.
 * Returns null if the topic cannot be mapped.
 */
export const normalizeToCanonical = (rawTopic: string): CanonicalTopic | null => {
  const normalized = rawTopic.toLowerCase().trim();
  return ALIAS_MAP[normalized] ?? null;
};

/**
 * Normalizes a map of raw topic keys → values into canonical topic keys.
 * Values from multiple raw keys that resolve to the same canonical topic are averaged.
 */
export const normalizeTopicMap = (
  rawMap: Record<string, number>
): Partial<Record<CanonicalTopic, number>> => {
  const accumulator: Record<string, { sum: number; count: number }> = {};

  for (const [raw, value] of Object.entries(rawMap)) {
    const canonical = normalizeToCanonical(raw);
    if (canonical) {
      if (!accumulator[canonical]) accumulator[canonical] = { sum: 0, count: 0 };
      accumulator[canonical].sum += value;
      accumulator[canonical].count += 1;
    }
  }

  const result: Partial<Record<CanonicalTopic, number>> = {};
  for (const [key, { sum, count }] of Object.entries(accumulator)) {
    result[key as CanonicalTopic] = Math.round(sum / count);
  }
  return result;
};

/** Returns all canonical topics sorted by recommended learning order */
export const getOrderedTopics = (): CanonicalTopicMeta[] =>
  Object.values(TOPIC_REGISTRY).sort((a, b) => a.recommendedOrder - b.recommendedOrder);
