import React, { useRef, useEffect, useState } from 'react';
import { Driver, Track } from '../types';
import { TRACK_SVGS } from '../constants';

interface TrackDisplayProps {
  drivers: Driver[];
  track: Track;
  simSpeed: number;
}

const TrackDisplay: React.FC<TrackDisplayProps> = ({ drivers, track, simSpeed }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  const trackData = TRACK_SVGS[track.name] || TRACK_SVGS['Albert Park'];
  const { path: trackPath, viewBox } = trackData;
  const baseLapTime = track.baseLapTime;

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);
    }
  }, [trackPath]);

  const getCarPosition = (progress: number) => {
    if (!pathRef.current || !pathLength) {
      return { x: 0, y: 0 };
    }
    const adjustedProgress = (progress % 1 + 1) % 1; // Ensure progress is always between 0 and 1
    const point = pathRef.current.getPointAtLength(adjustedProgress * pathLength);
    return { x: point.x, y: point.y };
  };
  
  // Simple lap progress based on time
  const [lapProgress, setLapProgress] = useState(0);

  useEffect(() => {
    const animate = () => {
      setLapProgress(prev => (prev + 0.0005 * simSpeed) % 1); // Animation speed now linked to simSpeed
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [simSpeed]);


  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 flex justify-center items-center relative aspect-video">
      <h3 className="absolute top-2 left-4 text-lg font-bold text-white" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.7)'}}>{track.name}</h3>
      <div className="w-full h-full flex items-center justify-center">
          <svg viewBox={viewBox} width="100%" height="100%" style={{ maxHeight: '100%', maxWidth: '100%' }}>
            <path
              d={trackPath}
              fill="none"
              stroke="#4a5568"
              strokeWidth="15"
            />
            <path
              ref={pathRef}
              d={trackPath}
              fill="none"
              stroke="transparent"
              strokeWidth="1"
            />
            {drivers.map((driver) => {
              const driverProgress = lapProgress - (baseLapTime > 0 ? driver.gapToLeader / baseLapTime : 0);
              const { x, y } = getCarPosition(driverProgress);
              
              return (
                 driver.raceStatus === 'Racing' &&
                <g key={driver.id} transform={`translate(${x}, ${y})`}>
                  <circle
                    r="7"
                    fill={driver.teamHexColor}
                    stroke="#FFF"
                    strokeWidth="1.5"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="bold"
                    fill={driver.teamColor.includes('text-black') ? '#000' : '#FFF'}
                  >
                    {driver.shortName[0]}
                  </text>
                </g>
              );
            })}
          </svg>
      </div>
    </div>
  );
};

export default TrackDisplay;
