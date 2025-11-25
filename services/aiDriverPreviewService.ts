import { InitialDriver, DriverStanding, Track, UpcomingRaceQuote } from '../types';

export const generateAiDriverPreview = async (
    driver: InitialDriver,
    driverStanding: DriverStanding,
    lastRacePosition: number | null,
    track: Track
): Promise<UpcomingRaceQuote | null> => {
    let performanceContext = `They are currently P${driverStanding.position} in the championship.`;
    if (lastRacePosition) {
        if (lastRacePosition === 1) {
            performanceContext += ` They are coming off a fantastic win in the last race.`;
        } else if (lastRacePosition <= 5) {
            performanceContext += ` They had a strong P${lastRacePosition} finish in the last race.`;
        } else if (lastRacePosition > 15) {
            performanceContext += ` They had a difficult last race, finishing P${lastRacePosition}.`;
        } else {
             performanceContext += ` They finished P${lastRacePosition} in the last race.`;
        }
    } else {
        performanceContext += " This is their first race of the season.";
    }

    const temperament = driver.driverSkills.aggressionIndex > 75
        ? "We're ready to attack and take every chance out there."
        : driver.driverSkills.consistency > 80
            ? "If we execute cleanly, the result will follow."
            : "We'll stay sharp and grab any opportunity that comes our way.";

    const trackHook = `It's always tricky around ${track.name} with its ${track.primaryCharacteristic.toLowerCase()} demands.`;

    return {
        driverName: driver.name,
        quote: `${performanceContext} ${trackHook} ${temperament}`
    };
};
