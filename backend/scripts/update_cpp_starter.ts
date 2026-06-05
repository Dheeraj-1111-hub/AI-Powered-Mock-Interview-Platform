import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CodingProblem from '../src/models/CodingProblem';

dotenv.config({ path: '../.env' });

const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hireiq';

const cppSignatures: Record<string, string> = {
  'Valid Parentheses': 'bool isValid(string s) {\n    \n}',
  'Climbing Stairs': 'int climbStairs(int n) {\n    \n}',
  'Number of Islands': 'int numIslands(vector<vector<char>>& grid) {\n    \n}',
  'Best Time to Buy and Sell Stock': 'int maxProfit(vector<int>& prices) {\n    \n}',
  'Top K Frequent Elements': 'vector<int> topKFrequent(vector<int>& nums, int k) {\n    \n}',
  'Longest Substring Without Repeating Characters': 'int lengthOfLongestSubstring(string s) {\n    \n}',
  'Merge Intervals': 'vector<vector<int>> merge(vector<vector<int>>& intervals) {\n    \n}',
  'Trapping Rain Water': 'int trap(vector<int>& height) {\n    \n}',
  'Coin Change': 'int coinChange(vector<int>& coins, int amount) {\n    \n}',
  'Two Sum': 'vector<int> twoSum(vector<int>& nums, int target) {\n    \n}'
};

const javaSignatures: Record<string, string> = {
  'Valid Parentheses': 'class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}',
  'Climbing Stairs': 'class Solution {\n    public int climbStairs(int n) {\n        \n    }\n}',
  'Number of Islands': 'class Solution {\n    public int numIslands(char[][] grid) {\n        \n    }\n}',
  'Best Time to Buy and Sell Stock': 'class Solution {\n    public int maxProfit(int[] prices) {\n        \n    }\n}',
  'Top K Frequent Elements': 'class Solution {\n    public int[] topKFrequent(int[] nums, int k) {\n        \n    }\n}'
};

const run = async () => {
  try {
    await mongoose.connect(dbURI);
    console.log('Connected to DB');

    const problems = await CodingProblem.find({});
    
    for (const problem of problems) {
      let updated = false;
      const starterCode = problem.starterCode as any;
      console.log(`Checking ${problem.title}, has cpp: ${!!starterCode.get('cpp')}`);
      
      if (cppSignatures[problem.title] && !starterCode.get('cpp')) {
        starterCode.set('cpp', cppSignatures[problem.title]);
        updated = true;
      }
      if (javaSignatures[problem.title] && !starterCode.get('java')) {
        starterCode.set('java', javaSignatures[problem.title]);
        updated = true;
      }
      
      if (updated) {
        problem.starterCode = starterCode;
        problem.markModified('starterCode');
        await problem.save();
        console.log(`Updated starter code for: ${problem.title}`);
      }
    }

    console.log('Done mapping starter codes!');
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
};

run();
