"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowUpDown, SlidersHorizontal, User } from "lucide-react";

interface AuthUser {
  name: string;
  role: string;
}

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      });
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ width: "100vw", height: "100vh", backgroundColor: "#FFFFFF" }}
    >
      {/* Header */}
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
          {[
            {
              icon: <ArrowUpDown size={16} color="#FFF" strokeWidth={2.5} />,
              label: "Sort",
            },
            {
              icon: (
                <SlidersHorizontal size={16} color="#FFF" strokeWidth={2.5} />
              ),
              label: "Filters",
            },
          ].map((btn) => (
            <button
              key={btn.label}
              className="flex items-center justify-center border-0 cursor-pointer"
              style={{
                backgroundColor: "#000",
                borderRadius: 4,
                padding: "6px 16px",
                gap: 8,
                whiteSpace: "nowrap",
              }}
            >
              {btn.icon}
              <span
                style={{
                  fontFamily: "'Aldine721 BT', serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#FFF",
                }}
              >
                {btn.label}
              </span>
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center border-0 cursor-pointer"
            style={{
              backgroundColor: "#000",
              borderRadius: 4,
              padding: "6px 16px",
              gap: 8,
              whiteSpace: "nowrap",
            }}
          >
            <User size={16} color="#FFF" strokeWidth={2.5} />
            <span
              style={{
                fontFamily: "'Aldine721 BT', serif",
                fontSize: 13,
                fontWeight: 500,
                color: "#FFF",
              }}
            >
              {user?.name ?? "Loading..."}
            </span>
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex flex-col flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
