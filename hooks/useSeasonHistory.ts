

import { useState, useEffect } from 'react';
import { SeasonHistoryEntry, DriverStanding, ConstructorStanding, Car, AiSeasonReview } from '../types';

const HISTORY_KEY = 'f1_season_history_v1';

export const useSeasonHistory = () => {
    const [history, setHistory] = useState<SeasonHistoryEntry[]>(() => {
        try {
            const saved = localStorage.getItem(HISTORY_KEY);
            // FIX: Add type assertion to ensure the parsed data is correctly typed.
            return saved ? JSON.parse(saved) as SeasonHistoryEntry[] : [];
        } catch (error) {
            console.error("Error reading season history from localStorage", error);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (error) {
            console.error("Error saving season history to localStorage", error);
        }
    }, [history]);

    const archiveSeason = (
        year: number, 
        driverStandings: DriverStanding[], 
        constructorStandings: ConstructorStanding[], 
        carRatings: Car[],
        aiSeasonReview: AiSeasonReview | null
    ) => {
        const newEntry: SeasonHistoryEntry = {
            year,
            // FIX: Add type assertions to ensure deep-cloned data retains its type.
            driverStandings: JSON.parse(JSON.stringify(driverStandings)) as DriverStanding[],
            constructorStandings: JSON.parse(JSON.stringify(constructorStandings)) as ConstructorStanding[],
            carRatings: JSON.parse(JSON.stringify(carRatings)) as Car[],
            aiSeasonReview: aiSeasonReview ? JSON.parse(JSON.stringify(aiSeasonReview)) as AiSeasonReview : undefined,
        };
        setHistory(prevHistory => [...prevHistory, newEntry]);
    };

    const clearHistory = () => {
        setHistory([]);
    }

    return { history, archiveSeason, clearHistory };
};