/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Line,
  ComposedChart,
  Dot
} from 'recharts';
import { MoralChoiceRecord } from './types';

interface MoralChartProps {
  moralHistory: MoralChoiceRecord[];
  darknessLevel: number;
  comicTitle?: string;
  heroName?: string;
  isCompact?: boolean;
  onOpenFullModal?: () => void;
}

export const MoralChart: React.FC<MoralChartProps> = ({
  moralHistory,
  darknessLevel,
  comicTitle = "무한한 영웅들",
  heroName = "주인공",
  isCompact = false,
  onOpenFullModal
}) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'traits' | 'log'>('chart');
  const [hoveredData, setHoveredData] = useState<any>(null);

  // Construct data points for Recharts
  // Baseline start at Page 0
  const chartData = [
    {
      page: 0,
      label: '시작 (프롤로그)',
      choice: '이야기 시작 (초기 상태)',
      scoreDelta: 0,
      darkness: 0,
      lightScore: 50, // 0-100 scale: 50 is balance
      darkScore: 50,
      moralLabel: '순수한 시작',
      tone: '중립'
    },
    ...moralHistory.map((rec, idx) => {
      // darknessLevel is -5 (Light) to +5 (Dark)
      // Normalizing to 0 (Pure Light) ~ 100 (Pure Dark)
      const normalizedDarkness = Math.round(((rec.cumulativeDarkness + 5) / 10) * 100);
      return {
        page: rec.pageIndex,
        label: `제 ${rec.pageIndex}화`,
        choice: rec.choice,
        scoreDelta: rec.score,
        darkness: rec.cumulativeDarkness,
        lightScore: Math.max(0, 100 - normalizedDarkness),
        darkScore: Math.max(0, normalizedDarkness),
        moralLabel: rec.moralLabel || (rec.score < 0 ? '빛의 선택' : '어둠의 선택'),
        description: rec.description || '',
        tone: rec.score < -0.2 ? '희망적' : rec.score > 0.2 ? '어두움' : '균형'
      };
    })
  ];

  // If no choices yet, show prospective baseline path to illustrate to reader
  const isInitialState = moralHistory.length === 0;

  // Moral Alignment Title calculation
  const getMoralTitle = (level: number) => {
    if (level <= -3.5) return { title: "눈부신 빛의 수호자", color: "text-blue-600", bg: "bg-blue-50 border-blue-200", desc: "이타심과 절대적 희생으로 세상을 밝히는 영웅적 서사" };
    if (level <= -1.5) return { title: "정의로운 결단가", color: "text-cyan-600", bg: "bg-cyan-50 border-cyan-200", desc: "도덕적 신념을 지키며 희망을 선택하는 온건한 영웅" };
    if (level < 1.5) return { title: "고뇌하는 회색지대의 수호자", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", desc: "빛과 어둠 사이에서 현실적인 타협과 균형을 추구하는 상태" };
    if (level < 3.5) return { title: "냉혹한 안티히어로", color: "text-orange-600", bg: "bg-orange-50 border-orange-200", desc: "목적을 위해 어두운 수단을 마다하지 않는 거친 서사" };
    return { title: "칠흑의 타락자 (다크 아크)", color: "text-rose-600", bg: "bg-rose-50 border-rose-200", desc: "절망과 파멸의 그림자에 깊이 잠식된 암흑의 서사" };
  };

  const moralStatus = getMoralTitle(darknessLevel);

  // Trait percentages derived from darknessLevel & choice count
  const altruismRate = Math.max(5, Math.min(95, Math.round(50 - (darknessLevel * 9))));
  const ruthlessnessRate = Math.max(5, Math.min(95, Math.round(50 + (darknessLevel * 9))));
  const decisivenessRate = Math.min(100, 40 + (moralHistory.length * 20));
  const pragmatismRate = Math.round((altruismRate + ruthlessnessRate) / 2);

  // Compact Widget View for direct page integration
  if (isCompact) {
    return (
      <div className="glass-card-subtle p-3.5 rounded-2xl w-full border border-white/80 shadow-sm text-slate-800">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              📊
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-slate-900 tracking-tight">도덕적 서사 궤적</h4>
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md border ${moralStatus.bg} ${moralStatus.color}`}>
                  {moralStatus.title}
                </span>
              </div>
            </div>
          </div>
          {onOpenFullModal && (
            <button
              onClick={onOpenFullModal}
              className="btn-apple btn-apple-glass text-[11px] py-1 px-2.5 font-semibold shrink-0 shadow-xs"
            >
              차트 상세 분석 ↗
            </button>
          )}
        </div>

        {/* Mini Meter Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-semibold px-0.5 text-slate-500">
            <span className="text-blue-600 flex items-center gap-1">
              <span>☀️</span> 희망/빛 ({100 - Math.round(((darknessLevel + 5) / 10) * 100)}%)
            </span>
            <span className="text-slate-700 font-bold">
              선택 {moralHistory.length}회 기록됨
            </span>
            <span className="text-rose-600 flex items-center gap-1">
              어둠/절망 ({Math.round(((darknessLevel + 5) / 10) * 100)}%) <span>🌙</span>
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden relative shadow-inner">
            <div
              className={`h-full transition-all duration-700 rounded-full ${
                darknessLevel < 0
                  ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600'
              }`}
              style={{
                width: `${Math.max(10, Math.min(100, ((darknessLevel + 5) / 10) * 100))}%`
              }}
            />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-slate-400/90 z-10" />
          </div>
        </div>

        {/* Mini Sparkline Chart */}
        <div className="h-20 w-full mt-2 pt-1 border-t border-slate-200/50">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 2, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="compactLightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <YAxis domain={[-5, 5]} hide />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="2 2" />
              <Area
                type="monotone"
                dataKey="darkness"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#compactLightGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Full Rich Dashboard View
  return (
    <div className="w-full flex flex-col gap-4 text-slate-800">
      
      {/* Top Moral Status Summary Banner */}
      <div className="glass-card-subtle p-4 sm:p-5 rounded-2xl border border-white/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              실시간 서사 도덕 분석
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {comicTitle} &middot; {heroName}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>서사 성향:</span>
            <span className={moralStatus.color}>{moralStatus.title}</span>
          </h3>
          <p className="text-xs text-slate-600 max-w-xl font-medium">
            {moralStatus.desc}
          </p>
        </div>

        {/* Score Value Pill */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
          <span className="text-[11px] font-semibold text-slate-500">도덕 수치 지수</span>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl sm:text-3xl font-black ${moralStatus.color}`}>
              {darknessLevel > 0 ? `+${darknessLevel.toFixed(1)}` : darknessLevel.toFixed(1)}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
          </div>
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
        <div className="segmented-control">
          <button
            onClick={() => setActiveTab('chart')}
            className={`segmented-item ${activeTab === 'chart' ? 'active' : ''}`}
          >
            📈 빛 & 어둠 궤적 차트
          </button>
          <button
            onClick={() => setActiveTab('traits')}
            className={`segmented-item ${activeTab === 'traits' ? 'active' : ''}`}
          >
            🧭 도덕 성향 진단
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`segmented-item ${activeTab === 'log' ? 'active' : ''}`}
          >
            📜 선택지 기록 ({moralHistory.length})
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
          독자의 선택에 따라 실시간 궤적이 업데이트됩니다
        </span>
      </div>

      {/* TAB 1: MAIN TRAJECTORY CHART */}
      {activeTab === 'chart' && (
        <div className="glass-card-subtle p-4 sm:p-5 rounded-2xl border border-white/80 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                이야기 진행에 따른 도덕성 변화 추이
              </h4>
              <p className="text-xs text-slate-500">
                상단(+영역)은 어둡고 비정한 전개, 하단(-영역)은 희망적이고 영웅적인 전개를 의미합니다.
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-rose-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                어둠 / 절망 (+5)
              </span>
              <span className="flex items-center gap-1 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                희망 / 빛 (-5)
              </span>
            </div>
          </div>

          {/* Recharts Trajectory Graph */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 20, left: -10, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="moralTrajectoryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8636F" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#E8A0A7" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#D94F5C" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#A8A29E"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E7E5E4' }}
                />
                <YAxis
                  domain={[-5, 5]}
                  ticks={[-5, -2.5, 0, 2.5, 5]}
                  tickFormatter={(val) => (val > 0 ? `+${val} (비정)` : val < 0 ? `${val} (선행)` : '0 (균형)')}
                  stroke="#A8A29E"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#E7E5E4' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-stone-900/95 text-stone-100 backdrop-blur-md p-3 rounded-xl shadow-xl border border-stone-700 text-xs max-w-xs space-y-1.5 font-serif-kr">
                          <div className="flex items-center justify-between gap-2 border-b border-stone-700 pb-1">
                            <strong className="text-white font-bold">{data.label}</strong>
                            <span className="text-[10px] bg-[#E8636F]/20 text-[#E8A0A7] px-1.5 py-0.5 rounded font-sans">
                              누적 {data.darkness > 0 ? `+${data.darkness}` : data.darkness}
                            </span>
                          </div>
                          <p className="text-stone-300 font-medium text-[11px]">
                            선택: "{data.choice}"
                          </p>
                          <div className="text-[10px] text-[#E8636F] font-semibold font-sans">
                            성향 평가: {data.moralLabel} (변화량: {data.scoreDelta > 0 ? `+${data.scoreDelta}` : data.scoreDelta})
                          </div>
                          {data.description && (
                            <p className="text-[10px] text-stone-400 line-clamp-2">
                              {data.description}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={0}
                  stroke="#D6D3D1"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  label={{
                    value: '도덕적 균형선 (Neutral 0)',
                    position: 'insideBottomLeft',
                    fill: '#78716C',
                    fontSize: 10
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="darkness"
                  stroke="#E8636F"
                  strokeWidth={3}
                  fill="url(#moralTrajectoryGrad)"
                  activeDot={{ r: 6, fill: '#D94F5C', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {isInitialState && (
            <div className="bg-[#FAF9F6] border border-stone-200 rounded-xl p-3 text-xs text-stone-700 flex items-center gap-2.5">
              <span className="text-lg">💡</span>
              <p>
                이야기가 시작되는 초기 상태입니다. 만화 속 <strong>스토리 분기 선택지</strong>를 고를 때마다 궤적 차트가 실시간으로 확장되며 서사의 빛과 어둠을 기록합니다.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MORAL TRAITS & COMPASS */}
      {activeTab === 'traits' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card-subtle p-4 rounded-2xl border border-white/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              도덕 4대 척도 분석
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-blue-700">이타심 & 희생정신</span>
                  <span className="text-slate-800">{altruismRate}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${altruismRate}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-rose-700">결단력 & 냉혹성</span>
                  <span className="text-slate-800">{ruthlessnessRate}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-600 rounded-full transition-all duration-500" style={{ width: `${ruthlessnessRate}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-indigo-700">서사 주도성 & 과감성</span>
                  <span className="text-slate-800">{decisivenessRate}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${decisivenessRate}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-amber-700">상황 적응 & 실리주의</span>
                  <span className="text-slate-800">{pragmatismRate}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-600 rounded-full transition-all duration-500" style={{ width: `${pragmatismRate}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card-subtle p-4 rounded-2xl border border-white/80 space-y-3 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                서사 결말 예측 지표
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                현재 {heroName}의 여정은 <strong>{moralStatus.title}</strong> 경로를 걷고 있습니다.
                {darknessLevel < -1 ? (
                  " 이 경로는 영웅적 연대와 희망 가득한 클라이맥스로 이어질 가능성이 높습니다."
                ) : darknessLevel > 1 ? (
                  " 이 경로는 복수와 희생, 어두운 비밀이 밝혀지는 비극적 카타르시스로 이어질 가능성이 높습니다."
                ) : (
                  " 균형 잡힌 선택으로 인해 예상치 못한 반전과 복합적인 결말이 펼쳐질 가능성이 높습니다."
                )}
              </p>
            </div>

            <div className="bg-white/70 p-3 rounded-xl border border-slate-200/70 text-[11px] space-y-1">
              <span className="font-bold text-slate-800 block">💡 다음 선택 팁</span>
              <span className="text-slate-600">
                밝은 전개를 원하시면 대화와 이타적 선택을, 다크한 긴장감을 원하시면 단호한 제압이나 과감한 선택을 골라보세요.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHOICE HISTORY LOG */}
      {activeTab === 'log' && (
        <div className="glass-card-subtle p-4 rounded-2xl border border-white/80 space-y-3 max-h-72 overflow-y-auto">
          {moralHistory.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs space-y-1">
              <span className="text-2xl block">📜</span>
              <p className="font-semibold text-slate-600">아직 선택된 분기점이 없습니다.</p>
              <p className="text-[11px]">스토리를 진행하며 선택지를 고르면 이곳에 상세 기록이 남습니다.</p>
            </div>
          ) : (
            moralHistory.map((rec, i) => (
              <div
                key={i}
                className="bg-white/80 p-3 rounded-xl border border-slate-200/70 flex items-start justify-between gap-3 text-xs shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.2 rounded-full">
                      제 {rec.pageIndex}화 분기점
                    </span>
                    <span className="font-bold text-slate-800">
                      {rec.moralLabel || "결단"}
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium">"{rec.choice}"</p>
                  {rec.description && (
                    <p className="text-[11px] text-slate-500">{rec.description}</p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                      rec.score < 0
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {rec.score > 0 ? `+${rec.score.toFixed(1)} 어둠` : `${rec.score.toFixed(1)} 밝음`}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    누적: {rec.cumulativeDarkness.toFixed(1)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
