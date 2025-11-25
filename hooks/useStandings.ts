

import { useState, useEffect, useMemo } from 'react';
import { DriverStanding, Driver, InitialDriver } from '../types';
import { POINTS_SYSTEM, getTeamColors } from '../constants';

const STANDINGS_KEY = 'f1_standings_v1';

const getDefaultStandings = (roster: InitialDriver[]): DriverStanding[] => {
    return roster.map(d => ({
        driverId: d.id,
        name: d.name,
        teamName: d.car.teamName,
        teamHexColor: getTeamColors(d.car.teamName).teamHexColor,
        points: 0,
        position: 0,
    }));
};


export const useStandings = (roster: InitialDriver[]) => {
    const defaultStandings = useMemo(() => getDefaultStandings(roster), [roster]);

    const [standings, setStandings] = useState<DriverStanding[]>(() => {
        try {
            const saved = localStorage.getItem(STANDINGS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as DriverStanding[];
                // More robust validation: ensure all current roster drivers are in the saved data.
                const rosterIds = new Set(roster.map(d => d.id));
                const savedIds = new Set(parsed.map(p => p.driverId));
                if (roster.every(d => savedIds.has(d.id)) && parsed.every(p => rosterIds.has(p.driverId))) {
                    return parsed;
                }
            }
        } catch (error) {
            console.error("Error reading standings from localStorage", error);
        }
        return defaultStandings;
    });

    useEffect(() => {
        try {
            localStorage.setItem(STANDINGS_KEY, JSON.stringify(standings));
        } catch (error) {
            console.error("Error saving standings to localStorage", error);
        }
    }, [standings]);

    const awardPoints = (finishedDrivers: Driver[]) => {
        setStandings(prevStandings => {
            let newStandings = prevStandings.map(s => ({...s})); // Deep copy
            
            const raceFinishers = finishedDrivers.filter(d => d.raceStatus !== 'Crashed' && d.raceStatus !== 'DNF');

            raceFinishers.slice(0, 10).forEach((driver, index) => {
                const points = POINTS_SYSTEM[index];
                if (points) {
                    const standingIndex = newStandings.findIndex(s => s.driverId === driver.id);
                    if (standingIndex !== -1) {
                        newStandings[standingIndex].points += points;
                    } else {
                        // This case handles if a driver is not in the standings (e.g., new rookie)
                         newStandings.push({
                            driverId: driver.id,
                            name: driver.name,
                            teamName: driver.car.teamName,
                            teamHexColor: driver.teamHexColor,
                            points: points,
                            position: 0,
                         });
                    }
                }
            });

            // Update positions
            newStandings = newStandings.sort((a, b) => b.points - a.points);
            newStandings.forEach((s, i) => s.position = i + 1);

            return newStandings;
        });
    };
    
    const resetStandings = (currentRoster: InitialDriver[]) => {
        setStandings(getDefaultStandings(currentRoster));
    };

    return { standings, awardPoints, resetStandings };
};
