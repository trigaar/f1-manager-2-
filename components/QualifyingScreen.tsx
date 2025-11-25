import React, { useMemo } from 'react';
import { QualifyingResult, InitialDriver } from '../types';
import { getTeamColors } from '../constants';

interface QualifyingScreenProps {
  results: QualifyingResult[];
  drivers: InitialDriver[];
  onProceed: () => void;
  onQualifyingFinish: () => void;
  stage: 'Q1' | 'Q2' | 'Q3' | 'FINISHED';
}

const formatTime = (time: number | null) => {
  if (time === null) return '-';
  const minutes = Math.floor(time / 60);
  const seconds = (time % 60).toFixed(3).padStart(6, '0');
  return `${minutes}:${seconds}`;
};

const QualifyingScreen: React.FC<QualifyingScreenProps> = ({ results, drivers, onProceed, onQualifyingFinish, stage }) => {
  const driverMap = useMemo(() => 
    new Map(drivers.map(driver => [driver.id, driver])),
    [drivers]
  );
  const getDriverById = (id: number) => driverMap.get(id);

  const getRowClass = (res: QualifyingResult) => {
     if (res.eliminatedIn === 'Q1') return 'bg-gray-800/50 opacity-50';
     if (res.eliminatedIn === 'Q2') return 'bg-gray-800/50 opacity-50';
     return 'bg-gray-800/80';
  };

  const renderActionButton = () => {
    const buttonClass = "py-3 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md";
    switch (stage) {
      case 'Q1': return <button onClick={onProceed} className={buttonClass}>Proceed to Q2</button>;
      case 'Q2': return <button onClick={onProceed} className={buttonClass}>Proceed to Q3</button>;
      case 'Q3': return <button onClick={onProceed} className={buttonClass}>View Final Grid</button>;
      case 'FINISHED': return <button onClick={onQualifyingFinish} className={buttonClass}>Go to Race</button>;
      default: return null;
    }
  };

  let displayedResults: QualifyingResult[] = [];
  let sessionTitle = '';
  
  const allResultsSorted = [...results].sort((a,b) => a.finalPosition - b.finalPosition);

  switch (stage) {
    case 'Q1':
      displayedResults = [...results].sort((a, b) => a.q1Time - b.q1Time);
      sessionTitle = 'Qualifying 1 Results';
      break;
    case 'Q2':
      displayedResults = allResultsSorted.filter(r => r.eliminatedIn !== 'Q1').sort((a, b) => (a.q2Time || 999) - (b.q2Time || 999))
        .concat(allResultsSorted.filter(r => r.eliminatedIn === 'Q1'));
      sessionTitle = 'Qualifying 2 Results';
      break;
    case 'Q3':
       displayedResults = allResultsSorted.filter(r => !r.eliminatedIn).sort((a, b) => (a.q3Time || 999) - (b.q3Time || 999))
        .concat(allResultsSorted.filter(r => r.eliminatedIn === 'Q2'))
        .concat(allResultsSorted.filter(r => r.eliminatedIn === 'Q1'));
      sessionTitle = 'Qualifying 3 Results';
      break;
    case 'FINISHED':
      displayedResults = allResultsSorted;
      sessionTitle = 'Final Starting Grid';
      break;
  }

  const highlightClass = (res: QualifyingResult, index: number): string => {
      if (stage === 'Q1' && index >= 15) return 'bg-red-900/60';
      if (stage === 'Q2' && res.eliminatedIn === 'Q2') return 'bg-red-900/60';
      return '';
  }


  return (
    <div className="w-full max-w-4xl bg-gray-900/50 backdrop-blur-sm p-6 rounded-lg shadow-2xl flex flex-col items-center animate-fade-in">
        <div className="w-full text-center mb-6">
            {renderActionButton()}
        </div>

        <div className="w-full flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-white tracking-widest">{sessionTitle}</h2>
        </div>

        <div className="w-full bg-gray-800/50 rounded-lg overflow-hidden shadow-lg mb-6">
            <div className="overflow-y-auto" style={{ maxHeight: '65vh' }}>
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900/80 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Pos</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Driver</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">Q1 Time</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">Q2 Time</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">Q3 Time</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {displayedResults.map((res, index) => {
                            const driver = getDriverById(res.driverId);
                            if(!driver) return null;
                            const { teamHexColor } = getTeamColors(driver.car.teamName);
                            const pos = stage === 'FINISHED' ? res.finalPosition : index + 1;
                            return (
                                <tr key={res.driverId} className={`${getRowClass(res)} ${highlightClass(res, index)}`}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-white">{pos}</td>
                                    <td className="px-6 py-2 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={`w-1 h-5 mr-3`} style={{ backgroundColor: teamHexColor }}></div>
                                            <div className="text-sm font-medium text-white">{driver.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-center font-mono text-sm">{formatTime(res.q1Time)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-center font-mono text-sm">{formatTime(res.q2Time)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-center font-mono text-sm">{formatTime(res.q3Time)}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default QualifyingScreen;
