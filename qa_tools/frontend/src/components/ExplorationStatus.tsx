"use client";

interface ExplorationStatusProps {
  status: string;
  progress?: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", dotColor: "bg-yellow-400" },
  RUNNING: { label: "Running", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", dotColor: "bg-blue-400" },
  COMPLETED: { label: "Completed", color: "bg-green-500/10 text-green-400 border-green-500/20", dotColor: "bg-green-400" },
  FAILED: { label: "Failed", color: "bg-red-500/10 text-red-400 border-red-500/20", dotColor: "bg-red-400" },
};

export default function ExplorationStatus({ status, progress }: ExplorationStatusProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG["PENDING"];
  const isRunning = status === "RUNNING";

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${isRunning ? "animate-pulse" : ""}`} />
        {config.label}
        {isRunning && progress !== undefined && ` (${progress}%)`}
      </span>
    </div>
  );
}
