export default function AdditionalPage() {
  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 md:p-6 space-y-6 font-sans">
      <div className="mb-2">
         <h1 className="text-xl font-bold text-gray-900">Additional Resources</h1>
         <p className="text-xs text-gray-400">Documentation and developer resources.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
         <h2 className="text-sm font-bold text-gray-800">Resources</h2>
         <p className="text-xs text-gray-500 leading-relaxed">
            This page provides additional information about the BP Estimated Delivery app.
         </p>
         <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-all">
            Visit Documentation →
         </button>
      </div>
    </div>
  );
}
