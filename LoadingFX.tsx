/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface LoadingFXProps {
    progress?: number;
    status?: string;
    pageIndex?: number;
}

export const LoadingFX: React.FC<LoadingFXProps> = ({ progress, status, pageIndex }) => {
    const displayStatus = status || (pageIndex !== undefined ? `제 ${pageIndex} 페이지 렌더링 중...` : "페이지 생성 중...");

    return (
        <div className="w-full h-full bg-slate-50/50 overflow-hidden relative flex flex-col items-center justify-center p-6 select-none">
            {/* Ambient Apple Glow Orb */}
            <div className="absolute w-48 h-48 bg-blue-500/10 rounded-full blur-2xl animate-pulse -z-10"></div>
            
            <div className="glass-card-subtle px-6 py-4 rounded-2xl flex flex-col items-center gap-3 max-w-[85%] shadow-md">
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 font-semibold tracking-tight">{displayStatus}</p>
                </div>
                
                {progress !== undefined && (
                    <div className="w-40 h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-600 transition-all duration-300 rounded-full" 
                            style={{ width: `${Math.min(Math.max(progress, 5), 100)}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
