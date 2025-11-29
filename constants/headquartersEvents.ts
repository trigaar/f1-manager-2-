import { HeadquartersEvent } from '../types';

export const HEADQUARTERS_EVENTS: HeadquartersEvent[] = [
  {
    id: 'experimental-aero',
    title: 'Experimental Aero Package Found in CFD',
    description: 'Your aero department quietly ran a risky CFD experiment that shows a potential +0.2s gain, but it hasn’t been validated in the wind tunnel.',
    choices: [
      {
        id: 'approve-prototype',
        label: 'Approve Rapid Prototype',
        summary: '+0.15s performance next race, 20% chance of instability',
        effect: { lapTimeModifier: 0.15, paceDelta: 3 },
        risk: {
          probability: 0.2,
          effect: { lapTimeModifier: -0.1, reliabilityDelta: -5, dnfRiskDelta: 5 },
          summary: 'instability hits and you lose pace instead',
        },
      },
      {
        id: 'reject-risk',
        label: 'Reject as Too Risky',
        summary: '+5% reliability, morale -5%',
        effect: { reliabilityDelta: 5, moraleDelta: -5, tyreDegMultiplier: 0.98 },
      },
    ],
  },
  {
    id: 'brake-cooling-shortcut',
    title: 'Lead Engineer Discovers a Brake Cooling Shortcut',
    description: 'A senior engineer proposes a temporary but risky brake-cooling duct tweak.',
    choices: [
      {
        id: 'use-shortcut',
        label: 'Use It',
        summary: 'Better tyre wear, small DNF risk',
        effect: { tyreLifeMultiplier: 1.04, tyreDegMultiplier: 0.96 },
        risk: { probability: 0.1, effect: { dnfRiskDelta: 2, reliabilityDelta: -3 }, summary: 'brakes overheat and risk a DNF' },
      },
      {
        id: 'decline-shortcut',
        label: 'Decline',
        summary: 'Pit crew performance +3%',
        effect: { pitStopTimeDelta: 0.2, moraleDelta: -2 },
      },
    ],
  },
  {
    id: 'aggressive-setup',
    title: 'Simulator Driver Suggests Aggressive Setup',
    description: 'Your sim driver returns with a new aggressive baseline setup that could unlock pace.',
    choices: [
      {
        id: 'trust-sim',
        label: 'Trust the Sim',
        summary: '+0.1s qualifying, tyre deg worsens',
        effect: { qualifyingSkillDelta: 4, lapTimeModifier: 0.1, tyreDegMultiplier: 1.05 },
      },
      {
        id: 'safe-setup',
        label: 'Stick With Safe Setup',
        summary: 'Tire deg -2%, -0.05s qualifying',
        effect: { qualifyingSkillDelta: -2, tyreDegMultiplier: 0.98 },
      },
    ],
  },
  {
    id: 'sponsor-shoot',
    title: 'Sponsor Offers Short-Notice Promotion',
    description: 'A sponsor wants a marketing shoot this week, draining engineering time.',
    choices: [
      {
        id: 'accept-shoot',
        label: 'Accept the Shoot',
        summary: '+$150k funds, -0.05s pace',
        effect: { budgetDelta: 150_000, lapTimeModifier: -0.05 },
      },
      {
        id: 'decline-shoot',
        label: 'Decline',
        summary: 'Morale +8%, sponsor hit',
        effect: { moraleDelta: 8, reputationDelta: -10 },
      },
    ],
  },
  {
    id: 'experimental-fuel',
    title: 'Engine Supplier Sends Experimental Fuel Mixture',
    description: 'Your supplier offers a test batch of higher-energy fuel.',
    choices: [
      {
        id: 'try-fuel',
        label: 'Try It',
        summary: '+0.12s qualifying pace, engine wear +10%',
        effect: { lapTimeModifier: 0.12, qualifyingSkillDelta: 5, reliabilityDelta: -8, engineWearDelta: 10 },
      },
      {
        id: 'decline-fuel',
        label: 'Decline',
        summary: 'Engine wear -5%',
        effect: { reliabilityDelta: 4, engineWearDelta: -5 },
      },
    ],
  },
  {
    id: 'wind-tunnel-malfunction',
    title: 'Wind Tunnel Malfunction',
    description: 'A calibration fault means your aero numbers might be unreliable.',
    choices: [
      {
        id: 'rush-fix',
        label: 'Rush Fix',
        summary: 'Reliability +5%, costs $50k',
        effect: { reliabilityDelta: 5, budgetDelta: -50_000 },
      },
      {
        id: 'trust-data',
        label: 'Ignore & Trust Data',
        summary: 'Potential +0.08s boost or -0.12s loss',
        effect: { lapTimeModifier: 0.08 },
        risk: { probability: 0.15, effect: { lapTimeModifier: -0.12, reliabilityDelta: -4 }, summary: 'data was wrong and aero load is off' },
      },
    ],
  },
  {
    id: 'media-meltdown',
    title: 'Driver Has a Media Meltdown',
    description: 'Your lead driver makes controversial comments during press.',
    choices: [
      {
        id: 'official-apology',
        label: 'Issue Official Apology',
        summary: 'Reputation +10, confidence -5%',
        effect: { reputationDelta: 10, confidenceDelta: -5, moraleDelta: -2 },
      },
      {
        id: 'defend-driver',
        label: 'Defend Driver Publicly',
        summary: 'Driver confidence +8%, rep -10',
        effect: { confidenceDelta: 8, reputationDelta: -10, moraleDelta: 2 },
      },
    ],
  },
  {
    id: 'pit-crew-training',
    title: 'Mechanics Want Overnight Pit Stop Training',
    description: 'Pit crew asks for extra sessions.',
    choices: [
      {
        id: 'approve-training',
        label: 'Approve',
        summary: 'Pit stop average -0.15s, fatigue risk',
        effect: { pitStopTimeDelta: 0.3 },
        risk: { probability: 0.25, effect: { pitMistakeChanceDelta: 2 }, summary: 'fatigue triggers more slow stops' },
      },
      {
        id: 'decline-training',
        label: 'Decline',
        summary: 'No fatigue, missed opportunity',
        effect: { moraleDelta: -2 },
      },
    ],
  },
  {
    id: 'suspension-crack',
    title: 'Unexpected Part Found Cracked',
    description: 'Routine inspection reveals a small crack in a suspension component.',
    choices: [
      {
        id: 'replace-part',
        label: 'Replace With New Part',
        summary: 'Reliability +20%, -0.03s aero drag, $20k',
        effect: { reliabilityDelta: 20, lapTimeModifier: -0.03, budgetDelta: -20_000 },
      },
      {
        id: 'reuse-part',
        label: 'Reinforce & Reuse',
        summary: '+0.03s performance, +4% DNF chance',
        effect: { lapTimeModifier: 0.03, dnfRiskDelta: 4, reliabilityDelta: -6 },
      },
    ],
  },
  {
    id: 'rookie-sim-hours',
    title: 'Rookie Driver Asks for Extra Simulator Hours',
    description: 'Your young 2nd driver wants extra simulator support.',
    choices: [
      {
        id: 'approve-sim-hours',
        label: 'Approve Extra Hours',
        summary: 'Race consistency +5%, cost $10k',
        effect: { reliabilityDelta: 2, qualifyingSkillDelta: 2, moraleDelta: -3, budgetDelta: -10_000 },
      },
      {
        id: 'decline-sim-hours',
        label: 'Decline',
        summary: 'Save budget, rookie stagnates',
        effect: { moraleDelta: -2 },
      },
    ],
  },
];

export const pickRandomHeadquartersEvent = (): HeadquartersEvent => {
  return HEADQUARTERS_EVENTS[Math.floor(Math.random() * HEADQUARTERS_EVENTS.length)];
};
