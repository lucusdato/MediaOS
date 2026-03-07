"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        return;
      }

      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg-surface)" }}
    >
      <div
        className="w-full max-w-md rounded-lg overflow-hidden shadow-lg"
        style={{ background: "var(--bg-primary)" }}
      >
        {/* Gradient accent bar */}
        <div
          className="h-2"
          style={{
            background: "linear-gradient(180deg, #D4EEF5 0%, #7DD3E8 100%)",
          }}
        />

        <div className="px-8 py-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/mediaos-logo.png"
              alt="MediaOS"
              width={180}
              height={48}
              priority
            />
          </div>

          {/* Heading */}
          <h1
            className="text-center text-2xl uppercase mb-1"
            style={{
              fontFamily: "'League Gothic', sans-serif",
              letterSpacing: "1.5px",
              color: "var(--text-primary)",
            }}
          >
            Sign In
          </h1>
          <p
            className="text-center text-sm mb-8"
            style={{
              fontFamily: "'Aldine721 BT', serif",
              color: "var(--text-secondary)",
            }}
          >
            Campaign Management Platform
          </p>

          {/* Error message */}
          {error && (
            <div
              className="mb-6 rounded-md px-4 py-3 text-sm"
              style={{
                background: "#FEF2F2",
                color: "var(--text-error)",
                border: "1px solid #FECACA",
                fontFamily: "'Aldine721 BT', serif",
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{
                  fontFamily: "'Aldine721 BT', serif",
                  color: "var(--text-primary)",
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm outline-none transition-colors"
                style={{
                  fontFamily: "'Aldine721 BT', serif",
                  border: "1px solid var(--border-medium)",
                  color: "var(--text-primary)",
                  background: "var(--bg-primary)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--status-progress)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--border-medium)")
                }
                placeholder="you@initiative.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{
                  fontFamily: "'Aldine721 BT', serif",
                  color: "var(--text-primary)",
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm outline-none transition-colors"
                style={{
                  fontFamily: "'Aldine721 BT', serif",
                  border: "1px solid var(--border-medium)",
                  color: "var(--text-primary)",
                  background: "var(--bg-primary)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--status-progress)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--border-medium)")
                }
                placeholder="Enter your password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
