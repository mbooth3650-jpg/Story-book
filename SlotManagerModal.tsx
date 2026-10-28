/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SlotId, SlotMetadata } from './storage';

export interface BgGenerationInfo {
    isGenerating: boolean;
    currentPageIndex: number;
    progress: number;
    statusText: string;
    activeSlotId: SlotId;
}

interface SlotManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentActiveSlot: SlotId;
    slots: SlotMetadata[];
    isCurrentlyInStory: boolean;
    bgGenerationInfo?: BgGenerationInfo | null;
    onSelectSlotToLoad: (slotId: SlotId) => void;
    onSaveCurrentToSlot: (slotId: SlotId) => void;
    onStartNewInSlot: (slotId: SlotId) => void;
    onDeleteSlot: (slotId: SlotId) => void;
    onAddNewSlot: () => void;
}

export const SlotManagerModal: React.FC<SlotManagerModalProps> = ({
    isOpen,
    onClose,
    currentActiveSlot,
    slots,
    isCurrentlyInStory,
    bgGenerationInfo,
    onSelectSlotToLoad,
    onSaveCurrentToSlot,
    onStartNewInSlot,
    onDeleteSlot,
    onAddNewSlot,
}) => {
    const [confirmDeleteSlot, setConfirmDeleteSlot] = useState<SlotId | null>(null);
    const [searchFilter, setSearchFilter] = useState('');

    if (!isOpen) return null;

    const formatDate = (timestamp?: number) => {
        if (!timestamp) return '';
        const d = new Date(timestamp);
        return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const filteredSlots = slots.filter(s => {
        if (!searchFilter.trim()) return true;
        const q = searchFilter.toLowerCase();
        return (
            String(s.slotId).includes(q) ||
            (s.comicTitle && s.comicTitle.toLowerCase().includes(q)) ||
            (s.heroName && s.heroName.toLowerCase().includes(q)) ||
            (s.genre && s.genre.toLowerCase().includes(q))
        );
    });

    const isSlotGenerating = (slotId: SlotId) => {
        return Boolean(
            bgGenerationInfo &&
            bgGenerationInfo.isGenerating &&
            bgGenerationInfo.activeSlotId === slotId
        );
    };

    return (
        <div className="fixed inset-0 z-[320] flex items-center justify-center p-3 sm:p-6 bg-stone-900/45 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-[#FAF9F6] max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-stone-800 shadow-2xl rounded-3xl border border-stone-200">
                
                {/* Modal Header */}
                <div className="bg-white border-b border-stone-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-[#E8636F]/10 border border-[#E8636F]/20 text-[#E8636F] flex items-center justify-center text-xl shadow-xs shrink-0">
                            📚
                        </span>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="bg-[#E8636F] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                                    서재온 서랍 보관소
                                </span>
                                <span className="text-xs font-semibold text-stone-500">
                                    총 {slots.length}개 서랍
                                </span>
                                {bgGenerationInfo?.isGenerating && (
                                    <span className="bg-[#E8636F]/10 text-[#E8636F] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#E8636F]/20 flex items-center gap-1 animate-pulse">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#E8636F]"></span>
                                        배경 삽화 집필 중
                                    </span>
                                )}
                            </div>
                            <h2 className="font-serif-kr text-xl sm:text-2xl font-bold text-stone-900 tracking-tight leading-snug mt-0.5">
                                서재 보관 서랍 관리
                            </h2>
                        </div>
                    </div>

                    {/* Header Action Buttons */}
                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                        <button
                            onClick={onAddNewSlot}
                            className="px-4 py-2 bg-[#E8636F] hover:bg-[#D94F5C] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                            title="새로운 서재 서랍 추가"
                        >
                            <span>➕</span>
                            <span>새 서랍 추가</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-full bg-white hover:bg-stone-100 text-stone-600 flex items-center justify-center text-sm font-semibold transition-all border border-stone-200 shrink-0"
                            title="닫기"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Subtitle / Active Info Strip */}
                <div className="bg-stone-50 border-b border-stone-200 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-600">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-stone-800 font-serif-kr">현재 열람 서랍:</span>
                        <span className="bg-[#E8636F] text-white font-bold px-2.5 py-0.5 rounded-full text-[11px] shadow-2xs">
                            서랍 {currentActiveSlot}
                        </span>
                        {isCurrentlyInStory && (
                            <span className="text-[#E8636F] font-semibold bg-[#E8636F]/10 px-2.5 py-0.5 rounded-full border border-[#E8636F]/20 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#E8636F] animate-pulse"></span>
                                실시간 서재 동기화 중
                            </span>
                        )}
                    </div>

                    {/* Slot Filter / Search Bar if many slots */}
                    {slots.length > 3 && (
                        <div className="relative">
                            <input
                                type="text"
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                placeholder="도서명, 주인공, 번호 검색..."
                                className="text-[11px] bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#E8636F] w-48 sm:w-56"
                            />
                            {searchFilter && (
                                <button
                                    onClick={() => setSearchFilter('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Slots Grid Area */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-stone-50/60">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {filteredSlots.map((meta) => {
                            const slotNum = meta.slotId;
                            const isActive = currentActiveSlot === slotNum;
                            const isEmpty = meta.isEmpty;
                            const isGenerating = isSlotGenerating(slotNum);
                            const pageProgressPercent = Math.min(100, Math.round(((meta.pageCount || 0) / 10) * 100));

                            return (
                                <div 
                                    key={slotNum}
                                    className={`relative rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 ${
                                        isActive 
                                            ? 'bg-white border-2 border-[#E8636F] shadow-md ring-4 ring-[#E8636F]/10 scale-[1.01]' 
                                            : 'bg-white border border-stone-200 hover:shadow-md'
                                    }`}
                                >
                                    {/* Top Slot Badge & Generation Indicator */}
                                    <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs ${
                                                isActive ? 'bg-[#E8636F] text-white' : 'bg-stone-100 text-stone-700'
                                            }`}>
                                                {slotNum}
                                            </span>
                                            <span className="font-bold text-sm text-stone-900 font-serif-kr">
                                                서랍 {slotNum}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {isGenerating && (
                                                <span className="bg-[#E8636F]/10 text-[#E8636F] font-semibold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse border border-[#E8636F]/20">
                                                    <span className="inline-block animate-spin text-[11px]">🎨</span>
                                                    <span>삽화 집필 중</span>
                                                </span>
                                            )}
                                            {isActive && !isGenerating && (
                                                <span className="bg-[#E8636F] text-white font-semibold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                                                    현재 열람 중
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Live Background Progress Bar (if generating) */}
                                    {isGenerating && bgGenerationInfo && (
                                        <div className="mb-3 p-2.5 rounded-2xl bg-stone-50 border border-stone-200 shadow-2xs space-y-1.5">
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="font-medium text-stone-800 flex items-center gap-1">
                                                    <span className="animate-spin text-xs">⚡</span>
                                                    <span>{bgGenerationInfo.statusText || '삽화 그리는 중...'}</span>
                                                </span>
                                                <span className="font-bold text-[#E8636F]">
                                                    {Math.round(bgGenerationInfo.progress)}%
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden relative">
                                                <div 
                                                    className="h-full bg-[#E8636F] rounded-full transition-all duration-300 relative overflow-hidden"
                                                    style={{ width: `${Math.max(5, bgGenerationInfo.progress)}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-white/30 animate-[shimmer_1.5s_infinite] -skew-x-12"></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Slot Content Body */}
                                    {isEmpty ? (
                                        <div className="py-7 text-center flex-1 flex flex-col items-center justify-center text-stone-400 space-y-1.5 border-2 border-dashed border-stone-200 rounded-2xl mb-4 bg-stone-50/50">
                                            <span className="text-3xl opacity-50">📖</span>
                                            <p className="text-xs font-semibold text-stone-700 font-serif-kr">비어있는 서재 서랍</p>
                                            <p className="text-[11px] text-stone-400">새로운 이야기를 이곳에 시작하고 보관하세요</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 flex-1 mb-4">
                                            <div className="flex items-start gap-3">
                                                {meta.heroAvatarBase64 ? (
                                                    <div className="w-13 h-13 rounded-2xl border-2 border-stone-100 overflow-hidden shrink-0 bg-stone-100 shadow-xs">
                                                        <img 
                                                            src={`data:image/jpeg;base64,${meta.heroAvatarBase64}`} 
                                                            alt={meta.heroName || "주인공"} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-13 h-13 rounded-2xl border border-stone-200 bg-stone-100 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                                                        📖
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-serif-kr font-bold text-sm text-stone-900 truncate leading-tight group-hover:text-[#E8636F]">
                                                        {meta.comicTitle || "서재온 이야기"}
                                                    </h4>
                                                    <p className="text-xs text-[#E8636F] font-medium truncate mt-0.5">
                                                        주인공: {meta.heroName || "인물"}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {meta.genre && (
                                                            <span className="bg-stone-100 text-stone-700 text-[10px] font-medium px-1.5 py-0.5 rounded border border-stone-200">
                                                                {meta.genre}
                                                            </span>
                                                        )}
                                                        {meta.artStyle && (
                                                            <span className="bg-[#E8636F]/10 text-[#E8636F] text-[10px] font-medium px-1.5 py-0.5 rounded border border-[#E8636F]/20 truncate max-w-[120px]">
                                                                {meta.artStyle}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress & Metadata Container */}
                                            <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-stone-200 text-[11px] space-y-2 shadow-2xs">
                                                {/* Page Completion Track */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <span className="text-stone-500 font-medium">독서 진행도:</span>
                                                        <span className="font-bold text-stone-800">
                                                            {meta.isCompleted ? '🎉 10/10 쪽 완결' : `${meta.pageCount || 0} / 10 쪽 (${pageProgressPercent}%)`}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full rounded-full transition-all duration-500 bg-[#E8636F]"
                                                            style={{ width: `${Math.max(meta.pageCount ? 8 : 0, pageProgressPercent)}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-between text-stone-500 pt-1 border-t border-stone-200 text-[10px]">
                                                    <span>최근 보관:</span>
                                                    <span className="text-stone-700 font-medium">{formatDate(meta.savedAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons for this Slot */}
                                    <div className="space-y-2 pt-2 border-t border-stone-100">
                                        {!isEmpty ? (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        onSelectSlotToLoad(slotNum);
                                                        onClose();
                                                    }}
                                                    className="w-full py-2 px-3 bg-[#E8636F] hover:bg-[#D94F5C] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                                                >
                                                    <span>📖</span>
                                                    <span>이 서재 열람하기 & 이어가기</span>
                                                </button>

                                                {isCurrentlyInStory && !isActive && (
                                                    <button
                                                        onClick={() => onSaveCurrentToSlot(slotNum)}
                                                        className="w-full py-1.5 px-3 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium border border-stone-200 rounded-xl flex items-center justify-center gap-1 transition-colors"
                                                    >
                                                        <span>💾</span>
                                                        <span>현재 도서를 이 서랍에 복제</span>
                                                    </button>
                                                )}

                                                {confirmDeleteSlot === slotNum ? (
                                                    <div className="bg-rose-50 p-2 rounded-xl border border-rose-200 flex items-center justify-between gap-1">
                                                        <span className="text-[11px] font-bold text-rose-700">정말 비울까요?</span>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => {
                                                                    onDeleteSlot(slotNum);
                                                                    setConfirmDeleteSlot(null);
                                                                }}
                                                                className="bg-[#E8636F] hover:bg-[#D94F5C] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-2xs"
                                                            >
                                                                삭제
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDeleteSlot(null)}
                                                                className="bg-stone-200 hover:bg-stone-300 text-stone-700 text-[10px] font-medium px-2 py-1 rounded-lg"
                                                            >
                                                                취소
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between pt-0.5">
                                                        <button
                                                            onClick={() => setConfirmDeleteSlot(slotNum)}
                                                            className="text-stone-400 hover:text-[#E8636F] text-[11px] font-medium transition-colors flex items-center gap-1 py-0.5"
                                                        >
                                                            <span>🗑</span>
                                                            <span>서랍 비우기</span>
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                onStartNewInSlot(slotNum);
                                                                onClose();
                                                            }}
                                                            className="text-stone-400 hover:text-[#E8636F] text-[11px] font-medium transition-colors flex items-center gap-1 py-0.5"
                                                        >
                                                            <span>✨ 새 도서 집필</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {isCurrentlyInStory && (
                                                    <button
                                                        onClick={() => onSaveCurrentToSlot(slotNum)}
                                                        className="w-full py-2 px-3 bg-[#E8636F] hover:bg-[#D94F5C] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                                                    >
                                                        <span>💾</span>
                                                        <span>현재 도서 이 서랍에 보관</span>
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => {
                                                        onStartNewInSlot(slotNum);
                                                        onClose();
                                                    }}
                                                    className="w-full py-2 px-3 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium border border-stone-200 rounded-xl flex items-center justify-center gap-1 transition-colors"
                                                >
                                                    <span>✨</span>
                                                    <span>이 서랍에서 새 도서 시작</span>
                                                </button>

                                                {slots.length > 1 && (
                                                    <button
                                                        onClick={() => onDeleteSlot(slotNum)}
                                                        className="w-full text-stone-400 hover:text-[#E8636F] text-[10px] font-medium text-center py-0.5 transition-colors"
                                                    >
                                                        서랍 제거
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>

                                </div>
                            );
                        })}

                        {/* Add New Slot Plus Card */}
                        <div 
                            onClick={onAddNewSlot}
                            className="rounded-3xl p-6 border-2 border-dashed border-stone-300 bg-white hover:bg-stone-50 transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[220px] shadow-2xs hover:scale-[1.01]"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-[#E8636F]/10 border border-[#E8636F]/20 text-[#E8636F] flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
                                ➕
                            </div>
                            <h4 className="font-serif-kr font-bold text-sm text-stone-900 group-hover:text-[#E8636F]">
                                새 서재 서랍 추가하기
                            </h4>
                            <p className="text-[11px] text-stone-500 mt-1 max-w-[200px]">
                                서랍을 무제한으로 확장하여 나만의 도서를 정온하게 보관하세요
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-white border-t border-stone-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-stone-500 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#E8636F]"></span>
                        <span className="font-serif-kr">집필 중인 도서는 활성 서랍에 실시간 자동 보관됩니다.</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-white hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-medium border border-stone-200 rounded-xl shadow-2xs transition-colors"
                        >
                            닫기
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
