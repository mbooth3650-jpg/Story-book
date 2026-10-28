/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { BookmarkedPanel } from './types';

interface ScrapbookModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookmarks: BookmarkedPanel[];
    activeSlotId: number;
    onRemoveBookmark: (id: string) => void;
    onUpdateNote: (id: string, note: string) => void;
    onJumpToPage?: (pageIndex: number) => void;
    onClearAll?: () => void;
}

export const ScrapbookModal: React.FC<ScrapbookModalProps> = ({
    isOpen,
    onClose,
    bookmarks,
    activeSlotId,
    onRemoveBookmark,
    onUpdateNote,
    onJumpToPage,
    onClearAll
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSlotFilter, setSelectedSlotFilter] = useState<string>('all');
    const [previewImage, setPreviewImage] = useState<BookmarkedPanel | null>(null);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [noteDraft, setNoteDraft] = useState('');
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Collect unique slots present in bookmarks
    const uniqueSlots = useMemo(() => {
        const set = new Set<number>();
        bookmarks.forEach(b => set.add(b.slotId));
        return Array.from(set).sort((a, b) => a - b);
    }, [bookmarks]);

    const filteredBookmarks = useMemo(() => {
        return bookmarks.filter(item => {
            if (selectedSlotFilter !== 'all' && item.slotId !== Number(selectedSlotFilter)) {
                return false;
            }
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                item.comicTitle?.toLowerCase().includes(q) ||
                item.caption?.toLowerCase().includes(q) ||
                item.dialogue?.toLowerCase().includes(q) ||
                item.scene?.toLowerCase().includes(q) ||
                item.userNote?.toLowerCase().includes(q) ||
                `제 ${item.pageIndex}화`.includes(q)
            );
        });
    }, [bookmarks, selectedSlotFilter, searchQuery]);

    if (!isOpen) return null;

    const startEditingNote = (item: BookmarkedPanel) => {
        setEditingNoteId(item.id);
        setNoteDraft(item.userNote || '');
    };

    const saveNote = (id: string) => {
        onUpdateNote(id, noteDraft);
        setEditingNoteId(null);
    };

    const handleDownloadPanel = (item: BookmarkedPanel) => {
        const link = document.createElement('a');
        link.href = item.imageUrl;
        link.download = `${item.comicTitle || '만화'}_제${item.pageIndex}화_패널${item.panelIndex + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatDate = (timestamp: number) => {
        const d = new Date(timestamp);
        return `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-stone-900/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal Body */}
            <div className="relative w-full max-w-5xl max-h-[92vh] bg-[#FAF9F6] rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-5 sm:px-8 py-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#E8636F]/10 border border-[#E8636F]/20 text-[#E8636F] flex items-center justify-center text-xl shadow-xs shrink-0">
                            🔖
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-serif-kr text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                                    서재온 명장면 책갈피 스크랩북
                                </h2>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E8636F]/10 text-[#E8636F] border border-[#E8636F]/20">
                                    {bookmarks.length}편 보관 중
                                </span>
                            </div>
                            <p className="text-xs text-stone-500 font-medium">
                                서재를 감상하며 기억에 남긴 소중한 장면과 독서 단상을 모아봅니다.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        {bookmarks.length > 0 && (
                            <button
                                onClick={() => setShowClearConfirm(true)}
                                className="text-xs text-stone-400 hover:text-[#E8636F] px-2.5 py-1.5 rounded-lg hover:bg-stone-100 transition-colors font-medium"
                                title="스크랩북 전체 비우기"
                            >
                                전체 비우기
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-full bg-white hover:bg-stone-100 text-stone-600 border border-stone-200 flex items-center justify-center text-sm font-semibold transition-all shadow-2xs"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="px-5 sm:px-8 py-3 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-72">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">🔍</span>
                        <input
                            type="text"
                            placeholder="대사, 나레이션, 독서 메모 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8636F]/20 focus:border-[#E8636F] text-stone-800 placeholder-stone-400 shadow-2xs"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                        <span className="text-[11px] font-semibold text-stone-500 shrink-0 font-serif-kr">서랍별:</span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setSelectedSlotFilter('all')}
                                className={`text-[11px] font-semibold px-3 py-1 rounded-xl transition-all ${
                                    selectedSlotFilter === 'all'
                                        ? 'bg-[#E8636F] text-white shadow-xs'
                                        : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                                }`}
                            >
                                전체
                            </button>
                            {uniqueSlots.map(slotId => (
                                <button
                                    key={slotId}
                                    onClick={() => setSelectedSlotFilter(String(slotId))}
                                    className={`text-[11px] font-semibold px-3 py-1 rounded-xl transition-all flex items-center gap-1 ${
                                        selectedSlotFilter === String(slotId)
                                            ? 'bg-[#E8636F] text-white shadow-xs'
                                            : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                                    }`}
                                >
                                    <span>서랍 {slotId}</span>
                                    {slotId === activeSlotId && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#E8636F] inline-block"></span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
                    {filteredBookmarks.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center max-w-md mx-auto">
                            <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-4xl mb-4 shadow-sm animate-bounce">
                                🔖
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-slate-800 mb-1.5">
                                {bookmarks.length === 0 ? "아직 즐겨찾기한 패널이 없습니다" : "검색 조건과 일치하는 패널이 없습니다"}
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed mb-4">
                                {bookmarks.length === 0 ? (
                                    <>
                                        만화를 읽는 동안 마음에 드는 컷 우측 상단의 <strong className="text-amber-600">⭐ 즐겨찾기</strong> 버튼을 누르면
                                        언제든지 이 스크랩북에서 모아보고 메모를 기록할 수 있습니다.
                                    </>
                                ) : (
                                    "다른 검색어나 슬롯 필터를 선택해 보세요."
                                )}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredBookmarks.map((item) => {
                                const isCurrentStory = item.slotId === activeSlotId;
                                const isEditingNote = editingNoteId === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                                    >
                                        {/* Image Container with overlays */}
                                        <div 
                                            className="relative aspect-[4/3] bg-stone-100 overflow-hidden cursor-pointer"
                                            onClick={() => setPreviewImage(item)}
                                        >
                                            <img
                                                src={item.imageUrl}
                                                alt={`제 ${item.pageIndex}화 패널 ${item.panelIndex + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                                            {/* Top badges */}
                                            <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10 pointer-events-auto">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-md shadow-xs">
                                                        제 {item.pageIndex}화 • 컷 {item.panelIndex + 1}
                                                    </span>
                                                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#E8636F] text-white backdrop-blur-md">
                                                        서랍 {item.slotId}
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRemoveBookmark(item.id);
                                                    }}
                                                    className="w-7 h-7 rounded-full bg-black/50 hover:bg-[#E8636F] text-white flex items-center justify-center text-xs backdrop-blur-md transition-colors shadow-xs"
                                                    title="책갈피 해제"
                                                >
                                                    🗑️
                                                </button>
                                            </div>

                                            {/* Bottom quick zoom prompt */}
                                            <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1">
                                                <span className="text-[10px] font-medium text-white/90 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded flex items-center gap-1">
                                                    🔍 원본 보기
                                                </span>
                                            </div>

                                            {/* Character Focus Tag */}
                                            {item.focusChar && (
                                                <div className="absolute bottom-2.5 left-2.5 z-10">
                                                    <span className="text-[10px] font-medium text-[#FAF9F6] bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/20">
                                                        👤 {item.focusChar === 'hero' ? '주인공' : item.focusChar === 'friend' ? '동료' : '인물'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content body */}
                                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                                            <div>
                                                <div className="flex items-center justify-between text-[11px] text-stone-400 font-medium mb-1">
                                                    <span className="font-serif-kr truncate max-w-[150px] font-bold text-stone-900 group-hover:text-[#E8636F] transition-colors">{item.comicTitle}</span>
                                                    <span>{formatDate(item.timestamp)}</span>
                                                </div>

                                                {/* Caption & Dialogue */}
                                                {item.caption && (
                                                    <div className="bg-[#FAF9F6] border border-stone-200 rounded-xl p-2.5 mb-2 text-stone-700 text-xs font-serif-kr leading-relaxed">
                                                        <span className="text-[9px] font-bold text-[#E8636F] block mb-0.5 tracking-wider uppercase">서재 나레이션</span>
                                                        {item.caption}
                                                    </div>
                                                )}

                                                {item.dialogue && (
                                                    <div className="bg-stone-900 text-stone-100 rounded-xl p-2.5 mb-2 text-xs font-sans leading-snug shadow-2xs">
                                                        <span className="text-[9px] font-bold text-[#E8A0A7] block mb-0.5 tracking-wider uppercase">인물 대사</span>
                                                        "{item.dialogue}"
                                                    </div>
                                                )}
                                            </div>

                                            {/* User Note Section */}
                                            <div className="pt-2 border-t border-stone-100">
                                                {isEditingNote ? (
                                                    <div className="space-y-2">
                                                        <textarea
                                                            value={noteDraft}
                                                            onChange={(e) => setNoteDraft(e.target.value)}
                                                            placeholder="이 명장면에 대한 독서 단상이나 기억하고 싶은 문장을 기록하세요..."
                                                            rows={2}
                                                            className="w-full text-xs p-2.5 bg-[#FAF9F6] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8636F]/20 focus:border-[#E8636F] text-stone-800 resize-none font-serif-kr"
                                                            autoFocus
                                                        />
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                onClick={() => setEditingNoteId(null)}
                                                                className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-700 font-medium"
                                                            >
                                                                취소
                                                            </button>
                                                            <button
                                                                onClick={() => saveNote(item.id)}
                                                                className="px-3 py-1 text-xs bg-[#E8636F] hover:bg-[#D94F5C] text-white font-semibold rounded-lg shadow-2xs"
                                                            >
                                                                기록 저장
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        onClick={() => startEditingNote(item)}
                                                        className="group/note cursor-pointer p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-dashed border-stone-200 transition-colors"
                                                    >
                                                        {item.userNote ? (
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className="text-xs text-stone-700 font-serif-kr leading-relaxed">
                                                                    <span className="text-[#E8636F] font-bold mr-1">✍️ 독서 단상:</span>
                                                                    {item.userNote}
                                                                </p>
                                                                <span className="text-[10px] text-[#E8636F] opacity-0 group-hover/note:opacity-100 shrink-0 font-medium">수정</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between text-stone-400 text-xs">
                                                                <span className="flex items-center gap-1 text-[11px] font-medium text-stone-400 group-hover/note:text-[#E8636F]">
                                                                    <span>✍️</span> 독서 단상 메모 남기기...
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Bar */}
                                            <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
                                                <button
                                                    onClick={() => handleDownloadPanel(item)}
                                                    className="py-1.5 px-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center justify-center gap-1 transition-colors"
                                                    title="패널 원본 이미지 다운로드"
                                                >
                                                    <span>📥</span>
                                                    <span>소장 저장</span>
                                                </button>

                                                {onJumpToPage && (
                                                    <button
                                                        onClick={() => {
                                                            onJumpToPage(item.pageIndex);
                                                            onClose();
                                                        }}
                                                        disabled={!isCurrentStory}
                                                        className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors ${
                                                            isCurrentStory
                                                                ? 'bg-[#E8636F] hover:bg-[#D94F5C] text-white shadow-2xs'
                                                                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                                                        }`}
                                                        title={isCurrentStory ? `제 ${item.pageIndex}화로 이동` : '현재 열려있는 도서의 페이지만 이동할 수 있습니다'}
                                                    >
                                                        <span>📖</span>
                                                        <span>쪽 펼치기</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Bar */}
                <div className="px-5 sm:px-8 py-3.5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
                    <span className="flex items-center gap-1.5 font-serif-kr">
                        <span>💡</span>
                        <span>패널 카드를 클릭하면 고해상도 전체 화면으로 감상할 수 있습니다.</span>
                    </span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-[#E8636F] hover:bg-[#D94F5C] text-white text-xs font-semibold rounded-xl shadow-2xs transition-all"
                    >
                        서재로 돌아가기
                    </button>
                </div>
            </div>

            {/* Fullscreen Lightbox Zoom Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-xl animate-in fade-in duration-200">
                    <button
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/20 hover:bg-[#E8636F] text-white flex items-center justify-center text-lg font-bold transition-all shadow-xl z-20"
                    >
                        ✕
                    </button>

                    <div className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center relative z-10">
                        <img
                            src={previewImage.imageUrl}
                            alt="패널 원본 미리보기"
                            className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-stone-800"
                        />
                        <div className="mt-4 flex items-center gap-3">
                            <span className="text-[#FAF9F6] text-xs sm:text-sm font-serif-kr font-bold bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                                {previewImage.comicTitle} • 제 {previewImage.pageIndex}화 (컷 {previewImage.panelIndex + 1})
                            </span>
                            <button
                                onClick={() => handleDownloadPanel(previewImage)}
                                className="px-4 py-2 text-xs font-semibold bg-[#E8636F] hover:bg-[#D94F5C] text-white rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                            >
                                <span>📥</span>
                                <span>고화질 소장 저장</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clear All Confirmation Dialog */}
            {showClearConfirm && (
                <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-stone-200 text-center space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#E8636F]/10 text-[#E8636F] flex items-center justify-center text-2xl mx-auto">
                            ⚠️
                        </div>
                        <h4 className="font-serif-kr text-base font-bold text-stone-900">
                            스크랩북 책갈피를 모두 비울까요?
                        </h4>
                        <p className="text-xs text-stone-500 leading-relaxed">
                            총 {bookmarks.length}편의 즐겨찾기 패널과 작성하신 독서 단상이 모두 서재에서 정리됩니다.
                        </p>
                        <div className="flex items-center gap-2 pt-2">
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="flex-1 py-2 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={() => {
                                    if (onClearAll) onClearAll();
                                    setShowClearConfirm(false);
                                }}
                                className="flex-1 py-2 text-xs font-semibold bg-[#E8636F] hover:bg-[#D94F5C] text-white rounded-xl shadow-2xs transition-all"
                            >
                                모두 비우기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
