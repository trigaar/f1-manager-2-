
import { DriverStanding, ConstructorStanding, TeamPersonnel, AiSeasonReview, TeamPrincipal } from '../types';
import { TEAM_EXPECTATIONS } from '../constants';

// Helper to select key teams for the review
const selectKeyTeams = (constructorStandings: ConstructorStanding[]): ConstructorStanding[] => {
    const winner = constructorStandings[0];
    let overachiever = constructorStandings[0];
    let underachiever = constructorStandings[0];
    let maxOverperformance = -10;
    let maxUnderperformance = 10;

    constructorStandings.forEach(team => {
        const expectation = TEAM_EXPECTATIONS[team.teamName] || team.position;
        const performanceDelta = expectation - team.position;

        if (performanceDelta > maxOverperformance) {
            maxOverperformance = performanceDelta;
            overachiever = team;
        }
        if (performanceDelta < maxUnderperformance) {
            maxUnderperformance = performanceDelta;
            underachiever = team;
        }
    });
    
    const selected = new Map<string, ConstructorStanding>();
    selected.set(winner.teamName, winner);
    if (!selected.has(overachiever.teamName)) {
        selected.set(overachiever.teamName, overachiever);
    }
     if (!selected.has(underachiever.teamName) && selected.size < 3) {
        selected.set(underachiever.teamName, underachiever);
    }

    if(selected.size < 3) {
        const midFieldTeams = constructorStandings.filter(t => t.position > 3 && t.position < 8 && !selected.has(t.teamName));
        if (midFieldTeams.length > 0) {
            selected.set(midFieldTeams[0].teamName, midFieldTeams[0]);
        }
    }

    return Array.from(selected.values());
};

const generatePrincipalQuote = (team: ConstructorStanding, principal: TeamPrincipal): string => {
    const expectation = TEAM_EXPECTATIONS[team.teamName] || team.position;
    const performanceDelta = expectation - team.position;
    const personality = principal.personality;

    if (team.position === 1) { // Champions
        switch(personality) {
            case 'Visionary': return "A monumental achievement for the entire team. This championship is a testament to our vision and the hard work of everyone involved. This is our new benchmark.";
            case 'Pragmatist': return "The numbers don't lie. We had the best package and we executed. It's a logical and well-deserved conclusion to a strong season.";
            case 'Ruthless Operator': return "Domination. That was the goal, and that's what we delivered. We expected to win, and we did.";
            case 'Loyalist': return "I'm speechless. For every single person who poured their heart and soul into this project, this championship is for you. What a family.";
        }
    } else if (performanceDelta >= 3) { // Big overperformance
        switch(personality) {
            case 'Visionary': return "This is just the beginning. We've laid the foundation for a new era of success for this team.";
            case 'Pragmatist': return "The results speak for themselves. We optimized our package and executed flawlessly. A fantastic achievement.";
            case 'Ruthless Operator': return "We proved the doubters wrong. This is the standard now, and we expect to maintain it.";
            case 'Loyalist': return "I'm so proud of every single person back at the factory and here at the track. They deserve this incredible result.";
        }
    } else if (performanceDelta <= -3) { // Big underperformance
        switch(personality) {
            case 'Visionary': return "A tough season, but one we will learn from. The rebuild starts now, and we have a clear vision for the future.";
            case 'Pragmatist': return "The performance was simply not acceptable. We need a deep analysis to understand our weaknesses and rectify them for next year.";
            case 'Ruthless Operator': return "Unacceptable. We will be making whatever changes are necessary to ensure this level of performance is never repeated.";
            case 'Loyalist': return "We win as a team, and we lose as a team. We'll stick together, work hard, and come back stronger from this.";
        }
    } else { // Met expectations
         switch(personality) {
            case 'Visionary': return "A solid season that aligns with our long-term project. The pieces are coming together, and the future is bright.";
            case 'Pragmatist': return "We finished where we expected to. Now, the goal is to find those crucial few tenths to move up the grid.";
            case 'Ruthless Operator': return "We met our targets, but we're not here to just meet targets. We're here to win. The work continues.";
            case 'Loyalist': return "A strong, consistent season from the whole team. It’s a great platform to build on for next year.";
        }
    }
    return "It was a season of ups and downs, but we are focused on the future.";
};

/**
 * Generates a local, data-driven season review without any external API calls.
 * The function is named `generateAiSeasonReview` to act as a drop-in replacement
 * and minimize changes in the main App component.
 */
export const generateAiSeasonReview = (
    season: number,
    driverStandings: DriverStanding[],
    constructorStandings: ConstructorStanding[],
    personnel: TeamPersonnel[]
): AiSeasonReview => {

    const champion = driverStandings[0];
    const wcc = constructorStandings[0];
    const runnerUp = driverStandings[1];

    // Generate Headline
    const pointsDifference = champion.points - (runnerUp?.points || 0);
    let headline = `${champion.name} Claims ${season} World Title!`;
    if (pointsDifference > 50) {
        headline = `Dominant ${champion.name} Storms to ${season} Championship Glory!`;
    } else if (pointsDifference < 10) {
        headline = `Down to the Wire! ${champion.name} Snatches ${season} Title in Thrilling Finale!`;
    }

    // Generate Summary
    let summary = `The ${season} season will be remembered for the incredible performance of ${champion.name}, who clinched the Drivers' Championship with a total of ${champion.points} points. `;
    if (wcc.teamName === champion.teamName) {
        summary += `Their team, ${wcc.teamName}, also secured the Constructors' Championship, capping a dominant year for the outfit. `;
    } else {
        summary += `However, the Constructors' title went to ${wcc.teamName} in a hard-fought battle, highlighting the incredible consistency of their driver pairing. `;
    }
    summary += `The championship fight saw spectacular highs and dramatic lows, ultimately cementing a memorable year in motorsport history.`;

    // Generate Principal Quotes
    const keyTeams = selectKeyTeams(constructorStandings);
    const principalQuotes = keyTeams.map(team => {
        const teamPersonnel = personnel.find(p => p.teamName === team.teamName)!;
        return {
            principalName: teamPersonnel.teamPrincipal.name,
            teamName: team.teamName,
            quote: generatePrincipalQuote(team, teamPersonnel.teamPrincipal),
        };
    });

    return {
        headline,
        summary,
        principalQuotes,
    };
};
