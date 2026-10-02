import React, { useState, useRef, useEffect } from 'react';
import { ProcessedFeatures, SensorData } from '../types';
import { Download, Trash2, Circle, Activity, Zap, Smartphone, Radio } from 'lucide-react';

interface DataCollectorProps {
  getFeatures: () => ProcessedFeatures | null;
  startRecording: () => void;
  stopRecording: () => void;
  requestPermissions: () => Promise<void>;
  permissionGranted: boolean;
  toggleSimulation: () => void;
  isSimulating: boolean;
  currentData: SensorData;
}

interface LabeledData extends ProcessedFeatures {
  label: string;
  timestamp: number;
}

const ACTIVITIES = [
  { name: 'Idle', emoji: '🧘' },
  { name: 'Walking', emoji: '🚶' },
  { name: 'Running', emoji: '🏃' },
  { name: 'Sitting', emoji: '🪑' },
  { name: 'Standing', emoji: '🧍' },
  { name: 'Jumping', emoji: '⬆️' },
];

export const DataCollector: React.FC<DataCollectorProps> = ({ 
  getFeatures, 
  startRecording, 
  stopRecording,
  requestPermissions,
  permissionGranted,
  toggleSimulation,
  isSimulating,
  currentData
}) => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('Idle');
  const [count, setCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sensorActive, setSensorActive] = useState(false);
  const [waitingForData, setWaitingForData] = useState(false);
  
  const dataBuffer = useRef<LabeledData[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if sensors are providing data
  const hasSensorData = currentData.timestamp > 0 || isSimulating;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      stopRecording();
    };
  }, []);

  const activateSensors = async () => {
    if (!permissionGranted && !isSimulating) {
      await requestPermissions();
    }
    startRecording();
    setSensorActive(true);
  };

  const startCollection = () => {
    setIsCollecting(true);
    setElapsedTime(0);
    setWaitingForData(true);
    
    // Data collection interval
    intervalRef.current = setInterval(() => {
      const features = getFeatures();
      if (features) {
        setWaitingForData(false);
        dataBuffer.current.push({
          ...features,
          label: selectedLabel,
          timestamp: Date.now()
        });
        setCount(dataBuffer.current.length);
      }
    }, 1000);

    // Timer for elapsed seconds
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const stopCollection = () => {
    setIsCollecting(false);
    setWaitingForData(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const downloadData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataBuffer.current, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `har_training_data_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const clearData = () => {
    if (confirm("Clear all recorded data?")) {
      dataBuffer.current = [];
      setCount(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedActivity = ACTIVITIES.find(a => a.name === selectedLabel);

  return (
    <div className="fixed inset-0 bg-stone-950 z-[100] overflow-auto">
      <div className="min-h-screen flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 to-red-800 px-6 py-4">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold tracking-tight">Data Collector</h1>
                <p className="text-red-200 text-xs">Training Mode Active</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono text-white font-bold">{count}</div>
              <div className="text-red-200 text-xs">samples</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-6 py-8 max-w-lg mx-auto w-full space-y-6">
          
          {/* Step 1: Sensor Activation */}
          {!sensorActive && (
            <div className="bg-stone-900 rounded-2xl p-6 border border-stone-800 space-y-4">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-stone-400" />
                <h2 className="text-white font-medium">Step 1: Activate Sensors</h2>
              </div>
              <p className="text-stone-500 text-sm">
                Grant sensor permissions or enable simulation mode to start collecting data.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={activateSensors}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-medium transition-all"
                >
                  📱 Use Sensors
                </button>
                <button
                  onClick={() => { toggleSimulation(); setSensorActive(true); startRecording(); }}
                  className="bg-stone-800 hover:bg-stone-700 text-white py-3 rounded-xl font-medium transition-all"
                >
                  🎮 Simulate
                </button>
              </div>
            </div>
          )}

          {/* Sensor Status */}
          {sensorActive && (
            <div className="flex items-center gap-2 text-sm">
              <Radio className={`w-4 h-4 ${hasSensorData ? 'text-emerald-500' : 'text-stone-600'}`} />
              <span className={hasSensorData ? 'text-emerald-400' : 'text-stone-500'}>
                {isSimulating ? 'Simulation Active' : hasSensorData ? 'Sensors Active' : 'Waiting for sensor data...'}
              </span>
              {hasSensorData && (
                <span className="text-stone-600 text-xs ml-auto font-mono">
                  x:{currentData.x.toFixed(1)} y:{currentData.y.toFixed(1)} z:{currentData.z.toFixed(1)}
                </span>
              )}
            </div>
          )}

          {/* Activity Selector */}
          {sensorActive && (
            <div className="space-y-3">
              <label className="text-stone-400 text-xs font-medium uppercase tracking-wider">
                Select Activity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ACTIVITIES.map(activity => (
                  <button
                    key={activity.name}
                    onClick={() => !isCollecting && setSelectedLabel(activity.name)}
                    disabled={isCollecting}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedLabel === activity.name
                        ? 'bg-red-900/50 border-red-500 text-white'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                    } ${isCollecting ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                  >
                    <div className="text-2xl mb-1">{activity.emoji}</div>
                    <div className="text-xs font-medium">{activity.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recording Status */}
          {isCollecting && (
            <div className="bg-stone-900 rounded-2xl p-6 border border-stone-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Circle className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
                    <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-50" />
                  </div>
                  <span className="text-white font-medium">
                    {waitingForData ? 'Buffering...' : 'Recording'}
                  </span>
                </div>
                <span className="text-3xl">{selectedActivity?.emoji}</span>
              </div>
              
              <div className="text-center py-4">
                <div className="text-5xl font-mono text-white font-bold tracking-tight">
                  {formatTime(elapsedTime)}
                </div>
                <div className="text-stone-500 text-sm mt-2">
                  {waitingForData ? (
                    <span className="text-yellow-400">Waiting for 2s buffer to fill...</span>
                  ) : (
                    <>Collecting <span className="text-red-400">{selectedLabel}</span> data</>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-stone-500 text-xs mt-4">
                <Zap className="w-3 h-3" />
                <span>1 sample/second</span>
              </div>
            </div>
          )}

          {/* Record Button */}
          {sensorActive && (
            <button
              onClick={isCollecting ? stopCollection : startCollection}
              className={`w-full py-5 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] ${
                isCollecting
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-900/30'
              }`}
            >
              {isCollecting ? '■  STOP RECORDING' : '●  START RECORDING'}
            </button>
          )}

          {/* Actions */}
          {sensorActive && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={downloadData}
                disabled={count === 0}
                className="flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-white py-4 rounded-xl font-medium transition-all"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
              <button
                onClick={clearData}
                disabled={count === 0 || isCollecting}
                className="flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 border border-stone-800 disabled:opacity-30 disabled:cursor-not-allowed text-stone-400 py-4 rounded-xl font-medium transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          )}

          {/* Stats */}
          {count > 0 && (
            <div className="bg-stone-900/50 rounded-xl p-4 border border-stone-800/50">
              <div className="text-stone-500 text-xs uppercase tracking-wider mb-3">Buffer Summary</div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-white">{count}</div>
                  <div className="text-stone-500 text-xs">Total</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">
                    {[...new Set(dataBuffer.current.map(d => d.label))].length}
                  </div>
                  <div className="text-stone-500 text-xs">Labels</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">
                    {Math.round(count * 0.1)}kb
                  </div>
                  <div className="text-stone-500 text-xs">Est. Size</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-800">
          <p className="text-center text-stone-600 text-xs">
            Visit without <code className="text-stone-500">?mode=collect</code> for normal app
          </p>
        </div>

      </div>
    </div>
  );
};
