
import { GoogleGenAI, Type } from "@google/genai";
import { Driver, RaceState, LapEvent, ConstructorStanding, AiRaceSummary } from '../types';
import { FULL_SEASON_TRACKS, TEAM_EXPECTATIONS } from '../constants';

const getSeasonContext = (currentRaceIndex: number, totalRaces: number): string => {
    if (currentRaceIndex === 0) return "Season Opener (Round 1)";
    if (currentRaceIndex < 5) return `Early Season (Round ${currentRaceIndex + 1} of ${totalRaces})`;
    if (currentRaceIndex < totalRaces - 4) return `Mid-Season (Round ${currentRaceIndex + 1} of ${totalRaces})`;
    if (currentRaceIndex < totalRaces - 1) return `Late Season (Round ${currentRaceIndex + 1} of ${totalRaces})`;
    return `Season Finale (Final Round of ${totalRaces})`;
};

const getPerformanceContext = (drivers: Driver[], constructorStandings: ConstructorStanding[]): string => {
    const winner = drivers[0];
    const winnerTeamStanding = constructorStandings.find(cs => cs.teamName === winner.car.teamName);
    const winnerTeamExpectation = TEAM_EXPECTATIONS[winner.car.teamName] || 5;

    let context = `The winning team, ${winner.car.teamName}, was expected to finish around P${winnerTeamExpectation} in the championship. `;
    if (winnerTeamStanding && Math.abs(winnerTeamStanding.position - winnerTeamExpectation) <= 1) {
        context += "This victory is in line with their strong season performance. ";
    } else if (winnerTeamStanding && winnerTeamStanding.position < winnerTeamExpectation) {
        context += "This dominant victory reinforces their status as overperformers this season. ";
    } else {
        context += "This is a major upset and a much-needed result for a team that has been underperforming. ";
    }

    const topTeams = Object.entries(TEAM_EXPECTATIONS).filter(([, pos]) => pos <= 3).map(([team]) => team);
    const topTeamDisasters = drivers.filter(d => topTeams.includes(d.car.teamName) && (d.raceStatus === 'Crashed' || d.raceStatus === 'DNF' || d.position > 15));
    if (topTeamDisasters.length > 0) {
        context += `It was a disastrous day for ${topTeamDisasters.map(d => d.car.teamName).join(' and ')}, with drivers finishing well down the order or not at all.`;
    }

    return context;
};

const getRaceResultSummary = (drivers: Driver[], raceState: RaceState): string => {
    const winner = drivers[0];
    const p2 = drivers[1];
    const podium = drivers.slice(0, 3).map(d => d.name).join(', ');
    const winningMargin = p2.totalRaceTime - winner.totalRaceTime;

    return `${winner.name} of ${winner.car.teamName} won the ${raceState.track.name} Grand Prix. They finished ${winningMargin.toFixed(3)}s ahead of ${p2.name}. The podium was ${podium}. The race featured ${raceState.flag === 'SafetyCar' ? 'a Safety Car period' : 'no major interruptions'}.`;
};

const findKeyMoments = (drivers: Driver[], lapEvents: LapEvent[]): { driverOfTheDay: string, moveOfTheDay: string } => {
    const positionGains = drivers.map(d => ({ name: d.name, gain: d.startingPosition - d.position })).sort((a, b) => b.gain - a.gain);
    const driverOfTheDay = positionGains.length > 0 ? positionGains[0].name : "N/A";

    const overtakes = lapEvents.filter(e => e.type === 'OVERTAKE' && e.data.position <= 5);
    const moveOfTheDay = overtakes.length > 0
        ? `The overtake by ${overtakes[0].driverName} on ${overtakes[0].data.target} for P${overtakes[0].data.position}.`
        : `A crucial pitstop strategy call by a midfield team.`;

    return { driverOfTheDay, moveOfTheDay };
};

export const generateAiRaceSummary = async (
    drivers: Driver[],
    raceState: RaceState,
    season: number,
    currentRaceIndex: number,
    constructorStandings: ConstructorStanding[],
    lapEvents: LapEvent[]
): Promise<AiRaceSummary | null> => {

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        
        const seasonContext = getSeasonContext(currentRaceIndex, FULL_SEASON_TRACKS.length);
        const raceResultSummary = getRaceResultSummary(drivers, raceState);
        const performanceContext = getPerformanceContext(drivers, constructorStandings);
        const { driverOfTheDay, moveOfTheDay } = findKeyMoments(drivers, lapEvents);
        
        const winner = drivers[0];
        const rival = drivers[1] || drivers[2];
        const underperformer = drivers.find(d => (TEAM_EXPECTATIONS[d.car.teamName] <= 4) && d.position > 10) || drivers[15];
        
        const prompt = `
You are an AI generating immersive, in-character commentary for an F1 simulation game.
The year is ${season}.

**Primary Context:**
* **SEASON_CONTEXT:** ${seasonContext}
* **RACE_RESULT_SUMMARY:** ${raceResultSummary}
* **PERFORMANCE_CONTEXT:** ${performanceContext}
* **KEY MOMENTS:**
  * Suggested Driver of the Day: ${driverOfTheDay}
  * Suggested Move of the Day: ${moveOfTheDay}

**Task:**
Generate a JSON object that provides a full post-race media summary. The tone **must** reflect the specified SEASON_CONTEXT. For example, in the "Season Opener", language should be about setting a benchmark, while in the "Late Season" it should be about championship pressure.

**Instructions:**
* The commentary must be a direct reaction to the RACE_RESULT_SUMMARY and PERFORMANCE_CONTEXT.
* Keep the lines brief and authentic, like social media posts.
* Create realistic, creative social media handles for each persona. Do not use generic placeholders.
* Ensure the quotes are from the specific drivers mentioned (e.g., the winning driver is ${winner.name}).
* **DO NOT** use markdown in the final JSON output.

**JSON Schema:**
{
  "headline": "A short, dramatic, newspaper-style headline for the race.",
  "driverOfTheDay": {
    "name": "The driver who performed best relative to their car's ability.",
    "reason": "A short explanation for why they are Driver of the Day."
  },
  "moveOfTheDay": {
    "driver": "The driver who made the best overtake or strategic move.",
    "description": "A brief, exciting description of the move."
  },
  "raceSummary": "A 3-4 sentence paragraph summarizing the story of the race.",
  "commentary": [
    { "persona": "Winning Driver (${winner.name})", "team": "${winner.car.teamName}", "handle": "A realistic, creative handle for this driver (e.g., @${winner.shortName}${winner.number}).", "text": "A celebratory quote from the winning driver." },
    { "persona": "Rival Driver (${rival.name})", "team": "${rival.car.teamName}", "handle": "A realistic, creative handle for this driver.", "text": "A quote from a rival driver, acknowledging the winner but looking ahead." },
    { "persona": "Winning Team Principal", "team": "${winner.car.teamName}", "handle": "The official team handle (e.g., @McLarenF1).", "text": "A quote from the winning Team Principal, praising the team." },
    { "persona": "Disappointed Driver (${underperformer.name})", "team": "${underperformer.car.teamName}", "handle": "A realistic, creative handle for this driver.", "text": "A frustrated but professional quote from a driver who had a bad race." },
    { "persona": "Pundit", "team": "Media", "handle": "A realistic pundit handle (e.g., @F1Insider).", "text": "An analytical take on the race result and its championship implications." },
    { "persona": "Fan", "team": "${winner.car.teamName}", "handle": "A creative fan account handle.", "text": "An excited, emotional reaction from a fan of the winning driver/team." },
    { "persona": "Rival Fan", "team": "${rival.car.teamName}", "handle": "A creative fan account handle for the rival team.", "text": "A slightly salty but hopeful tweet from a fan of a rival team." }
  ]
}
`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                headline: { type: Type.STRING },
                driverOfTheDay: {
                    type: Type.OBJECT,
                    properties: { name: { type: Type.STRING }, reason: { type: Type.STRING } },
                    required: ["name", "reason"]
                },
                moveOfTheDay: {
                    type: Type.OBJECT,
                    properties: { driver: { type: Type.STRING }, description: { type: Type.STRING } },
                     required: ["driver", "description"]
                },
                raceSummary: { type: Type.STRING },
                commentary: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            persona: { type: Type.STRING },
                            team: { type: Type.STRING },
                            handle: { type: Type.STRING },
                            text: { type: Type.STRING }
                        },
                        required: ["persona", "team", "handle", "text"]
                    }
                }
            },
             required: ["headline", "driverOfTheDay", "moveOfTheDay", "raceSummary", "commentary"]
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.9,
            }
        });
        
        let jsonStr = response.text.trim();
        const parsedResponse = JSON.parse(jsonStr);
        return parsedResponse as AiRaceSummary;

    } catch (error) {
        console.error("Error generating AI race summary:", error);
        return {
            headline: "Race Concludes After Thrilling Battle",
            driverOfTheDay: { name: drivers[0].name, reason: "A dominant performance from pole to flag." },
            moveOfTheDay: { driver: drivers[1].name, description: "A fantastic move around the outside into Turn 1." },
            raceSummary: "The race was filled with action from start to finish. The winner controlled the pace from the front, while battles raged throughout the midfield. A late safety car bunched up the pack, but the leader held on for a well-deserved victory.",
            commentary: [
                { persona: "Winner", team: "N/A", handle: "@Winner", text: "What a day! The car was a rocketship. Thanks to the whole team!" },
                { persona: "Pundit", team: "Media", handle: "@F1Insider", text: "A statement victory that sends a clear message to the rest of the paddock." }
            ]
        };
    }
};
