import React from 'react';
import { DriverMarketEvent, InitialDriver, Car } from '../types';
// FIX: Corrected import path
import { getTeamColors } from '../constants';

interface DriverMarketSummaryScreenProps {
  season: number;
  log: DriverMarketEvent[];
  roster: InitialDriver[];
  carRatings: Car[];
  onProceed: () => void;
}

const EventCard: React.FC<{ event: DriverMarketEvent }> = ({ event }) => {
    let icon = '🔄';
    let color = 'border-gray-600';

    const renderContent = () => {
        switch (event.type) {
            case 'TRANSFER':
            case 'POACH':
                icon = '✈️';
                color = 'border-yellow-500';
                return `transfers from ${event.fromTeam} to ${event.toTeam}!`;
            case 'ROOKIE':
            case 'SIGNED':
            case 'LAST_MINUTE_DEAL':
                icon = '✍️';
                color = 'border-green-500';
                return `signs for ${event.toTeam}!`;
            case 'RETAINED':
                icon = '🤝';
                color = 'border-blue-500';
                return `re-signs with ${event.toTeam}.`;
            case 'DROPPED':
                icon = '👋';
                color = 'border-orange-500';
                return `is dropped by ${event.fromTeam} and becomes a free agent.`;
            case 'RETIRED':
                icon = '🏁';
                color = 'border-red-500';
                return `announces their retirement from the sport.`;
            default:
                return 'makes a move on the driver market.';
        }
    }
    
    return (
        <div className={`bg-gray-800 p-3 rounded-md border-l-4 ${color} flex items-center`}>
            <span className="text-xl mr-3">{icon}</span>
            <div>
                <p className="font-bold text-white">{event.driverName}</p>
                <p className="text-sm text-gray-300">{renderContent()}</p>
            </div>
        </div>
    );
};

const DriverMarketSummaryScreen: React.FC<DriverMarketSummaryScreenProps> = ({ season, log, roster, carRatings, onProceed }) => {
    const teams = carRatings.map(car => {
        const drivers = roster.filter(d => d.status === 'Active' && d.car.teamName === car.teamName);
        return { car, drivers };
    }).sort((a,b) => b.car.overallPace - a.car.overallPace);

    return (
        <div className="w-full max-w-7xl bg-gray-800 p-6 rounded-lg shadow-2xl flex flex-col items-center animate-fade-in">
            <h2 className="text-4xl font-bold mb-1 text-white tracking-widest">{season} OFF-SEASON</h2>
            <p className="text-lg text-gray-400 mb-4">Driver Market Summary</p>

            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Market Feed */}
                <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h3 className="text-2xl font-bold mb-4 text-white">Silly Season Wrap-Up</h3>
                    <div className="overflow-y-auto space-y-3" style={{ maxHeight: '60vh' }}>
                        {log.length > 0 ? (
                           [...log].reverse().map((event, i) => <EventCard key={i} event={event} />)
                       ) : (
                           <p className="text-gray-500 text-center mt-8">A quiet off-season with no major driver moves.</p>
                       )}
                    </div>
                </div>

                {/* Final Grid */}
                <div className="bg-gray-900/50 p-4 rounded-lg">
                     <h3 className="text-2xl font-bold mb-4 text-white">The {season + 1} Grid</h3>
                     <div className="overflow-y-auto space-y-2" style={{ maxHeight: '60vh' }}>
                        {teams.map(({car, drivers}) => {
                            const { teamHexColor } = getTeamColors(car.teamName);
                            return (
                                <div key={car.teamName} className="bg-gray-800 p-3 rounded-md border-l-4" style={{borderColor: teamHexColor}}>
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-lg text-white">{car.teamName}</h4>
                                        <p className="font-mono text-sm">Car Pace: <span className="font-bold">{car.overallPace}</span></p>
                                    </div>
                                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                        {drivers.map(d => (
                                            <p key={d.id} className="bg-gray-700/50 p-1 rounded-md text-center">{d.name}</p>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                     </div>
                </div>
            </div>

            <button
                onClick={onProceed}
                className="w-full max-w-md py-4 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
                Proceed to Regulation Changes
            </button>
        </div>
    );
};

export default DriverMarketSummaryScreen;
