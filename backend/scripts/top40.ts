export const top40Problems = [
  {
    title: "Two Sum",
    slug: "two-sum",
    scenario: "Netflix Recommendation Pair Optimizer: You are building a feature that pairs two movies whose combined runtime exactly fits a user's available watch window.",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    difficulty: "Easy",
    category: "Arrays",
    acceptanceRate: 51.2,
    functionName: "twoSum",
    companyTags: ["Netflix", "Amazon", "Google", "Meta"],
    optimalComplexity: "O(N) Time, O(N) Space",
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    hints: [
      "A brute force O(N^2) solution is trivial, but can we do better?",
      "Can we use a HashMap to store the values we have seen so far?",
      "If we are currently at `nums[i]`, what value do we need to find in the HashMap?"
    ],
    starterCode: {
      javascript: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n    \n}",
      python: "def twoSum(nums: list[int], target: int) -> list[int]:\n    pass"
    },
    examples: [
      { input: "[2,7,11,15], 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "[3,2,4], 6", output: "[1,2]" }
    ],
    testCases: [
      { input: "[2,7,11,15], 9", expectedOutput: "[0,1]", hidden: false, caseType: "sample" },
      { input: "[3,2,4], 6", expectedOutput: "[1,2]", hidden: false, caseType: "sample" },
      { input: "[3,3], 6", expectedOutput: "[0,1]", hidden: true, caseType: "hidden" },
      { input: "[0,4,3,0], 0", expectedOutput: "[0,3]", hidden: true, caseType: "edge" },
      { input: "[-1,-2,-3,-4,-5], -8", expectedOutput: "[2,4]", hidden: true, caseType: "edge" },
      // Stress case would normally be huge array, mocked here for brevity
      { input: "[1000000000, 1000000000, 5, 5], 10", expectedOutput: "[2,3]", hidden: true, caseType: "stress" }
    ]
  },
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    scenario: "Code Compiler Syntax Validator: Your team is building the parser for a new IDE. You need to ensure that all opening brackets are properly closed.",
    description: "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    difficulty: "Easy",
    category: "Stack",
    acceptanceRate: 40.5,
    functionName: "isValid",
    companyTags: ["Meta", "Amazon", "Microsoft", "Bloomberg"],
    optimalComplexity: "O(N) Time, O(N) Space",
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'."
    ],
    hints: [
      "Use a stack data structure to keep track of the opening brackets.",
      "When you encounter a closing bracket, check if it matches the top of the stack."
    ],
    starterCode: {
      javascript: "/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isValid(s) {\n    \n}",
      python: "def isValid(s: str) -> bool:\n    pass"
    },
    examples: [
      { input: "\"()\"", output: "true" },
      { input: "\"()[]{}\"", output: "true" },
      { input: "\"(]\"", output: "false" }
    ],
    testCases: [
      { input: "\"()\"", expectedOutput: "true", hidden: false, caseType: "sample" },
      { input: "\"()[]{}\"", expectedOutput: "true", hidden: false, caseType: "sample" },
      { input: "\"(]\"", expectedOutput: "false", hidden: false, caseType: "sample" },
      { input: "\"([)]\"", expectedOutput: "false", hidden: true, caseType: "hidden" },
      { input: "\"{[]}\"", expectedOutput: "true", hidden: true, caseType: "hidden" },
      { input: "\"[\"", expectedOutput: "false", hidden: true, caseType: "edge" },
      { input: "\"]\"", expectedOutput: "false", hidden: true, caseType: "edge" }
    ]
  },
  {
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    scenario: "Robinhood Algo-Trading Evaluator: You are analyzing historical price data to determine the maximum theoretical profit a trading bot could have made with a single trade.",
    description: "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return `0`.",
    difficulty: "Easy",
    category: "Arrays",
    acceptanceRate: 53.7,
    functionName: "maxProfit",
    companyTags: ["Robinhood", "Citadel", "Amazon", "Goldman Sachs"],
    optimalComplexity: "O(N) Time, O(1) Space",
    constraints: [
      "1 <= prices.length <= 10^5",
      "0 <= prices[i] <= 10^4"
    ],
    hints: [
      "You need to buy before you can sell. So as you iterate, keep track of the lowest price seen so far.",
      "The maximum profit at any given day is the current price minus the lowest price seen before it."
    ],
    starterCode: {
      javascript: "/**\n * @param {number[]} prices\n * @return {number}\n */\nfunction maxProfit(prices) {\n    \n}",
      python: "def maxProfit(prices: list[int]) -> int:\n    pass"
    },
    examples: [
      { input: "[7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5." },
      { input: "[7,6,4,3,1]", output: "0", explanation: "In this case, no transactions are done and the max profit = 0." }
    ],
    testCases: [
      { input: "[7,1,5,3,6,4]", expectedOutput: "5", hidden: false, caseType: "sample" },
      { input: "[7,6,4,3,1]", expectedOutput: "0", hidden: false, caseType: "sample" },
      { input: "[2,4,1]", expectedOutput: "2", hidden: true, caseType: "hidden" },
      { input: "[2,1,2,1,0,1,2]", expectedOutput: "2", hidden: true, caseType: "hidden" },
      { input: "[1]", expectedOutput: "0", hidden: true, caseType: "edge" }
    ]
  },
  {
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    scenario: "Google Search Query Analyzer: Extract the longest unique character sequence from a raw search log for indexing.",
    description: "Given a string `s`, find the length of the longest substring without repeating characters.",
    difficulty: "Medium",
    category: "Sliding Window",
    acceptanceRate: 34.2,
    functionName: "lengthOfLongestSubstring",
    companyTags: ["Google", "Amazon", "Microsoft", "Spotify"],
    optimalComplexity: "O(N) Time, O(min(M, N)) Space",
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces."
    ],
    hints: [
      "Can you use a sliding window approach? Keep expanding the window to the right until you see a duplicate.",
      "When you see a duplicate, shrink the window from the left until the duplicate is removed."
    ],
    starterCode: {
      javascript: "/**\n * @param {string} s\n * @return {number}\n */\nfunction lengthOfLongestSubstring(s) {\n    \n}",
      python: "def lengthOfLongestSubstring(s: str) -> int:\n    pass"
    },
    examples: [
      { input: "\"abcabcbb\"", output: "3", explanation: "The answer is \"abc\", with the length of 3." },
      { input: "\"bbbbb\"", output: "1", explanation: "The answer is \"b\", with the length of 1." },
      { input: "\"pwwkew\"", output: "3", explanation: "The answer is \"wke\", with the length of 3." }
    ],
    testCases: [
      { input: "\"abcabcbb\"", expectedOutput: "3", hidden: false, caseType: "sample" },
      { input: "\"bbbbb\"", expectedOutput: "1", hidden: false, caseType: "sample" },
      { input: "\"pwwkew\"", expectedOutput: "3", hidden: false, caseType: "sample" },
      { input: "\"\"", expectedOutput: "0", hidden: true, caseType: "edge" },
      { input: "\" \"", expectedOutput: "1", hidden: true, caseType: "edge" },
      { input: "\"au\"", expectedOutput: "2", hidden: true, caseType: "hidden" },
      { input: "\"dvdf\"", expectedOutput: "3", hidden: true, caseType: "hidden" }
    ]
  },
  {
    title: "Merge Intervals",
    slug: "merge-intervals",
    scenario: "Calendar Collision Resolver: You are building a scheduling application. You need to consolidate overlapping meeting times into single continuous blocks.",
    description: "Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    difficulty: "Medium",
    category: "Arrays",
    acceptanceRate: 46.8,
    functionName: "merge",
    companyTags: ["Google", "Meta", "Uber", "Apple"],
    optimalComplexity: "O(N log N) Time, O(N) Space",
    constraints: [
      "1 <= intervals.length <= 10^4",
      "intervals[i].length == 2",
      "0 <= start_i <= end_i <= 10^4"
    ],
    hints: [
      "Try sorting the intervals by their start times.",
      "If the current interval begins after the previous interval ends, then they do not overlap."
    ],
    starterCode: {
      javascript: "/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nfunction merge(intervals) {\n    \n}",
      python: "def merge(intervals: list[list[int]]) -> list[list[int]]:\n    pass"
    },
    examples: [
      { input: "[[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]", explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]." },
      { input: "[[1,4],[4,5]]", output: "[[1,5]]", explanation: "Intervals [1,4] and [4,5] are considered overlapping." }
    ],
    testCases: [
      { input: "[[1,3],[2,6],[8,10],[15,18]]", expectedOutput: "[[1,6],[8,10],[15,18]]", hidden: false, caseType: "sample" },
      { input: "[[1,4],[4,5]]", expectedOutput: "[[1,5]]", hidden: false, caseType: "sample" },
      { input: "[[1,4],[0,4]]", expectedOutput: "[[0,4]]", hidden: true, caseType: "hidden" },
      { input: "[[1,4],[2,3]]", expectedOutput: "[[1,4]]", hidden: true, caseType: "hidden" },
      { input: "[[1,10],[2,3],[4,5],[6,7],[8,9]]", expectedOutput: "[[1,10]]", hidden: true, caseType: "stress" }
    ]
  },
  {
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    scenario: "Game State Calculator: You are determining the total number of valid traversal paths a character can take to reach the top of a tower.",
    description: "You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    difficulty: "Easy",
    category: "Dynamic Programming",
    acceptanceRate: 52.3,
    functionName: "climbStairs",
    companyTags: ["Amazon", "Apple", "Google", "Adobe"],
    optimalComplexity: "O(N) Time, O(1) Space",
    constraints: [
      "1 <= n <= 45"
    ],
    hints: [
      "To reach step n, you could have come from step n-1 (taking 1 step) or step n-2 (taking 2 steps).",
      "This means ways(n) = ways(n-1) + ways(n-2). Does this sequence look familiar?"
    ],
    starterCode: {
      javascript: "/**\n * @param {number} n\n * @return {number}\n */\nfunction climbStairs(n) {\n    \n}",
      python: "def climbStairs(n: int) -> int:\n    pass"
    },
    examples: [
      { input: "2", output: "2", explanation: "There are two ways to climb to the top.\n1. 1 step + 1 step\n2. 2 steps" },
      { input: "3", output: "3", explanation: "There are three ways to climb to the top.\n1. 1 step + 1 step + 1 step\n2. 1 step + 2 steps\n3. 2 steps + 1 step" }
    ],
    testCases: [
      { input: "2", expectedOutput: "2", hidden: false, caseType: "sample" },
      { input: "3", expectedOutput: "3", hidden: false, caseType: "sample" },
      { input: "1", expectedOutput: "1", hidden: true, caseType: "edge" },
      { input: "4", expectedOutput: "5", hidden: true, caseType: "hidden" },
      { input: "5", expectedOutput: "8", hidden: true, caseType: "hidden" },
      { input: "45", expectedOutput: "1836311903", hidden: true, caseType: "stress" }
    ]
  },
  {
    title: "Number of Islands",
    slug: "number-of-islands",
    scenario: "Satellite Image Processor: You need to detect distinct landmasses in a radar grid representing a sector of the ocean.",
    description: "Given an `m x n` 2D binary grid `grid` which represents a map of `'1'`s (land) and `'0'`s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.",
    difficulty: "Medium",
    category: "Graphs",
    acceptanceRate: 58.1,
    functionName: "numIslands",
    companyTags: ["Amazon", "Microsoft", "Bloomberg", "Google"],
    optimalComplexity: "O(M * N) Time, O(M * N) Space",
    constraints: [
      "m == grid.length",
      "n == grid[i].length",
      "1 <= m, n <= 300",
      "grid[i][j] is '0' or '1'."
    ],
    hints: [
      "Treat the 2D grid as an undirected graph where there is an edge between two horizontally or vertically adjacent '1's.",
      "You can iterate over the grid and trigger a DFS or BFS whenever you find a '1'. Make sure to mark visited lands as '0' to avoid infinite loops."
    ],
    starterCode: {
      javascript: "/**\n * @param {string[][]} grid\n * @return {number}\n */\nfunction numIslands(grid) {\n    \n}",
      python: "def numIslands(grid: list[list[str]]) -> int:\n    pass"
    },
    examples: [
      { 
        input: "[[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]", 
        output: "1" 
      },
      { 
        input: "[[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"1\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]]", 
        output: "3" 
      }
    ],
    testCases: [
      { input: "[[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]", expectedOutput: "1", hidden: false, caseType: "sample" },
      { input: "[[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"1\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]]", expectedOutput: "3", hidden: false, caseType: "sample" },
      { input: "[[\"0\",\"0\"],[\"0\",\"0\"]]", expectedOutput: "0", hidden: true, caseType: "edge" },
      { input: "[[\"1\"]]", expectedOutput: "1", hidden: true, caseType: "edge" },
      { input: "[[\"1\",\"0\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"0\",\"1\"]]", expectedOutput: "5", hidden: true, caseType: "hidden" }
    ]
  },
  {
    title: "Trapping Rain Water",
    slug: "trapping-rain-water",
    scenario: "Urban Infrastructure Planner: Calculate how much water a specific terrain topology will retain after a heavy storm to design proper drainage.",
    description: "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.",
    difficulty: "Hard",
    category: "Two Pointers",
    acceptanceRate: 59.8,
    functionName: "trap",
    companyTags: ["Goldman Sachs", "Amazon", "Apple", "Google"],
    optimalComplexity: "O(N) Time, O(1) Space",
    constraints: [
      "n == height.length",
      "1 <= n <= 2 * 10^4",
      "0 <= height[i] <= 10^5"
    ],
    hints: [
      "The amount of water trapped above any bar is determined by the maximum height to its left and the maximum height to its right.",
      "Can you use two pointers (left and right) to keep track of the maximums dynamically, saving space?"
    ],
    starterCode: {
      javascript: "/**\n * @param {number[]} height\n * @return {number}\n */\nfunction trap(height) {\n    \n}",
      python: "def trap(height: list[int]) -> int:\n    pass"
    },
    examples: [
      { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", output: "6", explanation: "The elevation map traps 6 units of rain water." },
      { input: "[4,2,0,3,2,5]", output: "9" }
    ],
    testCases: [
      { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", expectedOutput: "6", hidden: false, caseType: "sample" },
      { input: "[4,2,0,3,2,5]", expectedOutput: "9", hidden: false, caseType: "sample" },
      { input: "[0,0,0,0]", expectedOutput: "0", hidden: true, caseType: "edge" },
      { input: "[5,4,3,2,1]", expectedOutput: "0", hidden: true, caseType: "hidden" },
      { input: "[5,5,5,5]", expectedOutput: "0", hidden: true, caseType: "hidden" },
      { input: "[4,2,3]", expectedOutput: "1", hidden: true, caseType: "hidden" }
    ]
  },
  {
    title: "Coin Change",
    slug: "coin-change",
    scenario: "Vending Machine Dispenser: You are building the logic to dispense the minimum number of physical coins required to give a user their exact change.",
    description: "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.\n\nYou may assume that you have an infinite number of each kind of coin.",
    difficulty: "Medium",
    category: "Dynamic Programming",
    acceptanceRate: 43.1,
    functionName: "coinChange",
    companyTags: ["Amazon", "Uber", "Airbnb", "Bloomberg"],
    optimalComplexity: "O(amount * N) Time, O(amount) Space",
    constraints: [
      "1 <= coins.length <= 12",
      "1 <= coins[i] <= 2^31 - 1",
      "0 <= amount <= 10^4"
    ],
    hints: [
      "This is a classic dynamic programming problem. Let dp[i] be the minimum coins needed for amount i.",
      "For each coin c, dp[i] = min(dp[i], dp[i - c] + 1). Initialize the dp array with infinity."
    ],
    starterCode: {
      javascript: "/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nfunction coinChange(coins, amount) {\n    \n}",
      python: "def coinChange(coins: list[int], amount: int) -> int:\n    pass"
    },
    examples: [
      { input: "[1,2,5], 11", output: "3", explanation: "11 = 5 + 5 + 1" },
      { input: "[2], 3", output: "-1" },
      { input: "[1], 0", output: "0" }
    ],
    testCases: [
      { input: "[1,2,5], 11", expectedOutput: "3", hidden: false, caseType: "sample" },
      { input: "[2], 3", expectedOutput: "-1", hidden: false, caseType: "sample" },
      { input: "[1], 0", expectedOutput: "0", hidden: false, caseType: "sample" },
      { input: "[186,419,83,408], 6249", expectedOutput: "20", hidden: true, caseType: "stress" },
      { input: "[2,5,10,1], 27", expectedOutput: "4", hidden: true, caseType: "hidden" }
    ]
  },
  {
    title: "Top K Frequent Elements",
    slug: "top-k-frequent-elements",
    scenario: "Twitter Trending Topics: Analyze a stream of hashtags and rapidly identify the ones that are mentioned the most.",
    description: "Given an integer array `nums` and an integer `k`, return the `k` most frequent elements. You may return the answer in **any order**.",
    difficulty: "Medium",
    category: "Heap",
    acceptanceRate: 64.9,
    functionName: "topKFrequent",
    companyTags: ["Amazon", "Facebook", "Yelp", "Google"],
    optimalComplexity: "O(N log K) Time, O(N) Space",
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
      "k is in the range [1, the number of unique elements in the array].",
      "It is guaranteed that the answer is unique."
    ],
    hints: [
      "First, count the frequencies of each element using a hash map.",
      "Then, use a priority queue (min-heap) of size k to keep track of the top k elements. Alternatively, bucket sort gives an O(N) solution."
    ],
    starterCode: {
      javascript: "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nfunction topKFrequent(nums, k) {\n    \n}",
      python: "def topKFrequent(nums: list[int], k: int) -> list[int]:\n    pass"
    },
    examples: [
      { input: "[1,1,1,2,2,3], 2", output: "[1,2]" },
      { input: "[1], 1", output: "[1]" }
    ],
    testCases: [
      { input: "[1,1,1,2,2,3], 2", expectedOutput: "[1,2]", hidden: false, caseType: "sample" },
      { input: "[1], 1", expectedOutput: "[1]", hidden: false, caseType: "sample" },
      { input: "[4,1,-1,2,-1,2,3], 2", expectedOutput: "[-1,2]", hidden: true, caseType: "hidden" },
      { input: "[1,2], 2", expectedOutput: "[1,2]", hidden: true, caseType: "hidden" }
    ]
  }
];
