import { CarLink, Driver, InitialDriver } from '../types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export type CarLinkedDriver = (Driver | InitialDriver) & { carLink: CarLink };

interface CarLinkContext {
    lapNumber?: number;
    session?: 'race' | 'qualifying' | 'practice';
}

export const calculateCarLinkImpact = (
    driver: CarLinkedDriver,
    context: CarLinkContext = {}
): { synergyBonus: number; adaptationDrag: number; readiness: number } => {
    const { lapNumber = 0, session = 'race' } = context;
    const { compatibility, adaptation } = driver.carLink;

    const normalizedCompatibility = clamp(compatibility, 0, 100);
    const normalizedAdaptation = clamp(adaptation, 0, 100);

    const baseRamp = session === 'race' ? 6 : session === 'qualifying' ? 3 : 4;
    const responsiveness = 0.55 + (normalizedAdaptation / 100) * 0.6;
    const adaptationCurve = clamp(((lapNumber + 1) / baseRamp) * responsiveness, 0, 1);

    const compatibilityEdge = ((normalizedCompatibility - 50) / 100) * 0.35; // +/-0.175s potential
    const synergyBonus = compatibilityEdge * adaptationCurve;

    const adaptationGap = 1 - adaptationCurve;
    const adaptationDrag = adaptationGap * (0.08 + ((70 - normalizedAdaptation) / 220)) + Math.max(0, (55 - normalizedCompatibility) / 400);

    const readiness = adaptationCurve;

    return { synergyBonus, adaptationDrag, readiness };
};

export const describeCarLink = (link: CarLink) => {
    const compatibilityLabel = link.compatibility >= 85 ? 'Exceptional' : link.compatibility >= 70 ? 'Strong' : link.compatibility >= 55 ? 'Decent' : 'Strained';
    const adaptationLabel = link.adaptation >= 80 ? 'Instant' : link.adaptation >= 65 ? 'Quick' : link.adaptation >= 50 ? 'Gradual' : 'Slow';
    return `${compatibilityLabel} fit • ${adaptationLabel} adaptation`;
};
