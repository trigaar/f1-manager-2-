import { GoogleGenAI, Type } from "@google/genai";
import { InitialDriver, DriverStanding, Track, UpcomingRaceQuote } from '../types';

export const generateAiDriverPreview = async (
    driver: InitialDriver,
    driverStanding: DriverStanding,
    lastRacePosition: number | null,
    track: Track
): Promise<UpcomingRaceQuote | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        
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

        const prompt = `
You are an AI generating an immersive, in-character media quote for an F1 simulation game.
You are generating a quote for driver ${driver.name}, who is ${driver.age} years old.

**Driver Context:**
* **PERFORMANCE:** ${performanceContext}
* **PERSONALITY_TRAITS:** Aggression ${driver.driverSkills.aggressionIndex}/100, Consistency ${driver.driverSkills.consistency}/100.

**Upcoming Race Context:**
* **TRACK:** ${track.name}
* **TRACK_DESCRIPTION:** ${track.description}
* **KEY_CHALLENGE:** The track is known for being ${track.primaryCharacteristic}.

**Task:**
Generate a short, realistic, in-character quote from ${driver.name} looking ahead to the race at ${track.name}. The quote should reflect their recent performance and acknowledge the specific challenge of the upcoming track.

**Instructions:**
* Keep the quote to 1-2 sentences.
* The tone should be authentic to a professional F1 driver. Confident but not arrogant if they are doing well; determined but not defeated if they are struggling.
* **DO NOT** use markdown in the final JSON output.

**JSON Schema:**
{
  "driverName": "${driver.name}",
  "quote": "The generated media quote from the driver."
}
`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                driverName: { type: Type.STRING },
                quote: { type: Type.STRING }
            },
            required: ["driverName", "quote"]
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.85,
            }
        });

        let jsonStr = response.text.trim();
        const parsedResponse = JSON.parse(jsonStr);
        return parsedResponse as UpcomingRaceQuote;

    } catch (error) {
        console.error("Error generating AI driver preview:", error);
        return {
            driverName: driver.name,
            quote: "We're feeling confident heading into this weekend. The car feels good, and we're ready to push for a strong result."
        };
    }
};