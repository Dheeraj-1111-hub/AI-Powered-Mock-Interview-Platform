import { executeCode as executeJudge0 } from '../judge0';
import { runJSLocal, runPythonLocal } from './localRunner';
import { executePiston } from './piston';
import logger from '../logger';

export const executeCode = async (code: string, language: string, input: string): Promise<any> => {
  const engine = process.env.EXECUTION_ENGINE || 'local';
  
  if (engine === 'local') {
    const langKey = language.toLowerCase();
    logger.info(`[ExecutionRouter]: Routing ${language} compilation to LOCAL in-memory engine`);
    
    if (langKey === 'javascript' || langKey === 'typescript') {
      return runJSLocal(code, input);
    } else if (langKey === 'python') {
      return runPythonLocal(code, input);
    } else if (langKey === 'cpp' || langKey === 'java') {
      logger.info(`[ExecutionRouter]: Routing ${language} compilation to public Judge0 API engine`);
      return executeJudge0(code, language, input);
    } else {
      // Graceful fallback to prevent crashes if another language is somehow requested
      logger.warn(`[ExecutionRouter]: Unsupported local language '${language}', falling back to Judge0`);
      return executeJudge0(code, language, input);
    }
  }
  
  logger.info(`[ExecutionRouter]: Routing ${language} compilation to Judge0 sandbox engine`);
  return executeJudge0(code, language, input);
};
