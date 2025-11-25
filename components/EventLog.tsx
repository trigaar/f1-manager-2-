
import React from 'react';

interface EventLogProps {
  log: string[];
}

const EventLog: React.FC<EventLogProps> = ({ log }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg flex-grow flex flex-col h-48">
      <div className="p-2 bg-gray-700 rounded-t-lg">
        <h3 className="text-md font-bold text-white">Event Log</h3>
      </div>
      <div className="p-2 flex-grow overflow-hidden">
        <div className="h-full bg-gray-900/50 rounded-md p-2 overflow-y-auto flex flex-col-reverse">
            <ul className="space-y-1">
                {log.map((entry, index) => (
                    <li key={index} className="text-xs text-gray-300 font-mono break-words">
                        {entry}
                    </li>
                ))}
            </ul>
        </div>
      </div>
    </div>
  );
};

export default EventLog;