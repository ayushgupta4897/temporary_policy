// New Relic Browser Agent Configuration
export const NEW_RELIC_CONFIG = {
  accountId: '4736871',
  trustKey: '4736871',
  agentID: 'policy-intelligence-frontend',
  licenseKey: '186d881697b43200d0c7d18030a9708fFFFFNRAL',
  applicationID: 'policy-intelligence-frontend'
}

export function initNewRelic() {
  if (typeof window !== 'undefined') {
    // New Relic Browser Agent will be loaded via script tag in layout.tsx
    console.log('New Relic Browser monitoring initialized')
  }
}
