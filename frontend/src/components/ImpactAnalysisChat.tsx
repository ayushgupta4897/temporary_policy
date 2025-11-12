'use client'

import UnifiedChat from './UnifiedChat'

interface ImpactAnalysisChatProps {
  queryId: string
}

export default function ImpactAnalysisChat({ queryId }: ImpactAnalysisChatProps) {
  return (
    <UnifiedChat
      queryId={queryId}
      agentType="impact-analysis"
      title="Impact Analysis Assistant"
      description="Ask questions about causal pathways, multipliers, and evidence quality"
      iconColor="green"
    />
  )
}
