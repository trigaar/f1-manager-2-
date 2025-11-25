// This file contains the SVG path data for each unique track layout.
// This allows for a dynamic and visually distinct mini-map for each race.

export const TRACK_SVGS: Record<string, { path: string, viewBox: string }> = {
    'Albert Park Circuit': { 
        path: "M 150 50 L 250 50 C 300 50 350 100 350 150 L 350 250 C 350 300 300 350 250 350 L 150 350 C 100 350 50 300 50 250 L 50 150 C 50 100 100 50 150 50 Z",
        viewBox: "0 0 400 400"
    },
    'Shanghai International Circuit': {
        path: "M 100,200 A 50,80 0 0 1 250,200 L 250,50 L 350,50 A 50,50 0 0 1 350,150 L 250,150 L 250,200 L 400,200 L 400,300 L 100,300 Z",
        viewBox: "50 0 400 350"
    },
    'Suzuka International Racing Course': {
        path: "M100 200 C100 100 300 100 300 200 L 250 200 C 250 150 150 150 150 200 Z M300 200 C300 300 100 300 100 200",
        viewBox: "50 50 300 300"
    },
    'Bahrain International Circuit': {
        path: "M 100 50 L 300 50 L 350 100 L 350 250 L 300 300 L 100 300 L 50 250 L 50 100 Z",
        viewBox: "0 0 400 350"
    },
    'Jeddah Corniche Circuit': {
        path: "M 50 50 L 350 50 L 350 100 L 100 100 L 100 150 L 350 150 L 350 200 L 100 200 L 100 250 L 350 250 L 350 300 L 50 300 Z",
        viewBox: "0 0 400 350"
    },
    'Miami International Autodrome': {
        path: "M 100 50 L 300 50 L 300 100 L 150 100 L 150 200 L 300 200 L 300 250 L 100 250 Z",
        viewBox: "50 0 300 300"
    },
    'Autodromo Enzo e Dino Ferrari': {
        path: "M 100 50 L 300 50 Q 350 50 350 100 L 350 250 Q 350 300 300 300 L 100 300 Q 50 300 50 250 L 50 100 Q 50 50 100 50 Z",
        viewBox: "0 0 400 350"
    },
    'Circuit de Monaco': {
        path: "M 50 150 L 150 50 L 250 50 L 350 150 L 350 250 L 250 350 L 150 350 L 50 250 Z",
        viewBox: "0 0 400 400"
    },
    'Circuit de Barcelona-Catalunya': {
        path: "M 100 50 L 300 50 C 350 50 350 100 300 100 L 200 100 L 200 200 L 300 200 C 350 200 350 250 300 250 L 100 250 C 50 250 50 200 100 200 L 100 100 C 50 100 50 50 100 50 Z",
        viewBox: "0 0 400 300"
    },
    'Circuit Gilles Villeneuve': {
        path: "M 50 100 L 350 100 L 350 150 L 100 150 L 100 200 L 350 200 L 350 250 L 50 250 Z",
        viewBox: "0 50 400 250"
    },
    'Red Bull Ring': {
        path: "M 100 50 L 300 50 L 350 150 L 250 250 L 150 250 L 50 150 Z",
        viewBox: "0 0 400 300"
    },
    'Silverstone Circuit': {
        path: "M 100,50 L 300,50 C 400,50 400,150 300,150 L 250,150 C 200,150 200,250 250,250 L 300,250 C 400,250 400,350 300,350 L 100,350 C 0,350 0,250 100,250 L 150,250 C 200,250 200,150 150,150 L 100,150 C 0,150 0,50 100,50 Z",
        viewBox: "0 0 450 400"
    },
    'Circuit de Spa-Francorchamps': {
        path: "M 100 300 L 150 100 L 300 50 L 400 150 L 350 350 L 200 400 Z",
        viewBox: "50 0 400 450"
    },
    'Hungaroring': {
        path: "M 200 50 C 350 50 400 200 300 200 C 200 200 250 350 150 350 C 50 350 0 200 100 200 C 150 200 50 50 200 50 Z",
        viewBox: "0 0 400 400"
    },
    'Circuit Zandvoort': {
        path: "M 200 50 C 300 50 350 100 350 150 C 350 250 250 250 250 300 C 250 350 150 350 150 300 C 150 250 50 250 50 150 C 50 100 100 50 200 50 Z",
        viewBox: "0 0 400 400"
    },
    'Autodromo Nazionale Monza': {
        path: "M 50 50 L 350 50 L 350 100 L 100 100 L 100 200 L 350 200 L 350 250 L 50 250 Q 50 150 150 150 L 50 50 Z",
        viewBox: "0 0 400 300"
    },
    'Baku City Circuit': {
        path: "M 50 50 L 400 50 L 400 100 L 150 100 L 150 150 L 100 150 L 100 300 L 400 300 L 400 350 L 50 350 Z",
        viewBox: "0 0 450 400"
    },
    'Marina Bay Street Circuit': {
        path: "M 50 100 L 150 100 L 150 50 L 250 50 L 250 100 L 350 100 L 350 200 L 300 200 L 300 250 L 100 250 L 100 200 L 50 200 Z",
        viewBox: "0 0 400 300"
    },
    'Circuit of the Americas': {
        path: "M 100 350 L 100 100 L 200 50 L 300 100 L 300 200 L 250 250 L 200 200 L 200 300 L 350 300 L 350 350 Z",
        viewBox: "0 0 400 400"
    },
    'Autódromo Hermanos Rodríguez': {
        path: "M 50 50 L 350 50 L 350 150 L 300 200 L 250 150 L 250 250 L 350 350 L 50 350 Z",
        viewBox: "0 0 400 400"
    },
    'Interlagos Circuit': {
        path: "M 300 50 L 100 50 L 50 100 L 150 200 L 100 250 L 250 350 L 350 300 L 300 150 Z",
        viewBox: "0 0 400 400"
    },
    'Las Vegas Strip Circuit': {
        path: "M 50 50 L 400 50 L 400 100 L 100 100 L 100 150 L 300 150 C 350 150 350 250 250 250 L 100 250 L 100 350 L 50 350 Z",
        viewBox: "0 0 450 400"
    },
    'Lusail International Circuit': {
        path: "M 50 50 L 350 50 L 350 250 L 300 300 C 250 350 150 350 100 300 L 50 250 Z",
        viewBox: "0 0 400 400"
    },
    'Yas Marina Circuit': {
        path: "M 50 50 L 350 50 L 350 100 C 250 100 250 150 300 150 L 350 150 L 350 250 L 100 250 L 100 200 C 150 200 150 150 100 150 L 100 100 L 50 100 Z",
        viewBox: "0 0 400 300"
    }
};
