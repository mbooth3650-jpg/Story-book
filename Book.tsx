/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ComicFace, TOTAL_PAGES, MoralChoiceRecord } from './types';
import { Panel } from './Panel';

interface BookProps {
    comicFaces: ComicFace[];
    currentSheetIndex: number;
    isStarted: boolean;
    isSetupVisible: boolean;
    onSheetClick: (index: number) => void;
    onChoice: (pageIndex: number, choice: string) => void;
    onOpenBook: () => void;
    onDownload: () => void;
    onReset: () => void;
    onOpenDossier?: () => void;
    onOpenMoralChart?: () => void;
    onOpenScrapbook?: () => void;
    onToggleBookmark?: (pageIndex: number, panelIndex: number, panel: any) => void;
    isBookmarked?: (pageIndex: number, panelIndex: number) => boolean;
    bookmarkedCount?: number;
    moralHistory?: MoralChoiceRecord[];
    darknessLevel?: number;
    comicTitle?: string;
    heroName?: string;
}

export const Book: React.FC<BookProps> = (props) => {
    const sheetsToRender = [];
    if (props.comicFaces.length > 0) {
        sheetsToRender.push({ 
            front: props.comicFaces.find(f => f.pageIndex === 0) || props.comicFaces[0], 
            back: props.comicFaces.find(f => f.pageIndex === 1) 
        });
        for (let i = 2; i <= TOTAL_PAGES; i += 2) {
            sheetsToRender.push({ 
                front: props.comicFaces.find(f => f.pageIndex === i), 
                back: props.comicFaces.find(f => f.pageIndex === i + 1) 
            });
        }
    } else if (props.isSetupVisible) {
        // Placeholder sheet for initial render behind setup
        sheetsToRender.push({ front: undefined, back: undefined });
    }

    return (
        <div className="book-viewport">
            <div className={`book ${props.currentSheetIndex > 0 ? 'opened' : ''} transition-all duration-1000 ease-in-out`}
               style={ (props.isSetupVisible) ? { transform: 'translateZ(-600px) translateY(-100px) rotateX(20deg) scale(0.9)', filter: 'blur(12px) brightness(0.8)', pointerEvents: 'none' } : {}}>
              
              {/* Book Spine Shadow */}
              <div className="absolute left-0 top-0 w-4 h-full bg-gradient-to-r from-stone-900/25 to-transparent z-10 pointer-events-none rounded-l-lg"></div>
              
              {/* Signature BOOTIN SEOJAE ON Bookmark Ribbon */}
              {props.currentSheetIndex > 0 && (
                  <div className="seojae-ribbon" title="서재온 독서 책갈피">
                      <div className="seojae-ribbon-body"></div>
                      <div className="seojae-ribbon-tail"></div>
                  </div>
              )}
              
              {sheetsToRender.map((sheet, i) => (
                  <div key={i} className={`paper ${i < props.currentSheetIndex ? 'flipped' : ''}`} 
                       style={{ 
                           zIndex: i < props.currentSheetIndex ? i : sheetsToRender.length - i,
                           borderRadius: i < props.currentSheetIndex ? '24px 0 0 24px' : '0 24px 24px 0'
                       }}
                       onClick={() => props.onSheetClick(i)}>
                      <div className="front bg-white">
                          <Panel 
                            face={sheet.front} 
                            allFaces={props.comicFaces} 
                            onChoice={props.onChoice} 
                            onOpenBook={props.onOpenBook} 
                            onDownload={props.onDownload} 
                            onReset={props.onReset} 
                            onOpenDossier={props.onOpenDossier}
                            onOpenMoralChart={props.onOpenMoralChart}
                            onOpenScrapbook={props.onOpenScrapbook}
                            onToggleBookmark={props.onToggleBookmark}
                            isBookmarked={props.isBookmarked}
                            bookmarkedCount={props.bookmarkedCount}
                            moralHistory={props.moralHistory}
                            darknessLevel={props.darknessLevel}
                            comicTitle={props.comicTitle}
                            heroName={props.heroName}
                          />
                      </div>
                      <div className="back bg-white">
                          <Panel 
                            face={sheet.back} 
                            allFaces={props.comicFaces} 
                            onChoice={props.onChoice} 
                            onOpenBook={props.onOpenBook} 
                            onDownload={props.onDownload} 
                            onReset={props.onReset} 
                            onOpenDossier={props.onOpenDossier}
                            onOpenMoralChart={props.onOpenMoralChart}
                            onOpenScrapbook={props.onOpenScrapbook}
                            onToggleBookmark={props.onToggleBookmark}
                            isBookmarked={props.isBookmarked}
                            bookmarkedCount={props.bookmarkedCount}
                            moralHistory={props.moralHistory}
                            darknessLevel={props.darknessLevel}
                            comicTitle={props.comicTitle}
                            heroName={props.heroName}
                          />
                      </div>
                  </div>
              ))}
            </div>
        </div>
    );
}
