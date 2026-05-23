async function test() {
    try {
        const res = await fetch('https://ai-powered-mock-interview-platform-avpg.onrender.com/api/career/today/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                targetRole: "Software Engineer",
                strugglingTopics: ["React"],
                currentRoadmapWeek: null,
                availableMinutes: 120
            })
        });
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body:", text);
    } catch (err) {
        console.error("Fetch failed:", err);
    }
}
test();
