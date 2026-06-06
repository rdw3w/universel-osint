import { useState, useEffect, useRef } from "react";
import { Search, Image as ImageIcon, Video, Mic, Mail, Phone, User, Globe, FileText, Map, ShieldAlert, Cpu, Landmark, Clock, AlertTriangle, Upload, Link, Activity, Car, Fingerprint, ExternalLink, CheckCircle, XCircle, Menu, X } from "lucide-react";
import { cn } from "../lib/utils";
import { LiveAttackMap } from "../components/LiveAttackMap";

const MODULES = [
  { id: "domain", name: "🌐 Domain & Network", icon: Globe, desc: "DNS, SSL, WHOIS, Subdomains", category: "Global Intelligence" },
  { id: "username", name: "👤 Username Intel", icon: User, desc: "Cross-platform discovery, reuse analysis", category: "Global Intelligence" },
  { id: "email", name: "📧 Email Analysis", icon: Mail, desc: "Breaches, Domain Rep, Disposable test", category: "Global Intelligence" },
  { id: "image", name: "🖼️ Image Intel", icon: ImageIcon, desc: "EXIF, Reverse Search, Steganography", category: "Global Intelligence" },
  { id: "video", name: "🎥 Video Intel", icon: Video, desc: "Deepfake indicators, Frame OCR", category: "Global Intelligence" },
  { id: "audio", name: "🎙️ Audio Spec", icon: Mic, desc: "Language detection, Noise filter", category: "Global Intelligence" },
  { id: "meta", name: "📄 Metadata Lab", icon: FileText, desc: "Website unused metadata, Tech stack", category: "Global Intelligence" },
  { id: "geo", name: "🗺️ Geo Analysis", icon: Map, desc: "Coordinates, Map viz, Confidence", category: "Global Intelligence" },
  { id: "doc", name: "📜 Doc Intelligence", icon: ShieldAlert, desc: "OCR, Classification", category: "Global Intelligence" },
  { id: "number_v1", name: "📱 Number Info v1", icon: Phone, desc: "Carrier lookup, Spam risk (v1)", category: "National Intelligence" },
  { id: "number_v2", name: "📱 Number Info v2", icon: Phone, desc: "Carrier lookup, Spam risk (v2)", category: "National Intelligence" },
  { id: "ifsc", name: "🏦 Bank IFSC", icon: Landmark, desc: "Bank IFSC Lookup", category: "National Intelligence" },
  { id: "pincode", name: "📍 PIN Code", icon: Map, desc: "Postal PIN Code Info", category: "National Intelligence" },
  { id: "identity", name: "🪪 Identity Intel", icon: Fingerprint, desc: "Aadhaar lookup, public records", category: "National Intelligence" },
  { id: "vahan_v1", name: "🚗 Vahan Info v1", icon: Car, desc: "RC details, registration info (v1)", category: "National Intelligence" },
  { id: "vahan_v2", name: "🚗 Vahan Info v2", icon: Car, desc: "RC details, registration info (v2)", category: "National Intelligence" },

  // Surface Web Intelligence
  { id: "surface_scanner", name: "🌐 Surface Scanner", icon: Globe, desc: "Scan public assets", category: "Surface Web Intelligence" },
  { id: "os_explorer", name: "🔍 Open Source Explorer", icon: Search, desc: "OSINT discovery", category: "Surface Web Intelligence" },
  { id: "search_agg", name: "📑 Search Aggregator", icon: FileText, desc: "Aggregate search engines", category: "Surface Web Intelligence" },
  { id: "public_records", name: "📂 Public Records", icon: FileText, desc: "Search public databases", category: "Surface Web Intelligence" },
  { id: "site_profiler", name: "📊 Site Profiler", icon: Activity, desc: "Website profiling & reconnaissance", category: "Surface Web Intelligence" },
  { id: "internet_scanner", name: "📡 Internet Scanner", icon: Search, desc: "Broad internet scan architecture", category: "Surface Web Intelligence" },

  // Deep Web Intelligence
  { id: "deep_search", name: "🕳️ Deep Search Engine", icon: Search, desc: "Deep web indexed search", category: "Deep Web Intelligence" },
  { id: "hidden_sources", name: "🕵️ Hidden Sources", icon: ShieldAlert, desc: "Explore hidden data", category: "Deep Web Intelligence" },
  { id: "archive_miner", name: "🗄️ Archive Miner", icon: FileText, desc: "Mine historical archives", category: "Deep Web Intelligence" },
  { id: "research_engine", name: "🔬 Research Engine", icon: Activity, desc: "Advanced research", category: "Deep Web Intelligence" },

  // Dark Web & Exposure
  { id: "dark_monitor", name: "🌑 Dark Web Monitor", icon: ShieldAlert, desc: "Hidden network scanning", category: "Dark Web Intelligence" },
  { id: "leak_scanner", name: "📢 Data Breach Checker", icon: AlertTriangle, desc: "Monitor exposed credentials", category: "Dark Web Intelligence" },
  { id: "threat_feed", name: "⚠️ Threat Intelligence", icon: Activity, desc: "Underground threat feeds", category: "Dark Web Intelligence" },
  
  // Correlation & Monitoring
  { id: "entity_mapper", name: "🧩 Entity Mapper", icon: Link, desc: "Link analysis & correlation", category: "Correlation & Alerts" },
  { id: "watch_engine", name: "📡 Threat Watch", icon: Clock, desc: "Signal monitoring & Watchlist", category: "Correlation & Alerts" },
  { id: "case_manager", name: "📂 Case Manager", icon: FileText, desc: "Intelligence Reports & Vault", category: "Reporting & Case Work" },
];

const ADVANCED_MODULES = [
  { id: "adv_pincode", name: "⚡ Advanced PIN Code", icon: Map, desc: "Bypass cached DB for direct postal lookup", category: "Advanced Intelligence" },
  { id: "adv_ifsc", name: "⚡ Advanced IFSC", icon: Landmark, desc: "Direct Bank Core lookup", category: "Advanced Intelligence" },
  { id: "adv_vahan", name: "⚡ Advanced VAHAN", icon: Car, desc: "Transport Dept Direct API", category: "Advanced Intelligence" },
  { id: "adv_aadhaar", name: "⚡ Advanced Identity", icon: Fingerprint, desc: "Aadhaar UIDAI Direct Verification", category: "Advanced Intelligence" },
  { id: "adv_number", name: "⚡ Deep Phone Intel", icon: Phone, desc: "Direct Carrier Query", category: "Advanced Intelligence" },
  { id: "adv_6m_number", name: "⚡ 6M Phone History", icon: Clock, desc: "6-Month historical caller data", category: "Advanced Intelligence" },
  { id: "adv_email", name: "⚡ Deep Email Intel", icon: Mail, desc: "Real-time SMTP footprinting", category: "Advanced Intelligence" },
];

function ResultViewer({ data, isRoot = false }: { data: any, isRoot?: boolean }): any {
  if (data === null || data === undefined || data === "") return <span className="text-slate-600 italic font-mono text-sm">null</span>;
  
  if (typeof data === 'string') {
    if (data.startsWith('http://') || data.startsWith('https://')) {
      const isImage = data.match(/\.(jpeg|jpg|gif|png|webp)$/i);
      if (isImage) {
        return (
          <div className="mt-1">
            <a href={data} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline text-xs inline-flex items-center gap-1 mb-2 break-all">{data} <ExternalLink className="w-3 h-3 shrink-0" /></a>
            <img src={data} alt="result" className="max-h-32 object-contain rounded border border-white/10 bg-slate-900" />
          </div>
        );
      }
      return <a href={data} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-1 break-all text-sm">{data} <ExternalLink className="w-3 h-3 shrink-0" /></a>;
    }
    return <span className="text-slate-300 break-words text-sm">{data}</span>;
  }
  
  if (typeof data === 'boolean') {
    return data ? <span className="inline-flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20 text-xs font-mono"><CheckCircle className="w-3 h-3" /> True</span> : 
                  <span className="inline-flex items-center gap-1 text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20 text-xs font-mono"><XCircle className="w-3 h-3" /> False</span>;
  }
  
  if (typeof data === 'number') {
    return <span className="text-fuchsia-400 font-mono text-sm">{data}</span>;
  }
  
  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-slate-600 italic font-mono text-sm">Empty List</span>;
    const isSimple = data.every(item => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean');
    if (isSimple) {
      return (
        <div className="flex flex-wrap gap-2 mt-1">
          {data.map((item, i) => (
            <div key={`simple-${i}`} className="bg-slate-800 px-3 py-1.5 rounded-md text-sm text-slate-300 border border-white/5 shadow-sm">
              <ResultViewer data={item} />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-2 mt-1 w-full">
        {data.map((item, i) => (
          <div key={`cplx-${i}`} className="bg-slate-900/40 p-3 rounded-lg border border-white/5">
            <span className="text-[9px] text-slate-500 font-mono mb-2 block uppercase tracking-widest">Entry {i + 1}</span>
            <ResultViewer data={item} />
          </div>
        ))}
      </div>
    );
  }
  
  if (typeof data === 'object') {
    if (isRoot && 'success' in data && 'data' in data) {
      if (data.error) {
        return <div className="text-red-400 font-mono">{data.error}</div>;
      }
      return <ResultViewer data={data.data} />;
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 w-full">
        {Object.entries(data).map(([key, value]) => {
          if (value === null || value === undefined || value === "") return null;
          const isObjOrArray = typeof value === 'object';
          return (
            <div key={key} className={cn("bg-slate-900/30 p-3 rounded-lg border border-white/5 flex flex-col hover:bg-slate-900/50 transition-colors",
              isObjOrArray ? "sm:col-span-2" : ""
            )}>
              <span className="text-[10px] uppercase tracking-widest text-cyan-500/70 font-mono mb-1">{key.replace(/_/g, ' ')}</span>
              <div className="flex-1">
                 <ResultViewer data={value} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  
  return null;
}

function getFingerprint() {
  let fp = localStorage.getItem("nexus_fp");
  if (!fp) {
    fp = "fp_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("nexus_fp", fp);
  }
  return fp;
}

export function Dashboard() {
  const [query, setQuery] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeModule, setActiveModule] = useState(MODULES[0]);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState({ credits: 3, resetAt: 0 });
  const [timeLeft, setTimeLeft] = useState("");

  const [mode, setMode] = useState<"modules" | "live_attacks" | "directory">("modules");
  const [directoryData, setDirectoryData] = useState<any>(null);
  const [pluginsStatus, setPluginsStatus] = useState<Record<string, { enabled: boolean }>>({});
  const [role, setRole] = useState("user");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fp = getFingerprint();

  useEffect(() => {
    const adminToken = localStorage.getItem("nexus_admin_token");
    if (adminToken === "rudra_admin_auth_token_99") {
      setRole("admin");
    }

    fetch("/api/toolkit")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDirectoryData(data.data);
        }
      })
      .catch(console.error);

    fetch("/api/plugins")
      .then(res => res.json())
      .then(data => {
        if (data.plugins) {
          setPluginsStatus(data.plugins);
        }
      })
      .catch(console.error);

    fetch("/api/quota", {
      headers: { 
        "x-device-fingerprint": fp,
        "x-admin-token": localStorage.getItem("nexus_admin_token") || ""
      }
    })
      .then(res => res.json())
      .then(data => setQuota(data))
      .catch(console.error);
  }, [fp]);

  useEffect(() => {
    setQuery("");
    setFile(null);
    setResults(null);
  }, [activeModule]);

  useEffect(() => {
    if (quota.credits <= 0 && quota.resetAt) {
      const interval = setInterval(() => {
        const now = Date.now();
        const diff = quota.resetAt - now;
        if (diff <= 0) {
          setQuota({ credits: 3, resetAt: 0 });
          setTimeLeft("");
          clearInterval(interval);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${hours}h ${mins}m ${secs}s`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [quota]);

  const runInvestigation = async () => {
    if (!query && !file) return;
    setLoading(true);
    setResults(null);
    try {
      let body;
      let headers: Record<string, string> = { 
        "x-device-fingerprint": fp,
        "x-admin-token": localStorage.getItem("nexus_admin_token") || ""
      };

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        if (query) formData.append("target", query);
        body = formData;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({ target: query });
      }

      const res = await fetch(`/api/module/${activeModule.id}`, {
        method: "POST",
        headers,
        body
      });
      
      if (res.headers.has('X-Credits-Remaining') && res.headers.has('X-Reset-At')) {
        setQuota({
          credits: parseInt(res.headers.get('X-Credits-Remaining') || "0"),
          resetAt: parseInt(res.headers.get('X-Reset-At') || "0")
        });
      }

      if (res.status === 429) {
        const errData = await res.json();
        throw new Error(errData.message || "Quota Exceeded. Please wait 24 hours.");
      }

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || "Module offline or unavailable in preview.");
      }
      
      setResults(data);
    } catch (e: any) {
      setResults({ error: e.message || "Failed to execute module." });
    }
    setLoading(false);
  };

  const isBlocked = quota.credits <= 0;
  const supportsFile = ["image", "video", "audio", "doc"].includes(activeModule.id);

  return (
    <div className="min-h-screen h-screen bg-slate-950 text-slate-300 font-sans flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Topbar */}
      <div className="md:hidden bg-slate-900 border-b border-white/5 p-4 flex items-center justify-between z-50 flex-shrink-0">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => { setMode("modules"); setIsSidebarOpen(false); }}>
          <div className="w-8 h-8 rounded bg-cyan-500/20 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="font-semibold text-white tracking-tight">Nexus OSINT</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-white/5 rounded-lg border border-white/10 text-white flex-shrink-0"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 md:w-64 bg-slate-950/95 md:bg-slate-900/50 backdrop-blur-xl md:backdrop-blur-none border-r border-white/5 p-4 flex flex-col space-y-6 transform transition-transform duration-300 md:relative md:translate-x-0 h-full max-h-screen overflow-y-auto hide-scrollbar",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="hidden md:flex items-center space-x-2 pt-2 cursor-pointer" onClick={() => setMode("modules")}>
          <div className="w-8 h-8 rounded bg-cyan-500/20 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="font-semibold text-white tracking-tight">Nexus OSINT</span>
        </div>

        <div className="bg-slate-950 rounded-lg p-3 border border-white/5 flex flex-col space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 uppercase tracking-wider font-mono">Anonymous Session</span>
            <span className="text-cyan-400 font-mono">{quota.credits} / 3</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-500", isBlocked ? "bg-red-500" : "bg-cyan-500")}
              style={{ width: `${(quota.credits / 3) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => { setMode("live_attacks"); setIsSidebarOpen(false); }}
          className={cn(
            "w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors border",
            mode === "live_attacks" 
              ? "bg-red-500/10 text-red-400 border-red-500/20 font-medium" 
              : "bg-slate-900 border-white/5 hover:bg-white/5 text-slate-300"
          )}
        >
          <div className="flex items-center space-x-3">
            <Activity className="w-4 h-4" />
            <span>Live Threat Map</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
        </button>

        <button
          onClick={() => { setMode("directory"); setIsSidebarOpen(false); }}
          className={cn(
            "w-full flex items-center justify-start px-3 py-3 rounded-lg text-sm transition-colors border",
            mode === "directory" 
              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-medium" 
              : "bg-slate-900 border-white/5 hover:bg-white/5 text-slate-300"
          )}
        >
          <div className="flex items-center space-x-3">
            <Link className="w-4 h-4" />
            <span>OSINT Directory</span>
          </div>
        </button>

        <div className="w-full h-px bg-white/5 mb-4"></div>

        <nav className="flex flex-col overflow-y-auto overflow-x-hidden pb-4 hide-scrollbar flex-1 space-y-6">
          {Object.entries(
            (showAdvanced ? [...MODULES, ...ADVANCED_MODULES] : MODULES).reduce((acc, mod) => {
              if (!acc[mod.category]) acc[mod.category] = [];
              acc[mod.category].push(mod);
              return acc;
            }, {} as Record<string, any>)
          ).map(([category, modules]: [string, any]) => (
            <div key={category} className="mb-2">
              <h3 className="text-[10px] font-mono text-slate-500 px-3 mb-2 uppercase tracking-widest">{category}</h3>
              <div className="space-y-1">
                {modules.map((mod: any) => (
                  <button
                    key={mod.id}
                    onClick={() => { setActiveModule(mod); setMode("modules"); setResults(null); setIsSidebarOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-start space-x-3 px-3 py-2 rounded-lg text-sm transition-colors relative group",
                      mode === "modules" && activeModule.id === mod.id 
                        ? "bg-cyan-500/10 text-cyan-400 font-medium border border-cyan-500/20" 
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-300 border border-transparent"
                    )}
                  >
                    <mod.icon className={cn("w-4 h-4", mode === "modules" && activeModule.id === mod.id ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-400")} />
                    <span className="truncate">{mod.name}</span>
                    
                    {pluginsStatus[mod.id] && !pluginsStatus[mod.id].enabled && (
                      <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          <div className="pt-2 px-2">
            <button
               onClick={() => setShowAdvanced(!showAdvanced)}
               className={cn(
                 "w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-mono transition-colors border",
                 showAdvanced 
                   ? "bg-purple-500/10 text-purple-400 border-purple-500/30 font-bold" 
                   : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
               )}
            >
               <Activity className="w-3.5 h-3.5" />
               <span>{showAdvanced ? "HIDE ADVANCED TOOLS" : "SHOW ADVANCED TOOLS"}</span>
            </button>
          </div>
        </nav>

        <div className="w-full pt-4 mt-auto border-t border-white/5 text-center">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Website designed by Rudra
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        {mode === "directory" ? (
          <div className="absolute inset-0 flex flex-col overflow-y-auto">
             <header className="border-b border-white/5 p-6 bg-slate-900/40 relative z-10 backdrop-blur-sm sticky top-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-medium text-white">OSINT Directory</h1>
                    <p className="text-slate-400 text-sm mt-1">Curated list of public intelligence resources and external platforms.</p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono">
                    Advanced OSINT Toolkit
                  </div>
                </div>
             </header>
             <div className="p-6 max-w-5xl mx-auto w-full">
               {directoryData ? (
                 <div className="space-y-12">
                   {Object.entries(directoryData).map(([category, tools]: [string, any]) => (
                     <div key={category}>
                       <h2 className="text-lg font-medium text-slate-200 mb-4 border-b border-white/5 pb-2">{category}</h2>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {tools.map((tool: any, idx: number) => (
                           <a 
                             key={idx} 
                             href={tool.url} 
                             target="_blank" 
                             rel="noreferrer"
                             className="group bg-slate-900/40 border border-white/5 p-4 rounded-xl hover:bg-slate-900 hover:border-indigo-500/30 transition-all block"
                           >
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium text-indigo-300 group-hover:text-indigo-400 flex items-center gap-2">
                                  {tool.name}
                                </h3>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                              </div>
                              <p className="text-sm text-slate-500 line-clamp-2">{tool.desc}</p>
                              <div className="mt-3 text-[10px] font-mono text-slate-600 truncate">{tool.url}</div>
                           </a>
                         ))}
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="flex items-center justify-center p-12">
                   <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                 </div>
               )}
             </div>
          </div>
        ) : mode === "live_attacks" ? (
          <div className="absolute inset-0 flex flex-col">
             <header className="border-b border-white/5 p-6 bg-slate-900/40 relative z-10 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-medium text-white">Global Threat Monitor</h1>
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs font-mono uppercase tracking-widest border border-red-500/30">Live</span>
                </div>
                <p className="text-slate-400 text-sm mt-2">Real-time visualization of intercepted attacks and honeypot traffic.</p>
             </header>
             <div className="flex-1 relative">
                {/* We will build out LiveAttackMap within this area */}
                <LiveAttackMap />
             </div>
          </div>
        ) : (
          <>
            <header className="border-b border-white/5 p-6 bg-slate-900/20">
              <h1 className="text-2xl font-medium text-white mb-2">{activeModule.name}</h1>
              <p className="text-slate-400 text-sm">{activeModule.desc}</p>
            </header>

            <main className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-6">
                
                {isBlocked ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-medium text-white">Daily Quota Exceeded</h2>
                    <p className="text-slate-400 max-w-md text-sm">
                      Anonymous usage is strictly limited to 3 searches per device every 24 hours to prevent abuse and ensure service stability.
                    </p>
                    <div className="inline-flex items-center space-x-2 bg-slate-950 border border-white/10 px-4 py-2 rounded-lg font-mono text-red-400">
                      <Clock className="w-4 h-4" />
                      <span>Cooldown: {timeLeft}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4 shadow-sm">
                    {supportsFile ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">Provide URL Target</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && runInvestigation()}
                              disabled={!!file}
                              placeholder={activeModule.id === 'meta' ? "https://example.com" : `Paste ${activeModule.id} URL...`}
                              className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 pl-10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50"
                            />
                            <Link className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">Or Upload File</label>
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                          />
                          <button 
                            disabled={!!query}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                              "flex-1 flex items-center justify-center space-x-2 border border-dashed rounded-lg px-4 py-3 transition-colors disabled:opacity-50",
                              file ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400" : "border-white/20 hover:border-white/40 hover:bg-white/5 text-slate-300"
                            )}
                          >
                            <Upload className="w-4 h-4" />
                            <span className="truncate">{file ? file.name : `Select ${activeModule.name.replace(' Intel', '')}`}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <input 
                          type="text" 
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && runInvestigation()}
                          placeholder={
                            activeModule.id === 'meta' ? "Enter website URL e.g. example.com..." : 
                            activeModule.id.includes('identity') || activeModule.id === 'adv_aadhaar' ? "Enter Aadhaar Number (12 digits)..." :
                            activeModule.id.includes('vehicle') || activeModule.id === 'adv_vahan' ? "Enter Vehicle RC (e.g. MH12DE1433)..." :
                            activeModule.id.includes('ifsc') ? "Enter IFSC Code..." :
                            activeModule.id.includes('pincode') ? "Enter 6-digit PIN Code..." :
                            activeModule.id.includes('number') ? "Enter 10-digit Phone Number..." :
                            activeModule.id.includes('email') ? "Enter Email Address..." :
                            `Search target for ${activeModule.name.toLowerCase()}...`
                          }
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-4 pl-12 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                        />
                        <Search className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
                      </div>
                    )}
                    
                    <div className="flex justify-end pt-4 border-t border-white/5 mt-6">
                      <button 
                        onClick={runInvestigation}
                        disabled={loading || (!query && !file)}
                        className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:hover:bg-cyan-500 text-slate-950 font-medium px-6 py-3 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2"
                      >
                        {loading && <Cpu className="w-4 h-4 animate-spin" />}
                        <span>{loading ? "Scanning..." : "Execute Analysis"}</span>
                      </button>
                    </div>
                  </div>
                )}

            {pluginsStatus[activeModule.id] && !pluginsStatus[activeModule.id].enabled && !isBlocked && (
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm flex gap-3">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <p>This module has been temporarily disabled by the administrator.</p>
              </div>
            )}

            {results && !isBlocked && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 overflow-hidden">
                <div className={cn(
                  "inline-block px-3 py-1 rounded text-xs font-mono mb-4 uppercase tracking-wider border",
                  results.error 
                    ? "bg-red-500/10 border-red-500/20 text-red-400" 
                    : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                )}>
                  {results.error ? "Investigation Failed" : "Investigation Complete"}
                </div>
                {results.error ? (
                  <div className="text-red-400 font-mono text-sm bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                    {results.error}
                  </div>
                ) : (
                  <div className="text-slate-300">
                    <ResultViewer data={results} isRoot={true} />
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
        </>
        )}
      </div>
    </div>
  );
}
