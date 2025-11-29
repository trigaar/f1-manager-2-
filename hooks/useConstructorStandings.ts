

import { useState, useEffect, useMemo } from 'react';
import { ConstructorStanding, Driver, InitialDriver } from '../types';
import { POINTS_SYSTEM, getTeamColors } from '../constants';

const STANDINGS_KEY = 'f1_constructor_standings_v1';

const getDefaultConstructorStandings = (roster: InitialDriver[]): ConstructorStanding[] => {
    const teams = new Map<string, { teamHexColor: string }>();
    roster.forEach(driver => {
        if (!teams.has(driver.car.teamName)) {
            const { teamHexColor } = getTeamColors(driver.car.teamName);
            teams.set(driver.car.teamName, { teamHexColor });
        }
    });

    return Array.from(teams.entries()).map(([teamName, data]) => ({
        teamName,
        teamHexColor: data.teamHexColor,
        points: 0,
        position: 0,
    }));
};

export const useConstructorStandings = (roster: InitialDriver[]) => {
    const defaultStandings = useMemo(() => getDefaultConstructorStandings(roster), [roster]);
    
    const [standings, setStandings] = useState<ConstructorStanding[]>(() => {
        try {
            const saved = localStorage.getItem(STANDINGS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as ConstructorStanding[];
                const rosterTeams = new Set(roster.map(d => d.car.teamName));
                const savedTeams = new Set(parsed.map(p => p.teamName));
                // More robust validation: check if team lists are identical
                if (rosterTeams.size === savedTeams.size && [...rosterTeams].every(teamName => savedTeams.has(teamName))) {
                    return parsed;
                }
            }
        } catch (error) {
            console.error("Error reading constructor standings from localStorage", error);
        }
        return defaultStandings;
    });

    useEffect(() => {
        try {
            localStorage.setItem(STANDINGS_KEY, JSON.stringify(standings));
        } catch (error) {
            console.error("Error saving constructor standings to localStorage", error);
        }
    }, [standings]);

    const awardConstructorPoints = (finishedDrivers: Driver[]) => {
        setStandings(prevStandings => {
            let newStandings = prevStandings.map(s => ({...s}));

            const raceFinishers = finishedDrivers.filter(d => d.raceStatus !== 'Crashed' && d.raceStatus !== 'DNF');

            raceFinishers.slice(0, 10).forEach((driver, index) => {
                const points = POINTS_SYSTEM[index];
                if (points) {
                    const standingIndex = newStandings.findIndex(s => s.teamName === driver.car.teamName);
                    if (standingIndex !== -1) {
                        newStandings[standingIndex].points += points;
                    }
                }
            });

            // Update positions
            newStandings = newStandings.sort((a,b) => b.points - a.points);
            newStandings.forEach((s, i) => s.position = i + 1);

            return newStandings;
        });
    };
    
    const resetConstructorStandings = (currentRoster: InitialDriver[]) => {
        setStandings(getDefaultConstructorStandings(currentRoster));
    };

    const hydrateConstructorStandings = (loadedStandings: ConstructorStanding[]) => {
        if (!Array.isArray(loadedStandings) || loadedStandings.length === 0) {
            return;
        }
        setStandings(loadedStandings);
    };

    return { standings, awardConstructorPoints, resetConstructorStandings, hydrateConstructorStandings };
};
