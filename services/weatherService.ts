
import { Track, RaceState, TeamPersonnel } from '../types';

export const generateMasterForecast = (track: Track): RaceState['weather'][] => {
    const forecast: RaceState['weather'][] = Array(track.laps).fill('Sunny');

    if (Math.random() > track.wetSessionProbability) {
        // Chance for just a cloudy spell
        if (Math.random() < 0.3) {
            const start = Math.floor(Math.random() * (track.laps - 10));
            const duration = 5 + Math.floor(Math.random() * 10);
            for (let i = start; i < Math.min(track.laps, start + duration); i++) {
                forecast[i] = 'Cloudy';
            }
        }
        return forecast;
    }

    // Create a rain shower
    const rainStart = Math.floor(Math.random() * (track.laps - 15)) + 5;
    const rainDuration = 8 + Math.floor(Math.random() * 12);
    
    // Build-up
    for(let i = Math.max(0, rainStart - 3); i < rainStart; i++) {
        forecast[i] = 'Cloudy';
    }

    // Shower
    let heavyRainLaps = 0;
    let hasHadExtremeRain = false; // Prevent multiple extreme events
    for (let i = rainStart; i < Math.min(track.laps, rainStart + rainDuration); i++) {
        const isHeavy = Math.random() < 0.4 && heavyRainLaps < 5;
        if(isHeavy) {
            forecast[i] = 'Heavy Rain';
            heavyRainLaps++;
            // NEW: Chance to escalate to Extreme Rain
            if (Math.random() < 0.05 && !hasHadExtremeRain) { 
                hasHadExtremeRain = true;
                const extremeDuration = 2 + Math.floor(Math.random() * 2); // 2-3 laps
                for (let j = i; j < Math.min(track.laps, i + extremeDuration); j++) {
                    forecast[j] = 'Extreme Rain';
                }
                i += extremeDuration - 1; // Skip forward in the loop
            }
        } else {
            forecast[i] = 'Light Rain';
        }
    }
    
    // Taper-off
    const rainEnd = rainStart + rainDuration;
    for(let i = rainEnd; i < Math.min(track.laps, rainEnd + 4); i++) {
        forecast[i] = 'Cloudy';
    }

    return forecast;
}


export const generateTeamForecasts = (
    masterForecast: RaceState['weather'][],
    personnel: TeamPersonnel[]
): { [teamName: string]: RaceState['weather'][] } => {
    
    const teamForecasts: { [teamName: string]: RaceState['weather'][] } = {};

    personnel.forEach(team => {
        const ht = team.headOfTechnical;
        const tp = team.teamPrincipal;

        if (!ht || !tp) {
             teamForecasts[team.teamName] = [...masterForecast];
             return;
        }

        const forecastSkill = ((ht.innovation + tp.leadership) / 40) * 100; // Score out of 100

        const forecastAccuracy = 0.7 + (forecastSkill / 100) * 0.3; // Range 0.7 to 1.0

        let teamForecast = [...masterForecast];

        if (Math.random() > forecastAccuracy) {
            const errorType = Math.random();
            
            // Timing Error (70% chance)
            if (errorType < 0.7) {
                const shift = Math.random() < 0.5 ? -1 : 1; // Shift by 1 lap early or late
                const tempForecast = [...teamForecast];
                for(let i=0; i < teamForecast.length; i++) {
                    if (tempForecast[i].includes('Rain')) {
                        const newIndex = i + shift;
                        if(newIndex >= 0 && newIndex < teamForecast.length) {
                           teamForecast[newIndex] = tempForecast[i];
                           // Clean up original spot if it wasn't overwritten
                           if(tempForecast[i-shift] === tempForecast[i]) {
                              teamForecast[i] = 'Cloudy';
                           }
                        }
                    }
                }
            } 
            // Intensity Error (30% chance)
            else {
                for(let i=0; i < teamForecast.length; i++) {
                    if (teamForecast[i] === 'Heavy Rain') {
                        teamForecast[i] = 'Light Rain'; // Underestimate heavy rain
                    } else if (teamForecast[i] === 'Light Rain' && Math.random() < 0.2) {
                        teamForecast[i] = 'Heavy Rain'; // Overestimate light rain
                    }
                }
            }
        }
        
        teamForecasts[team.teamName] = teamForecast;
    });

    return teamForecasts;
}
