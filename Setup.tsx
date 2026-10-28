/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { GENRES, ART_STYLES, TONES, LANGUAGES, Persona, LayoutType, LAYOUTS, StoryType, STORY_TYPES } from './types';
import { SlotId, SlotMetadata } from './storage';

interface SetupProps {
    show: boolean;
    isTransitioning: boolean;
    hero: Persona | null;
    coStars: Persona[];
    extrasDesc: string;
    selectedGenre: string;
    selectedArtStyle: string;
    storyTone: string;
    selectedLanguage: string;
    selectedLayout: LayoutType;
    selectedStoryType: StoryType;
    customPremise: string;
    richMode: boolean;
    comicTitle: string;
    activeSlot: SlotId;
    slots: SlotMetadata[];
    onOpenSlotManager?: () => void;
    onSwitchSlot?: (slotId: SlotId) => void;
    onAddNewSlot?: () => void;
    onOpenDossier?: () => void;
    onOpenScrapbook?: () => void;
    bookmarkedCount?: number;
    onHeroUpload: (file: File) => void;
    onUpdateHeroInfo: (name: string, personality: string) => void;
    onAddCoStar: (file: File) => void;
    onRemoveCoStar: (index: number) => void;
    onUpdateCoStarInfo: (index: number, name: string, personality: string) => void;
    onExtrasDescChange: (val: string) => void;
    onTitleChange: (val: string) => void;
    onGenreChange: (val: string) => void;
    onArtStyleChange: (val: string) => void;
    onToneChange: (val: string) => void;
    onLanguageChange: (val: string) => void;
    onLayoutChange: (val: LayoutType) => void;
    onStoryTypeChange: (val: StoryType) => void;
    onPremiseChange: (val: string) => void;
    onRichModeChange: (val: boolean) => void;
    onLaunch: () => void;
    onLoadSampleBook?: () => void;
}

export const Setup: React.FC<SetupProps> = (props) => {
    if (!props.show && !props.isTransitioning) return null;

    return (
        <>
        <style>{`
             @keyframes apple-scale-fade {
                 0% { transform: scale(1); opacity: 1; filter: blur(0px); }
                 100% { transform: scale(1.08); opacity: 0; filter: blur(20px); }
             }
             @keyframes apple-glow-pulse {
                 0%, 100% { opacity: 0.4; transform: scale(1); }
                 50% { opacity: 0.7; transform: scale(1.05); }
             }
          `}</style>
        
        <div 
            className="fixed inset-0 z-[200] overflow-y-auto flex items-center justify-center p-4 sm:p-6"
            style={{
                background: props.isTransitioning ? 'transparent' : 'rgba(15, 23, 42, 0.25)', 
                backdropFilter: props.isTransitioning ? 'none' : 'blur(20px) saturate(180%)',
                animation: props.isTransitioning ? 'apple-scale-fade 0.8s forwards cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                pointerEvents: props.isTransitioning ? 'none' : 'auto'
            }}
        >
          <div className="max-w-[940px] w-full glass-modal p-6 sm:p-10 relative overflow-hidden text-slate-800">
                {/* Subtle Ambient Apple Aurora Background Glows */}
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl -z-10 pointer-events-none" style={{ animation: 'apple-glow-pulse 6s infinite ease-in-out' }}></div>
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl -z-10 pointer-events-none" style={{ animation: 'apple-glow-pulse 6s infinite ease-in-out 3s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                
                {/* Header with BOOTIN SEOJAE ON Capsule Badge & Serif Title */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8636F]/10 border border-[#E8636F]/20 shadow-2xs mb-3 backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-[#E8636F] animate-pulse"></span>
                        <span className="text-[11px] font-bold tracking-wide text-[#E8636F] uppercase">BOOTIN SEOJAE ON &middot; 감성 에디토리얼 서재</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-stone-900 font-serif-kr">
                        서재온 <span className="text-[#E8636F]">書齋穩</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-stone-500 mt-1 font-medium font-serif-kr">
                        종이책의 아날로그적 정온함과 현대적 디지털 리더가 조화된 온라인 서재
                    </p>
                </div>

                {/* Story Slot Bar in Warm Alabaster Style */}
                <div className="bg-[#F5F5F0] border border-stone-200 p-2.5 sm:p-3 mb-8 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-hidden">
                        <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5 shrink-0 pl-1 font-serif-kr">
                            <span>📚</span> 서재 서랍:
                        </span>
                        <div className="segmented-control w-full sm:w-auto flex-1 overflow-x-auto max-w-full py-0.5 no-scrollbar flex-nowrap bg-white/70 border border-stone-200/80">
                            {props.slots.map((slotMeta) => {
                                const slotId = slotMeta.slotId;
                                const isCurrent = props.activeSlot === slotId;
                                const hasData = !slotMeta.isEmpty;

                                return (
                                    <button
                                        key={slotId}
                                        type="button"
                                        onClick={() => props.onSwitchSlot && props.onSwitchSlot(slotId)}
                                        className={`segmented-item flex items-center gap-1.5 shrink-0 justify-center ${isCurrent ? 'active !bg-[#E8636F] !text-white' : 'text-stone-600 hover:text-stone-900'}`}
                                        title={hasData ? `서랍 ${slotId}: ${slotMeta.comicTitle} (주인공: ${slotMeta.heroName})` : `서랍 ${slotId}: 비어있음`}
                                    >
                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${isCurrent ? 'bg-white text-[#E8636F]' : 'bg-stone-200 text-stone-600'}`}>
                                            {slotId}
                                        </span>
                                        <span className="truncate max-w-[70px] sm:max-w-[100px] font-medium">
                                            {hasData ? (slotMeta.comicTitle || `서랍 ${slotId}`) : `서랍 ${slotId}`}
                                        </span>
                                        {hasData && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                        )}
                                    </button>
                                );
                            })}

                            {props.onAddNewSlot && (
                                <button
                                    type="button"
                                    onClick={props.onAddNewSlot}
                                    className="segmented-item flex items-center gap-1 shrink-0 text-[#E8636F] hover:text-[#D94F5C] font-bold px-2"
                                    title="새 서랍 추가"
                                >
                                    <span>➕</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        {props.onOpenScrapbook && (
                            <button
                                type="button"
                                onClick={props.onOpenScrapbook}
                                className="btn-apple btn-apple-glass text-xs font-bold py-1.5 px-3 w-full sm:w-auto shadow-xs shrink-0 flex items-center justify-center gap-1.5 hover:bg-white"
                                title="즐겨찾기한 패널 스크랩북 열기"
                            >
                                <span>⭐</span>
                                <span>스크랩북</span>
                                {props.bookmarkedCount !== undefined && props.bookmarkedCount > 0 && (
                                    <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border border-amber-300">
                                        {props.bookmarkedCount}
                                    </span>
                                )}
                            </button>
                        )}

                        {props.onOpenSlotManager && (
                            <button
                                type="button"
                                onClick={props.onOpenSlotManager}
                                className="btn-apple btn-apple-glass text-xs font-bold py-1.5 px-3.5 w-full sm:w-auto shadow-xs shrink-0 flex items-center justify-center gap-1.5 hover:bg-white"
                            >
                                <span>⚙️</span>
                                <span>슬롯 관리 ({props.slots.length})</span>
                            </button>
                        )}
                    </div>
                </div>
                
                {/* 2-Column Setup Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 text-left">
                    
                    {/* Left Column: Cast Section */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">1</span>
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">등장인물 설정</h2>
                        </div>
                        
                        {/* HERO UPLOAD */}
                        <div className={`p-4 sm:p-5 rounded-2xl transition-all ${props.hero ? 'bg-emerald-50/70 border border-emerald-200/80 shadow-xs' : 'glass-card-subtle'}`}>
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">주인공 (필수)</p>
                                {props.hero && (
                                    <span className="text-emerald-700 font-semibold text-xs bg-emerald-100/80 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                        ✓ 등록 완료
                                    </span>
                                )}
                            </div>
                            
                            {props.hero ? (
                                <div className="flex gap-4 items-center">
                                     <div className="relative group shrink-0">
                                         <img 
                                             src={`data:image/jpeg;base64,${props.hero.base64}`} 
                                             alt="Hero Preview" 
                                             className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl shadow-md border-2 border-white/80" 
                                         />
                                         <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                                             <label className="cursor-pointer text-white text-[11px] font-bold">
                                                 변경
                                                 <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onHeroUpload(e.target.files[0])} />
                                             </label>
                                         </div>
                                     </div>
                                     <div className="flex-1 space-y-2">
                                         <div className="grid grid-cols-2 gap-2">
                                             <input 
                                                 type="text" 
                                                 placeholder="이름" 
                                                 value={props.hero.name || ""} 
                                                 onChange={(e) => props.onUpdateHeroInfo(e.target.value, props.hero?.personality || "")}
                                                 className="apple-input text-xs py-1.5 px-2.5 w-full"
                                             />
                                             <input 
                                                 type="text" 
                                                 placeholder="성향 (예: 용감함)" 
                                                 value={props.hero.personality || ""} 
                                                 onChange={(e) => props.onUpdateHeroInfo(props.hero?.name || "", e.target.value)}
                                                 className="apple-input text-xs py-1.5 px-2.5 w-full"
                                             />
                                         </div>
                                         <label className="btn-apple btn-apple-glass text-[11px] py-1 px-3 inline-flex cursor-pointer">
                                             사진 변경하기
                                             <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onHeroUpload(e.target.files[0])} />
                                         </label>
                                     </div>
                                </div>
                            ) : (
                                <label className="btn-apple btn-apple-primary w-full py-4 text-base cursor-pointer shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    주인공 사진 업로드
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onHeroUpload(e.target.files[0])} />
                                </label>
                            )}
                        </div>

                        {/* CO-STARS UPLOAD */}
                        <div className={`p-4 sm:p-5 rounded-2xl transition-all ${props.coStars.length > 0 ? 'bg-indigo-50/70 border border-indigo-200/80' : 'glass-card-subtle'}`}>
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">조연 (최대 3명)</p>
                                {props.coStars.length > 0 && (
                                    <span className="text-indigo-700 font-semibold text-xs bg-indigo-100/80 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                                        ✓ {props.coStars.length}명 등록됨
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2.5 mb-3">
                                {props.coStars.map((cs, idx) => (
                                    <div key={idx} className="flex gap-3 items-center p-2.5 bg-white/70 backdrop-blur-sm rounded-xl border border-white shadow-xs group relative">
                                        <div className="relative shrink-0">
                                            <img 
                                                src={`data:image/jpeg;base64,${cs.base64}`} 
                                                alt={`Co-Star ${idx}`} 
                                                className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xl shadow-xs border border-white" 
                                            />
                                            <button 
                                                onClick={() => props.onRemoveCoStar(idx)}
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="삭제"
                                            >
                                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="이름" 
                                                value={cs.name || ""} 
                                                onChange={(e) => props.onUpdateCoStarInfo(idx, e.target.value, cs.personality || "")}
                                                className="apple-input text-xs py-1 px-2.5"
                                            />
                                            <input 
                                                type="text" 
                                                placeholder="성향" 
                                                value={cs.personality || ""} 
                                                onChange={(e) => props.onUpdateCoStarInfo(idx, cs.name || "", e.target.value)}
                                                className="apple-input text-xs py-1 px-2.5"
                                            />
                                        </div>
                                    </div>
                                ))}
                                {props.coStars.length < 3 && (
                                    <label className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 bg-white/40 hover:bg-white/70 flex items-center justify-center gap-2 cursor-pointer transition-colors text-slate-600 font-semibold text-xs">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        조연 추가
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onAddCoStar(e.target.files[0])} />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* EXTRAS DESCRIPTION */}
                        <div className="p-4 rounded-2xl glass-card-subtle">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">엑스트라 / 배경 군중 설정</p>
                            <input 
                                type="text" 
                                value={props.extrasDesc} 
                                onChange={(e) => props.onExtrasDescChange(e.target.value)} 
                                placeholder="예: 사이버펑크 시민들, 친절한 로봇들, 경비대원..." 
                                className="w-full apple-input text-xs"
                            />
                        </div>
                        
                        {/* Cast Summary Card */}
                        {props.hero && (
                            <div className="p-3.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 rounded-2xl border border-blue-200/70 shadow-xs flex items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">캐스팅 완료</span>
                                        <span className="text-xs font-bold text-slate-800">
                                            {props.hero.name || "주인공"} {props.coStars.length > 0 ? `외 ${props.coStars.length}명` : "(솔로)"}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                                        인물 프로필 도감에서 상세 정보를 열람하고 편집할 수 있습니다.
                                    </p>
                                </div>
                                {props.onOpenDossier && (
                                    <button
                                        type="button"
                                        onClick={props.onOpenDossier}
                                        className="btn-apple btn-apple-glass text-xs font-semibold py-1.5 px-3 shrink-0 shadow-xs"
                                    >
                                        👥 도감 보기
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Story Settings Section */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-stone-200">
                            <span className="w-6 h-6 rounded-full bg-[#E8636F] text-white text-xs font-bold flex items-center justify-center shadow-2xs">2</span>
                            <h2 className="text-lg sm:text-xl font-bold font-serif-kr text-stone-900 tracking-tight">도서 서사 및 편집 설정</h2>
                        </div>
                        
                        <div className="space-y-3.5">
                            <div>
                                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 font-serif-kr">도서 표제 (미입력 시 AI가 자동 집필)</p>
                                <input 
                                    type="text" 
                                    value={props.comicTitle} 
                                    onChange={(e) => props.onTitleChange(e.target.value)} 
                                    placeholder="예: 바람이 머무는 밤의 서재" 
                                    className="w-full apple-input text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 font-serif-kr">장르</p>
                                    <select value={props.selectedGenre} onChange={(e) => props.onGenreChange(e.target.value)} className="w-full apple-input text-xs font-medium">
                                        {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 font-serif-kr">화풍 & 일러스트 스타일</p>
                                    <select value={props.selectedArtStyle} onChange={(e) => props.onArtStyleChange(e.target.value)} className="w-full apple-input text-xs font-medium">
                                        {ART_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 font-serif-kr">문체 및 어조 (Tone)</p>
                                <select value={props.storyTone} onChange={(e) => props.onToneChange(e.target.value)} className="w-full apple-input text-xs font-medium">
                                    {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 font-serif-kr">언어</p>
                                    <select value={props.selectedLanguage} onChange={(e) => props.onLanguageChange(e.target.value)} className="w-full apple-input text-xs font-medium">
                                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 font-serif-kr">출간 형식</p>
                                    <select value={props.selectedStoryType} onChange={(e) => props.onStoryTypeChange(e.target.value as StoryType)} className="w-full apple-input text-xs font-medium">
                                        {STORY_TYPES.map(t => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 font-serif-kr">도서 판형 (레이아웃)</p>
                                <select value={props.selectedLayout} onChange={(e) => props.onLayoutChange(e.target.value as LayoutType)} className="w-full apple-input text-xs font-medium">
                                    {LAYOUTS.map(l => (
                                        <option key={l.id} value={l.id}>
                                            {l.name} ({l.description})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {props.selectedGenre === '직접 입력' && (
                                <div>
                                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5 font-serif-kr">원작 줄거리 직접 입력</p>
                                    <textarea 
                                        value={props.customPremise} 
                                        onChange={(e) => props.onPremiseChange(e.target.value)} 
                                        placeholder="원하는 서사 세계관이나 플롯을 서술해 주세요..." 
                                        className="w-full apple-input text-xs h-20 resize-none font-serif-kr" 
                                    />
                                </div>
                            )}

                            <div className="pt-2">
                                <label className="flex items-center gap-3 cursor-pointer group select-none">
                                    <div className={`w-11 h-6 rounded-full transition-all relative ${props.richMode ? 'bg-[#E8636F]' : 'bg-stone-300'}`}>
                                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-xs ${props.richMode ? 'left-5.5' : 'left-0.5'}`}></div>
                                    </div>
                                    <input type="checkbox" checked={props.richMode} onChange={(e) => props.onRichModeChange(e.target.checked)} className="hidden" />
                                    <span className="text-xs font-semibold text-stone-700 group-hover:text-[#E8636F] transition-colors font-serif-kr">소설 모드 (문학적 묘사와 풍부한 내면 독백 강화)</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Launch Button Bar */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    {props.onLoadSampleBook && (
                        <button
                            type="button"
                            onClick={props.onLoadSampleBook}
                            className="btn-apple btn-apple-glass py-3.5 px-4 text-xs sm:text-sm font-bold shrink-0 font-serif-kr text-stone-700 hover:text-[#E8636F] flex items-center justify-center gap-1.5 transition-colors"
                            title="Gemini API 크레딧 없이 서재온의 전편(12페이지)을 즉시 열람하고 체험합니다"
                        >
                            <span>📚</span>
                            <span>샘플 도서 열람</span>
                        </button>
                    )}
                    {props.hero && props.onOpenDossier && (
                        <button
                            type="button"
                            onClick={props.onOpenDossier}
                            className="btn-apple btn-apple-glass py-3.5 px-5 text-sm font-bold shrink-0 font-serif-kr text-stone-700"
                        >
                            👥 인물 도감 열람
                        </button>
                    )}
                    <button 
                        onClick={props.onLaunch} 
                        disabled={!props.hero || props.isTransitioning} 
                        className="btn-apple btn-apple-primary flex-1 py-3.5 sm:py-4 text-base sm:text-lg font-bold tracking-tight disabled:opacity-40 disabled:cursor-not-allowed shadow-md bg-[#E8636F] hover:bg-[#D94F5C] text-white font-serif-kr"
                    >
                        {props.isTransitioning ? (
                            <span className="flex items-center justify-center gap-2.5">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                서재 첫 권 제본 및 집필 중...
                            </span>
                        ) : '📖 서재 열람하기 & 이야기 시작'}
                    </button>
                </div>
          </div>
        </div>
        </>
    );
}
