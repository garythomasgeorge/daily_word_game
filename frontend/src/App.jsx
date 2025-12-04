import React, { useState, useEffect } from 'react';
import Grid from './components/Grid';
import Keyboard from './components/Keyboard';

const MAX_GUESSES = 6;

function App() {
    const [wordLength, setWordLength] = useState(5);
    const [topic, setTopic] = useState('');
    const [guesses, setGuesses] = useState([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [statuses, setStatuses] = useState([]); // Array of arrays of letter statuses
    const [keyStatuses, setKeyStatuses] = useState({}); // Map of letter -> status
    const [gameStatus, setGameStatus] = useState('playing'); // playing, won, lost
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => {
                setWordLength(data.wordLength);
                setTopic(data.topic);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch config:", err);
                setError("Failed to load game configuration.");
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameStatus !== 'playing' || loading) return;

            const key = e.key.toUpperCase();
            if (key === 'ENTER') {
                handleSubmit();
            } else if (key === 'BACKSPACE') {
                setCurrentGuess(prev => prev.slice(0, -1));
            } else if (/^[A-Z]$/.test(key)) {
                if (currentGuess.length < wordLength) {
                    setCurrentGuess(prev => prev + key);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentGuess, gameStatus, loading, wordLength]);

    const handleSubmit = async () => {
        if (currentGuess.length !== wordLength) return;

        try {
            const res = await fetch('/api/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guess: currentGuess }),
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.detail || "Error checking guess");
                return;
            }

            const data = await res.json();
            const result = data.result;

            // Update statuses
            const newStatuses = [...statuses, result];
            setStatuses(newStatuses);
            setGuesses([...guesses, currentGuess]);
            setCurrentGuess('');

            // Update keyboard colors
            const newKeyStatuses = { ...keyStatuses };
            result.forEach(({ letter, status }) => {
                const currentStatus = newKeyStatuses[letter];
                if (status === 'correct') {
                    newKeyStatuses[letter] = 'correct';
                } else if (status === 'present' && currentStatus !== 'correct') {
                    newKeyStatuses[letter] = 'present';
                } else if (status === 'absent' && currentStatus !== 'correct' && currentStatus !== 'present') {
                    newKeyStatuses[letter] = 'absent';
                }
            });
            setKeyStatuses(newKeyStatuses);

            // Check win/loss
            if (data.solved) {
                setGameStatus('won');
            } else if (guesses.length + 1 >= MAX_GUESSES) {
                setGameStatus('lost');
            }

        } catch (err) {
            console.error("Error submitting guess:", err);
            alert("Network error. Please try again.");
        }
    };

    const handleKeyPress = (key) => {
        if (gameStatus !== 'playing' || loading) return;

        if (key === 'ENTER') {
            handleSubmit();
        } else if (key === 'BACKSPACE') {
            setCurrentGuess(prev => prev.slice(0, -1));
        } else {
            if (currentGuess.length < wordLength) {
                setCurrentGuess(prev => prev + key);
            }
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
    if (error) return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;

    return (
        <div className="flex flex-col items-center min-h-screen pt-10">
            <h1 className="text-4xl font-bold mb-2 tracking-wider">DAILY WORD GAME</h1>
            {topic && <h2 className="text-xl text-gray-400 mb-8 uppercase tracking-widest">{topic} EDITION</h2>}

            <Grid
                guesses={guesses}
                currentGuess={currentGuess}
                wordLength={wordLength}
                maxGuesses={MAX_GUESSES}
                statuses={statuses}
            />

            <div className="mt-auto mb-8">
                <Keyboard onKeyPress={handleKeyPress} keyStatuses={keyStatuses} />
            </div>

            {gameStatus !== 'playing' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-game-tile p-8 rounded-lg text-center shadow-2xl border border-gray-700">
                        <h2 className="text-3xl font-bold mb-4">
                            {gameStatus === 'won' ? '🎉 You Won!' : 'Game Over'}
                        </h2>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-game-correct px-6 py-2 rounded font-bold hover:bg-green-600 transition-colors"
                        >
                            Play Again Tomorrow
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
