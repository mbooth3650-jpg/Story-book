/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComicFace, Persona } from './types';

export const SAMPLE_HERO: Persona = {
  name: "윤서하",
  personality: "사색적이고 정의로운 기록학자",
  desc: "고서와 기록을 복원하는 젊은 큐레이터. 묵묵히 진실을 기록하며 온화하지만 흔들리지 않는 내면을 지녔다.",
  base64: "" // fallback handled gracefully
};

export const SAMPLE_CO_STAR: Persona = {
  name: "한이안",
  personality: "재치 있고 호기심 많은 골동품 상인",
  desc: "희귀한 서적과 유물을 찾아 전국을 유랑하는 감정사. 서하의 든든한 동료이자 조언자.",
  base64: ""
};

// Generates warm editorial SVG data URIs matching the BOOTIN SEOJAE ON aesthetic
function createEditorialArt(title: string, subtitle: string, pageNum: number, mood: 'warm' | 'indigo' | 'coral' | 'stone' = 'warm'): string {
  const bgColors = {
    warm: ['#FBF9F5', '#EFECE6', '#FAF0E6'],
    indigo: ['#1C1E24', '#262A36', '#171920'],
    coral: ['#FFF5F5', '#FFEAEB', '#FDF2F2'],
    stone: ['#F5F5F0', '#EAEAE2', '#FAF9F6']
  };
  const [c1, c2, c3] = bgColors[mood];
  const textColor = mood === 'indigo' ? '#E2E2E6' : '#1C1917';
  const subColor = mood === 'indigo' ? '#A3A3B0' : '#78716C';
  const accent = '#E8636F';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200" width="800" height="1200">
    <defs>
      <linearGradient id="g_${pageNum}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="50%" stop-color="${c2}" />
        <stop offset="100%" stop-color="${c3}" />
      </linearGradient>
      <pattern id="grid_${pageNum}" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${accent}" stroke-width="0.5" stroke-opacity="0.08" />
      </pattern>
    </defs>
    
    <!-- Background Canvas -->
    <rect width="800" height="1200" fill="url(#g_${pageNum})" />
    <rect width="800" height="1200" fill="url(#grid_${pageNum})" />

    <!-- Editorial Border -->
    <rect x="30" y="30" width="740" height="1140" fill="none" stroke="${accent}" stroke-width="1.5" stroke-opacity="0.3" rx="16" />
    <rect x="42" y="42" width="716" height="1116" fill="none" stroke="${textColor}" stroke-width="0.75" stroke-opacity="0.2" rx="12" />

    <!-- Top Badge -->
    <rect x="60" y="70" width="160" height="32" rx="16" fill="${accent}" fill-opacity="0.12" />
    <text x="140" y="91" font-family="'Noto Serif KR', Georgia, serif" font-size="12" font-weight="700" fill="${accent}" text-anchor="middle" letter-spacing="2">서재온 에디토리얼</text>
    <text x="730" y="91" font-family="'Noto Serif KR', Georgia, serif" font-size="12" font-weight="600" fill="${subColor}" text-anchor="end">제 ${pageNum} 화</text>

    <!-- Center Geometric Art Illustration -->
    <g transform="translate(400, 520)">
      <circle r="190" fill="${accent}" fill-opacity="0.07" />
      <circle r="140" fill="none" stroke="${accent}" stroke-width="1.5" stroke-dasharray="6 6" />
      <circle r="90" fill="${c2}" stroke="${textColor}" stroke-width="1" stroke-opacity="0.3" />
      
      <!-- Book / Quill Motif -->
      <path d="M -60,20 Q 0,-20 60,20 L 50,-40 Q 0,-70 -50,-40 Z" fill="${accent}" fill-opacity="0.8" />
      <path d="M -60,20 Q 0,-10 60,20" stroke="#FFFFFF" stroke-width="2" fill="none" />
      <line x1="0" y1="-70" x2="0" y2="25" stroke="#FFFFFF" stroke-width="2" stroke-opacity="0.6" />
      
      <!-- Stars & Accents -->
      <circle cx="-110" cy="-90" r="3" fill="${accent}" />
      <circle cx="120" cy="-60" r="4" fill="${accent}" fill-opacity="0.6" />
      <circle cx="-80" cy="110" r="3.5" fill="${accent}" fill-opacity="0.5" />
      <circle cx="95" cy="100" r="2.5" fill="${accent}" />
    </g>

    <!-- Editorial Typography Bottom Section -->
    <g transform="translate(400, 880)">
      <text y="0" font-family="'Noto Serif KR', serif" font-size="34" font-weight="800" fill="${textColor}" text-anchor="middle" letter-spacing="-0.5">
        ${title}
      </text>
      <line x1="-120" y1="30" x2="120" y2="30" stroke="${accent}" stroke-width="2" />
      <text y="70" font-family="'Noto Serif KR', Georgia, serif" font-size="16" font-weight="500" fill="${subColor}" text-anchor="middle">
        ${subtitle}
      </text>
      <text y="105" font-family="'Noto Serif KR', Georgia, serif" font-size="13" font-weight="400" fill="${subColor}" fill-opacity="0.8" text-anchor="middle">
        BOOTIN SEOJAE ON &middot; KINFOLK &amp; MONOCLE EDITION
      </text>
    </g>

    <!-- Bottom Page Index -->
    <text x="400" y="1135" font-family="sans-serif" font-size="12" font-weight="600" fill="${subColor}" text-anchor="middle" letter-spacing="3">
      - PAGE ${pageNum} -
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_COMIC_FACES: ComicFace[] = [
  // Page 0: Cover
  {
    id: 'cover',
    type: 'cover',
    pageIndex: 0,
    layout: 'splash',
    isLoading: false,
    loadingProgress: 100,
    loadingStatus: '완료!',
    panels: [
      {
        narrative: {
          caption: "시간이 멈춘 서재에서 발견된 단 한 권의 필사본.",
          dialogue: "모든 이야기는 기억되기를 기다리는 누군가의 침묵에서 시작된다.",
          scene: "Vintage mahogany library at twilight, dust motes dancing in warm amber light, ancient leather-bound books.",
          focus_char: 'hero',
          choices: []
        },
        imageUrl: createEditorialArt("달빛 서재의 비밀", "제 1 권: 잊혀진 기록의 서막", 0, 'warm')
      }
    ],
    choices: []
  },

  // Page 1: Chapter 1
  {
    id: 'page-1',
    type: 'story',
    pageIndex: 1,
    layout: 'splash',
    isLoading: false,
    loadingProgress: 100,
    loadingStatus: '완료!',
    panels: [
      {
        narrative: {
          caption: "고서 복원가 윤서하는 백 년 전 봉인된 비밀 서고의 문을 열었다.",
          dialogue: "이곳의 공기 속엔 수많은 세월이 품었던 숨결이 아직 남아있어.",
          scene: "Scholar entering an archway of towering bookshelves, carrying a brass lantern.",
          focus_char: 'hero',
          choices: []
        },
        imageUrl: createEditorialArt("서고의 문이 열리다", "사라진 연대기의 첫 페이지", 1, 'warm')
      }
    ],
    choices: []
  },

  // Page 2: Chapter 2
  {
    id: 'page-2',
    type: 'story',
    pageIndex: 2,
    layout: 'splash',
    isLoading: false,
    loadingProgress: 100,
    loadingStatus: '완료!',
    panels: [
      {
        narrative: {
          caption: "서고 안쪽에서 오랜 동료 한이안이 뜻밖의 비단 서찰을 발견했다.",
          dialogue: "서하야, 이 낙관을 봐. 왕실 서고에서도 결코 열지 못했던 그 인장이야.",
          scene: "Two colleagues leaning over an antique oak desk examining a sealed scroll with glowing crest.",
          focus_char: 'friend',
          choices: []
        },
        imageUrl: createEditorialArt("봉인된 비단 서찰", "두 학자가 마주한 운명의 단서", 2, 'stone')
      }
    ],
    choices: []
  },

  // Page 3: Moral Decision 1
  {
    id: 'page-3',
    type: 'story',
    pageIndex: 3,
    layout: 'splash',
    isLoading: false,
    loadingProgress: 100,
    loadingStatus: '완료!',
    isDecisionPage: true,
    panels: [
      {
        narrative: {
          caption: "서찰의 봉인을 풀면 숨겨진 진실이 세상에 드러나지만, 누군가의 명예는 영원히 실추된다.",
          dialogue: "진실을 밝혀 역사를 바로세울 것인가, 아니면 상처받을 사람들을 위해 침묵할 것인가?",
          scene: "Hero holding a paper knife over the red wax seal, contemplating the gravity of knowledge.",
          focus_char: 'hero',
          choices: [
            "진실의 기록: 봉인을 해제하여 숨겨진 역사를 세상에 공개한다",
            "온화한 배려: 상처를 막기 위해 서찰을 서고 깊숙이 다시 보관한다"
          ]
        },
        imageUrl: createEditorialArt("기로에 선 선택", "진실의 무게와 역사의 기록", 3, 'coral')
      }
    ],
    choices: [
      "진실의 기록: 봉인을 해제하여 숨겨진 역사를 세상에 공개한다",
      "온화한 배려: 상처를 막기 위해 서찰을 서고 깊숙이 다시 보관한다"
    ],
    resolvedChoice: "진실의 기록: 봉인을 해제하여 숨겨진 역사를 세상에 공개한다"
  },

  // Page 4: Chapter 4
  {
    id: 'page-4',
    type: 'story',
    pageIndex: 4,
    layout: 'splash',
    isLoading: false,
    loadingProgress: 100,
    loadingStatus: '완료!',
    panels: [
      {
        narrative: {
          caption: "풀려난 서찰 속 글자들은 달빛을 받자 은은한 푸른빛으로 떠올랐다.",
          dialogue: "보여? 이것은 평범한 먹이 아니야. 마음을 비추는 영원한 잉크다.",
          scene: "Luminous calligraphy rising softly from ancient Korean hanji paper under moonlight.",
          focus_char: 'hero',
          choices: []
        },
        imageUrl: createEditorialArt("달빛 아래 피어난 글귀", "푸른 빛의 은문이 전하는 전언", 4, 'indigo')
      }
    ],
    choices: []
  },

  // Page 5: Chapter 5
  {
    id: 'page-5',
    type: 'story',
    pageIndex: 5,
    layout: 'splash',
    isLoading: false,
    loadingProgress: 100,
    loadingStatus: '완료!',
    panels: [
      {
        narrative: {
          caption: "글귀는 한 도시를 지켜냈던 이름 모를 장인들의 마지막 결의를 증언하고 있었다.",
          dialogue: "우리가 잊었던 것은 과거의 사건이 아니라, 그 안을 채웠던 사람들의 진심이었어.",
          scene: "Reflective moment by the arched window, looking out over misty evening rooftops.",
          focus_char: 'friend',
          choices: []
        },
        imageUrl: createEditorialArt("잊혀진 이름들의 증언", "역사의 뒤편에 서 있던 이들의 기도", 5, 'warm')
      }
    ],
    choices: []
  },

  // Page 6: Moral Decision 2
  {
    id: 'page-6',
    type: 'story',
    pageIndex: 6,
    layout: 'splash',
    isLoading: false,
    loadingProgress: 100,
    loadingStatus: '완료!',
    isDecisionPage: true,
    panels: [
      {
        narrative: {
          caption: "서찰의 마지막 장에는 서재 전체의 소유권을 결정할 열쇠가 동봉되어 있었다.",
          dialogue: "이 유산을 모두가 자유롭게 읽는 공공 서재로 기증할 것인가, 사설 연구소로 지켜낼 것인가?",
          scene: "Two scholars holding a carved jade key over the central guestbook of the grand library.",
          focus_char: 'hero',
          choices: [
            "모두의 서재: 누구나 문턱 없이 머물 수 있는 공공 도서관으로 개방한다",
            "순수의 보존: 훼손을 방지하기 위해 엄격한 사설 보존 서고로 유지한다"
          ]
        },
        imageUrl: createEditorialArt("마지막 열쇠의 향방", "서재온의 내일을 결정할 선택", 6, 'coral')
      }
    ],
    choices: [
      "모두의 서재: 누구나 문턱 없이 머물 수 있는 공공 도서관으로 개방한다",
      "순수의 보존: 훼손을 방지하기 위해 엄격한 사설 보존 서고로 유지한다"
    ],
    resolvedChoice: "모두의 서재: 누구나 문턱 없이 머물 수 있는 공공 도서관으로 개방한다"
  },

  // Page 7: Climax 1
  {
    id: 'page-7',
    type: 'story',
    pageIndex: 7,
    layout: 'splash',
    isLoading: false,
    loadingProgress: 100,
    loadingStatus: '완료!',
    panels: [
      {
        narrative: {
          caption: "서재의 문이 활짝 열리자 아침 햇살과 함께 따스한 봄바람이 들어왔다.",
          dialogue: "어서 오세요. 이곳은 당신이 잊고 지냈던 온기들이 머무는 곳입니다.",
          scene: "Grand glass pavilion library filled with soft morning light, welcoming new visitors.",
          focus_char: 'hero',
          choices: []
        },
        imageUrl: createEditorialArt("활짝 열린 온화한 문턱", "햇살이 깃드는 아침의 서재", 7, 'warm')
      }
    ],
    choices: []
  },

  // Page 8: Climax 2
  {
    id: 'page-8',
    type: 'story',
    pageIndex: 8,
    layout: 'splash',
    isLoading: false,
    loadingProgress: 100,
    loadingStatus: '완료!',
    panels: [
      {
        narrative: {
          caption: "마을 사람들과 청년들이 모여 저마다의 낡은 일기와 책을 기증하기 시작했다.",
          dialogue: "책은 혼자 쓰이지만, 서재는 함께 완성되는 법이지요.",
          scene: "Diverse townspeople sitting along long wooden tables, reading and conversing quietly.",
          focus_char: 'friend',
          choices: []
        },
        imageUrl: createEditorialArt("이어지는 이야기들", "한 사람의 온기가 모여 이룬 서가", 8, 'stone')
      }
    ],
    choices: []
  },

  // Page 9: Resolution
  {
    id: 'page-9',
    type: 'story',
    pageIndex: 9,
    layout: 'splash',
    isLoading: false,
    loadingProgress: 100,
    loadingStatus: '완료!',
    panels: [
      {
        narrative: {
          caption: "서하는 서가 한구석에 새로 제본된 『서재온 연대기』의 첫 줄을 적어 내려갔다.",
          dialogue: "기록된 진실은 결코 스러지지 않고, 읽는 이의 마음에 다시 싹을 틔운다.",
          scene: "Calligrapher writing with brush and black ink on fine handmade paper, tranquil smile.",
          focus_char: 'hero',
          choices: []
        },
        imageUrl: createEditorialArt("연대기의 첫 장", "마음에 다시 싹을 틔우는 기록", 9, 'warm')
      }
    ],
    choices: []
  },

  // Page 10: Ending Chapter
  {
    id: 'page-10',
    type: 'story',
    pageIndex: 10,
    layout: 'splash',
    isLoading: false,
    loadingProgress: 100,
    loadingStatus: '완료!',
    panels: [
      {
        narrative: {
          caption: "어둠이 내려앉자 서재의 창가마다 따스한 등불이 하나둘 켜졌다.",
          dialogue: "오늘 밤도 누군가는 이곳에서 인생의 한 문장을 만나게 될 것입니다.",
          scene: "Nocturnal monocular view of the library glowing gently like a beacon of warmth.",
          focus_char: 'hero',
          choices: []
        },
        imageUrl: createEditorialArt("밤의 등불, 영원의 문장", "어둠 속에서 빛나는 지혜의 안식처", 10, 'indigo')
      }
    ],
    choices: []
  },

  // Page 11: Epilogue
  {
    id: 'page-11',
    type: 'story',
    pageIndex: 11,
    layout: 'splash',
    isLoading: false,
    loadingProgress: 100,
    loadingStatus: '완료!',
    panels: [
      {
        narrative: {
          caption: "진실과 온기를 선택했던 서하의 발걸음은 다음 이야기로 이어진다.",
          dialogue: "서재온의 문은 언제나 열려 있습니다. 당신의 이야기를 기다립니다. 계속될 예정...",
          scene: "Open journal resting on a wooden chair, gentle breeze turning the last page.",
          focus_char: 'hero',
          choices: []
        },
        imageUrl: createEditorialArt("에필로그: 열려 있는 문", "당신의 이야기를 기다리며", 11, 'coral')
      }
    ],
    choices: []
  },

  // Page 12: Back Cover
  {
    id: 'page-12',
    type: 'back_cover',
    pageIndex: 12,
    layout: 'splash',
    isLoading: false,
    loadingProgress: 100,
    loadingStatus: '완료!',
    panels: [
      {
        narrative: {
          caption: "서재온(書齋穩) 제 1 권 완결. 제 2 권에서 새로운 장이 펼쳐집니다.",
          dialogue: "독서의 정온함을 사랑하는 모든 이들에게 이 책을 바칩니다.",
          scene: "Minimalist back cover with publisher colophon, barcode, and embossed coral emblem.",
          focus_char: 'other',
          choices: []
        },
        imageUrl: createEditorialArt("서재온 (書齋穩)", "제 1 권 완결 &middot; 다음 호에 계속", 12, 'stone')
      }
    ],
    choices: []
  }
];
