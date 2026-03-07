import SectionHeader from "@/components/ui/SectionHeader";

const phases = [
  {
    name: "Make",
    color: "var(--phase-make)",
    description:
      "Brief ingestion, strategy development, and channel planning. Where campaigns are born.",
  },
  {
    name: "Mine",
    color: "var(--phase-mine)",
    description:
      "Activation setup, trafficking, and taxonomy. Where plans become executable.",
  },
  {
    name: "Manage",
    color: "var(--phase-manage)",
    description:
      "In-market monitoring, reporting, and reconciliation. Where results are measured.",
  },
];

export default function DashboardPage() {
  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      {/* Page heading */}
      <h1
        className="text-4xl uppercase mb-2"
        style={{
          fontFamily: "'League Gothic', sans-serif",
          letterSpacing: "2px",
          color: "var(--text-primary)",
        }}
      >
        MediaOS Dashboard
      </h1>
      <p
        className="text-base mb-10"
        style={{
          fontFamily: "'Aldine721 BT', serif",
          color: "var(--text-secondary)",
        }}
      >
        Campaign management platform — Phase 0 pilot
      </p>

      {/* Phase cards */}
      <SectionHeader className="mb-4">Framework</SectionHeader>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {phases.map((phase) => (
          <div
            key={phase.name}
            className="rounded-lg overflow-hidden shadow-sm"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-light)",
            }}
          >
            {/* Color bar */}
            <div
              className="h-1.5"
              style={{ background: phase.color }}
            />

            <div className="p-6">
              <h3
                className="text-2xl uppercase mb-3"
                style={{
                  fontFamily: "'League Gothic', sans-serif",
                  letterSpacing: "1.5px",
                  color: phase.color,
                }}
              >
                {phase.name}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{
                  fontFamily: "'Aldine721 BT', serif",
                  color: "var(--text-secondary)",
                }}
              >
                {phase.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
