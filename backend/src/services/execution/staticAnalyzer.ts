export interface CodeAnalysisResult {
  usesHashMap: boolean;
  usesSet: boolean;
  usesRecursion: boolean;
  usesSorting: boolean;
  usesQueue: boolean;
}

export const analyzeCodeAST = (code: string, language: string): CodeAnalysisResult => {
  const result: CodeAnalysisResult = {
    usesHashMap: false,
    usesSet: false,
    usesRecursion: false,
    usesSorting: false,
    usesQueue: false
  };

  if (!code) return result;

  const codeStr = code.toLowerCase();

  // Language agnostic basic pattern checks
  if (language === 'javascript' || language === 'typescript') {
    result.usesHashMap = /new map\(\)|\{.*\}/.test(codeStr) && codeStr.includes('map');
    result.usesSet = /new set\(\)/.test(codeStr);
    result.usesSorting = /\.sort\(/.test(codeStr);
    result.usesQueue = /\[\]/.test(codeStr) && (codeStr.includes('.push(') && codeStr.includes('.shift('));
  } else if (language === 'python') {
    result.usesHashMap = /\{.*\}|dict\(/.test(codeStr);
    result.usesSet = /set\(/.test(codeStr);
    result.usesSorting = /\.sort\(\)|sorted\(/.test(codeStr);
    result.usesQueue = /deque\(/.test(codeStr) || (codeStr.includes('append') && codeStr.includes('pop(0)'));
  }

  // Very basic recursion detection (does the function name appear inside its own block?)
  const fnMatch = code.match(/function\s+([a-zA-Z0-9_]+)\s*\(/) || code.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
  if (fnMatch && fnMatch[1]) {
    const fnName = fnMatch[1];
    // Check if function name is called again inside the code
    const recursionRegex = new RegExp(`function\\s+${fnName}[\\s\\S]*?${fnName}\\s*\\(`, 'g');
    const pyRecursionRegex = new RegExp(`def\\s+${fnName}[\\s\\S]*?${fnName}\\s*\\(`, 'g');
    
    if (language === 'python') {
      result.usesRecursion = pyRecursionRegex.test(code);
    } else {
      result.usesRecursion = recursionRegex.test(code);
    }
  }

  return result;
};
