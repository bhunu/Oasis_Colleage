import { useNavigate } from 'react-router-dom'
import { MdLock, MdArrowForward, MdAssignment } from 'react-icons/md'

const MESSAGES = {
  OLevelCompletion: name =>
    `Results for ${name} are currently locked. O Level results are released only after a clearance letter has been issued by the school administration. Please complete your clearance process to access your results.`,
  ALevelCompletion: name =>
    `Results for ${name} are currently locked. A Level results are released only after a clearance letter has been issued by the school administration. Please complete your clearance process to access your results.`,
  Transfer: name =>
    `Results for ${name} are currently locked pending transfer clearance. Please obtain a clearance letter from the school administration before your results can be released.`,
}

export default function ClearanceRequiredBlock({ studentName, exitType }) {
  const navigate = useNavigate()
  const message = MESSAGES[exitType]?.(studentName) ?? `Results for ${studentName} are currently locked pending clearance.`

  return (
    <div className="max-w-lg mx-auto py-12">
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
        <div className="w-20 h-20 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-5">
          <MdLock className="text-red-400 text-4xl" />
        </div>
        <h2 className="font-playfair text-2xl font-bold text-white mb-3">Results Unavailable</h2>
        <p className="text-gray-400 font-montserrat text-sm leading-relaxed mb-8">
          {message}
        </p>
        <button
          onClick={() => navigate('/student/clearance/apply')}
          className="flex items-center gap-2 bg-[#C9A84C] hover:bg-yellow-400 text-[#0A1628] font-montserrat font-bold text-sm px-6 py-3 rounded-xl mx-auto transition mb-4"
        >
          <MdAssignment className="text-lg" />
          Apply for Clearance
          <MdArrowForward />
        </button>
        <p className="text-gray-500 font-montserrat text-xs">
          Already applied?{' '}
          <button
            onClick={() => navigate('/student/clearance/status')}
            className="text-[#C9A84C] hover:underline"
          >
            Check My Clearance Status
          </button>
        </p>
      </div>
    </div>
  )
}
