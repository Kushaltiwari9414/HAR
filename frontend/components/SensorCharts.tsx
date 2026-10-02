
import React, { useEffect, useState } from 'react';
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';
import { SensorData } from '../types';

interface SensorChartsProps {
  currentData: SensorData;
  isRecording: boolean;
}

export const SensorCharts: React.FC<SensorChartsProps> = ({ currentData, isRecording }) => {
  const [history, setHistory] = useState<SensorData[]>([]);

  useEffect(() => {
    setHistory(prev => {
      const newHistory = [...prev, currentData];
      if (newHistory.length > 50) newHistory.shift(); // Keep last 50 points
      return newHistory;
    });
  }, [currentData]); 

  return (
    <div className="w-full space-y-4">
      {/* Accelerometer Chart */}
      <div className="bg-white rounded-sm p-6 border border-stone-200 shadow-sm h-40 relative overflow-hidden">
        <div className="absolute top-4 left-6 z-10">
            <h3 className="text-xs font-serif font-bold text-stone-800 tracking-widest border-b-2 border-stone-900 inline-block pb-1">
                ACCELERATION (g)
            </h3>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <YAxis domain={['auto', 'auto']} hide />
            {/* X - The heavy ink stroke */}
            <Line type="monotone" dataKey="x" stroke="#1c1917" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            {/* Y - The wash stroke */}
            <Line type="monotone" dataKey="y" stroke="#78716c" strokeWidth={2} dot={false} isAnimationActive={false} />
            {/* Z - The seal accent */}
            <Line type="monotone" dataKey="z" stroke="#991b1b" strokeWidth={1.5} dot={false} isAnimationActive={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
        
        <div className="flex justify-end gap-4 text-[10px] font-mono mt-[-20px] relative z-10 pr-2 opacity-80">
            <span className="text-stone-900 font-bold">X: {currentData.x.toFixed(1)}</span>
            <span className="text-stone-500">Y: {currentData.y.toFixed(1)}</span>
            <span className="text-red-800">Z: {currentData.z.toFixed(1)}</span>
        </div>
      </div>

      {/* Gyroscope Chart */}
      <div className="bg-white rounded-sm p-6 border border-stone-200 shadow-sm h-40 relative overflow-hidden">
        <div className="absolute top-4 left-6 z-10">
            <h3 className="text-xs font-serif font-bold text-stone-600 tracking-widest border-b-2 border-stone-400 inline-block pb-1">
                ROTATION (deg/s)
            </h3>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <YAxis domain={['auto', 'auto']} hide />
            {/* Alpha - Ink */}
            <Line type="monotone" dataKey="alpha" stroke="#44403c" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            {/* Beta - Wash */}
            <Line type="monotone" dataKey="beta" stroke="#a8a29e" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            {/* Gamma - Light */}
            <Line type="monotone" dataKey="gamma" stroke="#d6d3d1" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
        
        <div className="flex justify-end gap-4 text-[10px] font-mono mt-[-20px] relative z-10 pr-2 opacity-80">
            <span className="text-stone-700">α: {currentData.alpha.toFixed(0)}</span>
            <span className="text-stone-500">β: {currentData.beta.toFixed(0)}</span>
            <span className="text-stone-400">γ: {currentData.gamma.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
};
