'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from 'react';

type UiState = {
  isMobileSidebarOpen: boolean;
  isAiSuggestionsOpen: boolean;
};

type UiAction =
  | { type: 'SET_MOBILE_SIDEBAR'; payload: boolean }
  | { type: 'TOGGLE_MOBILE_SIDEBAR' }
  | { type: 'SET_AI_PANEL'; payload: boolean }
  | { type: 'TOGGLE_AI_PANEL' };

const initialState: UiState = {
  isMobileSidebarOpen: false,
  isAiSuggestionsOpen: false,
};

function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'SET_MOBILE_SIDEBAR':
      return { ...state, isMobileSidebarOpen: action.payload };
    case 'TOGGLE_MOBILE_SIDEBAR':
      return { ...state, isMobileSidebarOpen: !state.isMobileSidebarOpen };
    case 'SET_AI_PANEL':
      return { ...state, isAiSuggestionsOpen: action.payload };
    case 'TOGGLE_AI_PANEL':
      return { ...state, isAiSuggestionsOpen: !state.isAiSuggestionsOpen };
    default:
      return state;
  }
}

const UiStateContext = createContext<UiState | null>(null);
const UiActionsContext = createContext<{
  setMobileSidebarOpen: (next: boolean) => void;
  toggleMobileSidebar: () => void;
  setAiSuggestionsOpen: (next: boolean) => void;
  toggleAiSuggestions: () => void;
} | null>(null);

export function UiProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  const setMobileSidebarOpen = useCallback((next: boolean) => {
    dispatch({ type: 'SET_MOBILE_SIDEBAR', payload: next });
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_MOBILE_SIDEBAR' });
  }, []);

  const setAiSuggestionsOpen = useCallback((next: boolean) => {
    dispatch({ type: 'SET_AI_PANEL', payload: next });
  }, []);

  const toggleAiSuggestions = useCallback(() => {
    dispatch({ type: 'TOGGLE_AI_PANEL' });
  }, []);

  const actions = useMemo(
    () => ({
      setMobileSidebarOpen,
      toggleMobileSidebar,
      setAiSuggestionsOpen,
      toggleAiSuggestions,
    }),
    [setAiSuggestionsOpen, setMobileSidebarOpen, toggleAiSuggestions, toggleMobileSidebar]
  );

  return (
    <UiStateContext.Provider value={state}>
      <UiActionsContext.Provider value={actions}>{children}</UiActionsContext.Provider>
    </UiStateContext.Provider>
  );
}

export function useUiState() {
  const context = useContext(UiStateContext);
  if (!context) {
    throw new Error('useUiState must be used within UiProvider');
  }
  return context;
}

export function useUiActions() {
  const context = useContext(UiActionsContext);
  if (!context) {
    throw new Error('useUiActions must be used within UiProvider');
  }
  return context;
}
