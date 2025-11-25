import React from 'react';
import { AiSeasonReview } from '../types';
import { getTeamColors } from '../constants';

interface AiSeasonReviewScreenProps {
  review: AiSeasonReview | null;
  season: number;
  onProceed: () => void;
}

const QuoteIcon: React.FC = () => (
    <svg className="w-8 h-8 text-gray-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 14">
        <path d="M6 0H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3H2a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3h-1a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Z"/>
    </svg>
);


const AiSeasonReviewScreen: React.FC<AiSeasonReviewScreenProps> = ({ review, season, onProceed }) => {
  if (!review) {
    return (
      <div className="w-full max-w-6xl text-center">
        <h2 className="text-2xl font-bold text-white">Generating AI Season Review...</h2>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-lg shadow-2xl flex flex-col items-center animate-fade-in border border-gray-700">
        <h2 className="text-4xl font-bold mb-1 text-white tracking-widest">{season} SEASON IN REVIEW</h2>
        <p className="text-lg text-gray-400 mb-6 text-center">AI-Generated Analysis</p>
        
        <div className="w-full bg-gray-800/50 p-6 rounded-lg mb-6">
            <h1 className="text-4xl font-bold mb-4 text-red-500 tracking-wider text-center" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>{review.headline}</h1>
            <p className="text-gray-300 leading-relaxed italic text-center mb-6 max-w-3xl mx-auto">{review.summary}</p>

            <div className="border-t border-gray-700 pt-4">
                 <h3 className="text-xl font-bold mb-3 text-white text-center">Paddock Verdict</h3>
                 <div className="space-y-4">
                    {review.principalQuotes.map((item, index) => {
                       const { teamHexColor } = getTeamColors(item.teamName);
                       return (
                           <div key={index} className="bg-gray-900/70 rounded-lg p-4 border-l-4 relative" style={{ borderColor: teamHexColor }}>
                                <div className="absolute top-2 right-2 opacity-10">
                                    <QuoteIcon />
                                </div>
                                <p className="font-bold text-lg text-white">{item.principalName}</p>
                                <p className="text-xs text-gray-400 mb-2">{item.teamName}</p>
                                <blockquote className="text-gray-200 text-sm">
                                    "{item.quote}"
                                </blockquote>
                           </div>
                       );
                    })}
                 </div>
            </div>
        </div>


        <button
            onClick={onProceed}
            className="w-full max-w-md py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
        >
            Proceed to Off-Season
        </button>
    </div>
  );
};

export default AiSeasonReviewScreen;
