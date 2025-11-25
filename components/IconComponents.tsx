import React from 'react';

export const TyreSoftIcon: React.FC = () => (
    <div className="w-5 h-5 rounded-full bg-red-600 border-2 border-red-400" title="Soft"></div>
);

export const TyreMediumIcon: React.FC = () => (
    <div className="w-5 h-5 rounded-full bg-yellow-400 border-2 border-yellow-200" title="Medium"></div>
);

export const TyreHardIcon: React.FC = () => (
    <div className="w-5 h-5 rounded-full bg-gray-200 border-2 border-gray-400" title="Hard"></div>
);

export const TyreIntermediateIcon: React.FC = () => (
    <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-green-300" title="Intermediate"></div>
);

export const TyreWetIcon: React.FC = () => (
    <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-blue-300" title="Wet"></div>
);

export const SunIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" className="text-yellow-400" fill="currentColor"></circle>
        <line x1="12" y1="1" x2="12" y2="3" className="text-yellow-400" stroke="currentColor"></line>
        <line x1="12" y1="21" x2="12" y2="23" className="text-yellow-400" stroke="currentColor"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" className="text-yellow-400" stroke="currentColor"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" className="text-yellow-400" stroke="currentColor"></line>
        <line x1="1" y1="12" x2="3" y2="12" className="text-yellow-400" stroke="currentColor"></line>
        <line x1="21" y1="12" x2="23" y2="12" className="text-yellow-400" stroke="currentColor"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" className="text-yellow-400" stroke="currentColor"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" className="text-yellow-400" stroke="currentColor"></line>
    </svg>
);

export const CloudIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" className="text-gray-400" fill="currentColor"></path>
    </svg>
);

export const LightRainIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" className="text-gray-400" fill="currentColor" stroke="none"></path>
        <path d="M12 15v6" className="text-blue-400"></path>
        <path d="M16 15v6" className="text-blue-400"></path>
        <path d="M8 15v6" className="text-blue-400"></path>
    </svg>
);

export const HeavyRainIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" className="text-gray-500" fill="currentColor" stroke="none"></path>
        <path d="M12 14v6" className="text-blue-300"></path>
        <path d="M16 14v6" className="text-blue-300"></path>
        <path d="M8 14v6" className="text-blue-300"></path>
        <path d="M10 15v6" className="text-blue-300"></path>
        <path d="M14 15v6" className="text-blue-300"></path>
    </svg>
);

export const ExtremeRainIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" className="text-gray-600" fill="currentColor" stroke="none"></path>
        <path d="M12 13v8" className="text-blue-200"></path>
        <path d="M16 13v8" className="text-blue-200"></path>
        <path d="M8 13v8" className="text-blue-200"></path>
        <path d="M10 14v8" className="text-blue-200"></path>
        <path d="M14 14v8" className="text-blue-200"></path>
        <path d="M18 14v8" className="text-blue-200"></path>
    </svg>
);

export const UpArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.03 9.83a.75.75 0 01-1.06-1.06l5.5-5.5a.75.75 0 011.06 0l5.5 5.5a.75.75 0 01-1.06 1.06L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
    </svg>
);

export const DownArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l4.22-4.22a.75.75 0 111.06 1.06l-5.5 5.5a.75.75 0 01-1.06 0l-5.5-5.5a.75.75 0 111.06-1.06L9.25 14.388V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
    </svg>
);

export const F1CarIcon: React.FC<{ color: string, className?: string }> = ({ color, className = "w-full h-auto" }) => (
    <svg viewBox="0 0 512 512" className={className} fill={color} xmlns="http://www.w3.org/2000/svg">
        <path d="M116.3 331.7c-2.3-2.3-3.1-5.6-2.1-8.5l19.5-62.1-39.3-15.7c-3.5-1.4-6.2-4.2-7.5-7.8l-15-45.1c-1.3-4.1.2-8.5 3.5-11.2L128 128l7.6-22.9c1.9-5.7 7.7-9.2 13.6-8.2l45.1 7.5c3.5.6 6.5 2.7 8.5 5.6l22.9 33.6L248 128l97.4-48.7c3.8-1.9 8.3-1.4 11.6.9l45.1 30.1c3.3 2.2 5.2 6 4.9 9.8l-7.5 52.6c-.3 2.3-1.4 4.4-3.2 6l-33.6 31.5L432 248l48.7 97.4c1.9 3.8 1.4 8.3-.9 11.6L450 402.1c-2.2 3.3-6 5.2-9.8 4.9l-52.6-7.5c-2.3-.3-4.4-1.4-6-3.2l-31.5-33.6L296 432l-52.6 7.5c-3.8.5-7.6-1.4-9.8-4.9l-30.1-45.1c-2.3-3.3-2.7-7.6-1.2-11.3l15-39.3-62-19.5c-2.9-1-6.2-1.8-8.5-4.1zM288 224a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-88 56a24 24 0 1 0 0-48 24 24 0 1 0 0 48z"/>
    </svg>
);
