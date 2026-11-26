import { useIsFocused } from '@react-navigation/native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

/** Long enough to read a short confirmation, short enough not to own the screen. */
export const FEEDBACK_TIMEOUT_MS = 6000;

const DockTabActiveContext = createContext(true);

/**
 * Dock pages stay mounted inside the pager, so navigation focus never changes
 * when the user switches tabs. The active tab is provided explicitly instead.
 */
export function DockTabActiveProvider({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <DockTabActiveContext.Provider value={active}>
      {children}
    </DockTabActiveContext.Provider>
  );
}

type TransientStateOptions = {
  /** Whether there is anything to clear right now. */
  pending: boolean;
  /** The state value itself; a new value rearms the timer. */
  revision: unknown;
  clear: () => void;
  timeoutMs?: number;
};

/**
 * Clears transient UI state on navigation blur, dock-tab change, or timeout.
 * `clear` should be a stable callback (e.g. `useCallback`) so a render does not
 * restart the timer.
 */
export function useTransientState({
  pending,
  revision,
  clear,
  timeoutMs = FEEDBACK_TIMEOUT_MS,
}: TransientStateOptions) {
  const isFocused = useIsFocused();
  const tabActive = useContext(DockTabActiveContext);
  const focused = isFocused && tabActive;

  useEffect(() => {
    if (!focused) clear();
  }, [focused, clear]);

  useEffect(() => {
    if (!pending || !focused) return;
    const timer = setTimeout(clear, timeoutMs);
    return () => clearTimeout(timer);
  }, [pending, focused, revision, timeoutMs, clear]);
}

export type TransientFeedback = {
  tone: 'success' | 'danger';
  title: string;
  message: string;
};

/** Feedback banner state that never persists across tab changes. */
export function useTransientFeedback() {
  const [feedback, setFeedback] = useState<TransientFeedback | null>(null);
  const clearFeedback = useCallback(() => setFeedback(null), []);

  useTransientState({
    pending: feedback !== null,
    revision: feedback,
    clear: clearFeedback,
  });

  return { feedback, showFeedback: setFeedback, clearFeedback };
}
