type Props = {
  message: string;
  onRetry: () => void;
};

export function RetryBanner({ message, onRetry }: Props) {
  return (
    <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
      <p>{message}</p>
      <button
        type="button"
        className="mt-2 rounded-lg border border-rose-300 px-3 py-1 text-rose-700"
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  );
}
