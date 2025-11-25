

import { useState, useEffect } from 'react';
import { RaceHistory, RaceHistoryEntry } from '../types';
import { FULL_SEASON_TRACKS } from '../constants';

const HISTORY_KEY = 'f1_race_history_v2';

const getInitialHistory = (): RaceHistory => {
    const initialHistory: RaceHistory = {};
    FULL_SEASON_TRACKS.forEach(track => {
        initialHistory[track.name] = []; 
    });
    return initialHistory;
};

export const useRaceHistory = () => {
    const [history, setHistory] = useState<RaceHistory>(() => {
        try {
            const saved = localStorage.getItem(HISTORY_KEY);
            if (saved) {
                // FIX: Add type assertion to the result of JSON.parse to avoid `unknown` type errors.
                return JSON.parse(saved) as RaceHistory;
            }
        } catch (error) {
            console.error("Error reading race history from localStorage", error);
        }
        return getInitialHistory();
    });

    useEffect(() => {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (error) {
            console.error("Error saving race history to localStorage", error);
        }
    }, [history]);

    const recordWinner = (trackName: string, winnerId: number, year: number) => {
        setHistory(prevHistory => {
            const newHistory = { ...prevHistory };
            const trackWinners = newHistory[trackName] || [];

            // Add new winner, preventing duplicates for the same year
            const updatedWinners = [{ winnerId, year }, ...trackWinners.filter(w => w.year !== year)];
            newHistory[trackName] = updatedWinners;
            return newHistory;
        });
    };

    const clearRaceHistory = () => {
        setHistory(getInitialHistory());
    };

    return { history, recordWinner, clearRaceHistory };
};