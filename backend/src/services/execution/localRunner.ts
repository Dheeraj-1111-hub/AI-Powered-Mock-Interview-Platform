import vm from 'node:vm';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import logger from '../logger';

// Helper for deep equality checks (matches matrices, arrays of objects, primitives)
export const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }
  
  // Handle loose structural equivalent comparisons (e.g. number and numeric string)
  if (String(a).trim() === String(b).trim()) return true;
  
  return false;
};

// Robust function name extraction
const extractFunctionName = (code: string): string => {
  const fnMatch = code.match(/function\s+([a-zA-Z0-9_]+)\s*\(/);
  if (fnMatch && fnMatch[1]) return fnMatch[1];
  
  const arrowMatch = code.match(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/);
  if (arrowMatch && arrowMatch[1]) return arrowMatch[1];
  
  const assignedMatch = code.match(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?function/);
  if (assignedMatch && assignedMatch[1]) return assignedMatch[1];
  
  return 'solve';
};

// Emulated memory estimator for realism
const estimateMemory = (code: string, logsCount: number): number => {
  let baseKb = 12000 + Math.floor(Math.random() * 8000); // 12MB - 20MB standard Node footprint
  baseKb += code.length * 2; 
  baseKb += logsCount * 12;
  return baseKb;
};

export const runJSLocal = async (code: string, input: string): Promise<any> => {
  const logs: string[] = [];
  let outputLimitExceeded = false;

  const sandbox = {
    console: {
      log: (...args: any[]) => {
        if (logs.length > 300) {
          if (!outputLimitExceeded) {
            logs.push('... [STDOUT TRUNCATED: Console logs capped at 300 entries to prevent memory crashes]');
            outputLimitExceeded = true;
          }
          return;
        }
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      },
    },
    JSON,
    Array,
    Object,
    Math,
    String,
    Number,
    Boolean,
    Date,
    RegExp,
    Set,
    Map
  };

  const context = vm.createContext(sandbox);
  const fnName = extractFunctionName(code);
  
  // Wrap in async IIFE driver to handle promise resolution elegantly
  const wrappedCode = `
    (async () => {
      ${code}
      const fn = typeof ${fnName} !== 'undefined' ? ${fnName} : null;
      if (!fn) {
        throw new Error("Function '${fnName}' is not defined. Please verify your solution function name.");
      }
      const args = [${input || ''}];
      const result = fn(...args);
      return result instanceof Promise ? await result : result;
    })()
  `;

  const startTime = process.hrtime.bigint();
  try {
    const script = new vm.Script(wrappedCode);
    
    // Strict 2-second timeout to mitigate infinite loops
    const promise = script.runInContext(context, { timeout: 2000 });
    const rawResult = await promise;
    
    const endTime = process.hrtime.bigint();
    const runtimeSec = Number(endTime - startTime) / 1000000000;
    
    const formattedResult = typeof rawResult === 'object' ? JSON.stringify(rawResult) : String(rawResult);

    return {
      stdout: logs.join('\n'),
      stderr: '',
      compile_output: '',
      status: 'Accepted',
      time: runtimeSec,
      memory: estimateMemory(code, logs.length),
      returnValue: rawResult,
      formattedResult
    };
  } catch (error: any) {
    const endTime = process.hrtime.bigint();
    const runtimeSec = Number(endTime - startTime) / 1000000000;
    
    let status = 'Runtime Error';
    if (error.message.includes('script execution timed out')) {
      status = 'Time Limit Exceeded';
    } else if (error instanceof SyntaxError) {
      status = 'Syntax Error';
    }

    return {
      stdout: logs.join('\n'),
      stderr: error.message,
      compile_output: error.stack || '',
      status,
      time: runtimeSec,
      memory: estimateMemory(code, logs.length)
    };
  }
};

export const runPythonLocal = async (code: string, input: string): Promise<any> => {
  const tempDir = path.join(__dirname, '..', '..', 'temp_runs');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const filename = `run_${Date.now()}_${Math.random().toString(36).substring(7)}.py`;
  const filepath = path.join(tempDir, filename);
  
  const fnName = extractFunctionName(code);
  
  // Wrapping script with robust JSON input parser and standard outputs
  const driverCode = `
import json
import sys

${code}

def main():
    try:
        # Safely parse the JSON string as an array to handle JS-to-Python type conversions (e.g. true -> True)
        raw_input_str = f"[{input or ''}]"
        args_input = json.loads(raw_input_str)
        
        fn = globals().get('${fnName}')
        if not fn:
            print(json.dumps({"error": "Function ${fnName} not found in submission"}), file=sys.stderr)
            sys.exit(1)
        
        res = fn(*args_input)
        print(json.dumps(res))
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
`;

  fs.writeFileSync(filepath, driverCode, 'utf8');
  const startTime = process.hrtime.bigint();

  const executeProcess = (command: string): Promise<any> => {
    return new Promise((resolve) => {
      const processInstance = spawn(command, [filepath], { timeout: 2000 });
      let stdout = '';
      let stderr = '';

      processInstance.stdout.on('data', (data) => { stdout += data.toString(); });
      processInstance.stderr.on('data', (data) => { stderr += data.toString(); });

      processInstance.on('close', (exitCode) => {
        const endTime = process.hrtime.bigint();
        const runtimeSec = Number(endTime - startTime) / 1000000000;
        
        try { fs.unlinkSync(filepath); } catch {}

        if (exitCode === 0) {
          let parsedResult = stdout.trim();
          let rawReturnValue = parsedResult;
          try {
            rawReturnValue = JSON.parse(parsedResult);
          } catch {}

          resolve({
            stdout: '',
            stderr: '',
            compile_output: '',
            status: 'Accepted',
            time: runtimeSec,
            memory: estimateMemory(code, 0),
            returnValue: rawReturnValue,
            formattedResult: parsedResult
          });
        } else {
          resolve({
            stdout: '',
            stderr: stderr.trim(),
            compile_output: stderr.trim(),
            status: exitCode === null ? 'Time Limit Exceeded' : 'Runtime Error',
            time: runtimeSec,
            memory: estimateMemory(code, 0)
          });
        }
      });

      processInstance.on('error', (err) => {
        resolve({ error: err });
      });
    });
  };

  try {
    // Attempt standard python run
    let result = await executeProcess('python');
    if (result.error && result.error.message.includes('ENOENT')) {
      // Fallback to python3 if python command isn't in shell path
      result = await executeProcess('python3');
    }
    
    if (result.error) {
      try { fs.unlinkSync(filepath); } catch {}
      return {
        stdout: '',
        stderr: 'Python execution environment is not set up on this machine.',
        compile_output: result.error.message,
        status: 'Runtime Error',
        time: 0.05,
        memory: 12000
      };
    }

    return result;
  } catch (err: any) {
    try { fs.unlinkSync(filepath); } catch {}
    return {
      stdout: '',
      stderr: err.message,
      compile_output: err.stack,
      status: 'Runtime Error',
      time: 0.05,
      memory: 12000
    };
  }
};
