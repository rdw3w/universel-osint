import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps';
import { Activity, ShieldAlert, Target, Terminal } from 'lucide-react';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

interface AttackLog {
  id: string;
  sourceCoords: [number, number];
  destCoords: [number, number];
  type: string;
  color: string;
  sourceName: string;
  destName: string;
}

const ATTACK_TYPES = [
  { name: "Web Exploit", color: "#ef4444" },
  { name: "DDoS Amplification", color: "#eab308" },
  { name: "Ransomware Payload", color: "#3b82f6" },
  { name: "Port Scan", color: "#10b981" },
  { name: "Credential Stuffing", color: "#f97316" },
  { name: "Zero-Day Attempt", color: "#d946ef" }
];

const LOCATIONS = [
  { coords: [-100, 40], name: "US-West" },
  { coords: [-74, 40.7], name: "US-East" },
  { coords: [-0.1, 51.5], name: "UK-South" },
  { coords: [104, 35], name: "CN-Mainland" },
  { coords: [-46, -23], name: "BR-South" },
  { coords: [139, 35], name: "JP-East" },
  { coords: [77, 28], name: "IN-North" },
  { coords: [37, 55], name: "RU-West" },
  { coords: [151, -33], name: "AU-East" },
  { coords: [10, 51], name: "DE-Central" }
];

export function LiveAttackMap() {
  const [attacks, setAttacks] = useState<AttackLog[]>([]);
  const [metrics, setMetrics] = useState({ active: 8432, blocked: 23145 });

  useEffect(() => {
    const interval = setInterval(() => {
      const source = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      let dest = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      while (source.name === dest.name) {
         dest = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      }

      const typeObj = ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];
      
      const newAttack: AttackLog = {
        id: Math.random().toString(36).substring(7),
        sourceCoords: source.coords as [number, number],
        destCoords: dest.coords as [number, number],
        type: typeObj.name,
        color: typeObj.color,
        sourceName: source.name,
        destName: dest.name
      };
      
      setAttacks(prev => {
        const next = [...prev, newAttack];
        return next.length > 20 ? next.slice(next.length - 20) : next;
      });

      setMetrics(prev => ({
        active: prev.active + Math.floor(Math.random() * 5) - 2,
        blocked: prev.blocked + Math.floor(Math.random() * 10)
      }));
      
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 bg-[#060b19] overflow-hidden font-mono flex flex-col">
      {/* Background World/Globe Visual */}
      <div className="absolute inset-0 opacity-60 pointer-events-none mt-12 md:mt-0">
        <ComposableMap projectionConfig={{ scale: 160, center: [0, 20] }} style={{ width: "100%", height: "100%" }}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography 
                  key={geo.rsmKey} 
                  geography={geo} 
                  fill="#111827" 
                  stroke="#1e293b" 
                  strokeWidth={0.5} 
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#1f2937" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>
          {attacks.map(attack => (
             <g key={attack.id}>
               <Line
                 from={attack.sourceCoords}
                 to={attack.destCoords}
                 stroke={attack.color}
                 strokeWidth={2}
                 strokeOpacity={0.8}
                 className="animate-pulse"
                 strokeLinecap="round"
                 strokeDasharray="4 4"
               />
               <Marker coordinates={attack.destCoords}>
                 <circle r={6} fill={attack.color} opacity={0.3} className="animate-ping" />
                 <circle r={2} fill="#fff" />
               </Marker>
               <Marker coordinates={attack.sourceCoords}>
                 <circle r={2} fill={attack.color} />
               </Marker>
             </g>
          ))}
        </ComposableMap>
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none border-[1px] border-cyan-500/10 opacity-10 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      {/* Top Banner metrics (Mobile Friendly) */}
      <div className="relative z-10 bg-slate-900/80 backdrop-blur-md border-b border-cyan-500/20 p-4 flex flex-col sm:flex-row items-center justify-between shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)]">
        <div className="flex items-center space-x-3 mb-2 sm:mb-0">
          <Activity className="w-5 h-5 text-red-500 animate-pulse" />
          <h2 className="text-cyan-400 font-bold tracking-widest uppercase text-sm sm:text-base">GTI Core Live Feed</h2>
        </div>
        <div className="flex items-center space-x-6 text-xs font-bold">
          <div className="flex flex-col items-end">
            <span className="text-slate-500">ACTIVE THREATS</span>
            <span className="text-red-400 text-lg">{metrics.active.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-slate-500">TOTAL BLOCKED</span>
            <span className="text-cyan-400 text-lg">{metrics.blocked.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative pointer-events-none">
        
        {/* Animated Terminal Log Feed (Bottom/Left) */}
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden flex flex-col h-64 shadow-xl z-20 pointer-events-auto">
          <div className="bg-slate-900/80 p-2 border-b border-white/10 flex justify-between items-center text-[10px] tracking-widest text-slate-400 uppercase">
            <div className="flex items-center space-x-2">
              <Terminal className="w-3 h-3 text-cyan-500" />
              <span>Real-Time Intercepts</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 flex flex-col justify-end space-y-1">
            <AnimatePresence initial={false}>
              {[...attacks].reverse().slice(0, 15).map(attack => (
                <motion.div
                  key={attack.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-2 text-[10px] sm:text-xs bg-slate-950/50 p-1.5 rounded border-l-2"
                  style={{ borderLeftColor: attack.color }}
                >
                  <span className="text-slate-500 w-16 shrink-0">{new Date().toISOString().split('T')[1].substring(0,8)}</span>
                  <div className="flex-1 min-w-0 flex items-center font-bold text-slate-300">
                    <span className="truncate w-16" style={{ color: attack.color }}>{attack.sourceName}</span>
                    <Target className="w-3 h-3 mx-1 opacity-50 shrink-0" />
                    <span className="truncate w-16">{attack.destName}</span>
                  </div>
                  <span className="truncate font-semibold ms-auto" style={{ color: attack.color }}>{attack.type}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
