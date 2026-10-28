/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComicFace, Persona, LayoutType, StoryType, MoralChoiceRecord, BookmarkedPanel } from './types';

export type SlotId = number;

export const SLOTS_INDEX_KEY = 'infinite_heroes_all_slot_ids';
export const ACTIVE_SLOT_KEY = 'infinite_heroes_active_slot_id';
export const LEGACY_STORAGE_KEY = 'infinite_heroes_saved_comic_v1';
export const BOOKMARKS_STORAGE_KEY = 'infinite_heroes_bookmarked_panels_v1';
export const getSlotStorageKey = (slotId: SlotId) => `infinite_heroes_saved_comic_slot_${slotId}`;

export interface SavedComicState {
    version: number;
    savedAt: number;
    slotId: SlotId;
    isStarted: boolean;
    currentSheetIndex: number;
    comicTitle: string;
    selectedGenre: string;
    selectedArtStyle: string;
    selectedLanguage: string;
    selectedLayout: LayoutType;
    selectedStoryType: StoryType;
    customPremise: string;
    storyTone: string;
    richMode: boolean;
    darknessLevel: number;
    moralHistory?: MoralChoiceRecord[];
    extrasDesc: string;
    hero: Persona | null;
    coStars: Persona[];
    comicFaces: ComicFace[];
}

export interface SlotMetadata {
    slotId: SlotId;
    isEmpty: boolean;
    comicTitle?: string;
    heroName?: string;
    heroAvatarBase64?: string;
    genre?: string;
    artStyle?: string;
    pageCount?: number;
    totalPanelsCount?: number;
    savedAt?: number;
    currentSheetIndex?: number;
    isCompleted?: boolean;
}

export const getSlotIds = (): SlotId[] => {
    try {
        const raw = localStorage.getItem(SLOTS_INDEX_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.map(n => Number(n)).filter(n => !isNaN(n) && n > 0);
            }
        }
    } catch (e) {
        console.warn("Failed to read slot IDs:", e);
    }
    // Default initial slots
    const defaults: SlotId[] = [1, 2, 3];
    saveSlotIds(defaults);
    return defaults;
};

export const saveSlotIds = (ids: SlotId[]): void => {
    try {
        localStorage.setItem(SLOTS_INDEX_KEY, JSON.stringify(ids));
    } catch (e) {
        console.warn("Failed to persist slot IDs:", e);
    }
};

export const addNewSlot = (): SlotId => {
    const currentIds = getSlotIds();
    const nextId = currentIds.length > 0 ? Math.max(...currentIds) + 1 : 1;
    const updated = [...currentIds, nextId];
    saveSlotIds(updated);
    return nextId;
};

export const removeSlot = (slotId: SlotId): SlotId[] => {
    clearComicProgressSlot(slotId);
    const currentIds = getSlotIds();
    let updated = currentIds.filter(id => id !== slotId);
    if (updated.length === 0) {
        updated = [1];
    }
    saveSlotIds(updated);
    
    // If active slot was deleted, reset active slot to first available
    const active = getActiveSlotId();
    if (active === slotId) {
        setActiveSlotId(updated[0]);
    }
    return updated;
};

export const getActiveSlotId = (): SlotId => {
    try {
        const val = localStorage.getItem(ACTIVE_SLOT_KEY);
        if (val) {
            const num = parseInt(val, 10);
            if (!isNaN(num) && num > 0) {
                return num;
            }
        }
    } catch (e) {
        console.warn("Failed to read active slot id:", e);
    }
    return 1;
};

export const setActiveSlotId = (slotId: SlotId): void => {
    try {
        localStorage.setItem(ACTIVE_SLOT_KEY, String(slotId));
    } catch (e) {
        console.warn("Failed to set active slot id:", e);
    }
};

export const saveComicProgressToSlot = (
    slotId: SlotId,
    state: Omit<SavedComicState, 'version' | 'savedAt' | 'slotId'>
): boolean => {
    try {
        // Ensure this slotId is tracked in slotIds
        const currentIds = getSlotIds();
        if (!currentIds.includes(slotId)) {
            saveSlotIds([...currentIds, slotId]);
        }

        const payload: SavedComicState = {
            ...state,
            slotId,
            version: 2,
            savedAt: Date.now()
        };
        localStorage.setItem(getSlotStorageKey(slotId), JSON.stringify(payload));
        return true;
    } catch (e) {
        console.warn(`Failed to save comic progress to slot ${slotId}:`, e);
        return false;
    }
};

export const loadComicProgressFromSlot = (slotId: SlotId): SavedComicState | null => {
    try {
        const raw = localStorage.getItem(getSlotStorageKey(slotId));
        if (!raw) {
            // Check legacy key for slot 1 migration if slot 1 is empty
            if (slotId === 1) {
                const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
                if (legacyRaw) {
                    const legacyParsed = JSON.parse(legacyRaw);
                    if (legacyParsed && legacyParsed.comicFaces) {
                        const migrated: SavedComicState = {
                            ...legacyParsed,
                            slotId: 1,
                            version: 2,
                            savedAt: legacyParsed.savedAt || Date.now()
                        };
                        saveComicProgressToSlot(1, migrated);
                        localStorage.removeItem(LEGACY_STORAGE_KEY);
                        return migrated;
                    }
                }
            }
            return null;
        }
        const parsed = JSON.parse(raw) as SavedComicState;
        if (!parsed || !parsed.comicFaces || !Array.isArray(parsed.comicFaces)) {
            return null;
        }
        return parsed;
    } catch (e) {
        console.error(`Failed to parse saved comic from slot ${slotId}:`, e);
        return null;
    }
};

export const clearComicProgressSlot = (slotId: SlotId): void => {
    try {
        localStorage.removeItem(getSlotStorageKey(slotId));
    } catch (e) {
        console.warn(`Failed to clear slot ${slotId}:`, e);
    }
};

export const getAllSlotsSummary = (): SlotMetadata[] => {
    const slotIds = getSlotIds();
    return slotIds.map(slotId => {
        const data = loadComicProgressFromSlot(slotId);
        if (!data || !data.isStarted || !data.comicFaces || data.comicFaces.length === 0) {
            return {
                slotId,
                isEmpty: true
            };
        }
        const completedFaces = data.comicFaces.filter(f => 
            f.panels && f.panels.length > 0 && f.panels.some(p => Boolean(p.imageUrl)) && !f.isLoading
        );
        const totalPanelsCount = data.comicFaces.reduce((acc, f) => acc + (f.panels?.length || 0), 0);

        return {
            slotId,
            isEmpty: false,
            comicTitle: data.comicTitle || "무한한 영웅들",
            heroName: data.hero?.name || "주인공",
            heroAvatarBase64: data.hero?.base64,
            genre: data.selectedGenre,
            artStyle: data.selectedArtStyle,
            pageCount: completedFaces.length,
            totalPanelsCount,
            savedAt: data.savedAt,
            currentSheetIndex: data.currentSheetIndex,
            isCompleted: data.comicFaces.some(f => f.type === 'back_cover' && f.panels && f.panels.length > 0 && !f.isLoading)
        };
    });
};

// --- Bookmarked Panels (Scrapbook) Persistence ---

export const getBookmarkedPanels = (): BookmarkedPanel[] => {
    try {
        const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn("Failed to load bookmarked panels:", e);
    }
    return [];
};

export const saveBookmarkedPanels = (panels: BookmarkedPanel[]): void => {
    try {
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(panels));
    } catch (e) {
        console.warn("Failed to persist bookmarked panels:", e);
    }
};

export const addBookmark = (panel: BookmarkedPanel): BookmarkedPanel[] => {
    const list = getBookmarkedPanels();
    // Check if duplicate exists (same slot, page, panel)
    const filtered = list.filter(p => !(p.slotId === panel.slotId && p.pageIndex === panel.pageIndex && p.panelIndex === panel.panelIndex));
    const updated = [panel, ...filtered];
    saveBookmarkedPanels(updated);
    return updated;
};

export const removeBookmark = (id: string): BookmarkedPanel[] => {
    const list = getBookmarkedPanels();
    const updated = list.filter(p => p.id !== id);
    saveBookmarkedPanels(updated);
    return updated;
};

export const removeBookmarkByCoords = (slotId: number, pageIndex: number, panelIndex: number): BookmarkedPanel[] => {
    const list = getBookmarkedPanels();
    const updated = list.filter(p => !(p.slotId === slotId && p.pageIndex === pageIndex && p.panelIndex === panelIndex));
    saveBookmarkedPanels(updated);
    return updated;
};

export const updateBookmarkNote = (id: string, note: string): BookmarkedPanel[] => {
    const list = getBookmarkedPanels();
    const updated = list.map(p => p.id === id ? { ...p, userNote: note } : p);
    saveBookmarkedPanels(updated);
    return updated;
};

export const isPanelBookmarked = (slotId: number, pageIndex: number, panelIndex: number): boolean => {
    const list = getBookmarkedPanels();
    return list.some(p => p.slotId === slotId && p.pageIndex === pageIndex && p.panelIndex === panelIndex);
};
