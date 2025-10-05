'use client';

import { NewsScrapeResults } from '@/types';

interface GeographyMapViewerProps {
  results: NewsScrapeResults;
  selectedHierarchy: string | null;
  selectedGeo: string | null;
  onSelectHierarchy: (hierarchy: string) => void;
  onSelectGeo: (geo: string) => void;
}

export default function GeographyMapViewer({
  results,
  selectedHierarchy,
  selectedGeo,
  onSelectHierarchy,
  onSelectGeo
}: GeographyMapViewerProps) {
  const hierarchies = results.hierarchy?.hierarchies || [];
  const newsByGeo = results.news_by_geography || {};

  const getGeoList = (hierarchy: string) => {
    return Object.keys(newsByGeo[hierarchy] || {});
  };

  const getCitationCount = (hierarchy: string, geo: string) => {
    return newsByGeo[hierarchy]?.[geo]?.length || 0;
  };

  return (
    <div className="neural-card p-6">
      <h3 className="text-xl font-semibold text-gray-100 mb-6">Geographic Distribution</h3>
      
      <div className="space-y-6">
        {hierarchies.map(hierarchy => {
          const geoList = getGeoList(hierarchy);
          const isSelected = selectedHierarchy === hierarchy;
          
          return (
            <div key={hierarchy} className={`border rounded-lg p-4 transition-all ${
              isSelected ? 'border-gradient-from bg-gradient-from/5' : 'border-dark-400/30'
            }`}>
              <button
                onClick={() => {
                  onSelectHierarchy(hierarchy);
                  if (geoList.length > 0) {
                    onSelectGeo(geoList[0]);
                  }
                }}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-100 capitalize">
                    {hierarchy === 'globe' ? '🌍 Global' : hierarchy === 'region' ? '🗺️ Regional' : '📍 Country-Level'}
                  </h4>
                  <span className="text-sm text-gray-400">{geoList.length} locations</span>
                </div>
              </button>
              
              {isSelected && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  {geoList.map(geo => {
                    const count = getCitationCount(hierarchy, geo);
                    const isGeoSelected = selectedGeo === geo;
                    
                    return (
                      <button
                        key={geo}
                        onClick={() => onSelectGeo(geo)}
                        className={`p-4 rounded-lg text-left transition-all ${
                          isGeoSelected
                            ? 'bg-gradient-to-r from-gradient-from to-gradient-to text-white'
                            : 'bg-dark-600 hover:bg-dark-500 text-gray-300'
                        }`}
                      >
                        <div className="font-semibold mb-1">{geo}</div>
                        <div className="text-sm opacity-80">{count} citations</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

