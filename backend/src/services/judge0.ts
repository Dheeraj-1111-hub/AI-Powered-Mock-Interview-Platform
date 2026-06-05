import axios from 'axios';
import logger from './logger';

const JUDGE0_URL = process.env.JUDGE0_URL || 'https://ce.judge0.com';

const languageMap: Record<string, number> = {
  'javascript': 63,
  'python': 71,
  'cpp': 54,
  'java': 62
};

export const executeCode = async (code: string, language: string, input: string): Promise<any> => {
  try {
    const langKey = language.toLowerCase();
    const language_id = languageMap[langKey] || 63;
    
    // Apply execution wrapper for functional solutions inside the sandbox
    let finalCode = code;
    if (input) {
      if (langKey === 'javascript') {
        const fnMatch = code.match(/function\s+([a-zA-Z0-9_]+)/) || code.match(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:function|\()/);
        if (fnMatch && fnMatch[1]) {
           finalCode += `\nconsole.log(JSON.stringify(${fnMatch[1]}(${input})));`;
        }
      } else if (langKey === 'python') {
        const fnMatch = code.match(/def\s+([a-zA-Z0-9_]+)/);
        if (fnMatch && fnMatch[1]) {
           finalCode += `\nimport json\nprint(json.dumps(${fnMatch[1]}(${input})))`;
        }
      } else if (langKey === 'cpp') {
        const sigRegex = /(?:bool|int|string|void|vector<[a-zA-Z0-9_<>: ]+>|double|float|long|char)\s+([a-zA-Z0-9_]+)\s*\(/;
        const fnMatch = code.match(sigRegex);
        
        if (fnMatch && fnMatch[1] && !code.includes('main(') && !code.includes('main (')) {
           const cppInput = input.replace(/\[/g, '{').replace(/\]/g, '}');
           
           // Robustly convert pass-by-reference to pass-by-value for vectors and strings to allow rvalue binding
           let modifiedCode = code
               .replace(/vector\s*<\s*int\s*>\s*&/g, 'vector<int>')
               .replace(/vector\s*<\s*vector\s*<\s*int\s*>\s*>\s*&/g, 'vector<vector<int>>')
               .replace(/vector\s*<\s*char\s*>\s*&/g, 'vector<char>')
               .replace(/vector\s*<\s*vector\s*<\s*char\s*>\s*>\s*&/g, 'vector<vector<char>>')
               .replace(/string\s*&/g, 'string');

           const funcName = fnMatch[1].trim();

           finalCode = `
#include <iostream>
#include <vector>
#include <string>
#include <stack>
#include <queue>
#include <unordered_map>
#include <unordered_set>
#include <algorithm>
using namespace std;

` + modifiedCode + `

template<typename T>
void print_leetcode_result(T val) { cout << val << endl; }
void print_leetcode_result(bool val) { cout << (val ? "true" : "false") << endl; }
template<typename T>
void print_leetcode_result(const vector<T>& vec) {
    cout << "[";
    for(size_t i = 0; i < vec.size(); ++i) {
        cout << vec[i] << (i == vec.size() - 1 ? "" : ",");
    }
    cout << "]" << endl;
}

int main() {
    print_leetcode_result(${funcName}(${cppInput}));
    return 0;
}
`;
        }
      }
    }

    logger.info(`[Judge0]: Sending ${language} code to sandboxed runner...`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (process.env.RAPIDAPI_KEY) {
      headers['x-rapidapi-key'] = process.env.RAPIDAPI_KEY;
      headers['x-rapidapi-host'] = process.env.RAPIDAPI_HOST || 'judge0-ce.p.rapidapi.com';
    }

    const response = await axios.post(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, {
      source_code: Buffer.from(finalCode).toString('base64'),
      language_id,
      stdin: Buffer.from(input).toString('base64'),
    }, { headers });

    const result = response.data;
    
    if (result.status?.description === 'Internal Error') {
        throw new Error('Sandbox Internal Error');
    }

    const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString().trim() : '';
    const stderr = result.stderr ? Buffer.from(result.stderr, 'base64').toString().trim() : '';
    const compile_output = result.compile_output ? Buffer.from(result.compile_output, 'base64').toString().trim() : '';

    return {
      stdout,
      stderr,
      compile_output,
      status: result.status.description,
      time: result.time || 0.02,
      memory: result.memory || 2048 // KB
    };
  } catch (error: any) {
    logger.error(`[Judge0]: Sandbox execution failed: ${error.message}`);
    throw new Error('Failed to execute code in sandbox. Please verify the environment.');
  }
};
