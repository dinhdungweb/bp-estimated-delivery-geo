export default function AdditionalPage() {
  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 font-sans md:p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Additional Resources</h1>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-500" />
              <p className="text-sm text-gray-500">Documentation and developer resources.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900">Resources</h2>
          <p className="text-sm leading-relaxed text-gray-500">
            This page provides additional information about the BP Estimated Delivery app.
          </p>
          <button className="inline-flex h-9 items-center justify-center rounded-xl bg-gray-900 px-3 text-xs font-bold text-white shadow-md transition-colors hover:bg-black">
            Visit Documentation
          </button>
        </div>
      </div>
    </div>
  );
}
