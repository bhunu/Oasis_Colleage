export default function ProgressModal({ isOpen, progress, currentLog, canClose = false, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Running End of Term Procedure</h3>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <p className="text-sm text-gray-600">Progress</p>
            <p className="text-sm font-semibold text-gray-900">{progress}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Live Log */}
        <div className="bg-gray-50 rounded border border-gray-200 p-4 mb-6 h-24 overflow-y-auto">
          <p className="text-xs text-gray-600 font-mono">{currentLog}</p>
        </div>

        {/* Close Button */}
        {canClose && (
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-900 px-4 py-2 rounded font-medium hover:bg-gray-300 transition"
          >
            Close
          </button>
        )}
      </div>
    </div>
  )
}
