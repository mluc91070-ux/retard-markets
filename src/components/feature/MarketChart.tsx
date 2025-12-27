import { useEffect, useState } from 'react';

interface ChartData {
  timestamp: string;
  yesPercentage: number;
  noPercentage: number;
  totalPool: number;
}

interface MarketChartProps {
  marketId: string;
  yesPool: number;
  noPool: number;
}

export default function MarketChart({ marketId, yesPool, noPool }: MarketChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | 'all'>('24h');

  useEffect(() => {
    // Load historical data from localStorage
    const stored = localStorage.getItem(`chart_${marketId}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setChartData(data);
      } catch (e) {
        console.error('Failed to parse chart data:', e);
      }
    }

    // Add current data point
    const newDataPoint: ChartData = {
      timestamp: new Date().toISOString(),
      yesPercentage: yesPool + noPool > 0 ? (yesPool / (yesPool + noPool)) * 100 : 50,
      noPercentage: yesPool + noPool > 0 ? (noPool / (yesPool + noPool)) * 100 : 50,
      totalPool: yesPool + noPool
    };

    setChartData(prev => {
      const updated = [...prev, newDataPoint].slice(-100); // Keep last 100 points
      localStorage.setItem(`chart_${marketId}`, JSON.stringify(updated));
      return updated;
    });
  }, [marketId, yesPool, noPool]);

  const getFilteredData = () => {
    const now = Date.now();
    const ranges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };

    return chartData.filter(point => {
      const pointTime = new Date(point.timestamp).getTime();
      return now - pointTime <= ranges[timeRange];
    });
  };

  const filteredData = getFilteredData();
  const maxPool = Math.max(...filteredData.map(d => d.totalPool), 1);

  return (
    <div className="border-4 border-white bg-[#c0c0c0] shadow-lg">
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 flex items-center justify-between">
        <span className="text-white text-xs font-bold">📊 MARKET ANALYTICS</span>
        <div className="flex gap-1">
          <button className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] hover:bg-white">_</button>
          <button className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] hover:bg-white">□</button>
          <button className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] hover:bg-[#ff0000] hover:text-white">×</button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white border-b-2 border-black p-2 flex gap-2">
        {(['1h', '24h', '7d', 'all'] as const).map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 text-xs font-black uppercase border-2 transition-all cursor-pointer whitespace-nowrap ${
              timeRange === range
                ? 'bg-[#00ff00] border-black text-black'
                : 'bg-[#c0c0c0] border-black text-black hover:bg-white'
            }`}
          >
            {range.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Chart Area */}
      <div className="bg-white p-4">
        {filteredData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm font-bold text-gray-600">No data yet</p>
            <p className="text-xs text-gray-500 mt-1">Chart will update as bets are placed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* YES/NO Percentage Chart */}
            <div>
              <p className="text-xs font-black uppercase mb-2">YES/NO DISTRIBUTION</p>
              <div className="h-48 flex items-end gap-1">
                {filteredData.map((point, index) => {
                  const height = (point.totalPool / maxPool) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col justify-end"
                      style={{ height: '100%' }}
                    >
                      <div
                        className="bg-[#00ff00] border border-black transition-all hover:opacity-80 cursor-pointer"
                        style={{ height: `${(height * point.yesPercentage) / 100}%` }}
                        title={`YES: ${point.yesPercentage.toFixed(1)}%`}
                      />
                      <div
                        className="bg-[#ff0000] border border-black transition-all hover:opacity-80 cursor-pointer"
                        style={{ height: `${(height * point.noPercentage) / 100}%` }}
                        title={`NO: ${point.noPercentage.toFixed(1)}%`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-600">
                <span>{new Date(filteredData[0]?.timestamp).toLocaleTimeString()}</span>
                <span>{new Date(filteredData[filteredData.length - 1]?.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Pool Growth Chart */}
            <div>
              <p className="text-xs font-black uppercase mb-2">POOL GROWTH</p>
              <div className="h-32 flex items-end gap-1">
                {filteredData.map((point, index) => {
                  const height = (point.totalPool / maxPool) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 bg-gradient-to-t from-[#00ff00] to-[#ffff00] border border-black transition-all hover:opacity-80 cursor-pointer"
                      style={{ height: `${height}%` }}
                      title={`Pool: ${point.totalPool.toFixed(2)} SOL`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-600">
                <span>0 SOL</span>
                <span>{maxPool.toFixed(2)} SOL</span>
              </div>
            </div>

            {/* Current Stats */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-[#c0c0c0] border-2 border-black p-2 text-center">
                <p className="text-[10px] font-black uppercase text-gray-600">CURRENT YES</p>
                <p className="text-lg font-black text-[#00ff00]">
                  {filteredData[filteredData.length - 1]?.yesPercentage.toFixed(1)}%
                </p>
              </div>
              <div className="bg-[#c0c0c0] border-2 border-black p-2 text-center">
                <p className="text-[10px] font-black uppercase text-gray-600">CURRENT NO</p>
                <p className="text-lg font-black text-[#ff0000]">
                  {filteredData[filteredData.length - 1]?.noPercentage.toFixed(1)}%
                </p>
              </div>
              <div className="bg-[#c0c0c0] border-2 border-black p-2 text-center">
                <p className="text-[10px] font-black uppercase text-gray-600">TOTAL POOL</p>
                <p className="text-lg font-black text-[#ffff00]">
                  {filteredData[filteredData.length - 1]?.totalPool.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Trend Indicator */}
            <div className="bg-[#c0c0c0] border-2 border-black p-3">
              <p className="text-xs font-black uppercase mb-2">📈 TREND</p>
              {filteredData.length >= 2 && (
                <div className="space-y-1">
                  {(() => {
                    const first = filteredData[0];
                    const last = filteredData[filteredData.length - 1];
                    const yesTrend = last.yesPercentage - first.yesPercentage;
                    const poolGrowth = last.totalPool - first.totalPool;

                    return (
                      <>
                        <p className="text-sm font-bold">
                          YES: {yesTrend > 0 ? '📈' : yesTrend < 0 ? '📉' : '➡️'}{' '}
                          <span className={yesTrend > 0 ? 'text-[#00ff00]' : yesTrend < 0 ? 'text-[#ff0000]' : ''}>
                            {yesTrend > 0 ? '+' : ''}{yesTrend.toFixed(1)}%
                          </span>
                        </p>
                        <p className="text-sm font-bold">
                          POOL: {poolGrowth > 0 ? '📈' : poolGrowth < 0 ? '📉' : '➡️'}{' '}
                          <span className={poolGrowth > 0 ? 'text-[#00ff00]' : poolGrowth < 0 ? 'text-[#ff0000]' : ''}>
                            {poolGrowth > 0 ? '+' : ''}{poolGrowth.toFixed(2)} SOL
                          </span>
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-[#c0c0c0] border-t-2 border-white px-2 py-1 flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-600">
          {filteredData.length} data points
        </span>
        <span className="text-[10px] font-bold text-gray-600">
          Updated: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
