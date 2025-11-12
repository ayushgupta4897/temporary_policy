'use client'

import UnifiedChat from './UnifiedChat'

interface DSMChatProps {
  queryId: string
}

export default function DSMChat({ queryId }: DSMChatProps) {
  return (
    <UnifiedChat
      queryId={queryId}
      agentType="dsm"
      title="Systems Modeler Assistant"
      description="Ask questions about taxonomy, interventions, and delta analysis"
      iconColor="purple"
    />
  )
}
