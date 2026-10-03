"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type ActivityItem = {
  id: string;
  label: string;
  hash?: `0x${string}`;
  status: "pending" | "confirmed" | "failed";
  at: number;
};

type ActivityContextValue = {
  items: ActivityItem[];
  addActivity: (item: Omit<ActivityItem, "id" | "at"> & { at?: number }) => string;
  updateActivity: (id: string, patch: Partial<ActivityItem>) => void;
};

const ActivityContext = createContext<ActivityContextValue | null>(null);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ActivityItem[]>([]);

  const addActivity = useCallback(
    (item: Omit<ActivityItem, "id" | "at"> & { at?: number }) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setItems((prev) => [
        { id, at: item.at ?? Date.now(), ...item },
        ...prev,
      ].slice(0, 40));
      return id;
    },
    []
  );

  const updateActivity = useCallback(
    (id: string, patch: Partial<ActivityItem>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    []
  );

  const value = useMemo(
    () => ({ items, addActivity, updateActivity }),
    [items, addActivity, updateActivity]
  );

  return (
    <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>
  );
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error("useActivity must be used within ActivityProvider");
  return ctx;
}
