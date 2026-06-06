import { useState, useEffect } from "react";
import { Lock, Shield, Eye, Database, Power, CheckCircle, XCircle } from "lucide-react";

export function Admin() {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("nexus_admin_token") || "");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const result = await res.json();
      if (result.success) {
        setToken(result.token);
        localStorage.setItem("nexus_admin_token", result.token);
        setError("");
        fetchData(result.token);
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  const fetchData = async (adminToken: string) => {
    try {
      const res = await fetch("/api/admin/data", {
        headers: { "x-admin-token": adminToken }
      });
      const result = await res.json();
      if (result.success) {
        setData(result);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("nexus_admin_token");
    setData(null);
  };

  useEffect(() => {
    if (token) fetchData(token);
  }, [token]);

  const updateQuota = async (fp: string, credits: number) => {
    await fetch("/api/admin/quota", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ fingerprint: fp, credits })
    });
    fetchData(token);
  };

  const togglePlugin = async (pluginId: string, enabled: boolean) => {
    await fetch("/api/admin/plugin", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ pluginId, enabled: !enabled })
    });
    fetchData(token);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-mono">
        <div className="bg-slate-900 border border-white/10 p-8 rounded-xl max-w-sm w-full shadow-2xl">
          <div className="flex items-center justify-center mb-6">
            <Shield className="w-12 h-12 text-cyan-500 mb-4" />
          </div>
          <h1 className="text-xl font-bold text-white text-center mb-6">ADMIN AUTHORIZATION</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-2">ACCESS PHRASE</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  placeholder="Enter Password..."
                />
                <Lock className="absolute right-4 top-3.5 w-4 h-4 text-slate-500" />
              </div>
            </div>
            {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
            <button className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-lg transition-colors mt-4">
              AUTHENTICATE
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-mono flex flex-col">
       <header className="border-b border-white/5 p-6 bg-slate-900/40 sticky top-0 z-10 flex flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
             <Shield className="w-8 h-8 text-cyan-400" />
             <div>
               <h1 className="text-xl font-bold text-white">NEXUS ADMIN PANEL</h1>
               <p className="text-xs text-slate-500">System Monitoring & Enforcement</p>
             </div>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10 lg:text-base">
            <Power className="w-4 h-4" /> Disconnect
          </button>
       </header>

       <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-10">
         {!data ? (
           <div className="flex justify-center p-12">
             <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
           </div>
         ) : (
           <>
             {/* Plugins Section */}
             <section>
               <div className="flex items-center mb-6 gap-3 border-b border-white/5 pb-2">
                 <Database className="text-indigo-400 w-5 h-5" />
                 <h2 className="text-lg text-white font-medium">Tool Configuration</h2>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {Object.entries(data.plugins).map(([id, info]: any) => (
                   <div key={id} className={`p-4 rounded-xl border flex flex-col justify-between ${info.enabled ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-900/40 border-white/5'}`}>
                     <div>
                       <h3 className="font-bold text-white capitalize mb-1">{id} Module</h3>
                       <p className="text-xs text-slate-500 mb-4 font-sans">Provider: {info.provider}</p>
                     </div>
                     <button
                       onClick={() => togglePlugin(id, info.enabled)}
                       className={`w-full py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 
                         ${info.enabled ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/20'}`}
                     >
                       {info.enabled ? <><Power className="w-3 h-3" /> Disable</> : <><CheckCircle className="w-3 h-3" /> Enable</>}
                     </button>
                   </div>
                 ))}
               </div>
             </section>

             {/* Quotas Section */}
             <section>
               <div className="flex items-center mb-6 gap-3 border-b border-white/5 pb-2">
                 <Eye className="text-emerald-400 w-5 h-5" />
                 <h2 className="text-lg text-white font-medium">Connected Devices & Quotas</h2>
               </div>
               <div className="bg-slate-900/40 border border-white/5 rounded-xl overflow-hidden">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
                       <tr>
                         <th className="px-6 py-4">Fingerprint / IP</th>
                         <th className="px-6 py-4">Credits</th>
                         <th className="px-6 py-4">Abuse Score</th>
                         <th className="px-6 py-4">Status</th>
                         <th className="px-6 py-4">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                       {data.quotas.length === 0 ? (
                         <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">No devices tracked yet.</td></tr>
                       ) : (
                         data.quotas.map((q: any) => (
                           <tr key={q.fingerprint} className="hover:bg-slate-900/50 transition-colors">
                             <td className="px-6 py-4 font-mono text-cyan-400 text-xs max-w-[200px] truncate" title={q.fingerprint}>{q.fingerprint}</td>
                             <td className="px-6 py-4">
                               <span className={`px-2 py-1 rounded text-xs font-bold ${q.credits > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                                 {q.credits}
                               </span>
                             </td>
                             <td className="px-6 py-4 text-orange-400">{q.abuseScore}</td>
                             <td className="px-6 py-4">
                               {q.credits > 0 ? (
                                 <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle className="w-3 h-3" /> Active</span>
                               ) : (
                                 <span className="flex items-center gap-1 text-red-400 text-xs"><XCircle className="w-3 h-3" /> Blocked</span>
                               )}
                             </td>
                             <td className="px-6 py-4 space-x-2">
                               <button onClick={() => updateQuota(q.fingerprint, 3)} className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded text-xs hover:bg-emerald-500/30 transition-colors">Reset Quota</button>
                               <button onClick={() => updateQuota(q.fingerprint, 0)} className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded text-xs hover:bg-red-500/30 transition-colors">Block Device</button>
                               <button onClick={() => updateQuota(q.fingerprint, 999)} className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded text-xs hover:bg-cyan-500/30 transition-colors">Infinite</button>
                             </td>
                           </tr>
                         ))
                       )}
                     </tbody>
                   </table>
                 </div>
               </div>
             </section>
           </>
         )}
       </main>
    </div>
  );
}
