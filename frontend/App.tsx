import React, { useEffect, useState, useRef } from 'react';
import { Header } from './components/Header';
import { SensorCharts } from './components/SensorCharts';
import { ActivityCard } from './components/ActivityCard';
import { DataCollector } from './components/DataCollector';
import { useSensors } from './hooks/useSensors';
import { classifyActivity } from './services/aiService';
import { ActivityPrediction, AppState } from './types';
import { Play, Square, AlertTriangle } from 'lucide-react';

const ANALYSIS_INTERVAL_MS = 2000; // Analyze every 2 seconds

export default function App() {
  const { 
    isRecording, 
    permissionGranted, 
    currentData, 
    startRecording, 
    stopRecording, 
    requestPermissions,
    getFeatures,
    toggleSimulation,
    isSimulating
  } = useSensors();

  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [prediction, setPrediction] = useState<ActivityPrediction | null>(null);
  
  const lastPredictionRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Check for the secret query param
  const isCollectionMode = new URLSearchParams(window.location.search).get('mode') === 'collect';

  const handleStart = async () => {
    if (!permissionGranted && !isSimulating) {
      await requestPermissions();
    }
    setPrediction(null);
    lastPredictionRef.current = null;
    setAppState(AppState.RECORDING);
    startRecording();
  };

  const handleStop = () => {
    stopRecording();
    setAppState(AppState.IDLE);
    lastPredictionRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  // AI Analysis Loop
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(async () => {
        const features = getFeatures();
        if (features) {
          // setAppState(AppState.ANALYZING); // Optional: flicker state
          
          // Pass the previous activity context to help stabilize the model
          const result = await classifyActivity(features, lastPredictionRef.current || undefined);
          
          setPrediction(result);
          lastPredictionRef.current = result.activity;
          
          // setAppState(AppState.RECORDING);
        }
      }, ANALYSIS_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRecording, getFeatures]);

  return (
    <div className="min-h-screen pb-20">
      {/* 2. Conditionally Render the Collector Panel */}
      {isCollectionMode && (
        <DataCollector 
          getFeatures={getFeatures} 
          startRecording={startRecording}
          stopRecording={stopRecording}
          requestPermissions={requestPermissions}
          permissionGranted={permissionGranted}
          toggleSimulation={toggleSimulation}
          isSimulating={isSimulating}
          currentData={currentData}
        />
      )}

      <Header />

      <main className="max-w-lg mx-auto px-6 pt-8 space-y-8">
        
        {/* Permission / Environment Warning */}
        {!permissionGranted && !isSimulating && (
          <div className="bg-stone-200 border-l-4 border-stone-500 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-stone-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-sm font-serif font-bold text-stone-800">Access Required</h3>
              <p className="text-xs text-stone-600 font-serif italic">
                iOS requires permission. On desktop, please use Simulation Mode.
              </p>
              <button 
                onClick={requestPermissions}
                className="text-xs bg-stone-800 text-white px-4 py-2 hover:bg-stone-700 transition-colors"
              >
                Grant Access
              </button>
            </div>
          </div>
        )}

        {/* Visualization Area */}
        <div className="space-y-3">
            <div className="flex justify-between items-end border-b border-stone-300 pb-1">
                 <h2 className="text-xs font-serif font-bold text-stone-500 tracking-widest uppercase">Live Ink Flow</h2>
                 <button 
                    onClick={toggleSimulation}
                    className={`text-[10px] px-3 py-1 transition-all font-serif tracking-wide ${isSimulating ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-900'}`}
                 >
                    {isSimulating ? 'SIMULATION ACTIVE' : 'ENABLE SIMULATION'}
                 </button>
            </div>
            <SensorCharts currentData={currentData} isRecording={isRecording || isSimulating} />
        </div>

        {/* Main Prediction Card */}
        <ActivityCard 
          prediction={prediction} 
          appState={appState} 
          isSimulating={isSimulating}
        />

        {/* Controls - Floating Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#f5f5f4] via-[#f5f5f4] to-transparent z-40">
          <div className="max-w-lg mx-auto grid grid-cols-1">
            {appState === AppState.IDLE ? (
              <button
                onClick={handleStart}
                className="flex items-center justify-center gap-3 bg-red-900 hover:bg-red-800 text-stone-50 py-4 shadow-lg shadow-red-900/20 transition-all active:translate-y-0.5 group"
              >
                <span className="border-2 border-white/20 p-1">
                   <Play className="w-4 h-4 fill-current" />
                </span>
                <span className="font-serif font-bold text-lg tracking-widest uppercase">Initiate</span>
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="flex items-center justify-center gap-3 bg-stone-900 hover:bg-stone-800 text-white py-4 shadow-lg transition-all active:translate-y-0.5 group"
              >
                <span className="border-2 border-white/20 p-1">
                    <Square className="w-4 h-4 fill-current" />
                </span>
                <span className="font-serif font-bold text-lg tracking-widest uppercase">Cease</span>
              </button>
            )}
          </div>
        </div>

        {/* Tech Specs / Footer */}
        <div className="text-center pt-8 opacity-40 hover:opacity-100 transition-opacity pb-24">
             <p className="text-[10px] font-serif italic text-stone-500">
                20Hz Sampling • 5s Window • Zen Mode
             </p>
        </div>

      </main>
    </div>
  );
}