/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Persona } from './types';

interface CharacterDossierProps {
    isOpen: boolean;
    onClose: () => void;
    hero: Persona | null;
    coStars: Persona[];
    extrasDesc?: string;
    comicTitle?: string;
    selectedGenre?: string;
    selectedArtStyle?: string;
    storyTone?: string;
    onLaunchStory?: () => void;
    isBeforeLaunch?: boolean;
    onUpdateHeroInfo?: (name: string, personality: string) => void;
    onUpdateCoStarInfo?: (index: number, name: string, personality: string) => void;
}

export const CharacterDossier: React.FC<CharacterDossierProps> = ({
    isOpen,
    onClose,
    hero,
    coStars,
    extrasDesc,
    comicTitle,
    selectedGenre,
    selectedArtStyle,
    storyTone,
    onLaunchStory,
    isBeforeLaunch,
    onUpdateHeroInfo,
    onUpdateCoStarInfo
}) => {
    const [activeTab, setActiveTab] = useState<'all' | 'hero' | 'costars'>('all');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6 bg-stone-900/40 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-[#FAF9F6] max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-stone-800 rounded-3xl border border-stone-200 shadow-2xl">
                
                {/* Header */}
                <div className="bg-white border-b border-stone-200 p-4 sm:p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-[#E8636F]/10 border border-[#E8636F]/20 text-[#E8636F] flex items-center justify-center text-xl shadow-xs">
                            👤
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="bg-[#E8636F]/10 text-[#E8636F] text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border border-[#E8636F]/20">
                                    서재온 인물 열전
                                </span>
                                <span className="text-xs font-semibold text-stone-500 truncate max-w-[200px]">
                                    {comicTitle || "서재온 이야기"}
                                </span>
                            </div>
                            <h2 className="font-serif-kr text-xl sm:text-2xl font-bold text-stone-900 tracking-tight leading-snug mt-0.5">
                                등장인물 프로필 및 서사 도감
                            </h2>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-600 flex items-center justify-center text-sm font-semibold transition-all border border-stone-200"
                        title="닫기"
                    >
                        ✕
                    </button>
                </div>

                {/* Filter Tabs & Story Summary Strip */}
                <div className="bg-stone-50 border-b border-stone-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="segmented-control">
                        <button 
                            onClick={() => setActiveTab('all')} 
                            className={`segmented-item ${activeTab === 'all' ? 'active' : ''}`}
                        >
                            전체 ({1 + (coStars?.length || 0)}인)
                        </button>
                        <button 
                            onClick={() => setActiveTab('hero')} 
                            className={`segmented-item ${activeTab === 'hero' ? 'active' : ''}`}
                        >
                            주인공
                        </button>
                        {coStars && coStars.length > 0 && (
                            <button 
                                onClick={() => setActiveTab('costars')} 
                                className={`segmented-item ${activeTab === 'costars' ? 'active' : ''}`}
                            >
                                동료 ({coStars.length}인)
                            </button>
                        )}
                    </div>

                    {/* World Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 font-medium">
                        {selectedGenre && <span className="bg-white border border-stone-200 px-2 py-0.5 rounded-full font-semibold text-stone-700">분야: {selectedGenre}</span>}
                        {selectedArtStyle && <span className="bg-white border border-stone-200 px-2 py-0.5 rounded-full">{selectedArtStyle}</span>}
                        {storyTone && <span className="bg-white border border-stone-200 px-2 py-0.5 rounded-full truncate max-w-[140px]">{storyTone.split('(')[0].trim()}</span>}
                    </div>
                </div>

                {/* Cards Grid Container */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-stone-50/60">
                    
                    {/* HERO SECTION */}
                    {(activeTab === 'all' || activeTab === 'hero') && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="bg-[#E8636F] text-white text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                                    주인공
                                </span>
                                <h3 className="font-serif-kr text-base sm:text-lg font-bold text-stone-900">주인공 프로필</h3>
                            </div>

                            {hero ? (
                                <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs transition-all">
                                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                                        {/* Avatar Column */}
                                        <div className="relative shrink-0 mx-auto sm:mx-0">
                                            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-2 border-stone-100 overflow-hidden bg-stone-100 shadow-xs">
                                                <img 
                                                    src={`data:image/jpeg;base64,${hero.base64}`} 
                                                    alt="주인공 프로필" 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <span className="absolute -bottom-2 -right-1 bg-[#E8636F] text-white font-semibold text-[10px] px-2 py-0.5 rounded-full shadow-xs border border-white">
                                                주인공
                                            </span>
                                        </div>

                                        {/* Info Column */}
                                        <div className="flex-1 space-y-3 w-full">
                                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-100">
                                                <div>
                                                    <div className="text-[10px] font-bold text-[#E8636F] uppercase tracking-wider">
                                                        PROTAGONIST
                                                    </div>
                                                    <h4 className="font-serif-kr text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                                                        {hero.name || "이름 미정"}
                                                    </h4>
                                                </div>

                                                <div className="flex flex-wrap gap-1.5">
                                                    <span className="bg-[#E8636F]/10 text-[#E8636F] text-xs font-medium px-2.5 py-0.5 rounded-full border border-[#E8636F]/20">
                                                        성향: {hero.personality || "정의로움 / 용기"}
                                                    </span>
                                                    <span className="bg-stone-100 text-stone-700 text-xs font-medium px-2.5 py-0.5 rounded-full border border-stone-200">
                                                        역할: 메인 주인공
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Inline edits */}
                                            {onUpdateHeroInfo ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                                    <div>
                                                        <label className="text-[11px] font-medium text-stone-500 block mb-1">인물 이름</label>
                                                        <input 
                                                            type="text" 
                                                            value={hero.name || ""} 
                                                            onChange={(e) => onUpdateHeroInfo(e.target.value, hero.personality || "")} 
                                                            placeholder="이름 입력"
                                                            className="w-full text-xs py-1.5 px-2.5 bg-[#FAF9F6] border border-stone-200 rounded-xl focus:outline-none focus:border-[#E8636F]"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-medium text-stone-500 block mb-1">성격 / 기질</label>
                                                        <input 
                                                            type="text" 
                                                            value={hero.personality || ""} 
                                                            onChange={(e) => onUpdateHeroInfo(hero.name || "", e.target.value)} 
                                                            placeholder="성향 입력 (예: 온화한 학자)"
                                                            className="w-full text-xs py-1.5 px-2.5 bg-[#FAF9F6] border border-stone-200 rounded-xl focus:outline-none focus:border-[#E8636F]"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                    <div className="bg-[#FAF9F6] p-2.5 rounded-xl border border-stone-200">
                                                        <span className="text-stone-400 block font-semibold text-[10px] uppercase">성격 및 가치관</span>
                                                        <span className="font-medium text-stone-800">{hero.personality || "정의롭고 온화한 성향"}</span>
                                                    </div>
                                                    <div className="bg-[#FAF9F6] p-2.5 rounded-xl border border-stone-200">
                                                        <span className="text-stone-400 block font-semibold text-[10px] uppercase">서사 비중</span>
                                                        <span className="font-medium text-stone-800">모든 중요 결단 및 메인 서사의 중심</span>
                                                    </div>
                                                </div>
                                            )}

                                            {hero.desc && hero.desc !== "주인공" && (
                                                <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200 font-serif-kr">
                                                    <span className="font-bold text-[#E8636F] block text-[10px] uppercase mb-0.5">외형 및 특징</span>
                                                    <p className="line-clamp-2">{hero.desc}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white border border-dashed border-stone-200 rounded-2xl p-6 text-center text-stone-400 text-xs font-serif-kr">
                                    주인공 삽화가 아직 등록되지 않았습니다.
                                </div>
                            )}
                        </div>
                    )}

                    {/* CO-STARS SECTION */}
                    {(activeTab === 'all' || activeTab === 'costars') && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="bg-stone-700 text-white text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                                    동료 열전
                                </span>
                                <h3 className="font-serif-kr text-base sm:text-lg font-bold text-stone-900">
                                    동료 및 주변 인물 ({coStars?.length || 0}인)
                                </h3>
                            </div>

                            {coStars && coStars.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {coStars.map((cs, idx) => (
                                        <div key={idx} className="bg-white rounded-2xl border border-stone-200 p-4 hover:shadow-md transition-all flex flex-col justify-between">
                                            <div className="flex gap-3.5 items-start">
                                                <div className="relative shrink-0">
                                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-stone-100 overflow-hidden bg-stone-100 shadow-xs">
                                                        <img 
                                                            src={`data:image/jpeg;base64,${cs.base64}`} 
                                                            alt={`동료 ${idx + 1}`} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <span className="absolute -bottom-1.5 -right-1 bg-[#E8636F] text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-xs">
                                                        #{idx + 1}
                                                    </span>
                                                </div>

                                                <div className="flex-1 min-w-0 space-y-1.5">
                                                    <div className="pb-1 border-b border-stone-100">
                                                        <div className="text-[9px] font-bold text-[#E8636F] uppercase tracking-wider">
                                                            동료 / 조력자
                                                        </div>
                                                        <h5 className="font-serif-kr text-base font-bold text-stone-900 truncate">
                                                            {cs.name || `동료 ${idx + 1}`}
                                                        </h5>
                                                    </div>

                                                    {onUpdateCoStarInfo ? (
                                                        <div className="space-y-1">
                                                            <input 
                                                                type="text" 
                                                                value={cs.name || ""} 
                                                                onChange={(e) => onUpdateCoStarInfo(idx, e.target.value, cs.personality || "")} 
                                                                placeholder="이름"
                                                                className="w-full text-[11px] py-1 px-2 bg-[#FAF9F6] border border-stone-200 rounded-lg focus:outline-none focus:border-[#E8636F]"
                                                            />
                                                            <input 
                                                                type="text" 
                                                                value={cs.personality || ""} 
                                                                onChange={(e) => onUpdateCoStarInfo(idx, cs.name || "", e.target.value)} 
                                                                placeholder="성향 (예: 충직함, 유머)"
                                                                className="w-full text-[11px] py-1 px-2 bg-[#FAF9F6] border border-stone-200 rounded-lg focus:outline-none focus:border-[#E8636F]"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-stone-700 bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                                                            <span className="text-[10px] text-stone-500 font-medium block">성향</span>
                                                            <span className="font-medium">{cs.personality || "믿음직한 조력자"}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {cs.desc && cs.desc !== `조연 ${idx + 1}` && (
                                                <div className="mt-2.5 text-[11px] text-stone-500 bg-[#FAF9F6] p-2 rounded-lg border border-stone-200 font-serif-kr">
                                                    <span className="font-semibold text-stone-700 mr-1">외형:</span>
                                                    <span className="line-clamp-2">{cs.desc}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white border border-dashed border-stone-200 rounded-2xl p-4 text-center text-stone-400 text-xs font-serif-kr">
                                    설정된 동료가 없습니다. (이야기 전개 중 서재 AI가 어울리는 인물을 동행시킵니다)
                                </div>
                            )}
                        </div>
                    )}

                    {/* EXTRAS & WORLD SETTINGS SUMMARY */}
                    {extrasDesc && (
                        <div className="bg-[#FAF9F6] border border-stone-200 rounded-2xl p-3.5 space-y-1 text-xs">
                            <span className="font-bold text-[#E8636F] uppercase text-[10px] tracking-wider block font-serif-kr">
                                🌐 배경 서사 및 군중 설정
                            </span>
                            <p className="text-stone-800 font-medium font-serif-kr leading-relaxed">{extrasDesc}</p>
                        </div>
                    )}

                </div>

                {/* Footer Controls */}
                <div className="bg-white border-t border-stone-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-stone-500 font-medium font-serif-kr">
                        총 <strong className="text-stone-900 font-bold">{1 + (coStars?.length || 0)}인</strong>의 인물이 이번 서재 도서에 등장합니다.
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-white hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-medium border border-stone-200 rounded-xl shadow-2xs transition-colors flex-1 sm:flex-initial"
                        >
                            닫기
                        </button>

                        {isBeforeLaunch && onLaunchStory && (
                            <button
                                onClick={() => {
                                    onClose();
                                    onLaunchStory();
                                }}
                                disabled={!hero}
                                className="px-5 py-2.5 bg-[#E8636F] hover:bg-[#D94F5C] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-2xs hover:shadow-xs transition-all flex-1 sm:flex-initial disabled:opacity-50"
                            >
                                이 인물들로 이야기 시작 📖
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
