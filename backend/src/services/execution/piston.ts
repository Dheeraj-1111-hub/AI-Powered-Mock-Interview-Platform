import axios from 'axios';
import logger from '../logger';

const PISTON_URL = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston';

const pistonLanguageMap: Record<string, { language: string, version: string }> = {
  'javascript': { language: 'javascript', version: '18.15.0' },
  'python': { language: 'python', version: '3.10.0' },
  'cpp': { language: 'c++', version: '10.2.0' },
  'java': { language: 'java', version: '15.0.2' },
};

export const executePiston = async (code: string, language: string, input: string): Promise<any> => {
  try {
    const langKey = language.toLowerCase();
    const runtimeConfig = pistonLanguageMap[langKey] || { language: langKey, version: '*' };
    
    let finalCode = code;
    // For Javascript and Python, emulate the functional wrapper if needed, 
    // but the system will mainly route cpp/java here. Let's add basic wrappers just in case.
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

    logger.info(`[Piston]: Sending ${language} code to public Piston execution sandbox...`);

    const response = await axios.post(`${PISTON_URL}/execute`, {
      language: runtimeConfig.language,
      version: runtimeConfig.version,
      files: [
        { content: finalCode }
      ],
      stdin: input || ''
    });

    const result = response.data;
    if (result.compile && result.compile.code !== 0) {
        return {
            stdout: '',
            stderr: result.compile.stderr || result.compile.output,
            compile_output: result.compile.output,
            status: 'Compile Error',
            time: 0,
            memory: 0
        };
    }

    const runResult = result.run;
    const stdout = runResult.stdout ? runResult.stdout.trim() : '';
    const stderr = runResult.stderr ? runResult.stderr.trim() : '';
    
    let status = 'Accepted';
    if (runResult.code !== 0) {
        if (runResult.signal === 'SIGKILL' || runResult.stderr.includes('Timeout')) {
            status = 'Time Limit Exceeded';
        } else {
            status = 'Runtime Error';
        }
    }

    return {
      stdout,
      stderr,
      compile_output: result.compile ? result.compile.output : '',
      status,
      time: 0.1, // Piston doesn't guarantee highly accurate benchmarking in v2 API response for free tier, mock lightly if missing
      memory: 2048 // KB
    };
  } catch (error: any) {
    logger.error(`[Piston]: Sandbox execution failed: ${error.message}`);
    return {
        stdout: '',
        stderr: error.message,
        compile_output: '',
        status: 'Runtime Error',
        time: 0,
        memory: 0
    };
  }
};
