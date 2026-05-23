import axios from 'axios';

(async () => {
    try {
        const res = await axios.post('https://emkc.org/api/v2/piston/execute', {
            language: 'javascript',
            version: '18.15.0',
            files: [
                { content: 'console.log("hello piston");' }
            ],
            stdin: ''
        });
        console.log(res.data);
    } catch (err) {
        console.error(err);
    }
})();
