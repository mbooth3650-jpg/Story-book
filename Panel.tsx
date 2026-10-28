/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { ComicFace, GATE_PAGE, MoralChoiceRecord } from './types';
import { LoadingFX } from './LoadingFX';
import { MoralChart } from './MoralChart';

interface PanelProps {
    face?: ComicFace;
    allFaces: ComicFace[]; // Needed for cover "printing" status
    onChoice: (pageIndex: number, choice: string) => void;
    onOpenBook: () => void;
    onDownload: () => void;
    onReset: () => void;
    onOpenDossier?: () => void;
    onOpenMoralChart?: () => void;
    onOpenScrapbook?: () => void;
    onToggleBookmark?: (pageIndex: number, panelIndex: number, panel: any) => void;
    isBookmarked?: (pageIndex: number, panelIndex: number) => boolean;
    bookmarkedCount?: number;
    moralHistory?: MoralChoiceRecord[];
    darknessLevel?: number;
    comicTitle?: string;
    heroName?: string;
}

export const Panel: React.FC<PanelProps> = ({ 
    face, 
    allFaces, 
    onChoice, 
    onOpenBook, 
    onDownload, 
    onReset, 
    onOpenDossier,
    onOpenMoralChart,
    onOpenScrapbook,
    onToggleBookmark,
    isBookmarked,
    bookmarkedCount,
    moralHistory = [],
    darknessLevel = 0,
    comicTitle = "무한한 영웅들",
    heroName = "주인공"
}) => {

    if (!face) {
        return (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center p-4">
                <LoadingFX status="페이지 준비 중..." />
            </div>
        );
    }
    
    const isFullBleed = face.type === 'cover' || face.type === 'back_cover';
    const hasPanels = face.panels && face.panels.length > 0 && face.panels.some(p => p.imageUrl);

    if (face.isLoading && !hasPanels) {
        return (
            <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
                <LoadingFX progress={face.loadingProgress} status={face.loadingStatus || (face.type === 'cover' ? '표지 생성 중...' : `제 ${face.pageIndex} 페이지 생성 중...`)} pageIndex={face.pageIndex} />
            </div>
        );
    }

    const renderPanel = (panel: any, index: number, total: number) => {
        const bookmarked = isBookmarked ? isBookmarked(face.pageIndex ?? 0, index) : false;

        return (
            <div key={index} className="relative flex-1 overflow-hidden bg-slate-100 flex items-center justify-center border-b border-slate-200/80 last:border-b-0 group/panel">
                {panel.imageUrl ? (
                    <img src={panel.imageUrl} alt={`패널 ${index + 1}`} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                        <LoadingFX progress={face.loadingProgress} status={face.loadingStatus || `패널 ${index + 1} 그리는 중...`} />
                    </div>
                )}

                {/* Bookmark / Favorite Panel Button */}
                {panel.imageUrl && onToggleBookmark && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleBookmark(face.pageIndex ?? 0, index, panel);
                        }}
                        className={`absolute top-2.5 right-2.5 z-20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all duration-200 shadow-sm backdrop-blur-md cursor-pointer ${
                            bookmarked
                                ? 'bg-[#E8636F] text-white font-bold scale-105 ring-2 ring-white/90 shadow-[#E8636F]/30'
                                : 'bg-stone-900/60 hover:bg-stone-900/90 text-white/90 hover:text-white opacity-0 group-hover/panel:opacity-100 hover:scale-105'
                        }`}
                        title={bookmarked ? "스크랩북에서 제외하기" : "서재온 스크랩북에 이 컷 보관하기"}
                    >
                        <span className="text-xs">{bookmarked ? '🔖' : '☆'}</span>
                        <span className="text-[10px] font-bold">
                            {bookmarked ? '보관됨' : '책갈피'}
                        </span>
                    </button>
                )}
                
                {/* Kinfolk & Editorial Narrative Overlays */}
                {panel.narrative && (
                    <div className="absolute inset-0 p-3 sm:p-4 pointer-events-none flex flex-col justify-between z-10">
                        {panel.narrative.caption && (
                            <div className="bg-[#FAF9F6]/95 backdrop-blur-md border border-stone-200/90 rounded-xl px-3.5 py-2.5 shadow-xs max-w-[88%] self-start">
                                <p className="font-serif-kr text-stone-900 text-xs sm:text-[13px] leading-relaxed font-medium">{panel.narrative.caption}</p>
                            </div>
                        )}

                        {panel.narrative.dialogue && (
                            <div className="bg-[#1C1917]/92 backdrop-blur-md text-stone-100 border border-stone-700/60 rounded-2xl px-4 py-2.5 shadow-md max-w-[90%] self-end mt-auto relative">
                                <p className="font-serif-kr text-xs sm:text-[13px] leading-relaxed font-medium">"{panel.narrative.dialogue}"</p>
                                <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-[#1C1917]/92 border-b border-r border-stone-700/60 rotate-45"></div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`panel-container relative group flex flex-col h-full bg-white ${isFullBleed ? '!p-0' : 'p-3'}`}>
            {isFullBleed ? (
                <div className="w-full h-full relative bg-stone-100 flex items-center justify-center overflow-hidden group/cover">
                    {face.panels?.[0]?.imageUrl ? (
                        <>
                            <img src={face.panels[0].imageUrl} alt="만화 표지" className="w-full h-full object-cover" />
                            {onToggleBookmark && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleBookmark(face.pageIndex ?? 0, 0, face.panels![0]);
                                    }}
                                    className={`absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-200 shadow-md backdrop-blur-md cursor-pointer ${
                                        isBookmarked?.(face.pageIndex ?? 0, 0)
                                            ? 'bg-[#E8636F] text-white font-bold scale-105 ring-2 ring-white/90 shadow-[#E8636F]/30'
                                            : 'bg-stone-900/60 hover:bg-stone-900/90 text-white/90 hover:text-white opacity-0 group-hover/cover:opacity-100 hover:scale-105'
                                    }`}
                                    title="표지 패널 스크랩북 보관"
                                >
                                    <span className="text-xs">{isBookmarked?.(face.pageIndex ?? 0, 0) ? '🔖' : '☆'}</span>
                                    <span className="text-xs font-bold">
                                        {isBookmarked?.(face.pageIndex ?? 0, 0) ? '보관됨' : '책갈피'}
                                    </span>
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full bg-stone-50 flex items-center justify-center">
                            <LoadingFX progress={face.loadingProgress} status={face.loadingStatus || (face.type === 'cover' ? '표지 제작 중...' : '뒷표지 제작 중...')} pageIndex={face.pageIndex} />
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-2xs relative">
                    {face.panels && face.panels.length > 0 ? (
                        face.panels.map((p, i) => renderPanel(p, i, face.panels!.length))
                    ) : (
                        <div className="flex-1 bg-slate-50 flex items-center justify-center">
                            <LoadingFX progress={face.loadingProgress} status={face.loadingStatus || `제 ${face.pageIndex} 페이지 준비 중...`} pageIndex={face.pageIndex} />
                        </div>
                    )}
                </div>
            )}

            {/* Apple Action Sheet Decision Overlay */}
            {face.isDecisionPage && face.choices && face.choices.length > 0 && (
                <div className={`absolute bottom-0 inset-x-0 p-6 pb-12 flex flex-col gap-3 items-center justify-end transition-opacity duration-500 ${face.resolvedChoice ? 'opacity-0 pointer-events-none' : 'opacity-100'} bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20`}>
                    <div className="bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/30 text-white text-xs font-semibold uppercase tracking-wider mb-1">
                        스토리 분기 선택
                    </div>
                    <p className="text-white text-xl sm:text-2xl font-bold tracking-tight mb-2 drop-shadow-md text-center">다음 행동을 선택하세요</p>
                    {face.choices.map((choice, i) => (
                        <button 
                            key={i} 
                            onClick={(e) => { e.stopPropagation(); if(face.pageIndex !== undefined) onChoice(face.pageIndex, choice); }}
                            className={`btn-apple w-full text-sm sm:text-base py-3 px-5 shadow-lg ${i === 0 ? 'btn-apple-primary' : 'btn-apple-glass'}`}
                        >
                            {choice}
                        </button>
                    ))}
                </div>
            )}

            {/* PAGE 1 (도서 첫 장): Top Action Badges */}
            {face.pageIndex === 1 && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                    {onOpenMoralChart && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenMoralChart();
                            }}
                            className="btn-apple btn-apple-glass text-xs font-semibold py-1.5 px-3 shadow-2xs flex items-center gap-1.5 bg-white/95 border-stone-200"
                            title="이야기의 빛과 어둠 도덕적 선택 궤적 차트 열기"
                        >
                            <span>📊</span>
                            <span>서사 궤적</span>
                            <span className={`w-2 h-2 rounded-full ${darknessLevel < 0 ? 'bg-amber-500' : darknessLevel > 0 ? 'bg-[#E8636F]' : 'bg-stone-400'}`} />
                        </button>
                    )}

                    {onOpenDossier && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenDossier();
                            }}
                            className="btn-apple btn-apple-glass text-xs font-semibold py-1.5 px-3 shadow-2xs flex items-center gap-1.5 bg-white/95 border-stone-200"
                            title="등장인물 프로필 카드 열기"
                        >
                            <span>👥</span>
                            <span>인물 도감</span>
                        </button>
                    )}

                    {onOpenScrapbook && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenScrapbook();
                            }}
                            className="btn-apple btn-apple-glass text-xs font-semibold py-1.5 px-3 shadow-2xs flex items-center gap-1.5 bg-white/95 border-stone-200 hover:bg-stone-50"
                            title="보관한 패널 스크랩북 열기"
                        >
                            <span>🔖</span>
                            <span>스크랩북</span>
                            {bookmarkedCount !== undefined && bookmarkedCount > 0 && (
                                <span className="bg-[#E8636F]/10 text-[#E8636F] text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-[#E8636F]/20">
                                    {bookmarkedCount}
                                </span>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* Cover Action */}
            {face.type === 'cover' && (
                 <div className="absolute bottom-16 inset-x-0 flex justify-center z-20 px-6">
                     <button 
                         onClick={(e) => { e.stopPropagation(); onOpenBook(); }}
                         disabled={!allFaces.find(f => f.pageIndex === 0)?.panels?.[0]?.imageUrl && !allFaces.find(f => f.pageIndex === GATE_PAGE)?.panels?.every(p => p.imageUrl)}
                         className="btn-apple btn-apple-primary w-full max-w-xs py-3.5 text-base sm:text-lg font-bold shadow-md disabled:opacity-50 disabled:cursor-wait"
                     >
                         {(!allFaces.find(f => f.pageIndex === 0)?.panels?.[0]?.imageUrl && !allFaces.find(f => f.pageIndex === GATE_PAGE)?.panels?.every(p => p.imageUrl)) ? (
                             <span className="flex items-center justify-center gap-2.5">
                                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                 </svg>
                                 도서 표지 제본 중...
                             </span>
                         ) : '📖 서재 열람하기 (제1화)'}
                     </button>
                 </div>
            )}

            {/* Back Cover Actions */}
            {face.type === 'back_cover' && (
                <div className="absolute bottom-20 inset-x-0 flex flex-col items-center gap-3 px-8 z-20">
                    <button onClick={(e) => { e.stopPropagation(); onDownload(); }} className="btn-apple btn-apple-primary w-full text-sm sm:text-base py-3 shadow-sm font-bold">
                        📥 도서 PDF 소장하기
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onReset(); }} className="btn-apple btn-apple-glass w-full text-sm sm:text-base py-3 shadow-2xs font-semibold">
                        ✨ 새로운 이야기 집필하기
                    </button>
                </div>
            )}
        </div>
    );
};
