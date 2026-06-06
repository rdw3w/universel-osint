import { useNavigate } from "react-router-dom";
import { NetworkGlobe } from "../components/NetworkGlobe";
import { Shield, Fingerprint, Activity, ChevronRight, Lock, Terminal, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

function getFingerprint() {
  let fp = localStorage.getItem("nf_device_fp");
  if (!fp) {
    fp = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    localStorage.setItem("nf_device_fp", fp);
  }
  return fp;
}

export function Landing() {
  const navigate = useNavigate();
  const [visited, setVisited] = useState(false);
  const [glitchText, setGlitchText] = useState("OSINT");
  
  useEffect(() => {
    if (!visited) {
      setVisited(true);
      fetch('/api/visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fp: getFingerprint() })
      }).catch(() => {});
    }
  }, [visited]);

  useEffect(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$*&%";
    let iter = 0;
    const interval = setInterval(() => {
      setGlitchText(prev => prev.split("").map((char, index) => {
        if(index < iter) return "OSINT"[index];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(""));
      
      if(iter >= "OSINT".length) clearInterval(interval);
      iter += 1/3;
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden text-slate-200 font-sans selection:bg-cyan-500/30">
      <NetworkGlobe />
      
      {/* Cyber Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none border-[1px] border-cyan-500/10 opacity-20 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_50%,#000_10%,transparent_100%)]"></div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl w-full text-center space-y-8"
        >
          <div className="flex justify-center">
             <div className="inline-flex items-center space-x-3 px-4 py-1.5 rounded-full bg-slate-900/80 border border-emerald-500/30 backdrop-blur shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-emerald-400 text-xs font-mono tracking-widest uppercase">Encrypted Connection Established</span>
             </div>
          </div>

          <div className="relative">
             <motion.h1 
               className="text-5xl sm:text-6xl md:text-8xl font-sans tracking-tighter font-extrabold text-white"
               animate={{ textShadow: ["0px 0px 0px #06b6d4", "0px 0px 20px #06b6d4", "0px 0px 0px #06b6d4"] }}
               transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
             >
               NEXUS <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-mono tracking-wider">{glitchText}</span>
             </motion.h1>
             {/* Decorative UI elements around the title */}
             <div className="absolute top-0 right-[10%] hidden md:block w-px h-8 bg-cyan-500/50"></div>
             <div className="absolute bottom-0 left-[10%] hidden md:block w-8 h-px bg-cyan-500/50"></div>
             <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden lg:flex flex-col space-y-2">
                 <div className="w-1 h-3 bg-cyan-500/80"></div>
                 <div className="w-1 h-2 bg-cyan-500/40"></div>
                 <div className="w-1 h-4 bg-cyan-500/60"></div>
             </div>
             <div className="absolute -right-12 top-1/2 -translate-y-1/2 hidden lg:flex flex-col space-y-2">
                 <div className="w-1 h-4 bg-purple-500/80"></div>
                 <div className="w-1 h-2 bg-purple-500/40"></div>
                 <div className="w-1 h-3 bg-purple-500/60"></div>
             </div>
          </div>
          
          <p className="text-base sm:text-lg md:text-xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed md:border-l-2 md:border-r-2 border-white/5 px-4 md:px-8">
            Production-grade tactical intelligence platform. Integrated data aggregation, threat correlation, and active reconnaissance workflows.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <button 
              onClick={() => navigate('/dashboard')}
              className="group relative flex items-center space-x-3 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all w-full sm:w-auto overflow-hidden shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.7)]"
            >
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out"></div>
              <Terminal className="w-5 h-5" />
              <span>INITIALIZE TERMINAL</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="group flex items-center space-x-3 px-8 py-4 rounded-none bg-transparent hover:bg-white/5 border border-white/20 hover:border-cyan-500/50 text-white font-mono tracking-wider transition-all w-full sm:w-auto">
              <Shield className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              <span>PROTOCOLS</span>
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="absolute bottom-8 left-0 right-0 flex justify-center space-x-4 md:space-x-12 opacity-80 px-4 flex-wrap gap-y-4"
        >
          <div className="flex items-center space-x-2 font-mono text-[10px] md:text-xs">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">CORE INFRA: <span className="text-white">ONLINE</span></span>
          </div>
          <div className="flex items-center space-x-2 font-mono text-[10px] md:text-xs">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-slate-400">DATA FEEDS: <span className="text-white">SYNCED</span></span>
          </div>
          <div className="flex items-center space-x-2 font-mono text-[10px] md:text-xs">
            <Fingerprint className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">SCAN ENGINE: <span className="text-white">READY</span></span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
