import React from 'react';
import { Car, CarAttribute } from '../types';
import { getTeamColors } from '../constants';
import { F1CarIcon } from './IconComponents';

interface GarageScreenProps {
  cars: Car[];
  onClose: () => void;
}

const formatAttributeName = (attr: string) => {
    return attr.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

const getStatColor = (value: number) => {
    if (value >= 95) return 'bg-purple-500';
    if (value >= 90) return 'bg-green-500';
    if (value >= 85) return 'bg-teal-400';
    if (value >= 80) return 'bg-yellow-400';
    return 'bg-red-500';
};

const StatBar: React.FC<{ label: string; value: number; maxValue?: number }> = ({ label, value, maxValue = 100 }) => (
  <div>
    <div className="flex justify-between mb-0.5">
      <span className="text-xs font-medium text-gray-300">{label}</span>
      <span className="text-xs font-bold text-white">{value.toFixed(0)}</span>
    </div>
    <div className="w-full bg-gray-600 rounded-full h-1.5">
      <div className={`${getStatColor(value)} h-1.5 rounded-full`} style={{ width: `${(value / maxValue) * 100}%` }}></div>
    </div>
  </div>
);

const GarageScreen: React.FC<GarageScreenProps> = ({ cars, onClose }) => {
    const sortedCars = [...cars].sort((a, b) => b.overallPace - a.overallPace);
    const carAttributes: (keyof Omit<Car, 'teamName' | 'isLST'>)[] = ['overallPace', 'highSpeedCornering', 'mediumSpeedCornering', 'lowSpeedCornering', 'powerSensitivity', 'reliability', 'tyreWearFactor'];

    return (
        <div className="w-full max-w-7xl bg-gray-900/50 backdrop-blur-sm p-6 rounded-lg shadow-2xl flex flex-col items-center animate-fade-in">
            <div className="w-full flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-white tracking-widest">Garage</h2>
                <button
                    onClick={onClose}
                    className="py-2 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition duration-300"
                >
                    Back to Sim
                </button>
            </div>

            <div className="w-full overflow-y-auto" style={{ maxHeight: '80vh' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedCars.map(car => {
                    const { teamHexColor } = getTeamColors(car.teamName);
                    return (
                        <div key={car.teamName} className="bg-gray-800 rounded-lg p-4 border-t-4" style={{ borderColor: teamHexColor }}>
                            <h3 className="font-bold text-xl text-white mb-2">{car.teamName}</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1 flex items-center justify-center">
                                    <F1CarIcon color={teamHexColor} />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    {carAttributes.map(attr => (
                                        <StatBar key={attr} label={formatAttributeName(attr)} value={car[attr]} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
                </div>
            </div>
        </div>
    );
};

export default GarageScreen;