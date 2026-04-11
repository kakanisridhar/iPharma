"use client";

interface ProgressSpinnerProps {
  isVisible: boolean;
  message?: string;
}

export function ProgressSpinner({ isVisible, message }: ProgressSpinnerProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* Spinner container with white background */}
      <div className="rounded-lg bg-white p-8 shadow-xl dark:bg-slate-900">
        {/* Animated spinner */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <svg
              className="h-full w-full animate-spin text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>

          {/* Optional message */}
          {message && (
            <p className="text-center text-sm font-medium text-foreground">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
