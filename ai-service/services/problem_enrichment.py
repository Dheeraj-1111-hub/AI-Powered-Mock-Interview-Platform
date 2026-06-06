import json
from services.groq_service import call_groq

PROBLEM_ENRICHMENT_PROMPT = """
You are a Principal Engineer at a FAANG company designing an elite coding challenge for HireIQ.
Given the following metadata of a real programming problem:
Title: {title}
Difficulty: {difficulty}
Tags: {tags}

Generate a premium, complete coding challenge in JSON format.
You must wrap this problem in a simple, realistic, grounded software engineering scenario. Do NOT use over-engineered AI buzzwords (like 'high-throughput blockchain optimizer'). Keep it practical and simple.

Example Grounded Scenarios:
- 'A distributed payment service stores transaction IDs in sorted arrays. Implement a scheduler to merge processing windows.'
- 'An internal telemetry filter analyzes system memory gain bounds to identify peak capacity.'

The JSON output MUST strictly match the following schema:
{{
    "scenario": "A simple, production-realistic software engineering context (1-2 sentences).",
    "description": "The exact problem description. Explain the input parameters, what the function should calculate/process, and the returned outputs. Use Markdown formatting. Be extremely clear and mathematically precise.",
    "starterCode": {{
        "javascript": "function functionName(param1, param2) {{\\n    // Implement\\n}}",
        "python": "def functionName(param1, param2):\\n    # Implement\\n    pass",
        "cpp": "#include <bits/stdc++.h>\\nusing namespace std;\\n\\n// Implement functionName(param1, param2) below\\n",
        "java": "import java.util.*;\\n\\nclass Solution {{\\n    // Implement functionName(param1, param2) below\\n}}"
    }},
    "testCases": [
        {{ "input": "input_as_string_of_arguments", "expectedOutput": "expected_output_as_string", "hidden": false, "caseType": "sample" }},
        {{ "input": "input_as_string_of_arguments", "expectedOutput": "expected_output_as_string", "hidden": false, "caseType": "sample" }},
        {{ "input": "input_as_string_of_arguments", "expectedOutput": "expected_output_as_string", "hidden": true, "caseType": "edge" }},
        {{ "input": "input_as_string_of_arguments", "expectedOutput": "expected_output_as_string", "hidden": true, "caseType": "boundary" }},
        {{ "input": "input_as_string_of_arguments", "expectedOutput": "expected_output_as_string", "hidden": true, "caseType": "stress" }}
    ],
    "constraints": ["constraint_1", "constraint_2"],
    "hints": ["progressive_hint_1", "progressive_hint_2"],
    "optimalComplexity": "O(...) Time, O(...) Space",
    "category": "Capitalized main DSA category (e.g. Arrays, Hashing, Two Pointers, Sliding Window, DP, Graphs, Stacks, Trees, Greedy)",
    "relatedProblems": ["Real Title 1", "Real Title 2"],
    "recommendedNext": "Real Sibling Title",
    "weaknessConnections": ["dsa_topic_1", "dsa_topic_2"],
    "discussions": [
        {{ "author": "dev_engineer_x", "timeAgo": "2 hours ago", "content": "fails on duplicate values in sliding windows" }},
        {{ "author": "quant_coder", "timeAgo": "1 day ago", "content": "Google screen last week. sliding window beats sorting O(N log N)." }},
        {{ "author": "stack_overflow_guru", "timeAgo": "3 days ago", "content": "can avoid array copy for O(1) memory delta" }}
    ]
}}

Make sure:
1. The starterCode function name must EXACTLY match the function call implied in the testCases (i.e. if JS function is 'twoSum', the testCase inputs represent arguments to 'twoSum(arg1, arg2)').
2. The 'input' field of each testCase MUST be formatted exactly as comma-separated arguments that can be appended directly to the function call, for example: '"[2,7,11,15], 9"' or '"\\\"anagram\\\", \\\"nagaram\\\""' or '"5"'.
3. The 'expectedOutput' field must be a valid JSON representation or exact string match of the output, for example: '"[0,1]"' or '"true"' or '"100"'.
4. Include exactly 5 test cases: 2 'sample' cases, 1 'edge' case (empty, single element, or null boundary), 1 'boundary' case (maximum or minimum constraints), and 1 'stress' case (larger datasets/extreme performance bounds).
5. Generate exactly 3 short-form, realistic developer comments in the 'discussions' array. Keep them brief and developer-like (e.g. 'fails on duplicates', 'memory overflow at 10^7 records').
6. Ensure the description matches the title and tags perfectly while placing it in the grounded scenario.
"""

def enrich_problem(title: str, difficulty: str, tags: list) -> dict:
    prompt = PROBLEM_ENRICHMENT_PROMPT.format(
        title=title,
        difficulty=difficulty,
        tags=", ".join(tags)
    )
    
    result = call_groq(prompt, temperature=0.1, json_mode=True)
    
    try:
        if isinstance(result, dict) and "error" in result:
            return result
            
        start = result.find('{')
        end = result.rfind('}') + 1
        return json.loads(result[start:end])
    except Exception as e:
        print(f"Error parsing enrichment result: {e}")
        return {"error": "Failed to parse enrichment response", "raw": result}
