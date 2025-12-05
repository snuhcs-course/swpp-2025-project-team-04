import { useCallback, useState } from 'react';

export type BehaviorLogs = {
  pauseCount: number;
  rewindCount: number;
  vocabLookupCount: number;
  vocabSaveCount: number;
};

type BehaviorLogKey = keyof BehaviorLogs;

export function useBehaviorLogs() {
  const [behaviorLogs, setBehaviorLogs] = useState<BehaviorLogs>({
    pauseCount: 0,
    rewindCount: 0,
    vocabLookupCount: 0,
    vocabSaveCount: 0,
  });

  const incrementLog = useCallback(
    (key: BehaviorLogKey, amount: number = 1) => {
      setBehaviorLogs((prev) => {
        const updated = { ...prev, [key]: prev[key] + amount };
        console.log(`📊 [behavior log] ${key}: ${updated[key]}`);
        return updated;
      });
    },
    [],
  );

  const resetLogs = useCallback(() => {
    setBehaviorLogs({
      pauseCount: 0,
      rewindCount: 0,
      vocabLookupCount: 0,
      vocabSaveCount: 0,
    });
  }, []);

  return {
    behaviorLogs,
    incrementLog,
    resetLogs,
  };
}
