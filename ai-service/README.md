# AI Service

FastAPI-based microservice for resume analysis, interview generation, and answer evaluation.

## Run locally

1. Create a virtual environment.
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and add `OPENAI_API_KEY` if available.
4. Start the service:
   - `uvicorn app:app --reload --host 0.0.0.0 --port 9000`

## Endpoints

- `POST /resume` - upload a resume PDF for analysis.
- `POST /generate` - provide role, experience, stack, and company type.
- `POST /evaluate` - evaluate an answer for a question.
