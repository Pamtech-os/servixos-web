import { createContext, useContext, useState, ReactNode } from 'react';

export type ClockStatus = 'clocked_out' | 'clocked_in' | 'on_break';

interface ClockEntry {
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  time: Date;
}

interface ClockContextType {
  status: ClockStatus;
  clockIn: () => void;
  clockOut: () => void;
  startBreak: () => void;
  endBreak: () => void;
  clockedInAt: Date | null;
  history: ClockEntry[];
}

const ClockContext = createContext<ClockContextType | null>(null);

export const ClockProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<ClockStatus>('clocked_out');
  const [clockedInAt, setClockedInAt] = useState<Date | null>(null);
  const [history, setHistory] = useState<ClockEntry[]>([]);

  const addEntry = (type: ClockEntry['type']) => {
    setHistory((prev) => [...prev, { type, time: new Date() }]);
  };

  const clockIn = () => {
    setStatus('clocked_in');
    setClockedInAt(new Date());
    addEntry('clock_in');
  };

  const clockOut = () => {
    setStatus('clocked_out');
    setClockedInAt(null);
    addEntry('clock_out');
  };

  const startBreak = () => {
    setStatus('on_break');
    addEntry('break_start');
  };

  const endBreak = () => {
    setStatus('clocked_in');
    addEntry('break_end');
  };

  return (
    <ClockContext.Provider
      value={{ status, clockIn, clockOut, startBreak, endBreak, clockedInAt, history }}
    >
      {children}
    </ClockContext.Provider>
  );
};

export const useClock = () => {
  const ctx = useContext(ClockContext);
  if (!ctx) throw new Error('useClock must be used within ClockProvider');
  return ctx;
};
