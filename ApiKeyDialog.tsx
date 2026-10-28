/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface ApiKeyDialogProps {
  onContinue: () => void;
  isCreditDepleted?: boolean;
  onClose?: () => void;
  onUseOfflineDemo?: () => void;
}

export const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ 
  onContinue, 
  isCreditDepleted = false,
  onClose,
  onUseOfflineDemo
}) => {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-stone-900/40 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="relative max-w-md w-full bg-[#FAF9F6] border border-stone-200 rounded-3xl p-6 sm:p-8 text-center text-stone-800 shadow-2xl">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors"
            title="닫기"
          >
            ✕
          </button>
        )}

        {/* Editorial Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#E8636F]/10 border border-[#E8636F]/20 text-[#E8636F] mx-auto flex items-center justify-center text-2xl mb-4 shadow-xs">
          {isCreditDepleted ? '💳' : '🗝️'}
        </div>

        <h2 className="font-serif-kr text-xl sm:text-2xl font-bold text-stone-900 tracking-tight mb-2">
          {isCreditDepleted ? '서재온 크레딧 충전 안내' : '서재온 API 열쇠 설정'}
        </h2>
        
        <p className="text-sm text-stone-600 mb-6 leading-relaxed font-serif-kr">
          {isCreditDepleted 
            ? '사전 충전된 Gemini API 크레딧이 모두 소진되었습니다. AI Studio 프로젝트 설정에서 결제 및 크레딧을 충전하시거나 새로운 API 키로 교체해 주세요.'
            : '서재온의 에디토리얼 삽화와 깊이 있는 서사 생성을 위해 결제가 활성화된 Gemini API 프로젝트가 필요합니다.'}
        </p>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-6 text-left space-y-2">
          <div className="text-[11px] font-bold text-[#E8636F] uppercase tracking-wider mb-1">
            {isCreditDepleted ? '해결 방법' : '안내 사항'}
          </div>
          {isCreditDepleted ? (
            <div className="text-xs text-stone-600 leading-relaxed font-serif-kr space-y-1.5">
              <p>1. Google Cloud 또는 AI Studio에서 프로젝트 선불 크레딧을 충전하세요.</p>
              <p>2. 또는 다른 유효한 Google Cloud 프로젝트의 API 키로 교체하세요.</p>
              <div className="pt-2 flex flex-col gap-1 border-t border-stone-100">
                <a 
                  href="https://ai.studio/projects" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#E8636F] hover:text-[#D94F5C] font-semibold underline inline-flex items-center gap-1"
                >
                  <span>AI Studio 프로젝트 & 결제 관리 열기</span> &rarr;
                </a>
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing#prepay" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-stone-500 hover:text-stone-800 text-[11px] underline"
                >
                  선불 크레딧 충전 가이드 보기
                </a>
              </div>
            </div>
          ) : (
            <p className="text-xs text-stone-600 leading-relaxed font-serif-kr">
              Gemini 모델은 결제 설정이 완료된 Google Cloud 프로젝트에서 가장 안정적으로 서재를 집필합니다.
              <br/>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#E8636F] hover:text-[#D94F5C] font-semibold underline mt-1.5 inline-block"
              >
                결제 가이드 확인하기 &rarr;
              </a>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <button 
            onClick={onContinue}
            className="px-5 py-3 bg-[#E8636F] hover:bg-[#D94F5C] text-white w-full text-sm font-semibold rounded-xl shadow-2xs hover:shadow-xs transition-all active:scale-98"
          >
            {isCreditDepleted ? '다른 API 열쇠로 교체하기' : '서재 계속 이용하기'}
          </button>
          {onUseOfflineDemo && (
            <button
              onClick={onUseOfflineDemo}
              className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 w-full text-xs font-semibold rounded-xl border border-stone-200 transition-all flex items-center justify-center gap-1.5"
            >
              <span>📚</span>
              <span>샘플 도서로 서재 즉시 체험하기 (크레딧 불필요)</span>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-transparent hover:bg-stone-100 text-stone-600 w-full text-xs font-medium rounded-xl transition-colors"
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
