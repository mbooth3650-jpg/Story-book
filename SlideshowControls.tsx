/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SlideshowSpeedMode } from './types';

interface SlideshowControlsProps {
    isActive: boolean;
    isPaused: boolean;
    speedMode: SlideshowSpeedMode;
    secondsRemaining: number;
    totalDuration: number;
    currentSheetIndex: number;
    totalSheets: number;
    isWaitingForGeneration: boolean;
    isWaitingForChoice: boolean;
    onTogglePlayPause: () => void;
    onSpeedChange: (mode: SlideshowSpeedMode) => void;
    onPrev: () => void;
    onNext: () => void;
    onClose: () => void;
}

export const SlideshowControls: React.FC<SlideshowControlsProps> = ({
    isActive,
    isPaused,
    speedMode,
    secondsRemaining,
    totalDuration,
    currentSheetIndex,
    totalSheets,
    isWaitingForGeneration,
    isWaitingForChoice,
    onTogglePlayPause,
    onSpeedChange,
    onPrev,
    onNext,
    onClose
}) => {
    if (!isActive) return null;

    const progressPercent = totalDuration > 0 
        ? Math.max(0, Math.min(100, ((totalDuration - secondsRemaining) / totalDuration) * 100))
        : 0;

    const getSheetLabel = (sheetIdx: number) => {
        if (sheetIdx === 0) return "표지";
        if (sheetIdx === 1) return "제 1-2 쪽";
        if (sheetIdx === 2) return "제 3-4 쪽";
        if (sheetIdx === 3) return "제 5-6 쪽";
        if (sheetIdx === 4) return "제 7-8 쪽";
        if (sheetIdx === 5) return "제 9-10 쪽";
        return "뒷표지";
    };

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[140] w-full max-w-xl px-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-[#1E1E24]/95 backdrop-blur-2xl text-[#FAF9F6] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 shadow-2xl border border-stone-700/60 flex flex-col gap-3">
                {/* Top Row: Play/Pause, Status, Progress, and Controls */}
                <div className="flex items-center justify-between gap-3">
                    {/* Left: Play/Pause and navigation */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                            onClick={onPrev}
                            disabled={currentSheetIndex === 0}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs text-stone-200 transition-colors"
                            title="이전 쪽"
                        >
                            ◀
                        </button>

                        <button
                            onClick={onTogglePlayPause}
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base font-bold shadow-lg transition-all ${
                                isPaused
                                    ? 'bg-[#E8636F] hover:bg-[#D94F5C] text-white hover:scale-105 active:scale-95'
                                    : 'bg-[#D94F5C] hover:bg-[#E8636F] text-white hover:scale-105 active:scale-95'
                            }`}
                            title={isPaused ? "연속 읽기 시작" : "일시 정지"}
                        >
                            {isPaused ? "▶" : "⏸"}
                        </button>

                        <button
                            onClick={onNext}
                            disabled={currentSheetIndex >= totalSheets}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs text-stone-200 transition-colors"
                            title="다음 쪽"
                        >
                            ▶
                        </button>
                    </div>

                    {/* Middle: Current page & countdown status */}
                    <div className="flex-1 flex flex-col items-center text-center px-1">
                        <div className="flex items-center gap-1.5">
                            <span className="font-serif-kr text-xs sm:text-sm font-bold text-stone-100 tracking-tight">
                                {getSheetLabel(currentSheetIndex)}
                            </span>
                            <span className="text-[10px] text-stone-400 font-medium">
                                ({currentSheetIndex + 1}/{totalSheets + 1})
                            </span>
                        </div>

                        <div className="text-[11px] font-medium text-stone-300 flex items-center gap-1.5">
                            {isWaitingForChoice ? (
                                <span className="text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                                    <span>⚠️</span> <span>선택 대기 (자동 일시 정지)</span>
                                </span>
                            ) : isWaitingForGeneration ? (
                                <span className="text-[#E8A0A7] font-bold flex items-center gap-1 animate-pulse">
                                    <span>🎨</span> <span>다음 삽화 집필 중...</span>
                                </span>
                            ) : isPaused ? (
                                <span className="text-stone-400 font-medium">정온하게 일시 정지됨</span>
                            ) : (
                                <span className="text-[#E8636F] font-semibold flex items-center gap-1">
                                    <span>⏱️</span>
                                    <span>{Math.ceil(secondsRemaining)}초 후 자동 넘김</span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right: Close button */}
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#E8636F] text-stone-300 hover:text-white flex items-center justify-center text-xs font-bold transition-colors"
                        title="슬라이드쇼 종료"
                    >
                        ✕
                    </button>
                </div>

                {/* Horizontal Progress Bar */}
                <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-200 ease-linear rounded-full ${
                            isWaitingForChoice
                                ? 'bg-amber-400'
                                : isWaitingForGeneration
                                ? 'bg-[#E8A0A7] animate-pulse'
                                : isPaused
                                ? 'bg-stone-600'
                                : 'bg-[#E8636F]'
                        }`}
                        style={{ width: `${isPaused ? progressPercent : progressPercent}%` }}
                    />
                </div>

                {/* Bottom Row: Speed Mode Preset Selector */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-800 text-[11px]">
                    <span className="text-stone-400 font-medium text-[10px] hidden xs:inline font-serif-kr">
                        독서 템포:
                    </span>

                    <div className="flex items-center gap-1 bg-stone-900/80 p-1 rounded-xl w-full xs:w-auto justify-between xs:justify-start border border-stone-800">
                        <button
                            onClick={() => onSpeedChange('fast')}
                            className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all ${
                                speedMode === 'fast'
                                    ? 'bg-[#E8636F] text-white shadow-xs'
                                    : 'text-stone-400 hover:text-stone-200'
                            }`}
                            title="페이지당 5초"
                        >
                            속독 (5초)
                        </button>

                        <button
                            onClick={() => onSpeedChange('normal')}
                            className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all ${
                                speedMode === 'normal'
                                    ? 'bg-[#E8636F] text-white shadow-xs'
                                    : 'text-stone-400 hover:text-stone-200'
                            }`}
                            title="페이지당 9초"
                        >
                            보통 (9초)
                        </button>

                        <button
                            onClick={() => onSpeedChange('relaxed')}
                            className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all ${
                                speedMode === 'relaxed'
                                    ? 'bg-[#E8636F] text-white shadow-xs'
                                    : 'text-stone-400 hover:text-stone-200'
                            }`}
                            title="페이지당 14초"
                        >
                            정독 (14초)
                        </button>

                        <button
                            onClick={() => onSpeedChange('smart')}
                            className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all flex items-center gap-1 ${
                                speedMode === 'smart'
                                    ? 'bg-[#E8636F] text-white shadow-xs'
                                    : 'text-stone-400 hover:text-stone-200'
                            }`}
                            title="문장과 대사 분량에 따른 지능형 독서 호흡 조절"
                        >
                            <span>서재 지능형</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
