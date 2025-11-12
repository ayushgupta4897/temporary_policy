'use client'

interface PipelineStep {
  id: string
  name: string
  description: string
  state: 'pending' | 'in_progress' | 'completed' | 'error'
  timestamp?: string | null
}

interface StepIndicatorProps {
  steps: PipelineStep[]
}

export default function StepIndicator({ steps }: StepIndicatorProps) {
  if (!steps || steps.length === 0) {
    return null
  }

  const formatTimestamp = (timestamp: string | null | undefined) => {
    if (!timestamp) return ''
    try {
      return new Date(timestamp).toLocaleTimeString()
    } catch {
      return ''
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-6">
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1

          return (
            <div key={step.id} className="relative">
              {/* Connecting Line */}
              {!isLast && (
                <div
                  className={`absolute left-5 top-12 w-0.5 h-full transition-colors duration-500 ${
                    step.state === 'completed'
                      ? 'bg-gradient-to-b from-green-500 to-green-600'
                      : step.state === 'error'
                      ? 'bg-red-500'
                      : 'bg-dark-400/30'
                  }`}
                />
              )}

              {/* Step Card */}
              <div
                className={`relative flex items-start gap-4 p-4 rounded-lg transition-all duration-300 ${
                  step.state === 'in_progress'
                    ? 'bg-gradient-to-r from-gradient-from/20 to-gradient-via/20 border-2 border-gradient-from shadow-lg'
                    : step.state === 'completed'
                    ? 'bg-green-500/10 border border-green-500/30'
                    : step.state === 'error'
                    ? 'bg-red-500/10 border border-red-500/30'
                    : 'bg-dark-600/30 border border-dark-400/20'
                }`}
              >
                {/* Icon */}
                <div className={`relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step.state === 'in_progress'
                    ? 'bg-gradient-to-r from-gradient-from to-gradient-via'
                    : step.state === 'completed'
                    ? 'bg-green-500'
                    : step.state === 'error'
                    ? 'bg-red-500'
                    : 'bg-dark-500 border-2 border-dark-400'
                }`}>
                  {step.state === 'pending' && (
                    <div className="w-3 h-3 rounded-full bg-dark-300" />
                  )}

                  {step.state === 'in_progress' && (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}

                  {step.state === 'completed' && (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}

                  {step.state === 'error' && (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`font-semibold transition-colors ${
                      step.state === 'in_progress'
                        ? 'text-gray-100'
                        : step.state === 'completed'
                        ? 'text-green-400'
                        : step.state === 'error'
                        ? 'text-red-400'
                        : 'text-gray-500'
                    }`}>
                      {step.name}
                    </h4>

                    {step.timestamp && (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatTimestamp(step.timestamp)}
                      </span>
                    )}
                  </div>

                  <p className={`text-sm mt-1 transition-colors ${
                    step.state === 'in_progress'
                      ? 'text-gray-300'
                      : step.state === 'completed'
                      ? 'text-gray-400'
                      : step.state === 'error'
                      ? 'text-red-300'
                      : 'text-gray-600'
                  }`}>
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
