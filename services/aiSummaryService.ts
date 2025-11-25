
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
    const positionGains = drivers
        .map(d => ({ name: d.name, gain: d.startingPosition - d.position }))
        .sort((a, b) => b.gain - a.gain);
    const driverOfTheDay = positionGains.length > 0 ? positionGains[0].name : "N/A";

    const dramaticOvertake = lapEvents.find(e => e.type === 'OVERTAKE' && e.data.position <= 5);
    const earlySafetyCar = lapEvents.find(e => e.type === 'SAFETY_CAR');
    const moveOfTheDay = dramaticOvertake
        ? `Bold move by ${dramaticOvertake.driverName} on ${dramaticOvertake.data.target} for P${dramaticOvertake.data.position}.`
        : earlySafetyCar
            ? `Safety Car on lap ${earlySafetyCar.lap} reshuffled strategies and opened the door for bold calls.`
            : `A decisive pit-stop under clear air created the gap that set the race order.`;

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

    const seasonContext = getSeasonContext(currentRaceIndex, FULL_SEASON_TRACKS.length);
    const raceResultSummary = getRaceResultSummary(drivers, raceState);
    const performanceContext = getPerformanceContext(drivers, constructorStandings);
    const { driverOfTheDay, moveOfTheDay } = findKeyMoments(drivers, lapEvents);

    const winner = drivers[0];
    const rival = drivers[1] || drivers[0];
    const underperformer = drivers.find(d => (TEAM_EXPECTATIONS[d.car.teamName] || 5) <= 4 && d.position > 10) || drivers[drivers.length - 1];

    const headline = `${winner.name} conquers ${raceState.track.name} as ${seasonContext}`;

    const raceSummary = `${raceResultSummary} ${performanceContext} ${moveOfTheDay}`;

    const safeHandle = (name: string) => `@${name.replace(/[^A-Za-z]/g, '') || 'Team'}F1`;

    return {
        headline,
        driverOfTheDay: { name: driverOfTheDay, reason: `${driverOfTheDay} gained the most ground relative to grid spot.` },
        moveOfTheDay: { driver: driverOfTheDay, description: moveOfTheDay },
        raceSummary,
        commentary: [
            { persona: `Winning Driver (${winner.name})`, team: winner.car.teamName, handle: safeHandle(winner.shortName || winner.name), text: "Incredible pace today. The team nailed strategy and the car felt hooked up." },
            { persona: `Rival Driver (${rival.name})`, team: rival.car.teamName, handle: safeHandle(rival.shortName || rival.name), text: "We threw everything at it. Congrats to the winners—our day will come soon." },
            { persona: "Winning Team Principal", team: winner.car.teamName, handle: safeHandle(winner.car.teamName), text: "Proud of the crew. Execution under pressure delivered this result." },
            { persona: `Disappointed Driver (${underperformer.name})`, team: underperformer.car.teamName, handle: safeHandle(underperformer.shortName || underperformer.name), text: "Tough one. We need to dig into the data and bounce back stronger." },
            { persona: "Pundit", team: "Media", handle: "@GridWatch", text: `${seasonContext}: ${winner.name} sets the benchmark while ${rival.name} keeps title hopes alive.` },
            { persona: "Fan", team: winner.car.teamName, handle: `@${winner.car.teamName.replace(/\s+/g, '')}Fan`, text: `${winner.name}! What a drive. This season just got interesting.` },
            { persona: "Rival Fan", team: rival.car.teamName, handle: `@${rival.car.teamName.replace(/\s+/g, '')}Faithful`, text: `Painful result, but trust the process—${rival.car.teamName} will strike back.` }
        ]
    };
};
