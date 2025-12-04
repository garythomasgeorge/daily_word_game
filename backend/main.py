import os
import sqlite3
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI()

DB_PATH = "backend/game.db"

class GuessRequest(BaseModel):
    guess: str

class LetterStatus(BaseModel):
    letter: str
    status: str  # "correct" (green), "present" (yellow), "absent" (gray)

class CheckResponse(BaseModel):
    result: List[LetterStatus]
    solved: bool

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_todays_word():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get config
    cursor.execute("SELECT value FROM config WHERE key='start_date'")
    start_date_str = cursor.fetchone()['value']
    
    cursor.execute("SELECT COUNT(*) as count FROM words")
    total_words = cursor.fetchone()['count']
    
    if total_words == 0:
        conn.close()
        raise HTTPException(status_code=500, detail="No words in database")

    # Calculate index
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
    today = datetime.now()
    days_diff = (today - start_date).days
    
    # Ensure positive index
    index = days_diff % total_words
    
    cursor.execute("SELECT word FROM words WHERE date_offset = ?", (index,))
    word_row = cursor.fetchone()
    conn.close()
    
    if not word_row:
         raise HTTPException(status_code=500, detail="Word not found for today")
         
    return word_row['word']

def get_config_value(key):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM config WHERE key=?", (key,))
    row = cursor.fetchone()
    conn.close()
    return row['value'] if row else None

@app.get("/api/config")
def get_config():
    try:
        word = get_todays_word()
        topic = get_config_value("topic")
        return {
            "wordLength": len(word),
            "topic": topic
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/check", response_model=CheckResponse)
def check_guess(request: GuessRequest):
    guess = request.guess.upper()
    target = get_todays_word().upper()
    
    if len(guess) != len(target):
        raise HTTPException(status_code=400, detail=f"Guess must be {len(target)} letters")

    result = [{"letter": l, "status": "absent"} for l in guess]
    target_letters_count = {}
    
    # Pass 1: Find Greens (Correct position)
    for i, letter in enumerate(target):
        if guess[i] == letter:
            result[i]["status"] = "correct"
        else:
            target_letters_count[letter] = target_letters_count.get(letter, 0) + 1
            
    # Pass 2: Find Yellows (Wrong position)
    for i, letter in enumerate(guess):
        if result[i]["status"] == "correct":
            continue
            
        if letter in target_letters_count and target_letters_count[letter] > 0:
            result[i]["status"] = "present"
            target_letters_count[letter] -= 1
            
    return {
        "result": result,
        "solved": all(r["status"] == "correct" for r in result)
    }

# Serve Frontend
# Ensure the directory exists to avoid startup errors if frontend isn't built yet
if os.path.exists("frontend/dist"):
    app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")
else:
    # Fallback for local dev before build
    @app.get("/")
    def read_root():
        return {"message": "Frontend not built. Run 'npm run build' in frontend/ directory."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
