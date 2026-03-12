"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type SortDir = "asc" | "desc" | null;

interface FilterState {
  campaignDateSort: SortDir;
  setCampaignDateSort: (v: SortDir | ((prev: SortDir) => SortDir)) => void;
}

const FilterContext = createContext<FilterState | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [campaignDateSort, setCampaignDateSort] = useState<SortDir>(null);

  return (
    <FilterContext.Provider value={{ campaignDateSort, setCampaignDateSort }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used within FilterProvider");
  return ctx;
}
