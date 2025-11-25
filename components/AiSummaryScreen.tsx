import React from 'react';
import { AiRaceSummary } from '../types';
import { getTeamColors } from '../constants';

interface AiSummaryScreenProps {
  summary: AiRaceSummary | null;
  isLastRace: boolean;
  onProceed: () => void;
}

const AiSummaryScreen: React.FC<AiSummaryScreenProps> = ({ summary, isLastRace, onProceed }) => {
  if (!summary) {
    return (
      <div className="w-full max-w-6xl text-center">
        <h2 className="text-2xl font-bold text-white">Generating AI Race Report...</h2>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl bg-gray-800 p-6 rounded-lg shadow-2xl flex flex-col items-center animate-fade-in">
        <h1 className="text-4xl font-bold mb-2 text-red-500 tracking-wider text-center">{summary.headline}</h1>
        <p className="text-lg text-gray-400 mb-4 text-center">AI-Generated Race Analysis</p>
        
        <div className="w-full max-w-5xl bg-gray-900/30 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold text-white mb-2 text-center">Race Summary</h3>
            <p className="text-lg text-gray-300 leading-relaxed text-center italic">{summary.raceSummary}</p>
        </div>
        
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left Column (Social Feed) */}
            <div className="lg:col-span-2 bg-gray-900/50 p-4 rounded-lg flex flex-col">
                 <h3 className="text-xl font-bold mb-3 text-white">Paddock Chatter</h3>
                 <div className="overflow-y-auto flex-grow space-y-3" style={{ maxHeight: '50vh' }}>
                    {summary.commentary.map((comment, index) => {
                       const { teamHexColor } = getTeamColors(comment.team);
                       const displayName = comment.persona.match(/\(([^)]+)\)/)?.[1] || comment.persona;
                       return (
                           <div key={index} className="bg-gray-800 rounded-lg p-3 border-l-4" style={{ borderColor: teamHexColor }}>
                                <div className="flex items-center mb-1">
                                    <p className="font-bold text-sm text-white">{displayName}</p>
                                    <p className="ml-2 text-xs text-gray-400">{comment.handle}</p>
                                </div>
                                <p className="text-sm text-gray-200">{comment.text}</p>
                           </div>
                       );
                    })}
                 </div>
            </div>
             {/* Right Column */}
            <div className="lg:col-span-1 bg-gray-900/50 p-4 rounded-lg space-y-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-xs text-yellow-400 font-bold uppercase">Driver of the Day</h3>
                    <p className="text-2xl font-bold text-white">{summary.driverOfTheDay.name}</p>
                    <p className="text-sm text-gray-300">{summary.driverOfTheDay.reason}</p>
                </div>
                 <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-xs text-green-400 font-bold uppercase">Move of the Day</h3>
                    <p className="text-xl font-bold text-white">{summary.moveOfTheDay.driver}</p>
                    <p className="text-sm text-gray-300">{summary.moveOfTheDay.description}</p>
                </div>
            </div>
        </div>

        <button
            onClick={onProceed}
            className="w-full max-w-md py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
        >
            {isLastRace ? 'Proceed to Off-Season' : 'Proceed to Next Race'}
        </button>
    </div>
  );
};

export default AiSummaryScreen;