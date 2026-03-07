"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-surface)" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6"
        style={{
          height: "52px",
          background: "linear-gradient(180deg, #D4EEF5 0%, #7DD3E8 100%)",
        }}
      >
        {/* Left: Logo */}
        <div className="flex items-center">
          <Image
            src="/mediaos-logo.png"
            alt="MediaOS"
            width={140}
            height={44}
            style={{ height: "44px", width: "auto" }}
            priority
          />
        </div>

        {/* Right: User info + Logout */}
        <div className="flex items-center gap-3">
          <span
            className="text-sm"
            style={{
              fontFamily: "'Aldine721 BT', serif",
              color: "var(--text-primary)",
            }}
          >
            Admin
          </span>
          <Button variant="primary" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      {/* Page content */}
      <main>{children}</main>
    </div>
  );
}
