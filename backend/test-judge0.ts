import { executeCode } from './src/services/judge0';

(async () => {
    try {
        const res = await executeCode('console.log("hello")', 'javascript', '');
        console.log(res);
    } catch (err) {
        console.error(err);
    }
})();
