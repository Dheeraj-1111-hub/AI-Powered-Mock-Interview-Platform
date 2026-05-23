import axios from 'axios';
import logger from './logger';

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';

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

    const response = await axios.post(`${JUDGE0_URL}/submissions?wait=true`, {
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
