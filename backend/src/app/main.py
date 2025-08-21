from fastapi import FastAPI,Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from api.endpoints.auth import router as auth_router
from api.endpoints.book import router as book_router
from api.endpoints.chapter import router as ai_router
from api.endpoints.chat import router as chat_router
from api.endpoints.ai_generate import router as generate_router
from repositories.chapter import ChapterRepository
from utils.auth_utils import get_chapter_repository
from mangum import Mangum

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(book_router)
app.include_router(ai_router)
app.include_router(chat_router)
app.include_router(generate_router)

@app.get("/")
async def root():
    return {"message": "User Authentication API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/test-db")
async def test_db_connection(repo: ChapterRepository = Depends(get_chapter_repository)):
    try:
        # Test by counting documents
        collection = repo.collection
        count = await collection.count_documents({})
        return {"status": "success", "document_count": count, "collection": collection.name}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

handler = Mangum(app)