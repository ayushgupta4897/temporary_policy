'use client'

import UnifiedChat from './UnifiedChat'

interface SystemCompassChatProps {
  queryId: string
}

export default function SystemCompassChat({ queryId }: SystemCompassChatProps) {
  return (
    <UnifiedChat
      queryId={queryId}
      agentType="system-compass"
      title="Systems Thinking Assistant"
      description="Ask questions about the evidence graph, nodes, edges, and citations"
      iconColor="blue"
    />
  )
}
