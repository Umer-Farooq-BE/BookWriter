from fastapi import FastAPI, HTTPException,APIRouter
from pydantic import BaseModel
from typing import List, Optional
import openai
import os
import re
import json
from dotenv import load_dotenv
from utils.ai_utils import BookWritingUtils


load_dotenv()

router = APIRouter(prefix='/ai', tags=['AI Generation'])

# Configure OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

class QuestionRequest(BaseModel):
    question: str

class BookSummaryRequest(BaseModel):
    summary: str

class TitleSuggestion(BaseModel):
    title: str
    subtitle: str

class BookTitlesResponse(BaseModel):
    titles: List[TitleSuggestion]

class ChapterRequest(BaseModel):
    chapter_summary: str
    key_points: List[str]
    part_number: int  # 1-4

class QAResponse(BaseModel):
    answer: str

#>>>>>>>>>>>>>>>>>>>>>>>>>>> Endpoints >>>>>>>>>>>>>>>>>>>>>>>

@router.post("/polish-summary")
async def polish_book_summary(request: BookSummaryRequest):
    """Polish and refine a book summary with unique variations"""
    if not request.summary or not request.summary.strip():
        raise HTTPException(status_code=400, detail="Book summary is required")
    
    prompt = f"""
    Rewrite this book summary in a more polished, professional manner, creating a unique variation each time. 
    Keep it concise (3-6 sentences) but make it compelling and clear.
    
    Original Summary: {request.summary}
    
    Guidelines for variation:
    - Use different sentence structures and phrasing
    - Vary the opening sentence each time
    - Highlight different aspects of the story
    - Use synonyms and alternative expressions
    - Change the emotional emphasis slightly
    - Vary the perspective (character-focused vs. plot-focused vs. theme-focused)
    
    Provide only the refined summary, no additional commentary.
    """
    
    messages = [
        {"role": "system", "content": "You are a professional editor specializing in book summaries. You excel at creating multiple unique variations of the same content."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        polished_summary = await BookWritingUtils.call_openai_api(messages, max_tokens=300, temperature=0.8)  # Higher temperature for variability
        return {"polished_summary": polished_summary}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-titles", response_model=BookTitlesResponse)
async def generate_book_titles(request: BookSummaryRequest):
    """Generate 10 unique book titles and subtitles based on book summary"""
    if not request.summary or not request.summary.strip():
        raise HTTPException(status_code=400, detail="Book summary is required")
    
    prompt = BookWritingUtils.generate_title_prompt(request.summary)

    messages = [
        {
            "role": "system",
            "content": (
                "You are a creative book title generator specializing in unique variations. "
                "You excel at generating completely different title sets for the same content. "
                "Respond ONLY with a valid JSON array of objects in this format: "
                '[{"title": "Main Title", "subtitle": "Subtitle"}]. '
                "Do not include markdown, explanations, or text outside JSON."
            ),
        },
        {"role": "user", "content": prompt},
    ]

    try:
        response = await BookWritingUtils.call_openai_api(
            messages, max_tokens=1000, temperature=0.95  # Very high temperature for maximum variability
        )
        clean_response = re.sub(r"```(?:json)?|```", "", response).strip()
        titles_data = json.loads(clean_response)
        titles = [TitleSuggestion(**title) for title in titles_data[:10]]

        return BookTitlesResponse(titles=titles)

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse title suggestions. Raw response: {response}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



