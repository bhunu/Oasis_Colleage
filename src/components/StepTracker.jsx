import { MdCheckCircle as IconChecks, MdLock as IconLockCheck, MdArrowDownward as IconArrowsTransferDown, MdCompareArrows as IconTransfer, MdCheckBox as IconCircleCheck } from 'react-icons/md'

const steps = [
  { label: 'Verify all payments', icon: IconChecks },
  { label: 'Lock term accounts', icon: IconLockCheck },
  { label: 'Calculate balances c/d', icon: IconArrowsTransferDown },
  { label: 'Post balances b/d', icon: IconTransfer },
  { label: 'Open new term', icon: IconCircleCheck },
]

export default function StepTracker({ currentStep }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="font-semibold text-gray-900 mb-6">Procedure Progress</h3>
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const Icon = step.icon
          const isActive = idx <= currentStep
          const isCompleted = idx < currentStep

          return (
            <div key={idx} className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition ${
                  isCompleted
                    ? 'bg-green-100'
                    : isActive
                      ? 'bg-blue-100'
                      : 'bg-gray-100'
                }`}
              >
                <Icon
                  size={24}
                  className={
                    isCompleted
                      ? 'text-green-600'
                      : isActive
                        ? 'text-blue-600'
                        : 'text-gray-400'
                  }
                />
              </div>
              <p className={`text-xs text-center ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                {step.label}
              </p>
              {idx < steps.length - 1 && (
                <div
                  className={`absolute w-12 h-1 mt-6 transition ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                  style={{ marginLeft: '2rem' }}
                ></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
