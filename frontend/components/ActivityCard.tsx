import React from 'react';
import { ActivityPrediction, AppState } from '../types';
import { Loader2, Wind } from 'lucide-react';

interface ActivityCardProps {
  prediction: ActivityPrediction | null;
  appState: AppState;
  isSimulating: boolean;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ prediction, appState, isSimulating }) => {
  
  return (
    <div className={`relative flex flex-col items-center justify-center p-8 bg-[#fdfbf7] rounded-sm border-4 transition-all duration-500 min-h-[350px] ink-shadow ${appState === AppState.RECORDING ? 'border-stone-400' : 'border-stone-200'}`}>
      
      {/* Simulation Stamp */}
      {isSimulating && (
        <div className="absolute top-4 right-4 px-3 py-1 border-2 border-red-800 text-red-900 text-[10px] font-serif font-bold tracking-widest uppercase opacity-70 transform rotate-3">
            SIMULATION
        </div>
      )}

      {/* Corner accents */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-stone-300"></div>
      <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-stone-300"></div>

      {appState === AppState.IDLE && (
        <div className="text-center space-y-6">
           <div className="w-24 h-24 rounded-full border-2 border-stone-300 flex items-center justify-center mx-auto opacity-50">
             <Wind className="w-10 h-10 text-stone-400" />
           </div>
           <h2 className="text-3xl font-serif font-bold text-stone-800">Awaiting Motion</h2>
           <p className="text-stone-500 max-w-xs mx-auto font-serif italic">
             The canvas is still. Begin recording to paint your movement with data.
           </p>
        </div>
      )}

      {(appState === AppState.RECORDING || appState === AppState.ANALYZING) && !prediction && (
         <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full border-t-2 border-stone-800 flex items-center justify-center mx-auto animate-spin">
            </div>
            <div>
                <h2 className="text-xl font-serif text-stone-700">Observing...</h2>
                <p className="text-stone-400 text-sm font-serif italic mt-2">Sensing the flow</p>
            </div>
         </div>
      )}

      {prediction && (
        <div className="w-full text-center animate-in fade-in zoom-in-95 duration-700">
          
          <div className="text-7xl mb-6 opacity-90 filter sepia-[.25] grayscale-[0.8]">
            {prediction.emoji}
          </div>
          
          <h2 className="text-5xl font-serif font-black text-stone-900 tracking-tight mb-4">
            {prediction.activity}
          </h2>
          
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-stone-100 border border-stone-200 mb-8">
            <span className="w-2 h-2 bg-red-800 rounded-full"></span>
            <span className="text-sm font-serif tracking-widest text-stone-600">{prediction.confidence}% CERTAINTY</span>
          </div>

          <div className="border-t border-b border-stone-200 py-6 px-4 max-w-sm mx-auto">
            <p className="text-stone-600 text-lg font-serif italic leading-relaxed">
              "{prediction.reasoning}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};