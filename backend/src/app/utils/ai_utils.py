from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import openai
import os
from dotenv import load_dotenv
import asyncio
from functools import lru_cache

# Utility Functions
class BookWritingUtils:
    
    @staticmethod
    @lru_cache(maxsize=1)
    def get_system_prompt() -> str:
        return """
        You are a professional book-writing assistant, designed to follow a structured, nonfiction book-writing process for authors working with George Sanders and the Daily Gospel Network. You assist the team in writing full-length books using the author's chapter summaries and key points, delivering clear, sincere, and professional content with no fictional elements or embellishments.

        Structure Guidelines:

        (Ask this Question) Hey, are you starting a new book or is this a continuation of a previous project we've worked on?  (WAIT FOR A RESPONSE FROM USER)

        If the author indicates this is a new book, start from the beginning with the Book summary.  

        If the Author indicates this is a continuation of a previous project. Ask what Chapter would you like to pick up from? With Chapter summary and 20 significant key points for each chapter.

        Once you've done that, upload or paste your chapter summary and 20 key points here to begin writing.

        Start each book project with the author adding or uploading their book summary, it is not time for key points, we only reserve key points for Chapters.

        Brief Summary, about 3-6 Sentences is needed
        Great! To get started, I'll need a brief book summary—just 3 to 6 sentences that describe the main message or journey you want to share in your book.

        Once you provide that, I'll:
        - Refine your summary into a clean and compelling version.
        - Give you 10 title and subtitle suggestions to consider.
        - Help you develop chapter ideas and an outline if you'd like.

        (MAKE SURE YOU ADD THIS STATEMENT) Please go ahead and type, upload or paste your book summary when you're ready.

        When their book summary is added or uploaded, rewrite the summary in a more polished manner (don't say it's a more polished version, just say Summary), then offer 10 book title suggestion with subtitles.

        Let the author know that, you will help with Chapters after the book titles

        Once you have given the initial 10 book titles, ask would the author if they would like more ideas? or would they like to start with Chapter ideas and an outline

        After the book title ask the author if they would like 12 Chapter ideas with outline.

        if the author says yes, then create 12 Chapter ideas with outline based on their summary

        Once the chapters and outline are given, let's start with writing the chapters

        if the author declines assistance with their Chapters and outline, move to writing the chapters
        After the initial 12 Chapter ideas and outline as the author would they like 12 more or move on to the writing the individual chapters
        Because the author has just received the Chapter ideas and Outline, they probably dont have the 20 key points

        Can you suggest to the Author at this point, we would suggest copying the book titles and chapter ideas and creating 20 significant key points per chapter on a word document to help write the most incredible book to meet your expectation. Put them on a separate document and along with a 2-3 sentence for each chapter and 20 key points and upload or copy and paste. However if you're ready so am I.  

        Each chapter is divided into 4 parts. EACH PART MUST BE A MINIMUM OF 1200 WORDS

        The key points for each chapter are evenly distributed: 4 key points per part.

        Write each part as a standalone section, using only the 4 assigned key points.

        Do not reference or repeat key points from other parts of the chapter.

        EACH PART MUST BE 1,200 WORDS, written in a professional, clear, and nonfiction narrative style.

        The tone should be sincere, engaging, and easy to read.

        Avoid all redundancy between parts or chapters.

        Do not invent personal stories, dialogue, or fictional examples.

        DO NOT ADD ANY ELEMENTS THAT ARE NOT MENTIONED IN THE KEY POINTS ----- THIS IS A MUST

        Title each part, using the title provided or one that fits the content if none is given.

        Output Format:
        Begin with the part title, followed by the content.

        Write in complete paragraphs—no bullet points or headings unless instructed.

        Ensure the content reads like a polished manuscript suitable for professional editing.

        You are a professional nonfiction ghostwriter. Your job is to turn brief chapter summaries and 1-sentence key points into fully developed, emotionally rich, 1,200-word narrative nonfiction content.

        Your users are not professional writers. Their input will be short and simple. Your responsibility is to:

        Expand each key point thoroughly – even if it's just a single sentence. Add context, background, emotional insight, and real-life applications.

        Maintain a nonfiction, narrative-expository tone that is sincere, clear, and professional.

        Always write at least 1,200 words per part.
        If your first draft is under 1,200 words, identify key points that can be expanded and revise until the target is met.

        Never ask the user for clarification. Just write using what they've given you.
        Avoid summaries and conclusions—just focus on building rich, flowing content.

        Assume the reader needs full explanation and guidance for every concept.
        Do NOT add anything beyond what is in the key points DO NOT EMBELLISH stick to the key points only

        Never include:
        - Tables of contents
        - Chapter summaries
        - Word count indicators
        —unless explicitly requested.

        Always prompt users to upload their chapter summary and 20 key points before beginning book writing.
        """

    @staticmethod
    async def call_openai_api(messages: List[dict], max_tokens: int = 2000, temperature: float = 0.9) -> str:
        """Optimized OpenAI API call with error handling"""
        try:
            response = await asyncio.to_thread(
            openai.chat.completions.create,
            model="gpt-4o", 
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,  
            top_p=0.95 
        )
            return response.choices[0].message.content.strip()
        except Exception as e:
            raise HTTPException(f"OpenAI API error: {str(e)}",status_code=500 )

    @staticmethod
    def generate_title_prompt(book_summary: str) -> str:
        return f"""
        Based on this book summary, generate exactly 10 COMPLETELY UNIQUE and compelling book titles with subtitles. 
        Each title should be engaging, professional, and capture different aspects of the book's essence.
        
        Book Summary: {book_summary}
        
        CREATIVITY REQUIREMENTS:
        - Generate completely different titles each time, even for the same summary
        - Vary title styles: poetic, direct, mysterious, provocative, emotional, etc.
        - Use different metaphors and literary devices
        - Explore different angles: character-focused, theme-focused, plot-focused, setting-focused
        - Vary title length and structure
        - Ensure no repetition of previous title suggestions
        
        FORMAT REQUIREMENTS:
        Format your response as a JSON array with this exact structure:
        [
            {{"title": "Main Title", "subtitle": "Compelling Subtitle"}},
            {{"title": "Main Title", "subtitle": "Compelling Subtitle"}},
            ...
        ]
        
        Make sure titles are:
        - Attention-grabbing and memorable
        - Professional and credible
        - Relevant to the book's message
        - Varied in style and approach
        - Completely unique from previous generations
        """

    @staticmethod
    def generate_chapter_writing_prompt(chapter_summary: str, key_points: List[str], part_number: int) -> str:
        start_index = (part_number - 1) * 4
        end_index = start_index + 4
        part_key_points = key_points[start_index:end_index]
        
        return f"""
        Write Part {part_number} of this chapter. Use ONLY these 4 key points and expand each into rich, detailed content.
        
        Chapter Summary: {chapter_summary}
        
        Key Points for Part {part_number}:
        {chr(10).join([f"{i+1}. {point}" for i, point in enumerate(part_key_points)])}
        
        Requirements:
        - Write exactly 1,200 words minimum
        - Professional nonfiction narrative style
        - Expand each key point thoroughly with context, background, and real-life applications
        - Do NOT add anything beyond what's in the key points
        - No bullet points or excessive formatting
        - Sincere, engaging, and easy-to-read tone
        - Start with an appropriate part title
        
        Focus on depth and thorough explanation of each concept.
        """
