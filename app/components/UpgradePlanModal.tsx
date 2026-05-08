import { useEffect } from "react";
import { useNavigate } from "react-router";

export function LockGlyph({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4.75 7V5.5a3.25 3.25 0 0 1 6.5 0V7M4.25 7h7.5c.69 0 1.25.56 1.25 1.25v4c0 .69-.56 1.25-1.25 1.25h-7.5C3.56 13.5 3 12.94 3 12.25v-4C3 7.56 3.56 7 4.25 7Zm3.75 2.25v2"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UpgradePlanModal({
  open,
  onClose,
  featureName = "This feature",
  requiredPlanName,
  currentPlanName,
  message,
  upgradeUrl = "/app/pricing",
}: {
  open: boolean;
  onClose: () => void;
  featureName?: string;
  requiredPlanName?: string;
  currentPlanName?: string;
  message?: string;
  upgradeUrl?: string;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const title = requiredPlanName
    ? `${requiredPlanName} plan required`
    : "Upgrade required";
  const body =
    message ||
    `${featureName} is not included in your current plan. Upgrade to unlock it and keep using this workflow.`;

  const handleUpgradeClick = () => {
    onClose();
    if (upgradeUrl.startsWith("/")) {
      navigate(upgradeUrl);
      return;
    }

    window.location.assign(upgradeUrl);
  };

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-gray-950/45 p-4">
      <button
        type="button"
        aria-label="Close upgrade modal"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-plan-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
      >
        <div className="flex items-start gap-3 border-b border-gray-100 bg-gray-50 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
            <LockGlyph className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Plan locked
            </p>
            <h2 id="upgrade-plan-title" className="text-lg font-bold text-gray-950">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-white hover:text-gray-900"
            aria-label="Close upgrade modal"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-sm leading-6 text-gray-600">{body}</p>
          {currentPlanName && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
              Current plan: <span className="text-gray-950">{currentPlanName}</span>
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={handleUpgradeClick}
              className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 text-xs font-bold text-white transition-colors hover:bg-black"
            >
              View plans
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
