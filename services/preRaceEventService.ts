import { InitialDriver, TeamPersonnel, WeekendModifier } from '../types';

export interface PreRaceEventOutcome {
  modifier: WeekendModifier;
  log: string;
  budgetDelta?: number;
  reputationDelta?: number;
}

interface PreRaceEventDefinition {
  id: string;
  title: string;
  description: string;
  build: (teamName: string, drivers: InitialDriver[], personnel?: TeamPersonnel) => PreRaceEventOutcome;
}

const pickLeadDriver = (drivers: InitialDriver[]): InitialDriver | null => {
  if (drivers.length === 0) return null;
  return [...drivers].sort((a, b) => (b.driverSkills.overall || 0) - (a.driverSkills.overall || 0))[0];
};

const PRE_RACE_EVENTS: PreRaceEventDefinition[] = [
  {
    id: 'driver-sick-affiliate',
    title: 'Main Driver Sick, Affiliate Steps In',
    description: 'Lead driver is unwell, reserve must cover the race.',
    build: (teamName, drivers, personnel) => {
      const lead = pickLeadDriver(drivers);
      const reserveName = personnel?.affiliateDriver?.name || 'reserve driver';
      const sidelinedName = lead?.name || 'Lead driver';
      return {
        modifier: {
          id: 'driver-sick-affiliate',
          title: 'Lead Driver Out Sick',
          summary: `${sidelinedName} is sidelined; ${reserveName} fills in with limited pace and prep`,
          teamName,
          lapTimeModifier: -0.18,
          qualifyingSkillDelta: -8,
          paceDelta: -6,
          reliabilityDelta: -4,
          confidenceDelta: -5,
          moraleDelta: -6,
        },
        log: `${sidelinedName} is sick. ${reserveName} will race with a dip in form for ${teamName}.`,
      };
    },
  },
  {
    id: 'career-weekend',
    title: 'Career-Defining Weekend Incoming',
    description: 'A driver finds massive qualifying pace and confidence.',
    build: (teamName, drivers) => {
      const lead = pickLeadDriver(drivers);
      const driverName = lead?.name || 'One of the drivers';
      return {
        modifier: {
          id: 'career-weekend',
          title: 'Career-Defining Weekend',
          summary: `${driverName} is in the zone — blistering qualy pace expected`,
          teamName,
          lapTimeModifier: 0.22,
          qualifyingSkillDelta: 12,
          confidenceDelta: 12,
          moraleDelta: 6,
        },
        log: `${driverName} is flying in sim runs. Expect a standout qualifying from ${teamName}.`,
      };
    },
  },
  {
    id: 'celebrity-sponsor',
    title: 'Unexpected Celebrity Sponsor Shows Up',
    description: 'A surprise sponsor drops by with a big cheque and exposure.',
    build: (teamName) => ({
      modifier: {
        id: 'celebrity-sponsor',
        title: 'Celebrity Sponsor Windfall',
        summary: 'Celebrity boost adds cash and reputation for the next build push',
        teamName,
        reputationDelta: 12,
        moraleDelta: 4,
      },
      log: `A celebrity sponsor gifts ${teamName} a $2M boost and extra spotlight.`,
      budgetDelta: 2_000_000,
      reputationDelta: 12,
    }),
  },
  {
    id: 'internal-conflict',
    title: 'Internal Team Conflict Explosion',
    description: 'Tensions flare inside the garage, hurting cohesion.',
    build: (teamName, drivers) => {
      const driverPair = drivers.slice(0, 2).map(d => d.name).join(' & ');
      return {
        modifier: {
          id: 'internal-conflict',
          title: 'Internal Team Conflict',
          summary: `${driverPair || 'Garage'} at odds — focus and morale down`,
          teamName,
          paceDelta: -8,
          moraleDelta: -12,
          confidenceDelta: -6,
          pitMistakeChanceDelta: 2,
        },
        log: `Internal friction hits ${teamName}. Morale dips and pitwall sharpness suffers.`,
      };
    },
  },
  {
    id: 'mini-cheat',
    title: 'Aero Department Discovers “Mini Cheat”',
    description: 'Grey-area aero tweak could deliver sneaky lap time.',
    build: (teamName) => ({
      modifier: {
        id: 'mini-cheat',
        title: 'Mini Aero Cheat',
        summary: 'Grey-area aero trick: quick but a bit fragile',
        teamName,
        lapTimeModifier: 0.12,
        paceDelta: 8,
        reliabilityDelta: -6,
        dnfRiskDelta: 2,
      },
      log: `${teamName} found a cheeky aero shortcut: faster laps, but reliability takes a hit.`,
    }),
  },
  {
    id: 'viral-moment',
    title: 'Driver Makes Viral Media Moment',
    description: 'A meme-worthy moment boosts or tanks morale and reputation.',
    build: (teamName, drivers) => {
      const driver = pickLeadDriver(drivers);
      const driverName = driver?.name || 'A driver';
      const positive = Math.random() < 0.5;
      if (positive) {
        return {
          modifier: {
            id: 'viral-moment-positive',
            title: 'Viral Buzz (Positive)',
            summary: `${driverName} goes viral — fans love it, confidence surges`,
            teamName,
            confidenceDelta: 9,
            moraleDelta: 7,
            reputationDelta: 8,
            lapTimeModifier: 0.06,
          },
          log: `${driverName}'s viral clip lifts ${teamName} spirits and reputation.`,
          reputationDelta: 8,
        };
      }
      return {
        modifier: {
          id: 'viral-moment-negative',
          title: 'Viral Buzz (Backfires)',
          summary: `${driverName} becomes a meme for the wrong reasons`,
          teamName,
          confidenceDelta: -8,
          moraleDelta: -8,
          reputationDelta: -6,
          lapTimeModifier: -0.05,
        },
        log: `${driverName}'s viral moment backfires. ${teamName} deals with negative press.`,
        reputationDelta: -6,
      };
    },
  },
];

export const rollPreRaceEventForTeam = (
  teamName: string,
  drivers: InitialDriver[],
  personnel?: TeamPersonnel,
): PreRaceEventOutcome => {
  const selected = PRE_RACE_EVENTS[Math.floor(Math.random() * PRE_RACE_EVENTS.length)];
  return selected.build(teamName, drivers, personnel);
};
