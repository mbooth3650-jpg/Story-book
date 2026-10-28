
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {useCallback, useState} from 'react';

// Interface for the injected window.aistudio object
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

export const useApiKey = () => {
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [isCreditDepleted, setIsCreditDepleted] = useState(false);

  const validateApiKey = useCallback(async (): Promise<boolean> => {
    const aistudio = (window as any).aistudio as AIStudio | undefined;
    
    // If the environment supports key selection
    if (aistudio) {
      try {
        // Check if key is already selected
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setIsCreditDepleted(false);
          setShowApiKeyDialog(true);
          return false;
        }
      } catch (error) {
        // Fallback if check fails
        console.warn('API Key check failed', error);
        setIsCreditDepleted(false);
        setShowApiKeyDialog(true);
        return false;
      }
    }
    return true;
  }, []);

  const handleApiKeyDialogContinue = useCallback(async () => {
    setShowApiKeyDialog(false);
    setIsCreditDepleted(false);
    const aistudio = (window as any).aistudio as AIStudio | undefined;
    if (aistudio) {
      await aistudio.openSelectKey();
    }
  }, []);

  return {
    showApiKeyDialog,
    setShowApiKeyDialog,
    isCreditDepleted,
    setIsCreditDepleted,
    validateApiKey,
    handleApiKeyDialogContinue,
  };
};
