import React from 'react';
import { clsx } from 'clsx';

const KEYS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
];

const Key = ({ value, status, onClick }) => {
    const baseClasses = "flex items-center justify-center rounded font-bold cursor-pointer select-none transition-colors duration-100 h-14";
    const widthClass = value.length > 1 ? "px-4 text-xs" : "w-10 text-lg";

    const statusClasses = {
        unused: "bg-gray-500 hover:bg-gray-400",
        correct: "bg-game-correct hover:bg-green-600",
        present: "bg-game-present hover:bg-yellow-600",
        absent: "bg-game-absent hover:bg-gray-800",
    };

    return (
        <button
            onClick={() => onClick(value)}
            className={clsx(baseClasses, widthClass, statusClasses[status || 'unused'])}
        >
            {value === 'BACKSPACE' ? '⌫' : value}
        </button>
    );
};

const Keyboard = ({ onKeyPress, keyStatuses }) => {
    return (
        <div className="w-full max-w-lg mx-auto px-2">
            {KEYS.map((row, i) => (
                <div key={i} className="flex justify-center gap-1.5 mb-2">
                    {row.map((key) => (
                        <Key
                            key={key}
                            value={key}
                            status={keyStatuses[key]}
                            onClick={onKeyPress}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default Keyboard;
