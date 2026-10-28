
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import jsPDF from 'jspdf';
import { MAX_STORY_PAGES, BACK_COVER_PAGE, TOTAL_PAGES, INITIAL_PAGES, BATCH_SIZE, DECISION_PAGES, GENRES, ART_STYLES, TONES, LANGUAGES, LAYOUTS, LayoutType, ComicFace, Beat, Persona, PanelData, StoryType, STORY_TYPES, MoralChoiceRecord, BookmarkedPanel, SlideshowSpeedMode } from './types';
import { Setup } from './Setup';
import { Book } from './Book';
import { CharacterDossier } from './CharacterDossier';
import { SlotManagerModal, BgGenerationInfo } from './SlotManagerModal';
import { MoralChartModal } from './MoralChartModal';
import { ScrapbookModal } from './ScrapbookModal';
import { SlideshowControls } from './SlideshowControls';
import { useApiKey } from './useApiKey';
import { ApiKeyDialog } from './ApiKeyDialog';
import { 
  SlotId, 
  SlotMetadata, 
  SavedComicState, 
  getActiveSlotId, 
  setActiveSlotId, 
  saveComicProgressToSlot, 
  loadComicProgressFromSlot, 
  clearComicProgressSlot, 
  getAllSlotsSummary,
  addNewSlot,
  removeSlot,
  getBookmarkedPanels,
  addBookmark,
  removeBookmark,
  removeBookmarkByCoords,
  updateBookmarkNote,
  isPanelBookmarked,
  saveBookmarkedPanels
} from './storage';
import { SAMPLE_HERO, SAMPLE_CO_STAR, SAMPLE_COMIC_FACES } from './sampleStory';

// --- Constants ---
const MODEL_TEXT_NAME = "gemini-3.8-flash";
const MODEL_IMAGE_GEN_NAME = "gemini-3.1-flash-lite-image";
const MODEL_IMAGE_GEN_FALLBACK = "gemini-3.1-flash-lite-image";

// Helper to determine if an error is due to exhausted prepayment credits / billing 402
export function isBillingOrCreditDepletedError(error: any): boolean {
  if (!error) return false;
  const str = (String(error) + " " + (error?.message || "")).toLowerCase();
  return (
    str.includes('402') ||
    str.includes('prepayment credits') ||
    str.includes('prepayment') ||
    str.includes('billing#prepay') ||
    str.includes('credits are depleted') ||
    error?.status === 402 ||
    error?.code === 402 ||
    error?.statusCode === 402 ||
    (str.includes('resource_exhausted') && (str.includes('prepayment') || str.includes('credits') || str.includes('billing')))
  );
}

// Helper for calling Gemini with retry and backoff on 429 / RESOURCE_EXHAUSTED errors
async function callGeminiWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 2500,
  onRateLimit?: (msg: string) => void
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (isBillingOrCreditDepletedError(error)) {
      console.warn("[Gemini API] Prepayment credit depleted (402). Halting retry.");
      throw error;
    }

    const errorStr = String(error) + " " + (error?.message || "");
    const is429 = errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('Quota exceeded');
    
    if (is429 && retries > 0) {
      let waitMs = delayMs;
      const secMatch = errorStr.match(/retry in ([0-9.]+)s/i) || errorStr.match(/retryDelay["']?\s*:\s*["']?(\d+)s/i);
      if (secMatch && secMatch[1]) {
        const sec = parseFloat(secMatch[1]);
        if (!isNaN(sec) && sec > 0 && sec <= 25) {
          waitMs = Math.ceil(sec * 1000) + 1000;
        }
      }

      const waitSec = Math.ceil(waitMs / 1000);
      if (onRateLimit) {
        onRateLimit(`요청 제한으로 인해 ${waitSec}초 후 자동으로 재시도합니다...`);
      }
      console.warn(`[Gemini API] Rate limit (429) hit. Waiting ${waitMs}ms before retry (${retries} attempts left).`);
      
      await new Promise(r => setTimeout(r, waitMs));
      return callGeminiWithRetry(fn, retries - 1, Math.floor(delayMs * 1.5), onRateLimit);
    }
    throw error;
  }
}

const App: React.FC = () => {
  // --- API Key Hook ---
  const { 
    validateApiKey, 
    setShowApiKeyDialog, 
    showApiKeyDialog, 
    handleApiKeyDialogContinue,
    isCreditDepleted,
    setIsCreditDepleted 
  } = useApiKey();

  const isCreditDepletedRef = useRef(isCreditDepleted);
  useEffect(() => {
    isCreditDepletedRef.current = isCreditDepleted;
  }, [isCreditDepleted]);

  const [hero, setHeroState] = useState<Persona | null>(null);
  const [coStars, setCoStarsState] = useState<Persona[]>([]);
  const [extrasDesc, setExtrasDesc] = useState("");
  const [comicTitle, setComicTitle] = useState("");
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [selectedArtStyle, setSelectedArtStyle] = useState(ART_STYLES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].code);
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(LAYOUTS[0].id);
  const [selectedStoryType, setSelectedStoryType] = useState<StoryType>(STORY_TYPES[0].id);
  const [customPremise, setCustomPremise] = useState("");
  const [storyTone, setStoryTone] = useState(TONES[0]);
  const [richMode, setRichMode] = useState(true);
  const [darknessLevel, setDarknessLevel] = useState(0); // -5 (Wholesome) to +5 (Grim/Dark)
  const [moralHistory, setMoralHistory] = useState<MoralChoiceRecord[]>([]);
  const [showMoralModal, setShowMoralModal] = useState(false);
  const [showDossier, setShowDossier] = useState(false);
  const [rateLimitNotice, setRateLimitNotice] = useState<string | null>(null);
  
  // --- Scrapbook & Bookmarks States ---
  const [bookmarks, setBookmarks] = useState<BookmarkedPanel[]>(() => getBookmarkedPanels());
  const [showScrapbookModal, setShowScrapbookModal] = useState(false);

  // --- Slideshow Reading Mode States ---
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const [isSlideshowPaused, setIsSlideshowPaused] = useState(false);
  const [slideshowSpeedMode, setSlideshowSpeedMode] = useState<SlideshowSpeedMode>('smart');
  const [slideshowSecondsLeft, setSlideshowSecondsLeft] = useState(9);
  const [slideshowTotalDuration, setSlideshowTotalDuration] = useState(9);

  // --- Slot Management States ---
  const [activeSlot, setActiveSlot] = useState<SlotId>(() => getActiveSlotId());
  const [slotsSummary, setSlotsSummary] = useState<SlotMetadata[]>(() => getAllSlotsSummary());
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [bgGenInfo, setBgGenInfo] = useState<BgGenerationInfo | null>(null);
  const activeSlotRef = useRef<SlotId>(activeSlot);

  useEffect(() => {
    activeSlotRef.current = activeSlot;
  }, [activeSlot]);

  const heroRef = useRef<Persona | null>(null);
  const coStarsRef = useRef<Persona[]>([]);

  const setHero = (p: Persona | null) => { setHeroState(p); heroRef.current = p; };
  const setCoStars = (list: Persona[]) => { setCoStarsState(list); coStarsRef.current = list; };
  
  const [comicFaces, setComicFaces] = useState<ComicFace[]>([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  
  // --- Transition States ---
  const [showSetup, setShowSetup] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const generatingPages = useRef(new Set<number>());
  const historyRef = useRef<ComicFace[]>([]);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const isInitialMount = useRef(true);

  const refreshSlots = () => {
    setSlotsSummary(getAllSlotsSummary());
  };

  const applySlotData = (saved: SavedComicState | null, slotId: SlotId) => {
    setActiveSlot(slotId);
    setActiveSlotId(slotId);
    if (saved && saved.isStarted && saved.comicFaces && saved.comicFaces.length > 0) {
      setHero(saved.hero);
      setCoStars(saved.coStars || []);
      setExtrasDesc(saved.extrasDesc || "");
      setComicTitle(saved.comicTitle || "");
      setSelectedGenre(saved.selectedGenre || GENRES[0]);
      setSelectedArtStyle(saved.selectedArtStyle || ART_STYLES[0]);
      setSelectedLanguage(saved.selectedLanguage || LANGUAGES[0].code);
      setSelectedLayout(saved.selectedLayout || LAYOUTS[0].id);
      setSelectedStoryType(saved.selectedStoryType || STORY_TYPES[0].id);
      setCustomPremise(saved.customPremise || "");
      setStoryTone(saved.storyTone || TONES[0]);
      setRichMode(saved.richMode !== undefined ? saved.richMode : true);
      setDarknessLevel(saved.darknessLevel || 0);
      setMoralHistory(saved.moralHistory || []);
      setComicFaces(saved.comicFaces);
      setCurrentSheetIndex(saved.currentSheetIndex || 0);
      historyRef.current = saved.comicFaces;
      setIsStarted(true);
      setShowSetup(false);
      
      setSaveStatus(`슬롯 ${slotId} 불러옴`);
    } else {
      setIsStarted(false);
      setShowSetup(true);
      setComicFaces([]);
      setCurrentSheetIndex(0);
      historyRef.current = [];
      generatingPages.current.clear();
      setHero(null);
      setCoStars([]);
      setExtrasDesc("");
      setComicTitle("");
      setMoralHistory([]);
      setDarknessLevel(0);
      setSaveStatus(`슬롯 ${slotId} (새 이야기)`);
    }
    refreshSlots();
    const t = setTimeout(() => setSaveStatus(""), 2500);
    return () => clearTimeout(t);
  };

  // Restore saved comic progress on initial load
  useEffect(() => {
    const initialSlot = getActiveSlotId();
    const saved = loadComicProgressFromSlot(initialSlot);
    if (saved && saved.isStarted && saved.comicFaces && saved.comicFaces.length > 0) {
      applySlotData(saved, initialSlot);
    } else {
      refreshSlots();
    }
  }, []);

  // Periodically and reactively auto-save comic progress to the active slot
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!isStarted || comicFaces.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      const success = saveComicProgressToSlot(activeSlot, {
        isStarted,
        currentSheetIndex,
        comicTitle,
        selectedGenre,
        selectedArtStyle,
        selectedLanguage,
        selectedLayout,
        selectedStoryType,
        customPremise,
        storyTone,
        richMode,
        darknessLevel,
        moralHistory,
        extrasDesc,
        hero: heroRef.current,
        coStars: coStarsRef.current,
        comicFaces
      });
      if (success) {
        refreshSlots();
        setSaveStatus(`슬롯 ${activeSlot} 저장됨`);
        const t = setTimeout(() => setSaveStatus(""), 2000);
        return () => clearTimeout(t);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    activeSlot,
    isStarted,
    currentSheetIndex,
    comicTitle,
    selectedGenre,
    selectedArtStyle,
    selectedLanguage,
    selectedLayout,
    selectedStoryType,
    customPremise,
    storyTone,
    richMode,
    darknessLevel,
    extrasDesc,
    hero,
    coStars,
    comicFaces
  ]);

  const handleSelectSlotToLoad = (slotId: SlotId) => {
    const data = loadComicProgressFromSlot(slotId);
    applySlotData(data, slotId);
  };

  const handleSaveCurrentToSlot = (slotId: SlotId) => {
    if (!isStarted) return;
    const success = saveComicProgressToSlot(slotId, {
      isStarted,
      currentSheetIndex,
      comicTitle,
      selectedGenre,
      selectedArtStyle,
      selectedLanguage,
      selectedLayout,
      selectedStoryType,
      customPremise,
      storyTone,
      richMode,
      darknessLevel,
      extrasDesc,
      hero: heroRef.current,
      coStars: coStarsRef.current,
      comicFaces
    });
    if (success) {
      setActiveSlot(slotId);
      setActiveSlotId(slotId);
      refreshSlots();
      setSaveStatus(`슬롯 ${slotId}에 복사 저장`);
      const t = setTimeout(() => setSaveStatus(""), 2500);
    }
  };

  const handleStartNewInSlot = (slotId: SlotId) => {
    clearComicProgressSlot(slotId);
    applySlotData(null, slotId);
  };

  const handleAddNewSlot = () => {
    const newId = addNewSlot();
    refreshSlots();
    applySlotData(null, newId);
    setSaveStatus(`새 슬롯 ${newId} 추가됨`);
    const t = setTimeout(() => setSaveStatus(""), 2500);
  };

  const handleDeleteSlot = (slotId: SlotId) => {
    const remaining = removeSlot(slotId);
    refreshSlots();
    if (activeSlot === slotId) {
      const nextSlot = remaining[0] || 1;
      const data = loadComicProgressFromSlot(nextSlot);
      applySlotData(data, nextSlot);
    }
  };

  // --- AI Helpers ---
  // Helper to always get a fresh instance with the selected key
  const getAI = () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  };

  const handleAPIError = (e: any) => {
    const isCreditDepletedError = isBillingOrCreditDepletedError(e);

    if (isCreditDepletedError) {
      console.warn("[서재온] 크레딧 소진 감지 (HTTP 402). 재시도 및 백그라운드 생성을 정지하고 안내 창을 표시합니다.");
      isCreditDepletedRef.current = true;
      setIsCreditDepleted(true);
      setShowApiKeyDialog(true);
      generatingPages.current.clear();
      setBgGenInfo(null);
      setRateLimitNotice("크레딧이 모두 소진되었습니다. AI Studio 프로젝트 결제 설정을 확인해 주세요.");
      setTimeout(() => setRateLimitNotice(null), 8000);
      return;
    }

    const msg = String(e) + " " + (e?.message || "");
    console.error("API 오류:", msg);

    if (
      msg.includes('Requested entity was not found') || 
      msg.includes('API_KEY_INVALID') || 
      msg.toLowerCase().includes('permission denied')
    ) {
      setIsCreditDepleted(false);
      setShowApiKeyDialog(true);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const generateBeat = async (history: ComicFace[], isRightPage: boolean, pageNum: number, isDecisionPage: boolean, panelIndex: number = 0, totalPanels: number = 1): Promise<Beat> => {
    if (!heroRef.current) throw new Error("No Hero");

    const isFinalPage = pageNum === MAX_STORY_PAGES;
    const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "한국어";
    const isAdult = selectedGenre === "성인 전용 (19+)" || storyTone.includes("성인 중심");

    // Get relevant history and last focus to prevent repetition
    const relevantHistory = history
        .filter(p => p.type === 'story' && p.panels.some(pan => pan.narrative) && (p.pageIndex || 0) < pageNum)
        .sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

    const lastFace = relevantHistory[relevantHistory.length - 1];
    const lastBeat = lastFace?.panels[lastFace.panels.length - 1]?.narrative;
    const lastFocus = lastBeat?.focus_char || 'none';

    const historyText = relevantHistory.map(p => 
      `[페이지 ${p.pageIndex}] ` + p.panels.map((pan, i) => `(패널 ${i+1} 포커스: ${pan.narrative?.focus_char}) (캡션: "${pan.narrative?.caption || ''}") (대사: "${pan.narrative?.dialogue || ''}") (장면: ${pan.narrative?.scene})`).join(' ') + (p.resolvedChoice ? ` -> 사용자 선택: "${p.resolvedChoice}"` : '')
    ).join('\n');

    const heroInfo = `이름: ${heroRef.current.name || "주인공"}, 성향: ${heroRef.current.personality || "정의로운 영웅"}`;
    
    // Co-Star and Extra Injection Logic
    let coStarInstruction = "아직 등장하지 않음.";
    if (coStarsRef.current.length > 0) {
        coStarInstruction = coStarsRef.current.map((cs, i) => 
            `조연 ${i+1} (이름: ${cs.name || `조연 ${i+1}`}, 성향: ${cs.personality || "신비로움"}): ${cs.desc}`
        ).join(", ") + "가 활성 상태입니다.";
        if (lastFocus !== 'friend' && Math.random() > 0.4) {
             coStarInstruction += " 필수: 이 패널에서는 조연 중 한 명에게 집중하세요.";
        } else {
             coStarInstruction += " 주요 포커스가 아니더라도 장면에 자연스럽게 녹여내세요.";
        }
    }
    
    let extrasInstruction = extrasDesc ? `엑스트라/배경 캐릭터: ${extrasDesc}.` : "이야기 전개에 필요한 일반적인 엑스트라를 자유롭게 추가하세요.";

    // Determine Core Story Driver (Genre vs Custom Premise)
    let coreDriver = `장르: ${selectedGenre}. 분위기: ${storyTone}. 아트 스타일: ${selectedArtStyle}.`;
    
    // Branching Narrative Influence
    let branchingInstruction = "";
    if (darknessLevel > 2) {
        branchingInstruction = "이야기가 매우 어둡고 비극적인 방향으로 흐르고 있습니다. 절망적인 분위기와 무거운 갈등을 강조하세요.";
    } else if (darknessLevel < -2) {
        branchingInstruction = "이야기가 매우 밝고 희망적인 방향으로 흐르고 있습니다. 유머와 따뜻한 유대감을 강조하세요.";
    }

    if (selectedGenre === '직접 입력') {
        coreDriver = `이야기 줄거리: ${customPremise || "완전히 독특하고 예측 불가능한 모험"}. (표준 장르의 틀보다 이 줄거리를 엄격히 따르세요).`;
    }
    
    const isSliceOfLife = selectedGenre.includes("코미디") || selectedGenre.includes("하이틴") || selectedGenre.includes("일상");

    // Guardrails to prevent everything becoming "Quantum Sci-Fi"
    const guardrails = `
    부정적 제약 조건:
    1. 장르가 "다크 SF" 또는 "슈퍼히어로 액션" 또는 "직접 입력"이 아닌 경우: "양자", "타임라인", "포털", "멀티버스", "싱귤래리티"와 같은 기술적 전문 용어를 사용하지 마세요.
    2. 장르가 "하이틴 드라마" 또는 "유쾌한 코미디"인 경우: "위기"는 사회적, 감정적 또는 개인적이어야 합니다 (예: 소문, 경쟁, 깨진 약속, 지각, 망신). 생사가 걸린 문제로 만들지 마세요. 현실적으로 유지하세요.
    3. 이전에 설정되지 않은 한 "유물"이나 "장치"를 피하세요.
    `;

    // BASE INSTRUCTION: Strictly enforce language for output text.
    let instruction = `이야기를 계속하세요. 모든 출력 텍스트(캡션, 대사, 선택지)는 반드시 ${langName.toUpperCase()}로 작성해야 합니다. ${coreDriver} ${guardrails} ${branchingInstruction}`;
    if (richMode) {
        instruction += " 소설 모드 활성화됨. 짧은 대사보다 캐릭터의 깊은 생각, 묘사적인 캡션, 의미 있는 대화 교환을 우선시하세요.";
    }

    if (selectedStoryType === 'series') {
        instruction += " 이 이야기는 연재물(Series)입니다. 이번 이슈에서 모든 갈등을 해결하려 하지 말고, 다음 호를 기대하게 만드는 복선과 긴장감을 유지하세요.";
    } else {
        instruction += " 이 이야기는 단편(One-shot)입니다. 정해진 페이지 내에서 기승전결을 갖추고 이야기를 완결성 있게 마무리하세요.";
    }

    if (isAdult) {
        instruction += " 성인 전용(19+) 콘텐츠입니다. 성숙하고 복잡한 주제, 강렬한 감정 묘사, 그리고 장르에 적합한 수위의 표현을 허용하되, 불필요하게 자극적이기보다는 서사적 깊이에 집중하세요.";
    }

    if (isFinalPage && panelIndex === totalPanels - 1) {
        instruction += " 마지막 페이지의 마지막 패널. 업보에 따른 클리프행어가 필요합니다. 3페이지에서의 사용자 선택을 서사에서 명시적으로 언급하고, 그 특정 철학이 어떻게 이 결론으로 이어졌는지 보여주세요. 텍스트는 '계속될 예정...' (또는 해당 언어의 동등한 표현)으로 끝나야 합니다.";
    } else if (isDecisionPage && panelIndex === totalPanels - 1) {
        instruction += " 매우 중요하고 복잡한 도덕적/전략적 선택으로 끝내세요. (예: 다수를 위한 희생 vs 소중한 한 사람의 구원, 평화를 위한 거짓 vs 고통스러운 진실). 선택지는 단순히 행동이 아니라 캐릭터의 운명과 이야기의 '어두움 정도'에 큰 영향을 미쳐야 합니다. 선택지의 결과가 극명하게 갈리도록 설계하세요.";
    } else {
        // Neutralized Narrative Arc to avoid forcing "scary mystery" tones if the genre doesn't call for it.
        if (pageNum === 1) {
            instruction += " 발단. 현상을 깨뜨리는 사건이 발생합니다. 장르의 의도된 분위기를 설정하세요. (일상물인 경우: 사회적 문제/놀람. 모험물인 경우: 행동 촉구).";
        } else if (pageNum <= 4) {
            instruction += " 전개. 영웅들이 새로운 상황에 처합니다. 대화, 캐릭터 역학 및 초기 도전에 집중하세요.";
        } else if (pageNum <= 8) {
            instruction += " 위기. 반전이 일어납니다! 비밀이 밝혀지거나, 오해가 깊어지거나, 길이 막힙니다. (장르에 적절한 강도를 유지하세요 - 예: 코미디는 사회적 어색함, 호러는 위험).";
        } else {
            instruction += " 절정. 주요 갈등과의 대면. 진실이 밝혀지거나, 경쟁이 끝나거나, 전투가 벌어집니다.";
        }
    }

    if (totalPanels > 1) {
        instruction += ` 현재 페이지 ${pageNum}의 패널 ${panelIndex + 1}/${totalPanels}을 작성 중입니다. 이전 패널들과의 연속성을 유지하세요.`;
    }

    // Dynamic text limits based on richMode
    const capLimit = richMode ? "최대 35단어. 상세한 서사 또는 내면 독백" : "최대 15단어";
    const diaLimit = richMode ? "최대 30단어. 풍부하고 캐릭터 중심적인 대화" : "최대 12단어";

    const prompt = `
당신은 만화책 스크립트를 작성하고 있습니다. ${MAX_STORY_PAGES}페이지 중 ${pageNum}페이지의 패널 ${panelIndex + 1}입니다.
텍스트 대상 언어: ${langName} (중요: 캡션, 대사, 선택지는 반드시 이 언어로 작성해야 합니다).
${coreDriver}

캐릭터:
- 주인공: ${heroInfo}
- 조연: ${coStarInstruction}
- 엑스트라: ${extrasInstruction}

이전 패널 (주의 깊게 읽으세요):
${historyText.length > 0 ? historyText : "모험을 시작하세요."}

규칙:
1. 반복 금지. 이전 페이지의 캡션이나 대사를 그대로 사용하지 마세요.
2. 조연이 활성 상태라면 자주 등장해야 합니다.
3. 다양성. 이전 페이지가 액션 샷이었다면 이번 페이지는 반응 샷이나 와이드 샷으로 만드세요.
4. 언어: 모든 사용자용 텍스트는 반드시 ${langName}로 작성해야 합니다.
5. 텍스트 캡션에서 "조연"이나 "주인공"이라고 부르지 마세요. 이름이 설정되었다면 이름을 사용하고, 그렇지 않으면 일반적인 묘사를 사용하세요.

지침: ${instruction}

엄격히 JSON으로만 출력하세요 (마크다운 형식 금지):
{
  "caption": "${langName}로 된 독특한 내레이터 텍스트. (${capLimit}).",
  "dialogue": "${langName}로 된 독특한 대사. (${diaLimit}). 선택 사항.",
  "scene": "생생한 시각적 묘사 (아티스트 모델을 위해 항상 영어로 작성). 주인공이나 조연이 있는 경우 반드시 'HERO' 또는 'CO-STAR'를 언급해야 합니다. 여러 조연이 있는 경우 'CO-STAR 1', 'CO-STAR 2' 등으로 구분하세요.",
  "focus_char": "hero" 또는 "friend" 또는 "other",
  "choices": ["${langName}로 된 옵션 A", "${langName}로 된 옵션 B"] (결정 페이지의 마지막 패널인 경우에만)
}
`;
    if (isCreditDepletedRef.current) {
      throw new Error("Credit depleted (402)");
    }

    try {
        const ai = getAI();
        const res = await callGeminiWithRetry(
          () => ai.models.generateContent({ model: MODEL_TEXT_NAME, contents: prompt, config: { responseMimeType: 'application/json' } }),
          3,
          2000
        );
        let rawText = res.text || "{}";
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const parsed = JSON.parse(rawText);
        
        if (parsed.dialogue) parsed.dialogue = parsed.dialogue.replace(/^[\w\s\-]+:\s*/i, '').replace(/["']/g, '').trim();
        if (parsed.caption) parsed.caption = parsed.caption.replace(/^[\w\s\-]+:\s*/i, '').trim();
        if (!isDecisionPage || panelIndex !== totalPanels - 1) parsed.choices = [];
        if (isDecisionPage && panelIndex === totalPanels - 1 && !isFinalPage && (!parsed.choices || parsed.choices.length < 2)) parsed.choices = ["선택지 A", "선택지 B"];
        if (!['hero', 'friend', 'other'].includes(parsed.focus_char)) parsed.focus_char = 'hero';

        return parsed as Beat;
    } catch (e: any) {
        if (isBillingOrCreditDepletedError(e) || isCreditDepletedRef.current) {
          console.warn("[서재온] 402 크레딧 소진으로 대본 생성이 중단되었습니다.");
          handleAPIError(e);
          throw e;
        }
        console.error("Beat generation failed", e);
        handleAPIError(e);
        return { 
            caption: pageNum === 1 ? "이야기가 시작됩니다..." : "...", 
            scene: `Generic scene for page ${pageNum}.`, 
            focus_char: 'hero', 
            choices: [] 
        } as any;
    }
  };

  const generatePersona = async (desc: string): Promise<Persona> => {
      if (isCreditDepletedRef.current) {
        throw new Error("Credit depleted (402)");
      }
      const style = selectedArtStyle;
      try {
          const ai = getAI();
          const execute = async (model: string) => {
            return await ai.models.generateContent({
                model,
                contents: { text: `STYLE: Masterpiece ${style} character sheet, detailed ink, neutral background. FULL BODY. Character: ${desc}` },
                config: { imageConfig: { aspectRatio: '1:1' } }
            });
          };

          const res = await callGeminiWithRetry(
            () => execute(MODEL_IMAGE_GEN_NAME).catch(() => execute(MODEL_IMAGE_GEN_FALLBACK)),
            3,
            2500,
            (msg) => { setRateLimitNotice(msg); setTimeout(() => setRateLimitNotice(null), 6000); }
          );

          const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
          if (part?.inlineData?.data) return { base64: part.inlineData.data, desc };
          throw new Error("Failed to generate persona image");
      } catch (e: any) { 
        if (isBillingOrCreditDepletedError(e)) {
          console.warn("[서재온] 402 크레딧 소진으로 인물 생성이 중단되었습니다.");
          handleAPIError(e);
          throw e;
        }
        console.error("Persona generation failed", e);
        handleAPIError(e);
        throw e; 
      }
  };

  const generateImage = async (beat: Beat, type: ComicFace['type'], layout: LayoutType = 'splash'): Promise<string> => {
    if (isCreditDepletedRef.current) {
      return '';
    }

    const contents: any[] = [];
    if (heroRef.current?.base64) {
        contents.push({ text: "REFERENCE 1 [HERO]:" });
        contents.push({ inlineData: { mimeType: 'image/jpeg', data: heroRef.current.base64 } });
    }
    coStarsRef.current.forEach((cs, i) => {
        if (cs.base64) {
            contents.push({ text: `REFERENCE ${i + 2} [CO-STAR ${i + 1}]:` });
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: cs.base64 } });
        }
    });

    const styleEra = selectedArtStyle;
    const titleToUse = comicTitle || "무한한 영웅들";
    let promptText = `STYLE: ${styleEra} comic book art, detailed ink, vibrant colors. `;
    
    // Adjust visual style based on darkness level
    if (darknessLevel > 3) {
        promptText += "Heavy shadows, high contrast, grim atmosphere, muted colors. ";
    } else if (darknessLevel < -3) {
        promptText += "Bright lighting, soft colors, optimistic atmosphere, clean lines. ";
    }
    
    if (type === 'cover') {
        const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "한국어";
        promptText += `TYPE: Comic Book Cover. TITLE: "${titleToUse}" (OR LOCALIZED TRANSLATION IN ${langName.toUpperCase()}). Main visual: Dynamic action shot of [HERO] (Use REFERENCE 1).`;
    } else if (type === 'back_cover') {
        promptText += `TYPE: Comic Back Cover. FULL PAGE VERTICAL ART. Dramatic teaser. Text: "다음 호에 계속".`;
    } else {
        promptText += `TYPE: Comic panel. SCENE: ${beat.scene}. `;
        promptText += `INSTRUCTIONS: Maintain strict character likeness. If scene mentions 'HERO', you MUST use REFERENCE 1. If scene mentions 'CO-STAR' or 'SIDEKICK', you MUST use REFERENCE 2. DO NOT include any text, captions, or speech bubbles in the image itself. Focus purely on the visual storytelling.`;
    }

    contents.push({ text: promptText });

    const aspectRatio = (type === 'cover' || type === 'back_cover' || layout === 'splash') ? '2:3' : (layout === '2-panel' ? '3:2' : '1:1');

    try {
        const ai = getAI();
        const execute = async (model: string) => {
          return await ai.models.generateContent({
            model,
            contents: contents,
            config: { imageConfig: { aspectRatio } }
          });
        };

        const res = await callGeminiWithRetry(
          () => execute(MODEL_IMAGE_GEN_NAME).catch(() => execute(MODEL_IMAGE_GEN_FALLBACK)),
          3,
          2500,
          (msg) => { setRateLimitNotice(msg); setTimeout(() => setRateLimitNotice(null), 6000); }
        );

        const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        return part?.inlineData?.data ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : '';
    } catch (e: any) { 
        if (isBillingOrCreditDepletedError(e)) {
          console.warn("[서재온] 402 크레딧 소진으로 삽화 생성이 중단되었습니다.");
          handleAPIError(e);
          return '';
        }
        console.error("Image generation failed", e);
        handleAPIError(e);
        return ''; 
    }
  };

  const updateFaceState = (id: string, updates: Partial<ComicFace>) => {
      setComicFaces(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
      const idx = historyRef.current.findIndex(f => f.id === id);
      if (idx !== -1) historyRef.current[idx] = { ...historyRef.current[idx], ...updates };
  };

  const generateSinglePage = async (faceId: string, pageNum: number, type: ComicFace['type']) => {
      if (isCreditDepletedRef.current) {
        updateFaceState(faceId, { isLoading: false, loadingStatus: "크레딧 충전 필요 (402)" });
        return;
      }

      const isDecision = DECISION_PAGES.includes(pageNum);
      const layout = (type === 'cover' || type === 'back_cover') ? 'splash' : selectedLayout;
      const numPanels = layout === 'splash' ? 1 : (layout === '2-panel' ? 2 : 3);
      
      const initialStatus = pageNum === 0 ? "표지 구상 중..." : pageNum === BACK_COVER_PAGE ? "뒷표지 구상 중..." : `제 ${pageNum}화 스크립트 구상 중...`;
      updateFaceState(faceId, { isLoading: true, loadingProgress: 5, loadingStatus: initialStatus, layout, isDecisionPage: isDecision });
      setBgGenInfo({
          isGenerating: true,
          currentPageIndex: pageNum,
          progress: 5,
          statusText: initialStatus,
          activeSlotId: activeSlotRef.current
      });

      const beats: Beat[] = [];
      const currentHistory = [...historyRef.current];

      try {
          // 1. Generate all beats for the page sequentially (to maintain flow)
          for (let i = 0; i < numPanels; i++) {
              if (isCreditDepletedRef.current) {
                throw new Error("Credit depleted (402)");
              }
              const panelStatus = `패널 ${i+1}/${numPanels} 대사 및 연출 구상 중...`;
              const progressVal = Math.round(((i + 1) / (numPanels * 2)) * 50);
              updateFaceState(faceId, { loadingProgress: progressVal, loadingStatus: panelStatus });
              setBgGenInfo({
                  isGenerating: true,
                  currentPageIndex: pageNum,
                  progress: progressVal,
                  statusText: `제 ${pageNum}화 ${panelStatus}`,
                  activeSlotId: activeSlotRef.current
              });
              
              let beat: Beat;
              if (type === 'cover') {
                  beat = { scene: "Cover art", focus_char: 'hero' };
              } else if (type === 'back_cover') {
                  beat = { scene: "Thematic teaser image", focus_char: 'other' };
              } else {
                  // We pass the temporary page history to maintain flow within the page
                  const tempFace: ComicFace = { id: 'temp', type: 'story', panels: beats.map(b => ({ narrative: b })), choices: [], isLoading: false, pageIndex: pageNum, layout };
                  beat = await generateBeat([...currentHistory, tempFace], pageNum % 2 === 0, pageNum, isDecision, i, numPanels);
              }

              if (beat.focus_char === 'friend' && coStarsRef.current.length === 0 && type === 'story') {
                  try {
                      const newSidekick = await generatePersona(selectedGenre === '직접 입력' ? "A fitting sidekick for this story" : `Sidekick for ${selectedGenre} story.`);
                      setCoStars([newSidekick]);
                  } catch (e) { beat.focus_char = 'other'; }
              }
              beats.push(beat);
          }

          // 2. Generate images sequentially to respect API quotas safely
          updateFaceState(faceId, { loadingProgress: 50, loadingStatus: "삽화 생성 중..." });
          setBgGenInfo({
              isGenerating: true,
              currentPageIndex: pageNum,
              progress: 50,
              statusText: `제 ${pageNum}화 삽화 스케치 중...`,
              activeSlotId: activeSlotRef.current
          });
          
          const imageUrls: string[] = [];
          for (let i = 0; i < beats.length; i++) {
              if (isCreditDepletedRef.current) {
                throw new Error("Credit depleted (402)");
              }
              const imageStatus = beats.length > 1 ? `패널 ${i + 1}/${beats.length} 삽화 완성 중...` : "삽화 렌더링 중...";
              const progressVal = Math.round(50 + ((i + 1) / beats.length) * 45);
              updateFaceState(faceId, { 
                loadingProgress: progressVal, 
                loadingStatus: imageStatus 
              });
              setBgGenInfo({
                  isGenerating: true,
                  currentPageIndex: pageNum,
                  progress: progressVal,
                  statusText: `제 ${pageNum}화 ${imageStatus}`,
                  activeSlotId: activeSlotRef.current
              });
              const url = await generateImage(beats[i], type, layout);
              imageUrls.push(url);
          }

          const panels: PanelData[] = beats.map((beat, i) => ({
              narrative: beat,
              imageUrl: imageUrls[i]
          }));

          const lastBeat = beats[beats.length - 1];
          if (lastBeat.choices && lastBeat.choices.length > 0) {
              updateFaceState(faceId, { choices: lastBeat.choices });
          }

          updateFaceState(faceId, { isLoading: false, loadingProgress: 100, loadingStatus: "완료!", panels });
      } catch (e: any) {
          const is402 = isBillingOrCreditDepletedError(e);
          if (is402) {
            console.warn(`[서재온] 제 ${pageNum}화 생성 중 402 크레딧 소진.`);
            handleAPIError(e);
          } else {
            console.error("Page generation failed", e);
          }
          updateFaceState(faceId, { 
            isLoading: false, 
            loadingStatus: is402 ? "크레딧 충전 필요 (402)" : "오류 발생 (재시도 가능)" 
          });
      } finally {
          generatingPages.current.delete(pageNum);
          if (generatingPages.current.size <= 1) {
              setBgGenInfo(null);
          }
      }
  };

  const generateBatch = async (startPage: number, count: number) => {
      if (isCreditDepletedRef.current) return;
      const pagesToGen: number[] = [];
      for (let i = 0; i < count; i++) {
          const p = startPage + i;
          if (p <= TOTAL_PAGES && !generatingPages.current.has(p)) {
              pagesToGen.push(p);
          }
      }
      
      if (pagesToGen.length === 0) return;
      pagesToGen.forEach(p => generatingPages.current.add(p));

      try {
          for (const pageNum of pagesToGen) {
              if (isCreditDepletedRef.current) break;
              await generateSinglePage(`page-${pageNum}`, pageNum, pageNum === BACK_COVER_PAGE ? 'back_cover' : 'story');
              generatingPages.current.delete(pageNum);
          }
      } catch (e: any) {
          if (!isBillingOrCreditDepletedError(e)) {
            console.error("Batch generation error", e);
          }
      } finally {
          pagesToGen.forEach(p => generatingPages.current.delete(p));
          if (generatingPages.current.size === 0) {
              setBgGenInfo(null);
          }
      }
  };

  // Continuous Background Illustration Completion Pipeline
  useEffect(() => {
      if (!isStarted || isTransitioning || showSetup || isCreditDepleted || isCreditDepletedRef.current) return;

      // Don't start another page if one is currently in flight
      if (generatingPages.current.size > 0) return;

      const checkAndTriggerNextBackgroundPage = async () => {
          if (isCreditDepletedRef.current || isCreditDepleted) return;
          if (generatingPages.current.size > 0) return;

          // Find the earliest ungenerated page
          for (let p = 1; p <= TOTAL_PAGES; p++) {
              if (isCreditDepletedRef.current || isCreditDepleted) break;
              const face = comicFaces.find(f => f.pageIndex === p);
              const isPageComplete = face && face.panels && face.panels.length > 0 && face.panels.every(panel => Boolean(panel.imageUrl)) && !face.isLoading;

              if (isPageComplete) {
                  continue; // Already completed
              }

              // Check branching / decision blockers:
              if (p > 3) {
                  const page3 = comicFaces.find(f => f.pageIndex === 3);
                  if (!page3 || !page3.resolvedChoice) {
                      break;
                  }
              }

              if (p > 6) {
                  const page6 = comicFaces.find(f => f.pageIndex === 6);
                  if (!page6 || !page6.resolvedChoice) {
                      break;
                  }
              }

              // Found the next target page to pre-render in the background
              if (!generatingPages.current.has(p)) {
                  generateBatch(p, 1);
              }
              break;
          }
      };

      const timer = setTimeout(checkAndTriggerNextBackgroundPage, 1200);
      return () => clearTimeout(timer);
  }, [isStarted, isTransitioning, showSetup, comicFaces, isCreditDepleted]);

  const launchStory = async () => {
    // --- API KEY VALIDATION ---
    const hasKey = await validateApiKey();
    if (!hasKey) return; // Stop if cancelled or invalid
    
    if (!heroRef.current) return;
    if (selectedGenre === '직접 입력' && !customPremise.trim()) {
        alert("이야기 줄거리를 입력해 주세요.");
        return;
    }
    setIsTransitioning(true);
    
    let availableTones = TONES;
    if (selectedGenre === "하이틴 드라마 / 일상" || selectedGenre === "유쾌한 코미디") {
        availableTones = TONES.filter(t => t.includes("일상적인") || t.includes("따뜻한") || t.includes("재치 있는"));
    } else if (selectedGenre === "고전 호러") {
        availableTones = TONES.filter(t => t.includes("내면 독백") || t.includes("오페라틱"));
    }
    
    setStoryTone(availableTones[Math.floor(Math.random() * availableTones.length)]);

    // Generate title if blank
    if (!comicTitle.trim()) {
        try {
            const ai = getAI();
            const res = await callGeminiWithRetry(
              () => ai.models.generateContent({
                model: MODEL_TEXT_NAME,
                contents: `장르: ${selectedGenre}, 줄거리: ${customPremise || "영웅의 모험"}. 이 정보를 바탕으로 멋진 한국어 만화 제목을 하나만 지어주세요. 제목만 간결하게 출력하세요.`,
              }),
              2,
              1500
            );
            if (res.text) setComicTitle(res.text.trim().replace(/"/g, ''));
        } catch (e) {
            setComicTitle("무한한 영웅들");
        }
    }

    // Initialize all pages upfront so no page ever renders as blank / black
    const initialFaces: ComicFace[] = [];
    for (let i = 0; i <= TOTAL_PAGES; i++) {
        const type = i === 0 ? 'cover' : (i === BACK_COVER_PAGE ? 'back_cover' : 'story');
        initialFaces.push({
            id: i === 0 ? 'cover' : `page-${i}`,
            type,
            choices: [],
            isLoading: true,
            pageIndex: i,
            layout: (i === 0 || i === BACK_COVER_PAGE) ? 'splash' : selectedLayout,
            panels: [],
            loadingStatus: i === 0 ? '표지 인쇄 중...' : (i === BACK_COVER_PAGE ? '뒷표지 준비 중...' : `제 ${i} 페이지 준비 중...`),
            loadingProgress: 0
        });
    }

    setComicFaces(initialFaces);
    historyRef.current = initialFaces;
    generatingPages.current.add(0);

    generateSinglePage('cover', 0, 'cover').finally(() => generatingPages.current.delete(0));
    
    setTimeout(async () => {
        setIsStarted(true);
        setShowSetup(false);
        setIsTransitioning(false);
        // Generate the first reading spread (Pages 1 & 2) progressively
        await generateBatch(1, 2);
    }, 1100);
  };

  const handleChoice = async (pageIndex: number, choice: string) => {
      updateFaceState(`page-${pageIndex}`, { resolvedChoice: choice });
      
      let score = 0;
      let moralLabel = "선택 완료";
      let description = "";

      // Analyze choice for branching narrative
      try {
          const ai = getAI();
          const analysisPrompt = `만화 속 주인공의 행동 선택을 분석하세요: "${choice}".
이 선택이 서사를 '밝고 희망적(이타적, 선함)'으로 이끄는지, 아니면 '어둡고 절망적(냉혹함, 파괴, 이기적)'으로 이끄는지 평가하세요.
점수 범위: -1.0 (매우 밝음/희망/빛) ~ +1.0 (매우 어두움/절망/어둠). 0은 중립/균형.

반드시 다음 JSON 형식으로만 응답하세요:
{
  "score": -0.8,
  "moralLabel": "짧은 한국어 칭호 (예: 빛의 결단, 이타적 희생, 실리적 타협, 냉혹한 심판, 어둠의 유혹)",
  "description": "서사에 미치는 영향에 대한 한국어 1문장 요약"
}`;
          const res = await callGeminiWithRetry(
            () => ai.models.generateContent({ 
              model: MODEL_TEXT_NAME, 
              contents: analysisPrompt,
              config: { responseMimeType: "application/json" }
            }),
            2,
            1500
          );

          if (res.text) {
              const cleanJson = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleanJson);
              if (typeof parsed.score === 'number' && !isNaN(parsed.score)) {
                  score = Math.max(-1, Math.min(1, parsed.score));
              }
              if (parsed.moralLabel) moralLabel = parsed.moralLabel;
              if (parsed.description) description = parsed.description;
          }
      } catch (e: any) { 
          if (isBillingOrCreditDepletedError(e)) {
            console.warn("[서재온] 402 크레딧 소진으로 선택지 분석을 휴리스틱으로 대체합니다.");
          } else {
            console.error("Choice analysis failed, heuristic fallback", e);
          }
          const darkKeywords = ['죽', '처단', '복수', '파괴', '냉혹', '희생시키', '버리', '암흑', '어둠', '거짓', '무시'];
          const lightKeywords = ['구하', '살리', '설득', '화해', '용서', '돕', '지키', '희망', '함께', '자비', '보호'];
          const isDark = darkKeywords.some(k => choice.includes(k));
          const isLight = lightKeywords.some(k => choice.includes(k));
          score = isDark ? 0.7 : isLight ? -0.7 : 0.1;
          moralLabel = score < 0 ? '빛의 결단' : score > 0 ? '냉혹한 결단' : '신중한 대처';
          description = score < 0 ? '희망과 선의를 택하여 서사를 밝게 이끕니다.' : '냉혹한 현실을 택하여 서사에 긴장감을 더합니다.';
      }

      const roundedScore = Number(score.toFixed(2));
      const currentDarkness = darknessLevel;
      const newDarkness = Number(Math.max(-5, Math.min(5, currentDarkness + roundedScore)).toFixed(2));
      setDarknessLevel(newDarkness);

      const newRecord: MoralChoiceRecord = {
          pageIndex,
          choice,
          score: roundedScore,
          cumulativeDarkness: newDarkness,
          moralLabel,
          description,
          timestamp: Date.now()
      };

      setMoralHistory(prev => [...prev, newRecord]);

      if (pageIndex + 1 <= TOTAL_PAGES) {
          generateBatch(pageIndex + 1, 2);
      }
  };

  const resetApp = () => {
      setIsStarted(false);
      setShowSetup(true);
      setComicFaces([]);
      setCurrentSheetIndex(0);
      historyRef.current = [];
      generatingPages.current.clear();
      setHero(null);
      setCoStars([]);
      setExtrasDesc("");
      setComicTitle("");
      setMoralHistory([]);
      setDarknessLevel(0);
  };

  const handleLoadSampleBook = () => {
    setShowApiKeyDialog(false);
    setIsCreditDepleted(false);
    isCreditDepletedRef.current = false;
    generatingPages.current.clear();
    setBgGenInfo(null);

    setHero(SAMPLE_HERO);
    setCoStars([SAMPLE_CO_STAR]);
    setComicTitle("달빛 서재의 비밀");
    setSelectedGenre("감성 에디토리얼 소설");
    setSelectedArtStyle("에디토리얼 삽화 (Kinfolk)");
    setSelectedLanguage("ko");
    setSelectedLayout("splash");
    setSelectedStoryType("series");
    setStoryTone("온화하고 정온한 사색");
    setRichMode(true);
    setDarknessLevel(0);
    setMoralHistory([
      {
        pageIndex: 3,
        choice: "진실의 기록: 봉인을 해제하여 숨겨진 역사를 세상에 공개한다",
        score: -0.8,
        label: "진실의 수호자",
        description: "역사의 진실을 밝혀 사람들에게 빛을 전했습니다.",
        cumulativeDarkness: -0.8,
        timestamp: Date.now() - 60000
      },
      {
        pageIndex: 6,
        choice: "모두의 서재: 누구나 문턱 없이 머물 수 있는 공공 도서관으로 개방한다",
        score: -1.0,
        label: "온화한 나눔",
        description: "서재를 만인을 위한 열린 배움터로 바꿨습니다.",
        cumulativeDarkness: -1.8,
        timestamp: Date.now() - 30000
      }
    ]);
    setComicFaces(SAMPLE_COMIC_FACES);
    historyRef.current = SAMPLE_COMIC_FACES;
    setCurrentSheetIndex(0);
    setIsStarted(true);
    setShowSetup(false);
    setIsTransitioning(false);
    setSaveStatus("샘플 서재 완권 탑재");
    setTimeout(() => setSaveStatus(""), 3000);
  };

  const downloadPDF = () => {
    const PAGE_WIDTH = 480;
    const PAGE_HEIGHT = 720;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [PAGE_WIDTH, PAGE_HEIGHT] });
    const pagesToPrint = comicFaces.filter(face => face.panels && face.panels.length > 0 && face.panels.every(p => p.imageUrl) && !face.isLoading).sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

    pagesToPrint.forEach((face, index) => {
        if (index > 0) doc.addPage([PAGE_WIDTH, PAGE_HEIGHT], 'portrait');
        const numPanels = face.panels.length;
        const panelHeight = PAGE_HEIGHT / numPanels;
        face.panels.forEach((panel, pIdx) => {
            if (panel.imageUrl) {
                doc.addImage(panel.imageUrl, 'JPEG', 0, pIdx * panelHeight, PAGE_WIDTH, panelHeight);
            }
        });
    });
    doc.save(`${comicTitle || '무한한-영웅들'}.pdf`);
  };

  const handleHeroUpload = async (file: File) => {
       try { const base64 = await fileToBase64(file); setHero({ base64, desc: "주인공", name: "", personality: "" }); } catch (e) { alert("주인공 업로드 실패"); }
  };
  const handleAddCoStar = async (file: File) => {
       try { 
           const base64 = await fileToBase64(file); 
           setCoStars([...coStars, { base64, desc: `조연 ${coStars.length + 1}`, name: "", personality: "" }]); 
       } catch (e) { alert("조연 업로드 실패"); }
  };
  const handleRemoveCoStar = (index: number) => {
      setCoStars(coStars.filter((_, i) => i !== index));
  };

  const updateHeroInfo = (name: string, personality: string) => {
    if (heroRef.current) {
      setHero({ ...heroRef.current, name, personality });
    }
  };

  const updateCoStarInfo = (index: number, name: string, personality: string) => {
    const newList = [...coStarsRef.current];
    if (newList[index]) {
      newList[index] = { ...newList[index], name, personality };
      setCoStars(newList);
    }
  };

  const totalSheets = 6;

  const handlePrevPage = () => {
      if (currentSheetIndex > 0) {
          setCurrentSheetIndex(prev => prev - 1);
      }
  };

  const handleNextPage = () => {
      if (currentSheetIndex < totalSheets) {
          const next = currentSheetIndex + 1;
          setCurrentSheetIndex(next);
          const startP = next === 0 ? 0 : (next - 1) * 2 + 1;
          if (startP <= TOTAL_PAGES) {
              generateBatch(startP, 2);
          }
      }
  };

  const handleSheetClick = (index: number) => {
      if (!isStarted) return;
      if (index === 0 && currentSheetIndex === 0) {
          setCurrentSheetIndex(1);
          generateBatch(1, 2);
          return;
      }
      if (index < currentSheetIndex) {
          setCurrentSheetIndex(index);
      } else {
          handleNextPage();
      }
  };

  // --- Bookmark / Scrapbook Handlers ---
  const handleToggleBookmark = (pageIndex: number, panelIndex: number, panel: PanelData) => {
    const isSaved = isPanelBookmarked(activeSlot, pageIndex, panelIndex);
    if (isSaved) {
      const updated = removeBookmarkByCoords(activeSlot, pageIndex, panelIndex);
      setBookmarks(updated);
      setSaveStatus("🗑️ 스크랩북에서 제외되었습니다");
      const t = setTimeout(() => setSaveStatus(""), 2000);
    } else {
      const newBookmark: BookmarkedPanel = {
        id: `slot-${activeSlot}-p${pageIndex}-i${panelIndex}-${Date.now()}`,
        slotId: activeSlot,
        comicTitle: comicTitle || "무한한 영웅들",
        pageIndex,
        panelIndex,
        imageUrl: panel.imageUrl || "",
        caption: panel.narrative?.caption,
        dialogue: panel.narrative?.dialogue,
        scene: panel.narrative?.scene,
        focusChar: panel.narrative?.focus_char,
        timestamp: Date.now()
      };
      const updated = addBookmark(newBookmark);
      setBookmarks(updated);
      setSaveStatus("⭐ 스크랩북에 저장되었습니다!");
      const t = setTimeout(() => setSaveStatus(""), 2000);
    }
  };

  const isBookmarkedCheck = (pageIndex: number, panelIndex: number) => {
    return isPanelBookmarked(activeSlot, pageIndex, panelIndex);
  };

  const handleUpdateBookmarkNote = (id: string, note: string) => {
    const updated = updateBookmarkNote(id, note);
    setBookmarks(updated);
  };

  const handleRemoveBookmark = (id: string) => {
    const updated = removeBookmark(id);
    setBookmarks(updated);
  };

  const handleClearAllBookmarks = () => {
    saveBookmarkedPanels([]);
    setBookmarks([]);
    setSaveStatus("스크랩북 비워짐");
    const t = setTimeout(() => setSaveStatus(""), 2000);
  };

  const handleJumpToPageFromScrapbook = (targetPage: number) => {
    let sheet = 0;
    if (targetPage === 0) sheet = 0;
    else if (targetPage <= 2) sheet = 1;
    else if (targetPage <= 4) sheet = 2;
    else if (targetPage <= 6) sheet = 3;
    else if (targetPage <= 8) sheet = 4;
    else if (targetPage <= 10) sheet = 5;
    else sheet = 6;

    setCurrentSheetIndex(sheet);
    const startP = sheet === 0 ? 0 : (sheet - 1) * 2 + 1;
    if (startP <= TOTAL_PAGES) {
      generateBatch(startP, 2);
    }
  };

  // --- Slideshow Reading Engine ---
  const getVisiblePagesForSheet = (sheetIdx: number): number[] => {
    if (sheetIdx === 0) return [0];
    if (sheetIdx === 1) return [1, 2];
    if (sheetIdx === 2) return [3, 4];
    if (sheetIdx === 3) return [5, 6];
    if (sheetIdx === 4) return [7, 8];
    if (sheetIdx === 5) return [9, 10];
    return [BACK_COVER_PAGE];
  };

  const getSheetReadingDuration = (sheetIdx: number, mode: SlideshowSpeedMode, faces: ComicFace[]): number => {
    if (mode === 'fast') return 5;
    if (mode === 'normal') return 9;
    if (mode === 'relaxed') return 14;

    // 'smart' mode: analyze text length
    const pages = getVisiblePagesForSheet(sheetIdx);
    let totalCharCount = 0;
    pages.forEach(p => {
      const face = faces.find(f => f.pageIndex === p);
      if (face && face.panels) {
        face.panels.forEach(pan => {
          if (pan.narrative?.caption) totalCharCount += pan.narrative.caption.length;
          if (pan.narrative?.dialogue) totalCharCount += pan.narrative.dialogue.length;
        });
      }
    });

    const calculated = 6 + Math.round(totalCharCount / 14);
    return Math.max(6, Math.min(18, calculated));
  };

  const currentVisiblePages = getVisiblePagesForSheet(currentSheetIndex);

  const isWaitingForGeneration = isSlideshowActive && currentVisiblePages.some(p => {
    const face = comicFaces.find(f => f.pageIndex === p);
    return !face || face.isLoading || !face.panels || face.panels.length === 0 || !face.panels.every(pan => Boolean(pan.imageUrl));
  });

  const isWaitingForChoice = isSlideshowActive && currentVisiblePages.some(p => {
    const face = comicFaces.find(f => f.pageIndex === p);
    return Boolean(face && face.isDecisionPage && face.choices && face.choices.length > 0 && !face.resolvedChoice);
  });

  // Reset duration when sheet changes or speed mode changes
  useEffect(() => {
    if (!isSlideshowActive) return;
    const dur = getSheetReadingDuration(currentSheetIndex, slideshowSpeedMode, comicFaces);
    setSlideshowTotalDuration(dur);
    setSlideshowSecondsLeft(dur);
  }, [currentSheetIndex, isSlideshowActive, slideshowSpeedMode]);

  // Slideshow ticker
  useEffect(() => {
    if (!isSlideshowActive || isSlideshowPaused || isWaitingForGeneration || isWaitingForChoice) {
      return;
    }

    const interval = setInterval(() => {
      setSlideshowSecondsLeft(prev => {
        if (prev <= 0.25) {
          if (currentSheetIndex < totalSheets) {
            handleNextPage();
          } else {
            setIsSlideshowPaused(true);
            setSaveStatus("만화 완독 완료! 🎉");
            const t = setTimeout(() => setSaveStatus(""), 3500);
          }
          return 0;
        }
        return Math.max(0, prev - 0.2);
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isSlideshowActive, isSlideshowPaused, isWaitingForGeneration, isWaitingForChoice, currentSheetIndex]);

  const handleToggleSlideshow = () => {
    if (!isSlideshowActive) {
      setIsSlideshowActive(true);
      setIsSlideshowPaused(false);
      const startingSheet = currentSheetIndex >= totalSheets ? 0 : currentSheetIndex;
      if (currentSheetIndex >= totalSheets) {
        setCurrentSheetIndex(0);
      }
      const dur = getSheetReadingDuration(startingSheet, slideshowSpeedMode, comicFaces);
      setSlideshowTotalDuration(dur);
      setSlideshowSecondsLeft(dur);
    } else {
      setIsSlideshowPaused(prev => !prev);
    }
  };

  const handleCloseSlideshow = () => {
    setIsSlideshowActive(false);
    setIsSlideshowPaused(false);
  };

  const handleSlideshowSpeedChange = (mode: SlideshowSpeedMode) => {
    setSlideshowSpeedMode(mode);
    const dur = getSheetReadingDuration(currentSheetIndex, mode, comicFaces);
    setSlideshowTotalDuration(dur);
    setSlideshowSecondsLeft(dur);
  };

  return (
    <div className="comic-scene">
      {showApiKeyDialog && (
        <ApiKeyDialog 
          onContinue={handleApiKeyDialogContinue} 
          isCreditDepleted={isCreditDepleted}
          onClose={() => setShowApiKeyDialog(false)}
          onUseOfflineDemo={handleLoadSampleBook}
        />
      )}

      {/* Rate limit notification toast */}
      {rateLimitNotice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 glass-card px-4 py-2 text-xs font-semibold text-amber-800 bg-amber-50/95 border border-amber-300 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
          <span>⏳</span>
          <span>{rateLimitNotice}</span>
        </div>
      )}
      
      {/* Darkness Meter & Side Status (반응형: 모바일에서는 상단 중앙 컴팩트, 데스크탑에서는 좌측 사이드) */}
      {isStarted && !showSetup && (
          <div className="fixed top-3 sm:top-5 left-3 sm:left-5 z-40 flex items-center gap-1.5 sm:gap-2 max-w-[calc(100vw-24px)]">
              <div 
                  onClick={() => setShowMoralModal(true)}
                  title="클릭하여 도덕적 궤적 상세 분석 열기"
                  className="w-44 sm:w-60 bg-[#FAF9F6]/95 backdrop-blur-md p-2 sm:p-2.5 rounded-xl flex flex-col gap-1 shadow-sm border border-stone-200 cursor-pointer hover:bg-white transition-all hover:scale-[1.01]"
              >
                  <div className="flex justify-between items-center w-full px-0.5">
                      <span className="text-[9px] sm:text-[10px] font-semibold text-amber-700 flex items-center gap-0.5">
                        <span>☀️</span> <span className="hidden xs:inline">온기</span>
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-stone-700 flex items-center gap-1 font-serif-kr">
                        <span>서사 기류</span>
                        <span className="text-[8px] sm:text-[9px] text-stone-400 font-normal">({moralHistory.length})</span>
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-semibold text-[#E8636F] flex items-center gap-0.5">
                        <span className="hidden xs:inline">냉혹</span> <span>🌙</span>
                      </span>
                  </div>
                  <div className="w-full h-1.5 sm:h-2 bg-stone-200 rounded-full overflow-hidden relative">
                      <div 
                          className={`h-full transition-all duration-1000 ease-out rounded-full ${darknessLevel > 0 ? 'bg-[#E8636F]' : 'bg-[#E8A0A7]'}`}
                          style={{ 
                              width: `${Math.abs(darknessLevel) * 20}%`,
                              marginLeft: darknessLevel >= 0 ? '50%' : `${50 - Math.abs(darknessLevel) * 20}%`
                          }}
                      ></div>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-stone-400"></div>
                  </div>
              </div>

              <button
                  onClick={() => setShowMoralModal(true)}
                  title="서사 궤적 분석 열기"
                  className="btn-apple btn-apple-glass text-[11px] sm:text-xs font-semibold py-1.5 sm:py-2 px-2.5 sm:px-3 shadow-2xs flex items-center gap-1 bg-[#FAF9F6]/95 border-stone-200 hover:bg-white shrink-0 font-serif-kr"
              >
                  <span>📊</span>
                  <span className="hidden sm:inline">서사 분석</span>
              </button>
          </div>
      )}

      {/* Bottom Reading Navigation Controls (BOOTIN SEOJAE ON 스타일) */}
      {isStarted && !showSetup && (
          <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 sm:gap-2 bg-[#FAF9F6]/95 backdrop-blur-md px-3 sm:px-4 py-2 shadow-xl border border-stone-200 rounded-2xl max-w-[95vw]">
              <button 
                  onClick={handlePrevPage} 
                  disabled={currentSheetIndex === 0}
                  className="btn-apple btn-apple-secondary text-[11px] sm:text-xs py-1.5 sm:py-2 px-2.5 sm:px-3.5 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 border-stone-200"
              >
                  ◀ <span className="hidden xs:inline">이전 쪽</span>
              </button>

              <div className="flex flex-col items-center min-w-[85px] sm:min-w-[130px] px-1">
                  <div className="flex items-center gap-1">
                      <span className="font-bold text-[11px] sm:text-[13px] text-stone-900 whitespace-nowrap font-serif-kr">
                          {currentSheetIndex === 0 && "표지"}
                          {currentSheetIndex === 1 && "제 1-2 쪽"}
                          {currentSheetIndex === 2 && "제 3-4 쪽"}
                          {currentSheetIndex === 3 && "제 5-6 쪽"}
                          {currentSheetIndex === 4 && "제 7-8 쪽"}
                          {currentSheetIndex === 5 && "제 9-10 쪽"}
                          {currentSheetIndex >= 6 && "뒷표지"}
                      </span>
                      {saveStatus && (
                          <span className="bg-[#E8636F]/10 text-[#E8636F] border border-[#E8636F]/20 text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full hidden sm:inline">
                              {saveStatus}
                          </span>
                      )}
                  </div>
                  <span className="text-[9px] sm:text-[11px] text-stone-500 font-medium truncate max-w-[90px] sm:max-w-[140px] font-serif-kr">
                      {comicTitle || "서재온 이야기"}
                  </span>
              </div>

              <button 
                  onClick={handleNextPage} 
                  disabled={currentSheetIndex >= totalSheets}
                  className="btn-apple btn-apple-primary text-[11px] sm:text-xs py-1.5 sm:py-2 px-2.5 sm:px-3.5 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs shrink-0 bg-[#E8636F] hover:bg-[#D94F5C] text-white"
              >
                  <span className="hidden xs:inline">다음 쪽</span> ▶
              </button>

              <div className="h-5 w-px bg-stone-200 mx-0.5 hidden sm:block"></div>

              {/* Slideshow Auto-Reading Toggle Button */}
              <button 
                  onClick={handleToggleSlideshow}
                  title={isSlideshowActive ? (isSlideshowPaused ? "자동 읽기 계속" : "자동 읽기 일시정지") : "자동 쪽 넘김(슬라이드쇼) 시작"}
                  className={`btn-apple text-[11px] sm:text-xs py-1.5 px-2 sm:px-2.5 flex items-center gap-1 shadow-2xs shrink-0 font-bold transition-all ${
                      isSlideshowActive
                          ? 'bg-[#E8636F] text-white shadow-[#E8636F]/20'
                          : 'btn-apple-glass text-stone-700 hover:text-stone-900 border-stone-200'
                  }`}
              >
                  <span>{isSlideshowActive ? (isSlideshowPaused ? '▶️' : '⏸️') : '▶️'}</span>
                  <span className="hidden md:inline font-serif-kr">{isSlideshowActive ? (isSlideshowPaused ? '일시정지' : '자동 읽기') : '자동 읽기'}</span>
              </button>

              {/* Scrapbook Modal Trigger Button */}
              <button 
                  onClick={() => setShowScrapbookModal(true)}
                  title="패널 스크랩북 (명장면 보관함) 열기"
                  className="btn-apple btn-apple-glass text-[11px] sm:text-xs py-1.5 px-2 sm:px-2.5 flex items-center gap-1 shadow-2xs font-semibold shrink-0 relative hover:bg-stone-50 border-stone-200"
              >
                  <span>🔖</span>
                  <span className="hidden md:inline font-serif-kr">스크랩북</span>
                  {bookmarks.length > 0 && (
                      <span className="bg-[#E8636F]/10 text-[#E8636F] text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-[#E8636F]/20">
                          {bookmarks.length}
                      </span>
                  )}
              </button>

              {/* Slot Manager Button */}
              <button 
                  onClick={() => setShowSlotModal(true)}
                  title="저장 서랍 관리"
                  className="btn-apple btn-apple-glass text-[11px] sm:text-xs py-1.5 px-2 sm:px-2.5 flex items-center gap-1 shadow-2xs shrink-0 relative border-stone-200"
              >
                  <span>📚</span>
                  <span className="hidden lg:inline font-semibold font-serif-kr">서랍 {activeSlot}</span>
                  {bgGenInfo?.isGenerating && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8636F] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E8636F]"></span>
                      </span>
                  )}
              </button>

              <button 
                  onClick={() => setShowDossier(true)}
                  title="등장인물 프로필 카드 열기"
                  className="btn-apple btn-apple-glass text-[11px] sm:text-xs py-1.5 px-2 sm:px-2.5 flex items-center gap-1 shadow-xs font-semibold shrink-0"
              >
                  <span>👥</span>
                  <span className="hidden lg:inline">인물</span>
              </button>

              <button 
                  onClick={() => setShowMoralModal(true)}
                  title="도덕적 선택 궤적 차트 열기"
                  className="btn-apple btn-apple-glass text-[11px] sm:text-xs py-1.5 px-2 sm:px-2.5 flex items-center gap-1 shadow-xs font-semibold shrink-0"
              >
                  <span>📊</span>
                  <span className="hidden lg:inline">궤적</span>
              </button>

              <button 
                  onClick={downloadPDF}
                  title="PDF 다운로드"
                  className="btn-apple btn-apple-glass text-[11px] sm:text-xs py-1.5 px-2 sm:px-2.5 hidden sm:flex items-center gap-1 shadow-xs shrink-0"
              >
                  PDF
              </button>

              <button 
                  onClick={resetApp}
                  title="설정 화면으로 돌아가기"
                  className="text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors py-1.5 px-1.5 sm:px-2 rounded-lg shrink-0"
              >
                  설정
              </button>
          </div>
      )}

      {/* Background Illustration Completion Floating Animation Badge */}
      {bgGenInfo?.isGenerating && isStarted && (
          <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[160] flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl text-white px-3.5 sm:px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 animate-in fade-in slide-in-from-top-3 duration-300">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 shadow-md shrink-0">
                  <span className="text-sm animate-spin">🎨</span>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              </div>
              <div className="flex flex-col text-left">
                  <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                          슬롯 {activeSlot} • 백그라운드 삽화 제작 중
                      </span>
                      <span className="text-[11px] font-extrabold text-emerald-400">
                          {Math.round(bgGenInfo.progress)}%
                      </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-100 max-w-[180px] sm:max-w-[240px] truncate">
                      {bgGenInfo.statusText || `제 ${bgGenInfo.currentPageIndex}화 삽화 그리는 중...`}
                  </span>
              </div>
              <div className="w-12 sm:w-16 h-2 bg-white/20 rounded-full overflow-hidden ml-1 shrink-0">
                  <div 
                      className="h-full bg-gradient-to-r from-purple-400 via-indigo-400 to-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(10, bgGenInfo.progress)}%` }}
                  />
              </div>
          </div>
      )}

      {/* Slot Manager Modal */}
      <SlotManagerModal 
          isOpen={showSlotModal}
          onClose={() => setShowSlotModal(false)}
          currentActiveSlot={activeSlot}
          slots={slotsSummary}
          isCurrentlyInStory={isStarted}
          bgGenerationInfo={bgGenInfo}
          onSelectSlotToLoad={handleSelectSlotToLoad}
          onSaveCurrentToSlot={handleSaveCurrentToSlot}
          onStartNewInSlot={handleStartNewInSlot}
          onDeleteSlot={handleDeleteSlot}
          onAddNewSlot={handleAddNewSlot}
      />

      {/* Character Dossier Modal */}
      <CharacterDossier 
          isOpen={showDossier}
          onClose={() => setShowDossier(false)}
          hero={hero}
          coStars={coStars}
          extrasDesc={extrasDesc}
          comicTitle={comicTitle}
          selectedGenre={selectedGenre}
          selectedArtStyle={selectedArtStyle}
          storyTone={storyTone}
          isBeforeLaunch={!isStarted}
          onLaunchStory={launchStory}
          onUpdateHeroInfo={updateHeroInfo}
          onUpdateCoStarInfo={updateCoStarInfo}
      />

      {/* Moral Trajectory Chart Modal */}
      <MoralChartModal 
          isOpen={showMoralModal}
          onClose={() => setShowMoralModal(false)}
          moralHistory={moralHistory}
          darknessLevel={darknessLevel}
          comicTitle={comicTitle}
          heroName={hero?.name || "주인공"}
          selectedGenre={selectedGenre}
          storyTone={storyTone}
      />

      {/* Scrapbook Modal (명장면 패널 보관함) */}
      <ScrapbookModal 
          isOpen={showScrapbookModal}
          onClose={() => setShowScrapbookModal(false)}
          bookmarks={bookmarks}
          activeSlotId={activeSlot}
          onRemoveBookmark={handleRemoveBookmark}
          onUpdateNote={handleUpdateBookmarkNote}
          onJumpToPage={handleJumpToPageFromScrapbook}
          onClearAll={handleClearAllBookmarks}
      />

      {/* Slideshow Auto-Reading Mode Controls */}
      <SlideshowControls 
          isActive={isSlideshowActive && isStarted && !showSetup}
          isPaused={isSlideshowPaused}
          speedMode={slideshowSpeedMode}
          secondsRemaining={slideshowSecondsLeft}
          totalDuration={slideshowTotalDuration}
          currentSheetIndex={currentSheetIndex}
          totalSheets={totalSheets}
          isWaitingForGeneration={isWaitingForGeneration}
          isWaitingForChoice={isWaitingForChoice}
          onTogglePlayPause={handleToggleSlideshow}
          onSpeedChange={handleSlideshowSpeedChange}
          onPrev={handlePrevPage}
          onNext={handleNextPage}
          onClose={handleCloseSlideshow}
      />

      <Setup 
          show={showSetup}
          isTransitioning={isTransitioning}
          hero={hero}
          coStars={coStars}
          extrasDesc={extrasDesc}
          selectedGenre={selectedGenre}
          selectedArtStyle={selectedArtStyle}
          selectedLayout={selectedLayout}
          selectedStoryType={selectedStoryType}
          storyTone={storyTone}
          selectedLanguage={selectedLanguage}
          customPremise={customPremise}
          richMode={richMode}
          comicTitle={comicTitle}
          activeSlot={activeSlot}
          slots={slotsSummary}
          onOpenSlotManager={() => setShowSlotModal(true)}
          onSwitchSlot={handleSelectSlotToLoad}
          onAddNewSlot={handleAddNewSlot}
          onOpenDossier={() => setShowDossier(true)}
          onOpenScrapbook={() => setShowScrapbookModal(true)}
          bookmarkedCount={bookmarks.length}
          onHeroUpload={handleHeroUpload}
          onUpdateHeroInfo={updateHeroInfo}
          onAddCoStar={handleAddCoStar}
          onRemoveCoStar={handleRemoveCoStar}
          onUpdateCoStarInfo={updateCoStarInfo}
          onExtrasDescChange={setExtrasDesc}
          onTitleChange={setComicTitle}
          onGenreChange={setSelectedGenre}
          onArtStyleChange={setSelectedArtStyle}
          onLayoutChange={setSelectedLayout}
          onStoryTypeChange={setSelectedStoryType}
          onToneChange={setStoryTone}
          onLanguageChange={setSelectedLanguage}
          onPremiseChange={setCustomPremise}
          onRichModeChange={setRichMode}
          onLaunch={launchStory}
          onLoadSampleBook={handleLoadSampleBook}
      />
      
      <Book 
          comicFaces={comicFaces}
          currentSheetIndex={currentSheetIndex}
          isStarted={isStarted}
          isSetupVisible={showSetup && !isTransitioning}
          onSheetClick={handleSheetClick}
          onChoice={handleChoice}
          onOpenBook={() => { setCurrentSheetIndex(1); generateBatch(1, 4); }}
          onDownload={downloadPDF}
          onReset={resetApp}
          onOpenDossier={() => setShowDossier(true)}
          onOpenMoralChart={() => setShowMoralModal(true)}
          onOpenScrapbook={() => setShowScrapbookModal(true)}
          onToggleBookmark={handleToggleBookmark}
          isBookmarked={isBookmarkedCheck}
          bookmarkedCount={bookmarks.length}
          moralHistory={moralHistory}
          darknessLevel={darknessLevel}
          comicTitle={comicTitle}
          heroName={hero?.name || "주인공"}
      />
    </div>
  );
};

export default App;
