/**
 * Curated Problem Bank
 * Organized by topic with real LeetCode problem names.
 * Used to enforce minimum problem volume per week (never trust the AI to count).
 * Google/FAANG prep standard: ~14 problems/week = 2/day over 7 days.
 */

export const PROBLEM_BANK: Record<string, string[]> = {
  arrays: [
    'LeetCode 1. Two Sum',
    'LeetCode 26. Remove Duplicates from Sorted Array',
    'LeetCode 27. Remove Element',
    'LeetCode 53. Maximum Subarray',
    'LeetCode 56. Merge Intervals',
    'LeetCode 57. Insert Interval',
    'LeetCode 88. Merge Sorted Array',
    'LeetCode 121. Best Time to Buy and Sell Stock',
    'LeetCode 169. Majority Element',
    'LeetCode 238. Product of Array Except Self',
    'LeetCode 268. Missing Number',
    'LeetCode 283. Move Zeroes',
    'LeetCode 448. Find All Numbers Disappeared in an Array',
    'LeetCode 977. Squares of a Sorted Array',
  ],
  two_pointers: [
    'LeetCode 15. 3Sum',
    'LeetCode 16. 3Sum Closest',
    'LeetCode 11. Container With Most Water',
    'LeetCode 42. Trapping Rain Water',
    'LeetCode 75. Sort Colors',
    'LeetCode 125. Valid Palindrome',
    'LeetCode 167. Two Sum II - Input Array Is Sorted',
    'LeetCode 189. Rotate Array',
    'LeetCode 283. Move Zeroes',
    'LeetCode 344. Reverse String',
    'LeetCode 345. Reverse Vowels of a String',
    'LeetCode 557. Reverse Words in a String III',
  ],
  sliding_window: [
    'LeetCode 3. Longest Substring Without Repeating Characters',
    'LeetCode 76. Minimum Window Substring',
    'LeetCode 209. Minimum Size Subarray Sum',
    'LeetCode 239. Sliding Window Maximum',
    'LeetCode 424. Longest Repeating Character Replacement',
    'LeetCode 438. Find All Anagrams in a String',
    'LeetCode 567. Permutation in String',
    'LeetCode 643. Maximum Average Subarray I',
    'LeetCode 713. Subarray Product Less Than K',
    'LeetCode 1004. Max Consecutive Ones III',
    'LeetCode 1052. Grumpy Bookstore Owner',
    'LeetCode 1456. Maximum Number of Vowels in a Substring',
  ],
  binary_search: [
    'LeetCode 33. Search in Rotated Sorted Array',
    'LeetCode 34. Find First and Last Position of Element in Sorted Array',
    'LeetCode 35. Search Insert Position',
    'LeetCode 74. Search a 2D Matrix',
    'LeetCode 81. Search in Rotated Sorted Array II',
    'LeetCode 153. Find Minimum in Rotated Sorted Array',
    'LeetCode 162. Find Peak Element',
    'LeetCode 240. Search a 2D Matrix II',
    'LeetCode 278. First Bad Version',
    'LeetCode 374. Guess Number Higher or Lower',
    'LeetCode 441. Arranging Coins',
    'LeetCode 704. Binary Search',
    'LeetCode 875. Koko Eating Bananas',
    'LeetCode 1011. Capacity To Ship Packages Within D Days',
  ],
  hashing: [
    'LeetCode 1. Two Sum',
    'LeetCode 49. Group Anagrams',
    'LeetCode 128. Longest Consecutive Sequence',
    'LeetCode 187. Repeated DNA Sequences',
    'LeetCode 202. Happy Number',
    'LeetCode 205. Isomorphic Strings',
    'LeetCode 217. Contains Duplicate',
    'LeetCode 219. Contains Duplicate II',
    'LeetCode 242. Valid Anagram',
    'LeetCode 290. Word Pattern',
    'LeetCode 349. Intersection of Two Arrays',
    'LeetCode 350. Intersection of Two Arrays II',
    'LeetCode 380. Insert Delete GetRandom O(1)',
    'LeetCode 383. Ransom Note',
  ],
  stack_queue: [
    'LeetCode 20. Valid Parentheses',
    'LeetCode 71. Simplify Path',
    'LeetCode 84. Largest Rectangle in Histogram',
    'LeetCode 150. Evaluate Reverse Polish Notation',
    'LeetCode 155. Min Stack',
    'LeetCode 225. Implement Stack using Queues',
    'LeetCode 232. Implement Queue using Stacks',
    'LeetCode 316. Remove Duplicate Letters',
    'LeetCode 394. Decode String',
    'LeetCode 402. Remove K Digits',
    'LeetCode 496. Next Greater Element I',
    'LeetCode 503. Next Greater Element II',
    'LeetCode 739. Daily Temperatures',
    'LeetCode 844. Backspace String Compare',
  ],
  linked_list: [
    'LeetCode 2. Add Two Numbers',
    'LeetCode 19. Remove Nth Node From End of List',
    'LeetCode 21. Merge Two Sorted Lists',
    'LeetCode 23. Merge k Sorted Lists',
    'LeetCode 24. Swap Nodes in Pairs',
    'LeetCode 25. Reverse Nodes in k-Group',
    'LeetCode 61. Rotate List',
    'LeetCode 82. Remove Duplicates from Sorted List II',
    'LeetCode 83. Remove Duplicates from Sorted List',
    'LeetCode 92. Reverse Linked List II',
    'LeetCode 141. Linked List Cycle',
    'LeetCode 142. Linked List Cycle II',
    'LeetCode 206. Reverse Linked List',
    'LeetCode 234. Palindrome Linked List',
  ],
  trees: [
    'LeetCode 94. Binary Tree Inorder Traversal',
    'LeetCode 98. Validate Binary Search Tree',
    'LeetCode 100. Same Tree',
    'LeetCode 101. Symmetric Tree',
    'LeetCode 102. Binary Tree Level Order Traversal',
    'LeetCode 104. Maximum Depth of Binary Tree',
    'LeetCode 105. Construct Binary Tree from Preorder and Inorder Traversal',
    'LeetCode 110. Balanced Binary Tree',
    'LeetCode 112. Path Sum',
    'LeetCode 114. Flatten Binary Tree to Linked List',
    'LeetCode 124. Binary Tree Maximum Path Sum',
    'LeetCode 199. Binary Tree Right Side View',
    'LeetCode 226. Invert Binary Tree',
    'LeetCode 230. Kth Smallest Element in a BST',
  ],
  graphs: [
    'LeetCode 133. Clone Graph',
    'LeetCode 200. Number of Islands',
    'LeetCode 207. Course Schedule',
    'LeetCode 210. Course Schedule II',
    'LeetCode 269. Alien Dictionary',
    'LeetCode 286. Walls and Gates',
    'LeetCode 310. Minimum Height Trees',
    'LeetCode 323. Number of Connected Components in an Undirected Graph',
    'LeetCode 417. Pacific Atlantic Water Flow',
    'LeetCode 542. 01 Matrix',
    'LeetCode 547. Number of Provinces',
    'LeetCode 695. Max Area of Island',
    'LeetCode 743. Network Delay Time',
    'LeetCode 994. Rotting Oranges',
  ],
  dynamic_programming: [
    'LeetCode 70. Climbing Stairs',
    'LeetCode 72. Edit Distance',
    'LeetCode 91. Decode Ways',
    'LeetCode 97. Interleaving String',
    'LeetCode 115. Distinct Subsequences',
    'LeetCode 139. Word Break',
    'LeetCode 152. Maximum Product Subarray',
    'LeetCode 198. House Robber',
    'LeetCode 213. House Robber II',
    'LeetCode 300. Longest Increasing Subsequence',
    'LeetCode 322. Coin Change',
    'LeetCode 416. Partition Equal Subset Sum',
    'LeetCode 518. Coin Change II',
    'LeetCode 1143. Longest Common Subsequence',
  ],
  backtracking: [
    'LeetCode 17. Letter Combinations of a Phone Number',
    'LeetCode 22. Generate Parentheses',
    'LeetCode 37. Sudoku Solver',
    'LeetCode 39. Combination Sum',
    'LeetCode 40. Combination Sum II',
    'LeetCode 46. Permutations',
    'LeetCode 47. Permutations II',
    'LeetCode 51. N-Queens',
    'LeetCode 52. N-Queens II',
    'LeetCode 78. Subsets',
    'LeetCode 79. Word Search',
    'LeetCode 90. Subsets II',
    'LeetCode 131. Palindrome Partitioning',
    'LeetCode 216. Combination Sum III',
  ],
  heap_priority_queue: [
    'LeetCode 23. Merge k Sorted Lists',
    'LeetCode 215. Kth Largest Element in an Array',
    'LeetCode 218. The Skyline Problem',
    'LeetCode 239. Sliding Window Maximum',
    'LeetCode 264. Ugly Number II',
    'LeetCode 295. Find Median from Data Stream',
    'LeetCode 313. Super Ugly Number',
    'LeetCode 347. Top K Frequent Elements',
    'LeetCode 355. Design Twitter',
    'LeetCode 373. Find K Pairs with Smallest Sums',
    'LeetCode 378. Kth Smallest Element in a Sorted Matrix',
    'LeetCode 407. Trapping Rain Water II',
    'LeetCode 692. Top K Frequent Words',
    'LeetCode 973. K Closest Points to Origin',
  ],
  system_design: [
    'LeetCode 146. LRU Cache',
    'LeetCode 155. Min Stack',
    'LeetCode 173. Binary Search Tree Iterator',
    'LeetCode 208. Implement Trie (Prefix Tree)',
    'LeetCode 211. Design Add and Search Words Data Structure',
    'LeetCode 225. Implement Stack using Queues',
    'LeetCode 232. Implement Queue using Stacks',
    'LeetCode 295. Find Median from Data Stream',
    'LeetCode 303. Range Sum Query - Immutable',
    'LeetCode 304. Range Sum Query 2D - Immutable',
    'LeetCode 307. Range Sum Query - Mutable',
    'LeetCode 355. Design Twitter',
    'LeetCode 380. Insert Delete GetRandom O(1)',
    'LeetCode 460. LFU Cache',
  ],
};

// Topic keyword → bank key mapping (to match AI-generated topic strings)
const TOPIC_KEYWORD_MAP: Record<string, string> = {
  array: 'arrays', arrays: 'arrays',
  'two pointer': 'two_pointers', 'two pointers': 'two_pointers',
  'sliding window': 'sliding_window',
  'binary search': 'binary_search',
  hash: 'hashing', hashing: 'hashing', hashmap: 'hashing',
  stack: 'stack_queue', queue: 'stack_queue',
  'linked list': 'linked_list',
  tree: 'trees', trees: 'trees', bst: 'trees',
  graph: 'graphs', graphs: 'graphs', bfs: 'graphs', dfs: 'graphs',
  dp: 'dynamic_programming', 'dynamic programming': 'dynamic_programming',
  backtrack: 'backtracking', backtracking: 'backtracking',
  heap: 'heap_priority_queue', 'priority queue': 'heap_priority_queue',
  'system design': 'system_design',
};

/**
 * Given a list of topic strings from the AI, pick problems from the curated bank.
 * Ensures minimum 10 and maximum 14 unique problems per week.
 */
export function getCuratedProblems(topics: string[], weekIndex: number, existingProblems: string[] = []): string[] {
  const TARGET_MIN = 10;
  const TARGET_MAX = 14;

  // Deduplicate existing problems
  const result = new Set<string>(existingProblems.filter(p => p && p.trim()));

  // Map topic strings to bank keys
  const bankKeys: string[] = [];
  for (const topic of topics) {
    const topicLower = topic.toLowerCase().trim();
    for (const [keyword, bankKey] of Object.entries(TOPIC_KEYWORD_MAP)) {
      if (topicLower.includes(keyword)) {
        bankKeys.push(bankKey);
        break;
      }
    }
  }

  // Pull problems from the relevant banks
  for (const bankKey of bankKeys) {
    const bank = PROBLEM_BANK[bankKey] || [];
    // Offset by weekIndex so different weeks don't repeat the same problems
    const offset = (weekIndex * 5) % Math.max(1, bank.length);
    const rotated = [...bank.slice(offset), ...bank.slice(0, offset)];
    for (const problem of rotated) {
      if (result.size >= TARGET_MAX) break;
      result.add(problem);
    }
    if (result.size >= TARGET_MIN) break;
  }

  // If still below minimum (unusual topic), fill from arrays/graphs as baseline
  if (result.size < TARGET_MIN) {
    const fallback = [...(PROBLEM_BANK['arrays'] || []), ...(PROBLEM_BANK['graphs'] || [])];
    for (const p of fallback) {
      if (result.size >= TARGET_MIN) break;
      result.add(p);
    }
  }

  return Array.from(result).slice(0, TARGET_MAX);
}
