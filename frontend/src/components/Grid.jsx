import React from 'react';
import { clsx } from 'clsx';

const Cell = ({ letter, status }) => {
    const baseClasses = "w-14 h-14 border-2 flex items-center justify-center text-3xl font-bold uppercase select-none transition-all duration-500";

    const statusClasses = {
        empty: "border-game-tile bg-transparent",
        filled: "border-gray-500 bg-transparent animate-pop",
        correct: "border-game-correct bg-game-correct text-white animate-flip",
        present: "border-game-present bg-game-present text-white animate-flip",
        absent: "border-game-absent bg-game-absent text-white animate-flip",
    };

    const className = clsx(
        baseClasses,
        status ? statusClasses[status] : (letter ? statusClasses.filled : statusClasses.empty)
    );

    return (
        <div className={className}>
            {letter}
        </div>
    );
};

const Row = ({ guess, length, status }) => {
    const letters = guess.padEnd(length, ' ').split('');

    return (
        <div className="flex gap-1.5 mb-1.5 justify-center">
            {letters.map((letter, i) => (
                <Cell
                    key={i}
                    letter={letter !== ' ' ? letter : ''}
                    status={status ? status[i]?.status : null}
                />
            ))}
        </div>
    );
};

const Grid = ({ guesses, currentGuess, wordLength, maxGuesses, statuses }) => {
    const empties = Math.max(0, maxGuesses - 1 - guesses.length);

    return (
        <div className="mb-8">
            {guesses.map((guess, i) => (
                <Row key={i} guess={guess} length={wordLength} status={statuses[i]} />
            ))}
            {guesses.length < maxGuesses && (
                <Row guess={currentGuess} length={wordLength} />
            )}
            {Array.from({ length: empties }).map((_, i) => (
                <Row key={i + guesses.length + 1} guess="" length={wordLength} />
            ))}
        </div>
    );
};

export default Grid;
