from mangum import Mangum
import sys, os

# Add backend/src/app to import path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend", "src", "app"))

from backend.src.app.main import app  # import your existing FastAPI app

handler = Mangum(app)
