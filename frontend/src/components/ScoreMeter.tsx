'use client';

interface ScoreMeterProps {
  score: number;
  label: string;
  color?: 'blue' | 'green' | 'orange';
}

export default function ScoreMeter({ score, label, color = 'blue' }: ScoreMeterProps) {
  const percentage = Math.round(score * 100);
  
  const colorMap = {
    blue: {
      bg: 'bg-blue-500/20',
      fill: 'bg-gradient-to-r from-blue-500 to-blue-400',
      text: 'text-blue-400',
      border: 'border-blue-500/30'
    },
    green: {
      bg: 'bg-green-500/20',
      fill: 'bg-gradient-to-r from-green-500 to-emerald-400',
      text: 'text-green-400',
      border: 'border-green-500/30'
    },
    orange: {
      bg: 'bg-orange-500/20',
      fill: 'bg-gradient-to-r from-orange-500 to-amber-400',
      text: 'text-orange-400',
      border: 'border-orange-500/30'
    }
  };

  const colors = colorMap[color];

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        <span className={`text-sm font-bold ${colors.text}`}>{percentage}</span>
      </div>
      <div className={`h-1.5 ${colors.bg} rounded-full overflow-hidden border ${colors.border}`}>
        <div 
          className={`h-full ${colors.fill} transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
