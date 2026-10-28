/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const MAX_STORY_PAGES = 10;
export const BACK_COVER_PAGE = 11;
export const TOTAL_PAGES = 11;
export const INITIAL_PAGES = 2;
export const GATE_PAGE = 1;
export const BATCH_SIZE = 6;
export const DECISION_PAGES = [3, 6];

export const GENRES = ["고전 호러", "슈퍼히어로 액션", "다크 SF", "하이 판타지", "네온 누아르 탐정", "황무지 아포칼립스", "유쾌한 코미디", "하이틴 드라마 / 일상", "무협", "성인 전용 (19+)", "직접 입력"];
export const ART_STYLES = ["현대 미국 만화", "일본 애니메이션", "빈티지 60년대 만화", "픽셀 아트", "부드러운 수채화", "사이버펑크 디지털", "연필 스케치", "망가 (Manga)", "필름 누아르 (Film Noir)", "Manga", "Noir"];
export const TONES = [
    "액션 중심 (짧고 강렬한 대사. 역동성에 집중.)",
    "내면 독백 (생각을 드러내는 풍부한 캡션.)",
    "재치 있는 (유머를 방어 기제로 사용하는 캐릭터들.)",
    "오페라틱 (웅장하고 드라마틱한 선언과 높은 긴장감.)",
    "일상적인 (자연스러운 대화, 관계와 가십에 집중.)",
    "따뜻한 (부드럽고 낙관적인 분위기.)",
    "긴장감 넘치는 (서스펜스 중심의 미스터리한 분위기.)",
    "코믹한 (유쾌하고 과장된 상황 중심.)",
    "성인 중심 (성숙하고 복잡한 주제, 심리적 갈등.)"
];

export type StoryType = 'one-shot' | 'series';
export const STORY_TYPES: { id: StoryType; name: string }[] = [
    { id: 'one-shot', name: '단편 (One-shot)' },
    { id: 'series', name: '연재 (Series)' }
];

export const LANGUAGES = [
    { code: 'ko-KR', name: '한국어 (대한민국)' },
    { code: 'en-US', name: '영어 (미국)' },
    { code: 'ja-JP', name: '일본어 (일본)' },
    { code: 'zh-CN', name: '중국어 (중국)' },
    { code: 'fr-FR', name: '프랑스어 (프랑스)' },
    { code: 'de-DE', name: '독일어 (독일)' },
    { code: 'es-MX', name: '스페인어 (멕시코)' },
    { code: 'it-IT', name: '이탈리아어 (이탈리아)' },
    { code: 'pt-BR', name: '포르투갈어 (브라질)' },
    { code: 'ru-RU', name: '러시아어 (러시아)' },
    { code: 'hi-IN', name: '힌디어 (인도)' },
    { code: 'id-ID', name: '인도네시아어 (인도네시아)' },
    { code: 'vi-VN', name: '베트남어 (베트남)' },
    { code: 'ar-EG', name: '아랍어 (이집트)' },
    { code: 'ua-UA', name: '우크라이나어 (우크라이나)' }
];

export type LayoutType = 'splash' | '2-panel' | '3-panel';
export const LAYOUTS: { id: LayoutType; name: string; description: string }[] = [
    { id: 'splash', name: '단일 패널 (Splash)', description: '페이지 전체를 차지하는 웅장한 연출' },
    { id: '2-panel', name: '2분할 패널 (Vertical)', description: '두 개의 장면으로 구성된 균형 잡힌 연출' },
    { id: '3-panel', name: '3분할 패널 (Grid)', description: '세 개의 장면으로 구성된 역동적인 연출' }
];

export interface ComicFace {
  id: string;
  type: 'cover' | 'story' | 'back_cover';
  panels: PanelData[];
  choices: string[];
  resolvedChoice?: string;
  isLoading: boolean;
  pageIndex?: number;
  isDecisionPage?: boolean;
  layout: LayoutType;
  loadingProgress?: number; // 0 to 100
  loadingStatus?: string;
}

export interface PanelData {
  imageUrl?: string;
  narrative?: Beat;
}

export interface Beat {
  caption?: string;
  dialogue?: string;
  scene: string;
  focus_char: 'hero' | 'friend' | 'other';
  choices?: string[];
}

export interface MoralChoiceRecord {
  pageIndex: number;
  choice: string;
  score: number; // -1 (매우 밝음/희망) ~ +1 (매우 어두움/절망)
  cumulativeDarkness: number; // 누적 어둠 수치 (-5 ~ +5)
  moralLabel: string; // 예: 빛의 결단, 실리적 선택, 냉혹한 심판
  description?: string;
  timestamp: number;
}

export interface Persona {
  base64: string;
  desc: string;
  name?: string;
  personality?: string;
}

export interface BookmarkedPanel {
  id: string; // e.g. slot-1-p3-i0-timestamp
  slotId: number;
  comicTitle: string;
  pageIndex: number;
  panelIndex: number;
  imageUrl: string;
  caption?: string;
  dialogue?: string;
  scene?: string;
  focusChar?: string;
  timestamp: number;
  userNote?: string;
}

export type SlideshowSpeedMode = 'fast' | 'normal' | 'relaxed' | 'smart';

export interface SlideshowConfig {
  isActive: boolean;
  isPaused: boolean;
  speedMode: SlideshowSpeedMode;
  secondsRemaining: number;
  totalDuration: number;
}
