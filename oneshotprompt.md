Act as a Senior Cloud Architect and Full Stack Developer. I need you to scaffold a complete, deployable web application: a custom "Daily Word Game" (Wordle clone) powered by AI.

### Context & Workflow Requirements
1.  **Local Setup:** I need clear instructions on how to create and activate a **Python virtual environment (`venv`)** and install dependencies using the generated `requirements.txt`.
2.  **Installer (`setup_game.py`):** The script MUST use the **`google-genai`** Python library and explicitly target the **`gemini-2.5-flash`** model ID.
3.  **Deployment:** The app must be ready for Google Cloud Run using the provided `deploy.sh`.
4.  **Game Logic:** Server-side validation, dynamic word length (5-10 chars), daily rotation, and a virtual keyboard in the React frontend.

### File Requirements
Please generate the code for the following files. Ensure the code is production-ready and includes all necessary imports.

#### 1. `requirements.txt`
* List all required Python packages for both the backend and the installer script. Include `fastapi`, `uvicorn`, `pydantic`, and the correct Gemini library.

#### 2. `setup_game.py`
* **Libs:** `google-genai`, `sqlite3`.
* **Gemini Logic:** Use the `gemini-2.5-flash` model.
* **Flow:**
    * **Local Run Instructions:** Print clear instructions for the user to set up the `venv` and run the script.
    * Authenticate using `os.getenv("GEMINI_API_KEY")`.
    * Prompt user for `TOPIC` and `WORD_LENGTH` (5-10).
    * **LLM Task:** Use Gemini to check feasibility (90+ words) and generate a JSON list of 100+ unique words.
    * **Output:** Create `game.db` with table `words (id, word, date_offset)`. Shuffle words and insert them.

#### 3. `backend/main.py`
* **Framework:** FastAPI.
* **Logic:**
    * **Word Selection:** `index = (today_date - start_date).days % total_words` (Use a hardcoded `START_DATE`).
    * **Endpoints:** `GET /api/config` (returns word length), `POST /api/check` (returns color statuses - GREEN, YELLOW, GRAY).
    * **Crucial:** Implement the 2-pass comparison algorithm for **correct handling of duplicate letters** in the guess/target word.
    * **Static:** Serve `../frontend/dist` on root `/`.

#### 4. `frontend/src/App.jsx` (and necessary CSS/styling)
* **Tech:** React (Vite).
* **UI:** Dynamic grid, responsive design, and a fully functional on-screen virtual keyboard that updates key colors based on previous guesses.

#### 5. `Dockerfile`
* **Multi-stage build:** Build React, then copy artifacts and the generated `game.db` into the Python/FastAPI image.
* **CMD:** Run the FastAPI app using `uvicorn` on `$PORT`.

#### 6. `deploy.sh`
* A robust Bash script to automate deployment.
* Steps:
    1.  Check for `game.db` and prompt user if missing.
    2.  Ask user for `PROJECT_ID` and `REGION`.
    3.  Run `gcloud builds submit --tag gcr.io/$PROJECT_ID/wordle-app .`
    4.  Run `gcloud run deploy wordle-app --image gcr.io/$PROJECT_ID/wordle-app --platform managed --allow-unauthenticated --region $REGION`.

### Output Instructions
* Provide the full code for every requested file.
