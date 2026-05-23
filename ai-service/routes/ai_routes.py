from fastapi import APIRouter, File, UploadFile, Form
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
    MENTOR_PERSONAS, PERSONA_BEHAVIORS, TODAY_ENGINE_PROMPT
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

class CodeReviewRequest(BaseModel):
    code: str
    language: str
    problemDescription: str
    staticAnalysis: Optional[dict] = None

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
    persona: str = 'Professional'

class CareerProfileInitRequest(BaseModel):
    targetRole: str
    targetCompany: str = ''
    currentYear: str = 'junior'
    dsaComfort: float = 5.0
    systemDesignComfort: float = 3.0
    dailyHoursAvailable: float = 2.0
    weakTopics: list[str] = []
    strongTopics: list[str] = []
    persona: str = 'faang_engineer'

class AdaptiveRoadmapRequest(BaseModel):
    targetRole: str
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

@router.post('/interview/finish')
async def finish_interview(request: FinishInterviewRequest):
    system_prompt = """
You are a Lead Software Engineer at Google calibrating a candidate's technical coding interview performance.
Analyze the candidate's final code and the conversational chat history to produce a comprehensive FAANG-grade performance report.

You MUST return exactly a JSON object matching this structure:
{
    "problemSolving": integer rating between 1 and 100,
    "optimization": integer rating between 1 and 100,
    "codeQuality": integer rating between 1 and 100,
    "communication": integer rating between 1 and 100,
    "feedbackSummary": "A detailed multi-paragraph performance evaluation summarizing their strengths, weaknesses, and direct technical areas for career growth."
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
async def analyze_resume(resume: UploadFile = File(...), jobDescription: Optional[str] = Form(None)):
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

    prompt = RESUME_ANALYSIS_PROMPT.format(text=text, jobDescription=jobDescription or "General Career Analysis")
    result = call_groq(prompt, json_mode=True)
    
    try:
        start = result.find('{')
        end = result.rfind('}') + 1
        parsed_result = json.loads(result[start:end])
        return {'analysis': parsed_result}
    except:
        return {'analysis': result}

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
    except:
        return {'plan': result}

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
        prompt = EVALUATION_PROMPT.format(
            question=request.question,
            answer=request.answer,
            behavior=behavior,
            transcript=json.dumps(request.transcript) if request.transcript else "New session."
        )
    
    result = call_groq(prompt, json_mode=True)
    try:
        start = result.find('{')
        end = result.rfind('}') + 1
        return {'evaluation': json.loads(result[start:end])}
    except Exception as e:
        print(f"Eval Error: {e} | Raw: {result}")
        return {'evaluation': {"score": 50, "mistakes": ["AI processing error"]}}

@router.post('/follow-up')
async def follow_up_question(request: FollowUpRequest):
    behavior = PERSONA_BEHAVIORS.get(request.persona, "Direct and challenging.")
    
    prompt = FOLLOW_UP_PROMPT.format(
        persona=request.persona,
        behavior=behavior,
        roundName=request.roundName,
        prevQuestion=request.prevQuestion,
        prevAnswer=request.prevAnswer
    )
    result = call_groq(prompt, json_mode=True)
    try:
        start = result.find('{')
        end = result.rfind('}') + 1
        return json.loads(result[start:end])
    except:
        return {"text": result, "intent": "Contextual deep-dive"}
@router.post('/review')
async def review_code(request: CodeReviewRequest):
    prompt = CODE_INTELLIGENCE_PROMPT.format(
        language=request.language,
        problemDescription=request.problemDescription,
        code=request.code,
        staticAnalysis=json.dumps(request.staticAnalysis) if request.staticAnalysis else "None detected"
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
                {{ "title": "topic name", "description": "why and what", "action": "/room", "priority": "High" }}
            ],
            "aiInsights": "Deep analysis of their performance trends",
            "memoryPattern": "A summary of how they have improved or what they repeatedly struggle with"
        }}

        Current Stats: {json.dumps(stats)}
        Recent Activity: {json.dumps(activity)}
        """
        result = call_groq(prompt, json_mode=True)
        
        try:
            start = result.find('{')
            end = result.rfind('}') + 1
            return json.loads(result[start:end])
        except:
            return {
                "summary": "Focus on consistent technical practice.",
                "recommendations": [],
                "aiInsights": result,
                "memoryPattern": "Analyzing patterns..."
            }
    except Exception as e:
        print(f"Recs Error: {e}")
        return {"summary": "Keep practicing.", "recommendations": [], "aiInsights": "", "memoryPattern": ""}

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
        except:
            return {"summary": result, "strengths": [], "weaknesses": [], "recommendations": [], "verdict": "CONSIDER"}

    except Exception as e:
        print(f"Summary Error: {e}")
        return {
            "summary": "Interview session concluded successfully.",
            "strengths": ["Communication", "Engagement"],
            "weaknesses": ["Precision"],
            "recommendations": ["Further deep-dives"],
            "verdict": "CONSIDER"
        }

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
            currentYear=request.currentYear,
            dsaComfort=request.dsaComfort,
            systemDesignComfort=request.systemDesignComfort,
            dailyHoursAvailable=request.dailyHoursAvailable,
            weakTopics=', '.join(request.weakTopics) or 'None specified',
            strongTopics=', '.join(request.strongTopics) or 'None specified',
            persona=request.persona,
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
            performanceDelta=request.performanceDelta,
            strugglingTopics=', '.join(request.strugglingTopics) or 'None',
            strongTopics=', '.join(request.strongTopics) or 'None',
            currentWeeks=json.dumps(request.currentWeeks),
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
            return {'result': {'weeklyPlan': []}}
    except Exception as e:
        print(f"Adaptive roadmap error: {e}")
        return {'result': {'weeklyPlan': []}}


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
            return {'mentorResponse': {'reply': result.strip(), 'actionableTips': [], 'suggestedNextSteps': [], 'referencesToPastSession': None}}
    except Exception as e:
        print(f"Mentor v2 error: {e}")
        return {'mentorResponse': {'reply': 'I encountered an error. Please try again.', 'actionableTips': [], 'suggestedNextSteps': [], 'referencesToPastSession': None}}

class TodayEngineRequest(BaseModel):
    targetRole: str
    strugglingTopics: list[str]
    currentRoadmapWeek: dict | None
    availableMinutes: int

@router.post("/career/today/generate")
async def generate_today_focus(request: TodayEngineRequest):
    try:
        prompt = TODAY_ENGINE_PROMPT.format(
            targetRole=request.targetRole,
            strugglingTopics=', '.join(request.strugglingTopics) if request.strugglingTopics else 'None',
            currentRoadmapWeek=json.dumps(request.currentRoadmapWeek) if request.currentRoadmapWeek else 'None',
            availableMinutes=request.availableMinutes
        )

        result = call_groq(prompt, json_mode=True)
        return {"result": result}
    except Exception as e:
        print(f"Today Engine error: {e}")
        return {"result": {"tasks": []}}
