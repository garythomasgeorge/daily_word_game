import os
import sys
import json
import sqlite3
import random
import argparse
from datetime import datetime
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Constants
DB_PATH = "backend/game.db"
MODEL_ID = "gemini-2.5-flash"

def setup_venv():
    """Checks for venv and provides instructions if missing."""
    if not os.path.exists(".venv"):
        print("\n" + "="*60)
        print("MISSING VIRTUAL ENVIRONMENT")
        print("="*60)
        print("Please run the following commands to set up your environment:")
        print("  python3 -m venv .venv")
        print("  source .venv/bin/activate")
        print("  pip install -r requirements.txt")
        print("  python setup_game.py")
        print("="*60 + "\n")
        sys.exit(1)

def get_user_input():
    """Prompts user for game configuration."""
    print("\n--- Daily Word Game Setup ---")
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        api_key = input("Enter your GEMINI_API_KEY: ").strip()
        if not api_key:
            print("Error: API Key is required.")
            sys.exit(1)
        os.environ["GEMINI_API_KEY"] = api_key

    topic = input("Enter a Topic (e.g., 'Space', 'Fruits', 'Animals'): ").strip()
    while not topic:
        topic = input("Topic cannot be empty. Try again: ").strip()

    while True:
        try:
            max_length = int(input("Enter Max Word Length (5-10): ").strip())
            if 5 <= max_length <= 10:
                break
            print("Please enter a number between 5 and 10.")
        except ValueError:
            print("Invalid input. Please enter a number.")
            
    return api_key, topic, max_length

def generate_words(client, topic, max_length):
    """Generates a list of words using Gemini."""
    print(f"\nGenerating words related to '{topic}' (length 5-{max_length})...")
    
    prompt = f"""
    Generate a list of 100 unique, common English nouns related to the topic '{topic}'.
    The words can be of varying lengths, but must be between 5 and {max_length} letters long.
    Return ONLY a raw JSON array of strings. Do not include markdown formatting.
    Example: ["word1", "word2", ...]
    """
    
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=list[str]
            )
        )
        words = json.loads(response.text)
        
        # Filter just in case
        valid_words = [w.upper() for w in words if 5 <= len(w) <= max_length and w.isalpha()]
        unique_words = list(set(valid_words))
        
        print(f"Successfully generated {len(unique_words)} unique words.")
        
        if len(unique_words) < 50:
             print("Warning: Generated fewer than 50 words. You might want to try a broader topic.")
             
        return unique_words
        
    except Exception as e:
        print(f"Error generating words: {e}")
        sys.exit(1)

def check_existing_db(reset=False):
    """Checks if DB exists and asks user to confirm reset."""
    if os.path.exists(DB_PATH):
        if reset:
            print(f"Resetting database at {DB_PATH}...")
            try:
                os.remove(DB_PATH)
            except OSError as e:
                print(f"Error removing database: {e}")
                sys.exit(1)
        else:
            print(f"\nExisting game database found at {DB_PATH}.")
            choice = input("Do you want to delete it and start a NEW game? (y/N): ").strip().lower()
            if choice == 'y':
                try:
                    os.remove(DB_PATH)
                    print("Old database deleted.")
                except OSError as e:
                    print(f"Error removing database: {e}")
                    sys.exit(1)
            else:
                print("Exiting without modifying database.")
                sys.exit(0)

def init_db(words, max_length, topic):
    """Initializes the SQLite database."""
    os.makedirs("backend", exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT NOT NULL,
            date_offset INTEGER NOT NULL
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)
    
    # Clear old data if table existed (redundant if file removed, but safe)
    cursor.execute("DELETE FROM words")
    cursor.execute("DELETE FROM config")
    
    # Insert Config
    start_date = datetime.now().strftime("%Y-%m-%d")
    cursor.execute("INSERT INTO config (key, value) VALUES (?, ?)", ("max_word_length", str(max_length)))
    cursor.execute("INSERT INTO config (key, value) VALUES (?, ?)", ("start_date", start_date))
    cursor.execute("INSERT INTO config (key, value) VALUES (?, ?)", ("topic", topic))
    
    # Insert Words
    random.shuffle(words)
    word_data = [(word, i) for i, word in enumerate(words)]
    cursor.executemany("INSERT INTO words (word, date_offset) VALUES (?, ?)", word_data)
    
    conn.commit()
    conn.close()
    print(f"\nDatabase initialized at {DB_PATH} with {len(words)} words.")
    print(f"Topic: {topic}")
    print(f"Game Start Date set to: {start_date}")

def main():
    parser = argparse.ArgumentParser(description="Setup Daily Word Game")
    parser.add_argument("--reset", action="store_true", help="Reset the database without prompting")
    args = parser.parse_args()

    setup_venv()
    
    # Check DB before asking for inputs
    check_existing_db(reset=args.reset)
    
    api_key, topic, max_length = get_user_input()
    
    client = genai.Client(api_key=api_key)
    
    words = generate_words(client, topic, max_length)
    
    init_db(words, max_length, topic)
    
    print("\nSetup Complete! You can now run the backend:")
    print("  uvicorn backend.main:app --reload")

if __name__ == "__main__":
    main()
