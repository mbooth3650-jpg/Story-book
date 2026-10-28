/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { MoralChart } from './MoralChart';
import { MoralChoiceRecord } from './types';

interface MoralChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  moralHistory: MoralChoiceRecord[];
  darknessLevel: number;
  comicTitle?: string;
  heroName?: string;
  selectedGenre?: string;
  storyTone?: string;
}

interface FuturePredictionData {
  fateTitle: string;
  trajectoryType: 'radiant' | 'dark' | 'twilight' | 'neutral';
  probabilityEnding: string;
  heroStateSummary: string;
  climaxForecast: string;
  advice: string;
}

export const MoralChartModal: React.FC<MoralChartModalProps> = ({
  isOpen,
  onClose,
  moralHistory,
  darknessLevel,
  comicTitle = "무한한 영웅들",
  heroName = "주인공",
  selectedGenre = "슈퍼히어로",
  storyTone = "희망적"
}) => {
  const [prediction, setPrediction] = useState<FuturePredictionData | null>(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [turningPointFilter, setTurningPointFilter] = useState<'all' | 'light' | 'dark'>('all');
  const [selectedTimelinePoint, setSelectedTimelinePoint] = useState<MoralChoiceRecord | null>(null);

  if (!isOpen) return null;

  const handlePredictFuture = async () => {
    setIsLoadingPrediction(true);
    setPredictionError(null);

    try {
      const apiKey = process.env.API_KEY || (window as any).__GEMINI_API_KEY__;
      const ai = new GoogleGenAI({ apiKey: apiKey || "" });

      const historySummary = moralHistory.length > 0
        ? moralHistory.map((rec, i) => 
            `[선택 ${i + 1} / 제${rec.pageIndex}화]: "${rec.choice}" (성향: ${rec.moralLabel}, 변동값: ${rec.score > 0 ? `+${rec.score}` : rec.score}, 당시 누적 명암: ${rec.cumulativeDarkness.toFixed(1)}) - 영향: ${rec.description || '없음'}`
          ).join('\n')
        : "아직 구체적인 분기 선택이 기록되지 않은 초기 상태입니다.";

      const prompt = `당신은 만화 및 서사 분석의 최고 권위자입니다.
현재 독자가 진행 중인 인터랙티브 만화의 '도덕적 선택 궤적'과 '명암(빛/희망 vs 어둠/절망) 지표'를 정밀 분석하여, 향후 결말(클라이맥스 및 에필로그)에 미칠 영향과 운명의 궤적을 예측해 주세요.

[작품 기본 정보]
- 작품 제목: ${comicTitle}
- 주인공 이름: ${heroName}
- 장르: ${selectedGenre}
- 기본 톤앤매너: ${storyTone}
- 현재 누적 명암 레벨: ${darknessLevel.toFixed(1)} (기준: -5에 가까울수록 순수한 빛/희망, +5에 가까울수록 완전한 어둠/절망, 0은 균형/중립)
- 지금까지의 도덕적 선택 이력 (${moralHistory.length}회 기록):
${historySummary}

[분석 요구사항]
현재까지 누적된 선택의 경향성과 인과율이 앞으로의 갈등 전개 및 최종 결말에 어떤 파급력을 미칠지 문학적이고 흥미진진하게 한국어로 예측해 주세요.

반드시 다음 필드를 포함한 유효한 JSON 형식으로만 응답하세요:
{
  "fateTitle": "한 줄로 압축한 운명의 칭호 (예: '숭고한 희생과 새벽의 승리', '냉혹한 심판과 고독한 왕좌', '타락의 벼랑 끝에서 피어난 구원')",
  "trajectoryType": "radiant" 또는 "dark" 또는 "twilight" 또는 "neutral" (radiant: 빛/희망 우세, dark: 어둠/비극 우세, twilight: 갈등/양면성, neutral: 균형),
  "probabilityEnding": "결말 확률 지표 요약 (예: '희망적 구원 엔딩 82% · 비극적 파멸 18%')",
  "heroStateSummary": "주인공(${heroName})의 현재 심리 및 도덕적 내면 상태에 대한 정밀 분석 (2~3문장)",
  "climaxForecast": "현재 궤적이 이어질 경우 최종 결말 및 클라이맥스에서 일어날 결정적 사건과 운명적 귀결 예측 (3~4문장)",
  "advice": "서사의 완성도와 감동을 높이기 위한 독자/주인공을 향한 서사적 암시 및 조언 (1~2문장)"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      let rawText = response.text || "{}";
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed: FuturePredictionData = JSON.parse(rawText);
      setPrediction(parsed);
    } catch (err: any) {
      console.error("Future prediction failed:", err);
      setPredictionError("미래 예측 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-white/80 animate-scale-up text-slate-800 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8636F] flex items-center justify-center text-white text-lg shadow-xs">
              📊
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif-kr text-stone-900 tracking-tight">
                서사 도덕 궤적 분석
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 font-medium">
                독자의 결단과 선택에 따른 빛(희망)과 어둠(냉혹)의 서사 인과율
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePredictFuture}
              disabled={isLoadingPrediction}
              className={`btn-apple text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-2xs transition-all ${
                isLoadingPrediction
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-[#E8636F] hover:bg-[#D94F5C] text-white'
              }`}
              title="현재 도덕 점수 추세가 결말에 미칠 영향을 AI로 예측"
            >
              {isLoadingPrediction ? (
                <>
                  <span className="inline-block animate-spin text-sm">⏳</span>
                  <span>운명 분석 중...</span>
                </>
              ) : (
                <>
                  <span>🔮</span>
                  <span>결말 운명 예측</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-all text-sm font-bold border border-stone-200"
              title="닫기"
            >
              ✕
            </button>
          </div>
        </div>

        {/* AI Future Prediction Card (미래 예측 결과 패널) */}
        {isLoadingPrediction && (
          <div className="glass-card-subtle p-6 rounded-2xl border border-purple-200/90 bg-gradient-to-br from-purple-50/80 via-white/95 to-indigo-50/80 text-center space-y-3 shadow-md animate-pulse">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white text-2xl shadow-md">
              🔮
            </div>
            <h4 className="text-sm font-bold text-purple-900">
              인과율 및 결말 운명 시뮬레이션 중...
            </h4>
            <p className="text-xs text-purple-700/80 max-w-md mx-auto leading-relaxed">
              지금까지 누적된 {heroName}의 도덕적 선택과 {darknessLevel > 0 ? '어둠(+)' : darknessLevel < 0 ? '빛(-)' : '중립'} 성향 지표를 바탕으로 서사의 최종 도달 지점을 계산하고 있습니다.
            </p>
          </div>
        )}

        {predictionError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{predictionError}</span>
            </div>
            <button
              onClick={handlePredictFuture}
              className="font-bold underline hover:text-rose-900 ml-3 shrink-0"
            >
              다시 시도
            </button>
          </div>
        )}

        {prediction && !isLoadingPrediction && (
          <div
            className={`glass-card p-5 sm:p-6 rounded-3xl border transition-all shadow-xl relative overflow-hidden ${
              prediction.trajectoryType === 'radiant'
                ? 'border-blue-200/90 bg-gradient-to-br from-blue-50/70 via-white/95 to-amber-50/60'
                : prediction.trajectoryType === 'dark'
                ? 'border-rose-200/90 bg-gradient-to-br from-rose-50/70 via-white/95 to-purple-50/60'
                : prediction.trajectoryType === 'twilight'
                ? 'border-purple-200/90 bg-gradient-to-br from-purple-50/70 via-white/95 to-indigo-50/60'
                : 'border-slate-200/90 bg-gradient-to-br from-slate-50/70 via-white/95 to-slate-100/60'
            }`}
          >
            {/* Top Accent Bar */}
            <div
              className={`absolute top-0 inset-x-0 h-1.5 ${
                prediction.trajectoryType === 'radiant'
                  ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-amber-400'
                  : prediction.trajectoryType === 'dark'
                  ? 'bg-gradient-to-r from-orange-400 via-rose-500 to-purple-600'
                  : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500'
              }`}
            />

            {/* Prediction Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-slate-200/70">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">
                  {prediction.trajectoryType === 'radiant' ? '☀️' : prediction.trajectoryType === 'dark' ? '🌙' : '🔮'}
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                      AI 결말 미래 예측
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {prediction.probabilityEnding}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    {prediction.fateTitle}
                  </h3>
                </div>
              </div>

              <button
                onClick={handlePredictFuture}
                className="btn-apple btn-apple-glass text-[11px] font-bold py-1 px-2.5 self-start sm:self-center flex items-center gap-1 shadow-2xs hover:bg-white"
                title="새로운 선택 반영하여 다시 예측"
              >
                <span>🔄</span>
                <span>다시 분석</span>
              </button>
            </div>

            {/* Prediction Body Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
              {/* Hero Inner State */}
              <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/70 space-y-1.5 shadow-2xs">
                <h5 className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
                  <span>🧠</span>
                  <span>{heroName}의 심리 및 도덕 상태</span>
                </h5>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {prediction.heroStateSummary}
                </p>
              </div>

              {/* Advice */}
              <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/70 space-y-1.5 shadow-2xs">
                <h5 className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
                  <span>🧭</span>
                  <span>서사적 통찰 & 운명의 조언</span>
                </h5>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {prediction.advice}
                </p>
              </div>

              {/* Climax Forecast (Full Width) */}
              <div className="md:col-span-2 p-4 rounded-2xl bg-white/90 border border-slate-200/80 space-y-2 shadow-2xs">
                <h5 className="font-extrabold text-slate-900 flex items-center gap-1.5 text-[13px]">
                  <span>⚡</span>
                  <span>결말 및 클라이맥스 파급 효과 전망</span>
                </h5>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {prediction.climaxForecast}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chart Content */}
        <MoralChart
          moralHistory={moralHistory}
          darknessLevel={darknessLevel}
          comicTitle={comicTitle}
          heroName={heroName}
        />

        {/* Key Turning Points Section (중요한 분기점 필터 및 TOP 3) */}
        <div className="pt-2 border-t border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                ⚡
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>중요한 분기점</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                    {turningPointFilter === 'light' ? '빛의 결단 TOP' : turningPointFilter === 'dark' ? '어둠의 결단 TOP' : '최대 영향력 TOP 3'}
                  </span>
                </h3>
              </div>
            </div>

            {/* Filter Buttons for Light vs Dark Decisions */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setTurningPointFilter('all')}
                className={`text-[11px] font-bold py-1 px-2.5 rounded-lg transition-all flex items-center gap-1 ${
                  turningPointFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="모든 분기점 보기"
              >
                <span>전체</span>
                <span className="text-[10px] opacity-70">({moralHistory.length})</span>
              </button>

              <button
                onClick={() => setTurningPointFilter('light')}
                className={`text-[11px] font-bold py-1 px-2.5 rounded-lg transition-all flex items-center gap-1 ${
                  turningPointFilter === 'light'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-blue-700 hover:bg-blue-50/80'
                }`}
                title="빛과 희망의 결단만 모아보기"
              >
                <span>☀️ 빛의 결단</span>
                <span className="text-[10px] opacity-80">
                  ({moralHistory.filter(r => r.score < 0).length})
                </span>
              </button>

              <button
                onClick={() => setTurningPointFilter('dark')}
                className={`text-[11px] font-bold py-1 px-2.5 rounded-lg transition-all flex items-center gap-1 ${
                  turningPointFilter === 'dark'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 hover:bg-rose-50/80'
                }`}
                title="어둠과 절망의 결단만 모아보기"
              >
                <span>🌙 어둠의 결단</span>
                <span className="text-[10px] opacity-80">
                  ({moralHistory.filter(r => r.score > 0).length})
                </span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {(() => {
            // Filter choices based on active filter
            let filteredChoices = [...moralHistory];
            if (turningPointFilter === 'light') {
              filteredChoices = filteredChoices.filter(r => r.score < 0);
            } else if (turningPointFilter === 'dark') {
              filteredChoices = filteredChoices.filter(r => r.score > 0);
            }

            // Sort choices by absolute impact (|score|), top 3
            const topChoices = filteredChoices
              .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
              .slice(0, 3);

            if (topChoices.length === 0) {
              return (
                <div className="glass-card-subtle p-5 rounded-2xl border border-dashed border-slate-300/80 text-center text-xs text-slate-500 space-y-1.5 bg-slate-50/50">
                  <span className="text-xl block">
                    {turningPointFilter === 'light' ? '☀️' : turningPointFilter === 'dark' ? '🌙' : '🧭'}
                  </span>
                  <p className="font-bold text-slate-700">
                    {turningPointFilter === 'light'
                      ? '아직 기록된 빛의 결단이 없습니다.'
                      : turningPointFilter === 'dark'
                      ? '아직 기록된 어둠의 결단이 없습니다.'
                      : '아직 등록된 분기점 선택지가 없습니다.'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {turningPointFilter === 'light'
                      ? '희망과 이타심을 선택하면 여기에 빛의 결단이 기록됩니다.'
                      : turningPointFilter === 'dark'
                      ? '냉혹함이나 어둠을 선택하면 여기에 어둠의 결단이 기록됩니다.'
                      : '스토리 진행 중 독자의 선택이 누적되면, 서사에 가장 큰 파장을 일으킨 순간들이 이곳에 분석 카드로 자동 정리됩니다.'}
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {topChoices.map((rec, idx) => {
                  const isDarker = rec.score > 0;
                  const impactMagnitude = Math.min(100, Math.round(Math.abs(rec.score) * 100));
                  const rankLabels = ['#1 최대 변곡점', '#2 주요 분기점', '#3 핵심 선택'];
                  const rankColors = [
                    'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
                    'bg-slate-800 text-white',
                    'bg-slate-200 text-slate-700'
                  ];

                  return (
                    <div
                      key={idx}
                      className={`group relative glass-card-subtle p-4.5 rounded-2xl border transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl flex flex-col justify-between gap-3 text-xs overflow-hidden cursor-default ${
                        isDarker
                          ? 'border-rose-200/90 bg-gradient-to-b from-rose-50/50 via-white/95 to-white/90 hover:border-rose-300 hover:shadow-rose-500/10 hover:ring-2 hover:ring-rose-400/30'
                          : 'border-blue-200/90 bg-gradient-to-b from-blue-50/50 via-white/95 to-white/90 hover:border-blue-300 hover:shadow-blue-500/10 hover:ring-2 hover:ring-blue-400/30'
                      }`}
                    >
                      {/* Top Accent Rim Indicator (빛 vs 어둠 컬러 바) */}
                      <div
                        className={`absolute top-0 inset-x-0 h-1 transition-all duration-300 group-hover:h-1.5 ${
                          isDarker
                            ? 'bg-gradient-to-r from-orange-400 via-rose-500 to-red-600'
                            : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600'
                        }`}
                      />

                      {/* Top Rank Header & Visual Color Beacon */}
                      <div className="space-y-2 pt-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs ${rankColors[idx] || rankColors[2]}`}>
                              {rankLabels[idx] || `#${idx + 1} 분기`}
                            </span>
                            
                            {/* Glowing Color Indicator Beacon (빛 vs 어둠 펄스 인디케이터) */}
                            <span className="relative flex h-2.5 w-2.5 items-center justify-center" title={isDarker ? '어둠 성향 선택' : '빛 성향 선택'}>
                              <span
                                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                  isDarker ? 'bg-rose-400' : 'bg-cyan-400'
                                }`}
                              />
                              <span
                                className={`relative inline-flex rounded-full h-2 w-2 shadow-xs ${
                                  isDarker ? 'bg-rose-600 ring-1 ring-rose-300' : 'bg-blue-600 ring-1 ring-blue-300'
                                }`}
                              />
                            </span>
                          </div>

                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/60">
                            제 {rec.pageIndex}화
                          </span>
                        </div>

                        {/* Moral Shift Pill & Dual Spectrum Indicator */}
                        <div className="flex items-center justify-between gap-1.5 pt-0.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 shadow-2xs ${
                                isDarker
                                  ? 'bg-rose-100/90 text-rose-700 border-rose-200/80'
                                  : 'bg-blue-100/90 text-blue-700 border-blue-200/80'
                              }`}
                            >
                              <span>{isDarker ? '🌙 어둠' : '☀️ 빛'}</span>
                              <span>{isDarker ? `+${rec.score.toFixed(1)}` : `${rec.score.toFixed(1)}`}</span>
                            </span>
                            <span className="font-bold text-slate-800 truncate text-[11px]">
                              {rec.moralLabel}
                            </span>
                          </div>

                          {/* Mini Spectrum Pill Indicator (빛/어둠 스펙트럼 인디케이터) */}
                          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 shrink-0 bg-slate-50 px-1.5 py-0.5 rounded-full border border-slate-200/60">
                            <span className={!isDarker ? 'text-blue-600 font-extrabold' : 'text-slate-400'}>☀️</span>
                            <div className="w-8 h-1.5 bg-slate-200 rounded-full overflow-hidden relative">
                              <div
                                className={`absolute top-0 bottom-0 w-2 rounded-full transition-all duration-300 ${
                                  isDarker ? 'bg-rose-600 right-0' : 'bg-blue-600 left-0'
                                }`}
                              />
                            </div>
                            <span className={isDarker ? 'text-rose-600 font-extrabold' : 'text-slate-400'}>🌙</span>
                          </div>
                        </div>
                      </div>

                      {/* Choice Content */}
                      <div className="space-y-1.5">
                        <blockquote className="text-[12px] font-semibold text-slate-900 leading-snug line-clamp-3 bg-white/80 p-2.5 rounded-xl border border-slate-200/70 italic shadow-2xs group-hover:border-slate-300 transition-colors">
                          "{rec.choice}"
                        </blockquote>

                        {rec.description && (
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed px-0.5 font-medium">
                            {rec.description}
                          </p>
                        )}
                      </div>

                      {/* Footer Info & Magnitude Bar */}
                      <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                        <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <span className="text-slate-400">⚡</span>
                            <span>서사 변동 강도</span>
                          </span>
                          <span className="font-extrabold text-slate-800">{impactMagnitude}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isDarker
                                ? 'bg-gradient-to-r from-orange-400 via-rose-500 to-rose-600'
                                : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600'
                            }`}
                            style={{ width: `${impactMagnitude}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>선택 당시 상태</span>
                          <span className={`font-semibold ${rec.cumulativeDarkness > 0 ? 'text-rose-600' : rec.cumulativeDarkness < 0 ? 'text-blue-600' : 'text-slate-600'}`}>
                            누적 {rec.cumulativeDarkness > 0 ? `+${rec.cumulativeDarkness.toFixed(1)} (어둠)` : rec.cumulativeDarkness < 0 ? `${rec.cumulativeDarkness.toFixed(1)} (빛)` : '0.0 (균형)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Horizontal Page Timeline of Turning Points (가로 타임라인) */}
        <div className="pt-3 border-t border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-blue-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                ⏱️
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>페이지별 분기 발생 타임라인</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  총 {moralHistory.length}개 결단 지점
                </span>
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              타임라인의 노드를 클릭하면 해당 화의 상세 결단 기록을 바로 조회합니다.
            </span>
          </div>

          {/* Timeline Track Container */}
          <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
            {moralHistory.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">
                아직 진행된 이야기 분기점이 없어 타임라인이 비어 있습니다.
              </div>
            ) : (
              <>
                {/* Horizontal Bar with Nodes */}
                <div className="relative py-4 px-2 sm:px-6 overflow-x-auto no-scrollbar">
                  {/* Connecting Line */}
                  <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 rounded-full z-0" />

                  <div className="relative z-10 flex items-center justify-between min-w-[500px] gap-2">
                    {/* Page 1 start mark */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-700 shadow-xs">
                        1
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">시작(1화)</span>
                    </div>

                    {/* Interactive Moral Points on Timeline */}
                    {moralHistory.map((point, pIdx) => {
                      const isDarker = point.score > 0;
                      const isSelected = selectedTimelinePoint === point;

                      return (
                        <button
                          key={pIdx}
                          onClick={() => setSelectedTimelinePoint(isSelected ? null : point)}
                          className={`group flex flex-col items-center gap-1.5 shrink-0 transition-all duration-200 focus:outline-none cursor-pointer ${
                            isSelected ? 'scale-110' : 'hover:scale-105'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black shadow-md border-2 transition-all duration-200 relative ${
                              isSelected
                                ? 'ring-4 ring-indigo-400/40 scale-105'
                                : 'hover:shadow-lg'
                            } ${
                              isDarker
                                ? 'bg-gradient-to-tr from-rose-500 to-orange-500 text-white border-white'
                                : 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white border-white'
                            }`}
                          >
                            <span>{isDarker ? '🌙' : '☀️'}</span>
                            {/* Pulse for high impact */}
                            {Math.abs(point.score) >= 0.7 && (
                              <span
                                className={`absolute -inset-1 rounded-2xl opacity-40 animate-ping ${
                                  isDarker ? 'bg-rose-500' : 'bg-blue-500'
                                }`}
                              />
                            )}
                          </div>
                          <div className="flex flex-col items-center">
                            <span className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded-md ${
                              isSelected ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-700 group-hover:text-indigo-600'
                            }`}>
                              제{point.pageIndex}화
                            </span>
                            <span className="text-[9px] font-semibold text-slate-400 max-w-[70px] truncate">
                              {point.moralLabel}
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    {/* Page 10 Finale mark */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-700 shadow-xs">
                        10
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">결말(10화)</span>
                    </div>
                  </div>
                </div>

                {/* Selected Node Detailed Popover / Card */}
                {selectedTimelinePoint && (
                  <div className={`p-4 rounded-2xl border transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
                    selectedTimelinePoint.score > 0
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                      : 'bg-blue-50/70 border-blue-200 text-blue-950'
                  }`}>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg text-white shadow-xs ${
                          selectedTimelinePoint.score > 0 ? 'bg-rose-600' : 'bg-blue-600'
                        }`}>
                          제 {selectedTimelinePoint.pageIndex}화의 결단 지점
                        </span>
                        <span className="text-xs font-black text-slate-900">
                          {selectedTimelinePoint.moralLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${
                          selectedTimelinePoint.score > 0
                            ? 'bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                        }`}>
                          {selectedTimelinePoint.score > 0 ? `🌙 어둠 +${selectedTimelinePoint.score.toFixed(1)}` : `☀️ 빛 ${selectedTimelinePoint.score.toFixed(1)}`}
                        </span>
                        <button
                          onClick={() => setSelectedTimelinePoint(null)}
                          className="w-6 h-6 rounded-full bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center text-xs border border-slate-200"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <blockquote className="text-xs font-bold text-slate-900 bg-white/90 p-3 rounded-xl border border-slate-200/80 shadow-2xs italic mb-2">
                      "{selectedTimelinePoint.choice}"
                    </blockquote>

                    {selectedTimelinePoint.description && (
                      <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                        <span className="font-bold text-slate-900">서사 영향: </span>
                        {selectedTimelinePoint.description}
                      </p>
                    )}

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                      <span>선택 후 도덕 누적 상태:</span>
                      <span className={`font-bold ${selectedTimelinePoint.cumulativeDarkness > 0 ? 'text-rose-600' : selectedTimelinePoint.cumulativeDarkness < 0 ? 'text-blue-600' : 'text-slate-700'}`}>
                        {selectedTimelinePoint.cumulativeDarkness > 0 ? `+${selectedTimelinePoint.cumulativeDarkness.toFixed(1)} (어둠 성향 우세)` : selectedTimelinePoint.cumulativeDarkness < 0 ? `${selectedTimelinePoint.cumulativeDarkness.toFixed(1)} (빛 성향 우세)` : '0.0 (균형)'}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span>만화 첫 장(제1화)에서 언제든 도덕적 궤적과 미래 예측을 확인할 수 있습니다.</span>
          <button
            onClick={onClose}
            className="btn-apple btn-apple-primary py-2 px-5 text-xs font-bold"
          >
            확인 및 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

