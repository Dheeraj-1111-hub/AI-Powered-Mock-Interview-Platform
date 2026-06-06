from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from typing import Optional
from pydantic import BaseModel
import pdfplumber
import docx
import io
from services.groq_service import call_groq
from services.problem_enrichment import enrich_problem
from prompts.core_prompts import (
    RESUME_ANALYSIS_PROMPT, INTERVIEW_GEN_PROMPT, EVALUATION_PROMPT,
    FOLLOW_UP_PROMPT, CODE_INTELLIGENCE_PROMPT, CAREER_INTELLIGENCE_PROMPT,
    CAREER_PROFILE_INIT_PROMPT, ADAPTIVE_ROADMAP_PROMPT, MENTOR_V2_SYSTEM_PROMPT,
    MENTOR_PERSONAS, PERSONA_BEHAVIORS, TODAY_ENGINE_PROMPT, PROACTIVE_INTERRUPT_PROMPT,
    INTERVIEW_SUMMARY_PROMPT
)
import json

router = APIRouter()

class EnrichRequest(BaseModel):
    title: str
    difficulty: str
    tags: list[str]

class InterviewChatRequest(BaseModel):
    problemDescription: str
    code: str
    language: str
    messages: list[dict]
    tone: str
    interviewerPersona: str

class FinishInterviewRequest(BaseModel):
    problemDescription: str
    code: str
    language: str
    messages: list[dict]

class GenerateRequest(BaseModel):
    role: str
    experience: str
    stack: str
    companyType: str
    persona: str = 'Professional'

class EvaluateRequest(BaseModel):
    answer: str
    question: str
    role: str
    transcript: Optional[list] = None
    roundType: Optional[str] = 'behavioral'
    skill: Optional[str] = 'General'
    latencyMs: Optional[int] = None
    voiceMetrics: Optional[dict] = None

class CodeReviewRequest(BaseModel):
    code: str
    language: str
    problemDescription: str
    staticAnalysis: Optional[dict] = None
    executionStatus: Optional[str] = None
    executionResults: Optional[list] = None

class ChallengeRequest(BaseModel):
    role: str
    experience: str
    stack: str

class GapAnalysisRequest(BaseModel):
    resumeText: str
    targetRole: str
    targetStack: str

class RoadmapRequest(BaseModel):
    gaps: list[str]
    targetRole: str

class CareerMentorRequest(BaseModel):
    message: str
    context: str

class DashboardRecsRequest(BaseModel):
    stats: dict
    activity: list
    userProfile: dict

class FollowUpRequest(BaseModel):
    role: str
    roundName: str
    prevQuestion: str
    prevAnswer: str
    transcript: list = []
    persona: str = 'Professional'

class InterviewSummaryRequest(BaseModel):
    transcript: list
    role: str

class CareerProfileInitRequest(BaseModel):
    targetRole: str = 'Software Engineer'
    targetCompany: str = ''
    timeline: str = '12 months'
    currentYear: str = 'junior'
    dsaComfort: float = 5.0
    systemDesignComfort: float = 3.0
    dailyHoursAvailable: float = 2.0
    weakTopics: list[str] = []
    strongTopics: list[str] = []
    persona: str = 'faang_engineer'
    targetWeekCount: int = 12

class AdaptiveRoadmapRequest(BaseModel):
    targetRole: str = 'Software Engineer'
    targetCompany: str = ''
    persona: str = 'faang_engineer'
    startingFromWeek: int = 1
    currentWeeks: list[dict] = []
    performanceDelta: str = ''
    strugglingTopics: list[str] = []
    strongTopics: list[str] = []
    readinessScore: float = 0.0

class MentorV2Request(BaseModel):
    persona: str = 'faang_engineer'
    message: str
    history: list[dict] = []
    context: dict = {}

@router.post('/enrich')
async def enrich_coding_problem(request: EnrichRequest):
    enriched = enrich_problem(request.title, request.difficulty, request.tags)
    return enriched

@router.post('/interview/chat')
async def interview_chat(request: InterviewChatRequest):
    system_prompt = f"""
You are the AI Technical Interviewer. Your persona is: {request.interviewerPersona}.
You are conducting a live, highly interactive technical coding interview for a candidate working on this DSA problem:
{request.problemDescription}

Your behavior must reflect the candidate's requested tone:
- supportive: encourage them, give subtle structural hints when they are stuck, be warm, friendly, and helpful.
- interrogative: ask deep, sharp questions about complexity, trade-offs, and design choices. Ask them to walk through their thinking.
- silent: speak only when asked or when they submit. Give very brief, direct, minimalist confirmation.
- demanding: push them hard on edge cases, maximum performance bounds, array constraints, and optimal complexities. Be direct and slightly critical of unoptimized segments.

The candidate's current code draft:
```{request.language}
{request.code}
```

Instructions:
1. Speak exclusively in character as the interviewer. Do NOT generate the candidate's code. Do NOT output a solution unless they are completely blocked and the tone is supportive.
2. Ask direct, engineering-grounded, highly realistic questions (e.g., "How does your code handle duplicate values?", "What is the worst-case space complexity of your hashing block?", "Can you optimize this line to avoid overhead?").
3. Keep your questions and responses extremely brief (1-3 sentences maximum). Real interviewers are concise, interactive, and do not lecture.
4. If this is the start of the interview (messages history is empty), introduce the problem scenario in a professional corporate context and ask the candidate how they plan to approach the solution.
"""
    chat_history = []
    for msg in request.messages:
        role = "assistant" if msg["role"] == "interviewer" else "user"
        chat_history.append({"role": role, "content": msg["content"]})
        
    response_text = call_groq(system_prompt, json.dumps(chat_history) if chat_history else "Let's begin the interview.")
    return {"message": response_text.strip()}

@router.post('/interview/monitor')
async def interview_monitor(request: InterviewChatRequest):
    prompt = PROACTIVE_INTERRUPT_PROMPT.format(
        interviewerPersona=request.interviewerPersona,
        tone=request.tone,
        problemDescription=request.problemDescription,
        language=request.language,
        code=request.code
    )
    result = call_groq(prompt, json_mode=True)
    try:
        start = result.find('{')
        end = result.rfind('}') + 1
        parsed = json.loads(result[start:end])
        return parsed
    except:
        return {"interrupt": False, "message": ""}

@router.post('/interview/finish')
async def finish_interview(request: FinishInterviewRequest):
    system_prompt = """
You are a Lead Software Engineer at Google calibrating a candidate's technical coding interview performance.
Analyze the candidate's final code and the conversational chat history to produce a comprehensive FAANG-grade performance report.

You MUST return exactly a JSON object matching this structure:
{
    "accuracy": integer rating between 1 and 100,
    "depth": integer rating between 1 and 100,
    "communication": integer rating between 1 and 100,
    "confidence": integer rating between 1 and 100,
    "practicality": integer rating between 1 and 100,
    "feedbackSummary": "A detailed multi-paragraph performance evaluation summarizing their strengths, weaknesses, and direct technical areas for career growth.",
    "overallReadiness": integer rating between 1 and 100,
    "strongAreas": ["list", "of", "strong", "skills"],
    "weakAreas": ["list", "of", "weak", "skills"],
    "faangRecommendation": "Ready" | "Not Ready Yet" | "Close",
    "estimatedTimeline": "X weeks"
}

Do NOT wrap the output in markdown code blocks or add any other text. Return ONLY the raw valid JSON string.
"""

    prompt = f"""
Problem: {request.problemDescription}
Final Code ({request.language}):
```{request.language}
{request.code}
```
Dialogue History:
{json.dumps(request.messages)}
"""
    response_text = call_groq(system_prompt, prompt)
    clean_text = response_text.replace("```json", "").replace("```", "").strip()
    return json.loads(clean_text)

@router.post('/resume')
async def analyze_resume(resume: UploadFile = File(...), jobDescription: Optional[str] = Form(None), profileData: Optional[str] = Form(None)):
    text = ''
    filename = resume.filename.lower()
    
    content = await resume.read()
    file_stream = io.BytesIO(content)

    if filename.endswith('.pdf'):
        with pdfplumber.open(file_stream) as pdf:
            text = '\n'.join(page.extract_text() or '' for page in pdf.pages)
    elif filename.endswith('.docx'):
        doc = docx.Document(file_stream)
        text = '\n'.join([para.text for para in doc.paragraphs])
    else:
        text = content.decode('utf-8', errors='ignore')

    if not text.strip():
        return {"error": "Could not extract text from the file."}

    # Truncate text to avoid Groq Free Tier TPM limit (30,000 TPM -> max ~6000 words per minute)
    if len(text) > 12000:
        print(f"Truncating resume text from {len(text)} to 12000 chars.")
        text = text[:12000] + "\n...[TRUNCATED FOR LENGTH]"

    prompt = RESUME_ANALYSIS_PROMPT.format(
        text=text, 
        jobDescription=jobDescription or "General Career Analysis",
        profileData=profileData or "No specific career profile provided."
    )
    result = call_groq(prompt, json_mode=True)
    
    try:
        start = result.find('{')
        end = result.rfind('}') + 1
        parsed_result = json.loads(result[start:end])
        
        # --- DETERMINISTIC OVERRIDES ---
        # 1. Job Alignment Math
        align = parsed_result.get('jobAlignment', {})
        intel = parsed_result.get('keywordIntelligence', {})
        
        # Combine all possible extracted keywords from the LLM
        all_jd_keywords = set()
        for kw in (align.get('presentKeywords', []) + align.get('missingKeywords', []) + intel.get('present', []) + intel.get('missing', [])):
            if len(kw) > 1: all_jd_keywords.add(kw)
            
        real_present = []
        real_missing = []
        text_lower = text.lower()
        
        for kw in all_jd_keywords:
            if kw.lower() in text_lower:
                real_present.append(kw)
            else:
                real_missing.append(kw)
                
        present = len(real_present)
        missing = len(real_missing)
        total_keywords = present + missing
        
        if 'jobAlignment' not in parsed_result: parsed_result['jobAlignment'] = {}
        parsed_result['jobAlignment']['presentKeywords'] = real_present
        parsed_result['jobAlignment']['missingKeywords'] = real_missing
        
        if total_keywords > 0:
            score = int(round((present / total_keywords) * 100))
            # If the user matched >88% but missing is > 0, cap at 88
            if score > 88 and missing > 0: score = 88
            parsed_result['jobAlignment']['score'] = score
        else:
            parsed_result['jobAlignment']['score'] = 50

        # 2. ATS Score Math
        text_lower = text.lower()
        ats_score = 30
        sections_found = 0
        if "education" in text_lower: sections_found += 1
        if "skills" in text_lower or "technologies" in text_lower: sections_found += 1
        if "experience" in text_lower or "employment" in text_lower: sections_found += 1
        if "projects" in text_lower: sections_found += 1
        ats_score += (sections_found * 10)
        
        failed_rules = [r for r in parsed_result.get('dynamicGuidelines', []) if r.get('status') == 'failed']
        format_validity = 40
        
        # Penalize if metrics are missing from the resume text
        has_metrics = any(char.isdigit() for char in text) and '%' in text
        
        if len(failed_rules) == 0: 
            ats_score += 30 if has_metrics else 20
            format_validity = 95
        elif len(failed_rules) <= 1: 
            ats_score += 15
            format_validity = 85
        
        # Calculate actual ATS based strictly on extracted metrics
        if 'globalAts' not in parsed_result: parsed_result['globalAts'] = {}
        
        # Ensure it doesn't exceed 100, but allow it to be what it actually calculated
        parsed_result['globalAts']['total'] = min(ats_score, 100)
        parsed_result['globalAts']['sections'] = min(int((sections_found / 4) * 100), 100)
        parsed_result['globalAts']['format'] = format_validity
        parsed_result['globalAts']['parsing'] = 90 if len(text) > 200 else 15

        # We completely removed the hardcoded 'Project Quality Boost (88)' and 'Recruiter Impact Boost (80)'
        # Let the LLM's actual parsed metrics dictate the score.

        # 5. Missing / Standout Section Enforcement
        if 'sixSecondScan' not in parsed_result: parsed_result['sixSecondScan'] = {}
        
        # Override Standouts
        standouts = []
        if 'llm' in text_lower or 'generative ai' in text_lower or 'agents' in text_lower:
            standouts.append("Strong alignment with AI-native development (LLMs, RAG, Multi-Agent Systems).")
        if 'react' in text_lower and ('node' in text_lower or 'fastapi' in text_lower):
            standouts.append("Strong full-stack engineering background.")
        if 'technical head' in text_lower or 'lead' in text_lower:
            standouts.append("Demonstrated leadership and project management experience.")
        if len(standouts) > 0:
            parsed_result['sixSecondScan']['good'] = standouts

        # Override Missing
        missing_section = []
        if len(real_missing) > 0:
            missing_section.append(f"JD requirements not explicitly found: {', '.join(real_missing[:3])}")
        if not has_metrics:
            missing_section.append("No quantified project impact metrics (e.g., 'Reduced latency by 30%')")
        if 'cursor' not in text_lower and 'copilot' not in text_lower:
            missing_section.append("No explicit AI coding tools mentioned (Cursor, Copilot, Claude)")
            
        if len(missing_section) > 0:
            parsed_result['sixSecondScan']['bad'] = missing_section
        
        parsed_result['parsedText'] = text
        return {'analysis': parsed_result}
    except Exception as e:
        print(f"Resume JSON Parse Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse resume analysis JSON")

@router.post('/generate')
async def generate_interview(request: dict):
    # request: { role, experience, stack, companyType, persona, resumeContext }
    role = request.get('role')
    experience = request.get('experience')
    stack = request.get('stack')
    companyType = request.get('companyType')
    persona = request.get('persona', 'Skeptical Senior Architect')
    resume_context = request.get('resumeContext')

    behavior = PERSONA_BEHAVIORS.get(persona, "Professional and standard.")
    
    resume_info = ""
    if resume_context:
        resume_info = f"Resume Insights: Strengths: {resume_context.get('strengths')}, Weaknesses: {resume_context.get('weaknesses')}, Gaps: {resume_context.get('keywordGaps')}"

    prompt = INTERVIEW_GEN_PROMPT.format(
        experience=experience,
        role=role,
        companyType=companyType,
        stack=stack,
        persona=persona,
        behavior=behavior,
        resumeInfo=resume_info
    )
    result = call_groq(prompt, json_mode=True)
    
    try:
        start = result.find('{')
        end = result.rfind('}') + 1
        return {'plan': json.loads(result[start:end])}
    except Exception as e:
        print(f"Generate Error: {e} | Raw: {result}")
        raise HTTPException(status_code=500, detail="Failed to generate interview plan")

@router.post('/evaluate')
async def evaluate_answer(request: EvaluateRequest):
    persona = request.role # In this context role might be persona name
    behavior = PERSONA_BEHAVIORS.get(persona, "Professional and analytical.")

    if request.roundType == 'technical':
        prompt = CODE_INTELLIGENCE_PROMPT.format(
            language="javascript",
            problemDescription=request.question,
            staticAnalysis="None provided.",
            code=request.answer
        )
    else:
        telemetry_context = ""
        if request.latencyMs:
            telemetry_context += f"Latency to Answer: {request.latencyMs}ms.\n"
        if request.voiceMetrics:
            telemetry_context += f"Voice Analytics: WPM={request.voiceMetrics.get('wpm')}, Filler Words={request.voiceMetrics.get('fillerWordCount')}.\n"
        
        prompt = EVALUATION_PROMPT.format(
            question=request.question,
            answer=request.answer,
            skill=request.skill,
            transcript=json.dumps(request.transcript) if request.transcript else "New session.",
            telemetry=telemetry_context if telemetry_context else "No real-time telemetry recorded."
        )
    
    result = call_groq(prompt, json_mode=True)
    try:
        start = result.find('{')
        end = result.rfind('}') + 1
        return {'evaluation': json.loads(result[start:end])}
    except Exception as e:
        print(f"Eval Error: {e} | Raw: {result}")
        raise HTTPException(status_code=500, detail="Failed to evaluate answer")

@router.post('/follow-up')
async def follow_up_question(request: FollowUpRequest):
    behavior = PERSONA_BEHAVIORS.get(request.persona, "Direct and challenging.")
    
    prompt = FOLLOW_UP_PROMPT.format(
        persona=request.persona,
        behavior=behavior,
        roundName=request.roundName,
        prevQuestion=request.prevQuestion,
        prevAnswer=request.prevAnswer,
        transcript=json.dumps(request.transcript) if request.transcript else "New session."
    )
    result = call_groq(prompt, json_mode=True)
    try:
        start = result.find('{')
        end = result.rfind('}') + 1
        return json.loads(result[start:end])
    except:
        return {"text": result, "intent": "Contextual deep-dive"}

@router.post('/interview/summary')
async def interview_summary(request: InterviewSummaryRequest):
    prompt = INTERVIEW_SUMMARY_PROMPT.format(
        role=request.role,
        transcript=json.dumps(request.transcript)
    )
    result = call_groq(prompt, json_mode=True)
    try:
        start = result.find('{')
        end = result.rfind('}') + 1
        return json.loads(result[start:end])
    except:
        return {
            "communicationScore": 75,
            "technicalScore": 75,
            "confidenceScore": 75,
            "problemSolvingScore": 75,
            "summary": "Interview concluded.",
            "strengths": ["Communication"],
            "weaknesses": [],
            "recommendations": ["Keep practicing"],
            "verdict": "CONSIDER"
        }
@router.post('/review')
async def review_code(request: CodeReviewRequest):
    prompt = CODE_INTELLIGENCE_PROMPT.format(
        language=request.language,
        problemDescription=request.problemDescription,
        code=request.code,
        staticAnalysis=json.dumps(request.staticAnalysis) if request.staticAnalysis else "None detected",
        executionStatus=request.executionStatus or "Unknown",
        executionResults=json.dumps(request.executionResults) if request.executionResults else "None"
    )
    result = call_groq(prompt, json_mode=True)
    return {'review': result}

@router.post('/challenge')
async def generate_challenge(request: ChallengeRequest):
    # This can stay simple or use the new prompts
    prompt = f"Generate a {request.experience} coding challenge for {request.role} on {request.stack}. Return JSON."
    result = call_groq(prompt, json_mode=True)
    return {'challenge': result}

@router.post('/career/gap')
async def analyze_skill_gap(request: GapAnalysisRequest):
    prompt = CAREER_INTELLIGENCE_PROMPT.format(
        resumeGaps="Analyze text",
        interviewPerformance="Fetch from history",
        targetRole=request.targetRole
    )
    # Using the refined prompt
    result = call_groq(prompt, json_mode=True)
    return {'analysis': result}

@router.post('/career/roadmap')
async def generate_roadmap(request: RoadmapRequest):
    prompt = f"Generate roadmap for {request.targetRole} with gaps {request.gaps}. Return JSON."
    result = call_groq(prompt, json_mode=True)
    return {'roadmap': result}

@router.post('/career/mentor')
async def career_mentor(request: CareerMentorRequest):
    prompt = CAREER_MENTOR_PROMPT.format(
        context=request.context,
        message=request.message
    )
    result = call_groq(prompt, json_mode=True)
    try:
        return {'mentorResponse': json.loads(result)}
    except:
        return {'mentorResponse': {'reply': result}}

@router.post('/dashboard/recommendations')
async def dashboard_recommendations(request: dict):
    try:
        # stats: { totalInterviews, totalCoding, averageScore, streak }
        # activity: [{ title, description, date, tags }]
        # userProfile: { role, skills, experience }
        
        stats = request.get('stats', {})
        user_profile = request.get('userProfile', {})
        activity = request.get('activity', [])

        prompt = f"""
        Provide a career intelligence summary for a {user_profile.get('role')} with {user_profile.get('experience')} experience.
        Return ONLY a JSON object:
        {{
            "summary": "1-2 sentence improvement plan",
            "recommendations": [
                {{ "title": "Actionable task title", "description": "why and what", "action": "/valid_route", "priority": "High" }}
            ],
            "aiInsights": "Deep analysis of their performance trends",
            "memoryPattern": "A summary of how they have improved or what they repeatedly struggle with"
        }}

        IMPORTANT RULES FOR "action":
        You MUST choose ONE of these EXACT routes for the "action" field depending on the task:
        - "/interview" (for practicing mock interviews, communication, or system design)
        - "/coding" (for practicing algorithms, data structures, and problem solving)
        - "/resume" (for updating resume or career details)
        - "/analytics" (to view detailed performance metrics)
        - "/career" (to review career roadmap)
        DO NOT invent new URLs. Always map the recommendation to the most relevant exact route above.

        Current Stats: {json.dumps(stats)}
        Recent Activity: {json.dumps(activity)}
        """
        result = call_groq(prompt, json_mode=True)
        
        try:
            start = result.find('{')
            end = result.rfind('}') + 1
            return json.loads(result[start:end])
        except Exception as e:
            print(f"Recs Parse Error: {e}")
            raise Exception("Parse failed")
            
    except Exception as e:
        print(f"Recs Error (returning fallback): {e}")
        return {
            "summary": "Continue building your foundational skills. AI analysis is currently calibrating your recent activity.",
            "recommendations": [
                { "title": "Complete Calibration", "description": "Take another interview to establish a stronger baseline.", "action": "/interview", "priority": "High" },
                { "title": "Solve Code Challenges", "description": "Improve your technical readiness with targeted practice.", "action": "/coding", "priority": "Medium" }
            ],
            "aiInsights": "Based on recent activity, the candidate is establishing their foundation. Maintain consistency to unlock deeper insights.",
            "memoryPattern": "Candidate is currently in the active learning and data collection phase."
        }

@router.post('/interview/summary')
async def interview_summary(request: dict):
    try:
        # request: { transcript: [{question, answer, score}], role }
        role = request.get('role', 'Candidate')
        transcript_data = request.get('transcript', [])
        
        prompt = f"""
        Analyze the following interview transcript for a {role} position and provide a recruiter-grade intelligence report.
        Return ONLY a JSON object with the following structure:
        {{
            "summary": "2-3 sentence executive summary",
            "strengths": ["list of 3 key strengths"],
            "weaknesses": ["list of 3 key gaps/weaknesses"],
            "recommendations": ["list of 3 next steps/topics"],
            "verdict": "RECOMMENDED" | "CONSIDER" | "DEVELOPMENT"
        }}

        Transcript: {json.dumps(transcript_data)}
        """
        result = call_groq(prompt, json_mode=True)
        
        try:
            # Robust JSON extraction
            start = result.find('{')
            end = result.rfind('}') + 1
            if start != -1 and end != 0:
                return json.loads(result[start:end])
            return {"summary": result, "strengths": [], "weaknesses": [], "recommendations": [], "verdict": "CONSIDER"}
        except Exception as e:
            print(f"Summary JSON Parse Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to parse summary JSON")

    except Exception as e:
        print(f"Summary Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate interview summary")

# ─────────────────────────────────────────────────────────────────────────────
# CAREER AI INTELLIGENCE — Phase 3 Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.post('/career/profile/init')
async def career_profile_init(request: CareerProfileInitRequest):
    """Generate initial 12-week roadmap + skill gap analysis from onboarding answers."""
    try:
        prompt = CAREER_PROFILE_INIT_PROMPT.format(
            targetRole=request.targetRole,
            targetCompany=request.targetCompany or 'top tech company',
            timeline=request.timeline,
            currentYear=request.currentYear,
            dsaComfort=request.dsaComfort,
            systemDesignComfort=request.systemDesignComfort,
            dailyHoursAvailable=request.dailyHoursAvailable,
            weakTopics=', '.join(request.weakTopics) or 'None specified',
            strongTopics=', '.join(request.strongTopics) or 'None specified',
            persona=request.persona,
            targetWeekCount=request.targetWeekCount,
        )
        result = call_groq(prompt, json_mode=True)
        try:
            # Clean possible markdown wrap before parsing
            clean_text = result.replace("```json", "").replace("```", "").strip()
            start = clean_text.find('{')
            end = clean_text.rfind('}') + 1
            if start >= 0 and end > start:
                parsed = json.loads(clean_text[start:end])
                return {'result': parsed}
            else:
                raise ValueError("No JSON object found")
        except Exception as parse_err:
            print(f"Career init parse error: {parse_err} | Raw: {result[:200]}")
            # Do NOT return a raw string that will crash JSON.parse in the Node backend!
            return {'result': {'title': 'Default Plan', 'phases': [], 'weeklyPlan': [], 'skillGaps': []}}
    except Exception as e:
        print(f"Career init error: {e}")
        return {'result': {'title': 'Default Plan', 'phases': [], 'weeklyPlan': [], 'skillGaps': []}}


@router.post('/career/roadmap/adaptive')
async def adaptive_roadmap(request: AdaptiveRoadmapRequest):
    """Re-generate future roadmap weeks based on performance delta."""
    try:
        prompt = ADAPTIVE_ROADMAP_PROMPT.format(
            targetRole=request.targetRole,
            persona=request.persona,
            startingFromWeek=request.startingFromWeek,
            readinessScore=request.readinessScore,
            performanceDelta=json.dumps(request.performanceDelta).replace("{", "{{").replace("}", "}}"),
            strugglingTopics=', '.join(request.strugglingTopics) or 'None',
            strongTopics=', '.join(request.strongTopics) or 'None',
            currentWeeks=json.dumps(request.currentWeeks).replace("{", "{{").replace("}", "}}"),
        )
        result = call_groq(prompt, json_mode=True)
        try:
            clean_text = result.replace("```json", "").replace("```", "").strip()
            start = clean_text.find('{')
            end = clean_text.rfind('}') + 1
            if start >= 0 and end > start:
                parsed = json.loads(clean_text[start:end])
                return {'result': parsed}
            else:
                raise ValueError("No JSON object found")
        except Exception as parse_err:
            print(f"Adaptive roadmap parse error: {parse_err}")
            raise HTTPException(status_code=500, detail="Failed to parse adaptive roadmap JSON")
    except Exception as e:
        print(f"Adaptive roadmap error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate adaptive roadmap")


@router.post('/career/mentor/v2')
async def career_mentor_v2(request: MentorV2Request):
    """Memory-aware AI mentor with 4 distinct personas."""
    try:
        persona_data = MENTOR_PERSONAS.get(request.persona, MENTOR_PERSONAS['faang_engineer'])
        ctx = request.context

        system_prompt = MENTOR_V2_SYSTEM_PROMPT.format(
            personaName=persona_data['name'],
            personaStyle=persona_data['style'],
            focusAreas=', '.join(persona_data['focus']),
            feedbackStyle=persona_data['feedback_style'],
            tone=persona_data['tone'],
            overallReadiness=ctx.get('overallReadiness', 0),
            careerState=ctx.get('careerState', 'Explorer'),
            targetRole=ctx.get('targetRole', 'Software Engineer'),
            targetCompany=ctx.get('targetCompany', 'FAANG'),
            weakTopics=', '.join(ctx.get('weakTopics', [])) or 'Unknown',
            strongTopics=', '.join(ctx.get('strongTopics', [])) or 'Unknown',
            streak=ctx.get('streak', 0),
            weeksToReadiness=ctx.get('weeksToReadiness', 12),
            performanceDelta=ctx.get('performanceDelta', 'No data yet'),
            messageCount=len(request.history),
        )

        # Build history as chat messages
        history_str = json.dumps(request.history[-8:]) if request.history else "No prior history."
        user_message = f"History: {history_str}\n\nCandidate: {request.message}"

        result = call_groq(user_message, system_message=system_prompt, json_mode=True)

        try:
            start = result.find('{')
            end = result.rfind('}') + 1
            parsed = json.loads(result[start:end])
            return {'mentorResponse': parsed}
        except Exception as parse_err:
            print(f"Mentor v2 parse error: {parse_err}")
            raise HTTPException(status_code=500, detail="Failed to parse mentor response JSON")
    except Exception as e:
        print(f"Mentor v2 error: {e}")
        raise HTTPException(status_code=500, detail="Mentor AI service failed")

class TodayEngineRequest(BaseModel):
    targetRole: str = 'Software Engineer'
    strugglingTopics: list[str] = []
    currentRoadmapWeek: dict | None = None
    roadmapSpecificProblems: list[str] = []
    availableMinutes: int = 120

@router.post("/career/today/generate")
async def generate_today_focus(request: TodayEngineRequest):
    try:
        prompt = TODAY_ENGINE_PROMPT.format(
            targetRole=request.targetRole,
            strugglingTopics=', '.join(request.strugglingTopics) if request.strugglingTopics else 'None',
            currentRoadmapWeek=json.dumps(request.currentRoadmapWeek).replace("{", "{{").replace("}", "}}") if request.currentRoadmapWeek else 'None',
            roadmapSpecificProblems=', '.join(request.roadmapSpecificProblems) if request.roadmapSpecificProblems else 'None',
            availableMinutes=request.availableMinutes
        )

        result = call_groq(prompt, json_mode=True)
        return {"result": result}
    except Exception as e:
        print(f"Today Engine error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate today focus")
