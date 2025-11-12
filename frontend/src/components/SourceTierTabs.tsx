'use client';

import { SourceTierAnalysis } from '@/types';
import {
  BuildingIcon,
  ChartIcon,
  GlobeIcon,
  BankIcon,
  TrendingIcon,
  ScienceIcon,
  MedicalIcon,
  BookIcon,
  FileIcon,
  AcademicCapIcon,
  CloudIcon,
  UsersIcon,
  ScaleIcon,
  CashIcon,
  ChecklistIcon,
  NewspaperIcon,
  BriefcaseIcon,
  OfficeIcon,
  HandshakeIcon,
  CogIcon,
  RefreshIcon,
  RocketIcon,
  WarningIcon,
  HistoryIcon,
  BroadcastIcon,
} from '@/components/icons/TabIcons';

interface SourceTierTabsProps {
  tierAnalysis: SourceTierAnalysis | null;
  selectedTier: string;
  onTierSelect: (tier: string) => void;
}

export default function SourceTierTabs({ tierAnalysis, selectedTier, onTierSelect }: SourceTierTabsProps) {
  if (!tierAnalysis) {
    return (
      <div className="border-b border-dark-400/30">
        <div className="flex space-x-2 overflow-x-auto pb-4">
          <button
            onClick={() => onTierSelect('all')}
            className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-gradient-from to-gradient-to text-white text-sm font-medium rounded-lg"
          >
            All Sources
          </button>
        </div>
      </div>
    );
  }

  const formatTierName = (tier: string) => {
    return tier
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getTierIcon = (tier: string, className: string = "w-5 h-5") => {
    const iconMap: Record<string, JSX.Element> = {
      'official_government_primary': <BuildingIcon className={className} />,
      'government_statistics_bureaus': <ChartIcon className={className} />,
      'international_organizations_un': <GlobeIcon className={className} />,
      'international_organizations_financial': <BankIcon className={className} />,
      'international_organizations_oecd': <TrendingIcon className={className} />,
      'peer_reviewed_nature_science': <ScienceIcon className={className} />,
      'peer_reviewed_medical': <MedicalIcon className={className} />,
      'peer_reviewed_social_science': <BookIcon className={className} />,
      'peer_reviewed_policy_journals': <FileIcon className={className} />,
      'peer_reviewed_domain_specific': <AcademicCapIcon className={className} />,
      'university_research_centers': <AcademicCapIcon className={className} />,
      'think_tanks_global': <CloudIcon className={className} />,
      'think_tanks_regional': <GlobeIcon className={className} />,
      'professional_associations': <UsersIcon className={className} />,
      'regulatory_authorities': <ScaleIcon className={className} />,
      'central_banks_monetary': <CashIcon className={className} />,
      'industry_reports_consulting': <ChecklistIcon className={className} />,
      'industry_reports_market_research': <ChartIcon className={className} />,
      'industry_associations': <OfficeIcon className={className} />,
      'news_quality_international': <NewspaperIcon className={className} />,
      'news_quality_business': <BriefcaseIcon className={className} />,
      'news_specialized_trade': <BroadcastIcon className={className} />,
      'multilateral_development_banks': <BankIcon className={className} />,
      'ngo_advocacy_organizations': <HandshakeIcon className={className} />,
      'policy_implementation_cases': <CogIcon className={className} />,
      'comparative_international_studies': <RefreshIcon className={className} />,
      'historical_policy_analysis': <HistoryIcon className={className} />,
      'emerging_trends_future': <RocketIcon className={className} />,
      'quantitative_data_metrics': <ChartIcon className={className} />,
      'implementation_barriers_challenges': <WarningIcon className={className} />
    };
    return iconMap[tier] || <FileIcon className={className} />;
  };

  const getTierDescription = (tier: string) => {
    const descMap: Record<string, string> = {
      'official_government_primary': 'Official government agencies, ministries, departments',
      'government_statistics_bureaus': 'National/regional statistical offices and census data',
      'international_organizations_un': 'UN family organizations (WHO, UNESCO, UNICEF)',
      'international_organizations_financial': 'World Bank, IMF, regional development banks',
      'international_organizations_oecd': 'OECD reports and economic analysis',
      'peer_reviewed_nature_science': 'High-impact journals (Nature, Science, Cell)',
      'peer_reviewed_medical': 'Medical journals (NEJM, Lancet, BMJ, JAMA)',
      'peer_reviewed_social_science': 'Social science research (PNAS, psychology)',
      'peer_reviewed_policy_journals': 'Policy-specific academic journals',
      'peer_reviewed_domain_specific': 'Domain-specific academic research',
      'university_research_centers': 'University research institutes and centers',
      'think_tanks_global': 'Major global think tanks (Brookings, CFR)',
      'think_tanks_regional': 'Regional policy institutes and think tanks',
      'professional_associations': 'Industry professional bodies and associations',
      'regulatory_authorities': 'Regulatory agencies and oversight bodies',
      'central_banks_monetary': 'Central banks and monetary authorities',
      'industry_reports_consulting': 'Consulting firms (McKinsey, Deloitte, PwC)',
      'industry_reports_market_research': 'Market research firms (Gartner, IDC)',
      'industry_associations': 'Industry-specific trade associations',
      'news_quality_international': 'International news (BBC, Reuters, AP)',
      'news_quality_business': 'Business news (WSJ, Financial Times, Bloomberg)',
      'news_specialized_trade': 'Trade publications and specialized media',
      'multilateral_development_banks': 'Regional development banks (ADB, AfDB)',
      'ngo_advocacy_organizations': 'NGOs and advocacy groups',
      'policy_implementation_cases': 'Real-world implementation examples',
      'comparative_international_studies': 'Cross-country comparative analysis',
      'historical_policy_analysis': 'Historical and longitudinal studies',
      'emerging_trends_future': 'Future trends and emerging developments',
      'quantitative_data_metrics': 'Statistical data and quantitative analysis',
      'implementation_barriers_challenges': 'Challenges and implementation barriers'
    };
    return descMap[tier] || 'Specialized source category';
  };

  // Sort tiers by citation count (descending) and take top ones for tabs
  const sortedTiers = Object.entries(tierAnalysis.tier_distribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12); // Show top 12 tiers as tabs

  return (
    <div className="border-b border-dark-400/30">
      <div className="flex space-x-2 overflow-x-auto pb-4">
        {/* All Sources Tab */}
        <button
          onClick={() => onTierSelect('all')}
          className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
            selectedTier === 'all'
              ? 'bg-gradient-to-r from-gradient-from to-gradient-to text-white'
              : 'bg-dark-600/50 text-gray-300 hover:bg-dark-500/50 hover:text-white'
          }`}
          title="View all citations from all source tiers"
        >
          <GlobeIcon className="w-4 h-4" />
          All Sources
          <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">
            {Object.values(tierAnalysis.tier_distribution).reduce((a, b) => a + b, 0)}
          </span>
        </button>

        {/* Individual Tier Tabs */}
        {sortedTiers.map(([tier, count]) => (
          <button
            key={tier}
            onClick={() => onTierSelect(tier)}
            className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors group flex items-center gap-2 ${
              selectedTier === tier
                ? 'bg-gradient-to-r from-gradient-from to-gradient-to text-white'
                : 'bg-dark-600/50 text-gray-300 hover:bg-dark-500/50 hover:text-white'
            }`}
            title={getTierDescription(tier)}
          >
            {getTierIcon(tier, "w-4 h-4")}
            <span className="hidden md:inline">{formatTierName(tier)}</span>
            <span className="md:hidden">{formatTierName(tier).split(' ').slice(0, 2).join(' ')}</span>
            <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">
              {count}
            </span>
          </button>
        ))}

        {/* More Tiers Dropdown (if there are more than 12) */}
        {Object.keys(tierAnalysis.tier_distribution).length > 12 && (
          <div className="relative flex-shrink-0">
            <select
              value={selectedTier}
              onChange={(e) => onTierSelect(e.target.value)}
              className="px-4 py-2 bg-dark-600/50 text-gray-300 text-sm font-medium rounded-lg border border-dark-400/30 focus:ring-2 focus:ring-gradient-from focus:border-gradient-from appearance-none pr-8"
            >
              <option value="">More Tiers...</option>
              {Object.entries(tierAnalysis.tier_distribution)
                .sort(([, a], [, b]) => b - a)
                .slice(12)
                .map(([tier, count]) => (
                  <option key={tier} value={tier}>
                    {formatTierName(tier)} ({count})
                  </option>
                ))
              }
            </select>
            <svg className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>

      {/* Selected Tier Info */}
      {selectedTier !== 'all' && (
        <div className="py-3 px-4 bg-dark-600/20 rounded-lg mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">{getTierIcon(selectedTier, "w-8 h-8")}</div>
            <div>
              <h4 className="text-lg font-medium text-gray-100">{formatTierName(selectedTier)}</h4>
              <p className="text-sm text-gray-400">{getTierDescription(selectedTier)}</p>
            </div>
            <div className="ml-auto text-right">
              <div className="text-2xl font-bold text-gradient-from">
                {tierAnalysis.tier_distribution[selectedTier] || 0}
              </div>
              <div className="text-xs text-gray-400">citations</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
