"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowUpDown, SlidersHorizontal, User, Check } from "lucide-react";
import { FilterProvider, useFilters, type SortDir } from "@/lib/filter-context";

interface AuthUser {
  name: string;
  role: string;
}

function HeaderBar() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const { campaignDateSort, setCampaignDateSort } = useFilters();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showFilters) return;
    function handleClick(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showFilters]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const btnStyle = {
    backgroundColor: "#000",
    borderRadius: 4,
    padding: "6px 16px",
    gap: 8,
    whiteSpace: "nowrap" as const,
  };

  const labelStyle = {
    fontFamily: "'Aldine721 BT', serif",
    fontSize: 13,
    fontWeight: 500,
    color: "#FFF",
  };

  function cycleCampaignSort() {
    setCampaignDateSort((prev: SortDir) =>
      prev === null ? "asc" : prev === "asc" ? "desc" : null
    );
  }

  return (
    <header
      className="flex items-center justify-between shrink-0"
      style={{
        height: 52,
        padding: "0 28px",
        background: "linear-gradient(180deg, #D4EEF5 0%, #7DD3E8 100%)",
      }}
    >
      <Image
        src="/mediaos-logo.png"
        alt="MediaOS"
        width={140}
        height={44}
        style={{ height: 44, width: "auto" }}
        priority
      />
      <div className="flex items-center gap-4">
        {/* Sort button */}
        <button
          onClick={cycleCampaignSort}
          className="flex items-center justify-center border-0 cursor-pointer"
          style={{
            ...btnStyle,
            backgroundColor: campaignDateSort ? "#1a1a1a" : "#000",
            outline: campaignDateSort ? "1px solid rgba(255,255,255,0.3)" : "none",
          }}
          title={
            campaignDateSort === null
              ? "Sort campaigns by date"
              : campaignDateSort === "asc"
                ? "Sorted: earliest due first"
                : "Sorted: latest due first"
          }
        >
          <ArrowUpDown size={16} color="#FFF" strokeWidth={2.5} />
          <span style={labelStyle}>
            {campaignDateSort === "asc"
              ? "Earliest"
              : campaignDateSort === "desc"
                ? "Latest"
                : "Sort"}
          </span>
        </button>

        {/* Filters button + dropdown */}
        <div ref={filtersRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center justify-center border-0 cursor-pointer"
            style={{
              ...btnStyle,
              outline: showFilters ? "1px solid rgba(255,255,255,0.3)" : "none",
            }}
          >
            <SlidersHorizontal size={16} color="#FFF" strokeWidth={2.5} />
            <span style={labelStyle}>Filters</span>
          </button>

          {showFilters && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                minWidth: 220,
                backgroundColor: "#FFF",
                borderRadius: 8,
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                border: "1px solid var(--border-light)",
                padding: "8px 0",
                zIndex: 100,
              }}
            >
              <div
                style={{
                  padding: "6px 14px 4px",
                  fontFamily: "'League Gothic', sans-serif",
                  fontSize: 12,
                  letterSpacing: 1.2,
                  color: "var(--text-muted)",
                }}
              >
                CAMPAIGN SORT
              </div>
              {([
                { label: "Default order", value: null },
                { label: "Earliest due date", value: "asc" as SortDir },
                { label: "Latest due date", value: "desc" as SortDir },
              ] as const).map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    setCampaignDateSort(() => opt.value);
                    setShowFilters(false);
                  }}
                  className="flex items-center w-full border-0 cursor-pointer"
                  style={{
                    padding: "8px 14px",
                    backgroundColor: campaignDateSort === opt.value ? "rgba(0,0,0,0.04)" : "transparent",
                    fontFamily: "'Aldine721 BT', serif",
                    fontSize: 13,
                    color: "var(--text-primary)",
                    gap: 8,
                  }}
                >
                  <span style={{ width: 16 }}>
                    {campaignDateSort === opt.value && <Check size={14} />}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User button */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center border-0 cursor-pointer"
          style={btnStyle}
        >
          <User size={16} color="#FFF" strokeWidth={2.5} />
          <span style={labelStyle}>{user?.name ?? "Loading..."}</span>
        </button>
      </div>
    </header>
  );
}

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FilterProvider>
      <div
        className="flex flex-col overflow-hidden"
        style={{ width: "100vw", height: "100vh", backgroundColor: "#FFFFFF" }}
      >
        <HeaderBar />
        <main className="flex flex-col flex-1 overflow-hidden">{children}</main>
      </div>
    </FilterProvider>
  );
}
