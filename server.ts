import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dns from "dns/promises";
import multer from "multer";
import fs from "fs";
import crypto from 'crypto';

const upload = multer({ dest: 'uploads/' });

// Pseudo Plugin System
let plugins: Record<string, { enabled: boolean; provider: string }> = {
  image: { enabled: true, provider: "reverse_search_ai" },
  audio: { enabled: true, provider: "whisper_stt" },
  video: { enabled: true, provider: "frame_extract" },
  email: { enabled: true, provider: "breach_lookup" },
  number_v1: { enabled: true, provider: "abhay_api" },
  number_v2: { enabled: true, provider: "numinfo_api" },
  domain: { enabled: true, provider: "dns_resolver" },
  ifsc: { enabled: true, provider: "ifsc_lookup" },
  pincode: { enabled: true, provider: "pincode_lookup" },
  meta: { enabled: true, provider: "website_metadata" },
  identity: { enabled: true, provider: "aadhaar_lookup" },
  vahan_v1: { enabled: true, provider: "abhay_api" },
  vahan_v2: { enabled: true, provider: "vvvin_api" },
  geo: { enabled: true, provider: "location_api" },
  doc: { enabled: true, provider: "ocr_parser" },
  adv_pincode: { enabled: true, provider: "rudra_workers" },
  adv_ifsc: { enabled: true, provider: "rudra_workers" },
  adv_vahan: { enabled: true, provider: "rudra_workers" },
  adv_aadhaar: { enabled: true, provider: "rudra_workers" },
  adv_number: { enabled: true, provider: "rudra_workers" },
  adv_6m_number: { enabled: true, provider: "rudra_workers" },
  adv_email: { enabled: true, provider: "rudra_workers" }
};

// Sanitization for third-party APIs
function sanitizeData(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sanitizeData).filter((item: any) => item !== undefined);
  if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'credit' || lowerKey.includes('owner') || lowerKey.includes('dev') || lowerKey.includes('creator') || 
          lowerKey.includes('channel') || lowerKey.includes('telegram') || lowerKey.includes('join') ||
          lowerKey === 'contact' || lowerKey === 'footer') {
        continue;
      }
      const valStr = String(obj[key]).toLowerCase();
      if (lowerKey === 'name' && valStr.includes('lakhan')) continue;
      if (valStr.includes('lakhan lakhnotra') || valStr.includes('t.me/')) continue;
      
      newObj[key] = sanitizeData(obj[key]);
    }
    return newObj;
  }
  return obj;
}

const QUOTA_FILE = 'quotas.json';
let searchQuotas = new Map<string, { credits: number; resetAt: number; abuseScore: number }>();
try {
  if (fs.existsSync(QUOTA_FILE)) {
    const raw = fs.readFileSync(QUOTA_FILE, 'utf8');
    searchQuotas = new Map(Object.entries(JSON.parse(raw)));
  }
} catch (e) {}

function saveQuotas() {
  try {
    fs.writeFileSync(QUOTA_FILE, JSON.stringify(Object.fromEntries(searchQuotas)));
  } catch(e) {}
}

const INITIAL_CREDITS = 3;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function checkQuota(identifier: string) {
  const now = Date.now();
  
  if (!searchQuotas.has(identifier)) {
    searchQuotas.set(identifier, { credits: INITIAL_CREDITS, resetAt: now + COOLDOWN_MS, abuseScore: 0 });
    saveQuotas();
  }

  const quota = searchQuotas.get(identifier)!;
  if (now > quota.resetAt) {
    quota.credits = INITIAL_CREDITS;
    quota.resetAt = now + COOLDOWN_MS;
    saveQuotas();
  }
  
  return quota;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes (Microservices Mock)
  const apiRouter = express.Router();

  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  apiRouter.get("/plugins", (req, res) => {
    res.json({ plugins });
  });

  // Middleware to enforce quota & plugin status
  apiRouter.use("/module/:id", (req, res, next) => {
    const modId = req.params.id;
    if (plugins[modId] && !plugins[modId].enabled) {
      return res.status(403).json({ error: "Module Offline", message: "This module has been disabled by the administrator." });
    }

    if (req.headers['x-admin-token'] === 'rudra_admin_auth_token_99') {
      res.setHeader('X-Credits-Remaining', '999');
      res.setHeader('X-Reset-At', (Date.now() + COOLDOWN_MS).toString());
      return next();
    }
    
    const fingerprint = (req.headers['x-device-fingerprint'] as string) || req.ip || 'anonymous';
    const quota = checkQuota(fingerprint);

    if (req.method === 'POST') {
      if (quota.credits <= 0) {
        return res.status(429).json({ 
          error: "Quota Exceeded", 
          resetAt: quota.resetAt,
          message: "You have reached your limit of 3 searches per 24 hours for this device."
        });
      }

      // Basic abuse detection logic
      const target = req.body?.target?.toLowerCase() || '';
      if (target.includes("spam") || target.includes("sql") || target.includes("drop table")) {
        quota.abuseScore += 1;
        if (quota.abuseScore >= 2) {
          quota.credits = 0; // immediate block
          saveQuotas();
          return res.status(403).json({ 
            error: "Abuse Detected", 
            message: "Suspicious activity detected. Your IP/session has been restricted." 
          });
        }
      }

      quota.credits -= 1;
      saveQuotas();
    }
    
    // Attach quota info to response headers so client knows
    res.setHeader('X-Credits-Remaining', quota.credits.toString());
    res.setHeader('X-Reset-At', quota.resetAt.toString());
    next();
  });

  apiRouter.get("/quota", (req, res) => {
    if (req.headers['x-admin-token'] === 'rudra_admin_auth_token_99') {
      return res.json({ credits: 999, resetAt: Date.now() + COOLDOWN_MS });
    }
    const fingerprint = (req.headers['x-device-fingerprint'] as string) || req.ip || 'anonymous';
    const quota = checkQuota(fingerprint);
    res.json({ credits: quota.credits, resetAt: quota.resetAt });
  });

  // OSINT Toolkit Directory
  apiRouter.get("/toolkit", (req, res) => {
    res.json({
      success: true,
      data: {
        "Image / Visual OSINT": [
          { name: "TinEye", url: "https://tineye.com", desc: "Reverse image search" },
          { name: "PimEyes", url: "https://pimeyes.com", desc: "Face search" },
          { name: "FotoForensics", url: "https://fotoforensics.com", desc: "Image forensics" },
          { name: "GeoSpy", url: "https://geospy.ai", desc: "Location estimation from images" },
          { name: "ExifTool", url: "https://exiftool.org", desc: "Metadata extraction" }
        ],
        "Username / Social Discovery": [
          { name: "Sherlock", url: "https://github.com/sherlock-project/sherlock", desc: "Username discovery" },
          { name: "WhatsMyName", url: "https://whatsmyname.app", desc: "Username enumeration" },
          { name: "Namechk", url: "https://namechk.com", desc: "Username availability" }
        ],
        "Email Intelligence": [
          { name: "Have I Been Pwned", url: "https://haveibeenpwned.com", desc: "Breach exposure" },
          { name: "Hunter.io", url: "https://hunter.io", desc: "Domain email discovery" },
          { name: "EmailRep", url: "https://emailrep.io", desc: "Email reputation" },
          { name: "MXToolbox", url: "https://mxtoolbox.com", desc: "Mail infrastructure analysis" }
        ],
        "Domain / Network OSINT": [
          { name: "Shodan", url: "https://www.shodan.io", desc: "Internet-exposed assets" },
          { name: "Censys", url: "https://search.censys.io", desc: "Internet scanning/search" },
          { name: "SecurityTrails", url: "https://securitytrails.com", desc: "DNS history" },
          { name: "crt.sh", url: "https://crt.sh", desc: "Certificate transparency" }
        ],
        "Investigation Platforms": [
          { name: "Maltego", url: "https://www.maltego.com", desc: "Graph investigations" },
          { name: "SpiderFoot", url: "https://www.spiderfoot.net", desc: "Automated multi-source intelligence" },
          { name: "OpenCTI", url: "https://www.opencti.io", desc: "Intelligence knowledge graph" }
        ]
      }
    });
  });

  // Domain / Network Intelligence Module
  apiRouter.post("/module/domain", async (req, res) => {
    try {
      const { target } = req.body;
      if (!target) return res.status(400).json({ error: "Missing target" });
      
      const ip4 = await dns.resolve4(target).catch(() => []);
      const ip6 = await dns.resolve6(target).catch(() => []);
      const mx = await dns.resolveMx(target).catch(() => []);
      const txt = await dns.resolveTxt(target).catch(() => []);
      
      res.json({
        success: true,
        data: {
          ip4,
          ip6,
          mx,
          txt: txt.map(t => t.join("")),
          risk_score: ip4.length === 0 ? "High" : "Low",
          confidence: 0.95
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Mock Username / Web Intelligence Module
  apiRouter.post("/module/username", async (req, res) => {
    const { target } = req.body;
    res.json({
      success: true,
      data: {
        target,
        profiles_found: [
          { platform: "GitHub", url: `https://github.com/${target}`, profile_image: `https://github.com/${target}.png`, status: "Active Profile" },
          { platform: "Twitter", url: `https://twitter.com/${target}`, status: "Account Exists" },
          { platform: "Reddit", url: `https://reddit.com/user/${target}`, status: "Account Exists" },
          { platform: "Instagram", url: `https://instagram.com/${target}`, status: "Not Found or Private" }
        ],
        risk_score: "Medium",
        confidence: 0.85,
        recommended_tools: [
          { name: "WhatsMyName", url: "https://whatsmyname.app" },
          { name: "Sherlock", url: "https://github.com/sherlock-project/sherlock" }
        ]
      }
    });
  });

  const fetchWithUA = async (url: string) => {
    let res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      }
    });
    
    let text = await res.text();
    
    const m = text.match(/a=toNumbers\("([a-f0-9]+)"\),b=toNumbers\("([a-f0-9]+)"\),c=toNumbers\("([a-f0-9]+)"\)/);
    if (m) {
      try {
        const key = Buffer.from(m[1], 'hex');
        const iv = Buffer.from(m[2], 'hex');
        const ciphertext = Buffer.from(m[3], 'hex');
        const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
        decipher.setAutoPadding(false);
        const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        const cookieVal = decrypted.toString('hex');
        
        let finalUrl = url;
        if (url.includes('?')) finalUrl += "&i=1";
        else finalUrl += "?i=1";

        res = await fetch(finalUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Cookie": `__test=${cookieVal}`
          }
        });
        text = await res.text();
      } catch (e) {
        console.error("Bypass failed", e);
      }
    }

    try {
      return JSON.parse(text);
    } catch(e) {
      if (text.includes("aes.js") || text.includes("<html")) {
        // Return raw html as error notification to avoid JSON parse crash completely
        throw new Error("System blocked by upstream provider anti-bot.");
      }
      return { 
        "Status": res.status, 
        "Raw_Response": text.length > 500 ? text.substring(0, 500) + "..." : text,
        "Notice": "API endpoint returned non-JSON data. Please try advanced tools." 
      };
    }
  };

  // Real IFSC Intelligence Module
  apiRouter.post("/module/ifsc", async (req, res) => {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: "Missing target" });
    try {
      if (target.match(/^[A-Z]{4}0[A-Z0-9]{6}$/)) {
        const data = await fetchWithUA(`https://abhaykumar.xo.je/api/proxy420.php?tool=ifsc_info&query=${target}`);
        return res.json({ success: true, data: sanitizeData(data) });
      } else {
        return res.status(400).json({ error: "Invalid IFSC format." });
      }
    } catch (e: any) {
      console.error("IFSC Error:", e);
      res.status(500).json({ error: "Failed to fetch from upstream API: " + e.message });
    }
  });

  // Real PIN Code Intelligence Module
  apiRouter.post("/module/pincode", async (req, res) => {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: "Missing target" });
    try {
      if (target.match(/^[0-9]{6}$/)) {
        const data = await fetchWithUA(`https://abhaykumar.xo.je/api/proxy420.php?tool=pincode_info&query=${target}`);
        return res.json({ success: true, data: sanitizeData(data) });
      } else {
        return res.status(400).json({ error: "Invalid PIN (6 digits) format." });
      }
    } catch (e: any) {
      console.error("Pincode Error:", e);
      res.status(500).json({ error: "Failed to fetch from upstream API: " + e.message });
    }
  });

  // Admin Login
  apiRouter.post("/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === "RUDRA@0099") {
      res.json({ success: true, token: "rudra_admin_auth_token_99" });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Admin Dashboard Data
  apiRouter.get("/admin/data", (req, res) => {
    if (req.headers['x-admin-token'] !== 'rudra_admin_auth_token_99') {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const quotasArray = Array.from(searchQuotas.entries()).map(([fp, data]) => ({
      fingerprint: fp,
      credits: data.credits,
      resetAt: data.resetAt,
      abuseScore: data.abuseScore
    }));
    res.json({
      success: true,
      quotas: quotasArray,
      plugins
    });
  });

  // Admin Revoke/Update Quota
  apiRouter.post("/admin/quota", (req, res) => {
    if (req.headers['x-admin-token'] !== 'rudra_admin_auth_token_99') {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { fingerprint, credits } = req.body;
    const q = searchQuotas.get(fingerprint);
    if (q) {
      q.credits = credits;
      if (credits > 0) q.abuseScore = 0;
      saveQuotas();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  // Admin Toggle Plugin
  apiRouter.post("/admin/plugin", (req, res) => {
    if (req.headers['x-admin-token'] !== 'rudra_admin_auth_token_99') {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { pluginId, enabled } = req.body;
    if (plugins[pluginId]) {
      plugins[pluginId].enabled = enabled;
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Plugin not found" });
    }
  });

  // Phone Intelligence Module v1
  apiRouter.post("/module/number_v1", async (req, res) => {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: "Missing target" });
    try {
      const data = await fetchWithUA(`https://abhaykumar.xo.je/api/proxy420.php?tool=number_info&query=${target}`);
      return res.json({ success: true, data: sanitizeData(data) });
    } catch(err: any) {
      console.error("Phone Error:", err);
      res.status(500).json({ error: "Failed to fetch from upstream API: " + err.message });
    }
  });

  // Phone Intelligence Module v2
  apiRouter.post("/module/number_v2", async (req, res) => {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: "Missing target" });
    try {
      const data = await fetchWithUA(`https://numinfo.eu.cc/api/public/lookup?type=number&q=${target}`);
      if (data && !data.error) {
        return res.json({ success: true, data: sanitizeData(data) });
      }
      throw new Error("No data returned");
    } catch(err: any) {
      console.error("Phone Error:", err);
      res.status(500).json({ error: "Failed to fetch from upstream API: " + err.message });
    }
  });

  // Vehicle Intelligence Module v1
  apiRouter.post("/module/vahan_v1", async (req, res) => {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: "Missing target" });
    try {
      const data = await fetchWithUA(`https://abhaykumar.xo.je/api/proxy420.php?tool=vehicle_info&query=${target}`);
      return res.json({ success: true, data: sanitizeData(data) });
    } catch (e2: any) {
      console.error("Vehicle Error:", e2);
      res.status(500).json({ error: "Failed to fetch from upstream API: " + e2.message });
    }
  });

  // Vehicle Intelligence Module v2
  apiRouter.post("/module/vahan_v2", async (req, res) => {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: "Missing target" });
    try {
      const data = await fetchWithUA(`https://vvvin-ng.vercel.app/lookup?rc=${target}`);
      if (data && data.success !== false) {
        return res.json({ success: true, data: sanitizeData(data) });
      }
      throw new Error("fallback");
    } catch (e: any) {
      console.error("Vehicle Error:", e);
      res.status(500).json({ error: "Failed to fetch from upstream API: " + e.message });
    }
  });

  // Real Identity Intelligence Module
  apiRouter.post("/module/identity", async (req, res) => {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: "Missing target" });
    try {
      const data = await fetchWithUA(`https://abhaykumar.xo.je/api/proxy420.php?tool=aadhar_info&query=${target}`);
      return res.json({ success: true, data: sanitizeData(data) });
    } catch (e: any) {
      console.error("Identity Error:", e);
      res.status(500).json({ error: "Failed to fetch from upstream API: " + e.message });
    }
  });

  // Real Geo Intelligence Module
  apiRouter.post("/module/geo", async (req, res) => {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: "Missing target IP or Location" });
    try {
      if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(target)) {
        const response = await fetch(`http://ip-api.com/json/${target}`);
        const data = await response.json();
        return res.json({ success: true, data: sanitizeData(data) });
      } else {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(target)}`, {
          headers: { "User-Agent": "NexusOSINT/1.0" }
        });
        const data = await response.json();
        return res.json({ success: true, data: sanitizeData(data.slice(0, 3)) });
      }
    } catch (e: any) {
      res.status(500).json({ error: "Failed to fetch Geo data" });
    }
  });

  // Mock Doc Intelligence Module
  apiRouter.post("/module/doc", upload.single("file"), async (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "File required for Doc Intelligence" });
    res.json({
      success: true,
      data: {
        filename: file.originalname,
        size_bytes: file.size,
        mime_type: file.mimetype,
        ocr_extracted_snippet: "Simulated OCR: This document contains patterns of PII including phone numbers and email addresses. Data classification: CONFIDENTIAL.",
        classification: "Internal Document",
        confidence: 0.88,
        authors_meta: ["John Doe", "IT Dept"],
        is_encrypted: false
      }
    });
  });

  // Mock Email Intelligence Module
  apiRouter.post("/module/email", async (req, res) => {
    const { target } = req.body;
    res.json({
      success: true,
      data: {
        email: target,
        breach_count: Math.floor(Math.random() * 5),
        breaches: ["LinkedIn (2012)", "Adobe (2013)"],
        is_disposable: false,
        domain_reputation: "Good",
        mx_records_valid: true,
        risk_score: "Low"
      }
    });
  });

  // Mock Image Intelligence Module (URL or File)
  apiRouter.post("/module/image", upload.single("file"), async (req, res) => {
    const targetUrl = req.body.target;
    const file = req.file;

    res.json({
      success: true,
      data: {
        source: file ? file.originalname : targetUrl,
        exif_data: {
          camera: "iPhone 13 Pro",
          exposure: "1/60",
          iso: 320,
          original_date: "2023-10-15T10:23:00Z"
        },
        ai_generated_probability: 0.05,
        steganography_detected: false,
        reverse_search_matches: 12,
        geolocation_estimate: {
          lat: 37.7749,
          lon: -122.4194,
          location: "San Francisco, CA"
        },
        recommended_tools: [
          { name: "TinEye", url: "https://tineye.com" },
          { name: "FotoForensics", url: "https://fotoforensics.com" }
        ]
      }
    });
  });

  // Mock Video Intelligence Module
  apiRouter.post("/module/video", upload.single("file"), async (req, res) => {
    const targetUrl = req.body.target;
    const file = req.file;

    res.json({
      success: true,
      data: {
        source: file ? file.originalname : targetUrl,
        metadata: {
          duration: "1m 32s",
          resolution: "1920x1080",
          codec: "H.264"
        },
        ocr_extracted_text: ["CONFIDENTIAL", "INTERNAL USE ONLY", "PROJECT TITAN"],
        deepfake_confidence: 0.12,
        scene_changes_detected: 4
      }
    });
  });

  // Mock Audio Intelligence Module
  apiRouter.post("/module/audio", upload.single("file"), async (req, res) => {
    const targetUrl = req.body.target;
    const file = req.file;

    res.json({
      success: true,
      data: {
        source: file ? file.originalname : targetUrl,
        language_detected: "en-US",
        speech_to_text: "[00:00]: Hello, testing the audio extraction.\n[00:05]: This is a secondary voice signature.",
        background_noise: "Coffee shop ambient, light traffic",
        voice_clone_probability: 0.02
      }
    });
  });

  // Mock Website Meta Intelligence Module
  apiRouter.post("/module/meta", async (req, res) => {
    const { target } = req.body;
    res.json({
      success: true,
      data: {
        url: target,
        hidden_metadata: {
          generator: "WordPress 6.2",
          author: "Admin User",
          unused_tags: ["deprecated_tracking_id=UA-XXXX-1", "test_env=true"]
        },
        technologies: ["React", "Express", "Google Analytics"],
        server_info: "nginx/1.18.0",
        vulnerability_score: "Medium"
      }
    });
  });

  // Advanced Modules
  apiRouter.post("/module/adv_pincode", async (req, res) => {
    const { target } = req.body;
    try {
      const data = await fetchWithUA(`https://pincode.rudrasingh221204.workers.dev/?pin=${target}`);
      return res.json({ success: true, data: sanitizeData(data) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post("/module/adv_ifsc", async (req, res) => {
    const { target } = req.body;
    try {
      const data = await fetchWithUA(`https://ifsc-code.rudrasingh221204.workers.dev/?ifsc=${target}`);
      return res.json({ success: true, data: sanitizeData(data) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post("/module/adv_vahan", async (req, res) => {
    const { target } = req.body;
    try {
      const data = await fetchWithUA(`https://vahan-num.rudrasingh221204.workers.dev/?query=${target}`);
      return res.json({ success: true, data: sanitizeData(data) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post("/module/adv_aadhaar", async (req, res) => {
    const { target } = req.body;
    try {
      const data = await fetchWithUA(`https://adhar-info.rudrasingh221204.workers.dev/?type=aadhar_info&query=${target}`);
      return res.json({ success: true, data: sanitizeData(data) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post("/module/adv_number", async (req, res) => {
    const { target } = req.body;
    try {
      const data = await fetchWithUA(`https://number-2api.rudrasingh221204.workers.dev/?type=number_info&query=${target}`);
      return res.json({ success: true, data: sanitizeData(data) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post("/module/adv_6m_number", async (req, res) => {
    const { target } = req.body;
    try {
      const data = await fetchWithUA(`https://6m-number.rudrasingh221204.workers.dev/?number=${target}`);
      return res.json({ success: true, data: sanitizeData(data) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post("/module/adv_email", async (req, res) => {
    const { target } = req.body;
    try {
      const data = await fetchWithUA(`https://email-id.rudrasingh221204.workers.dev/?email=${target}`);
      return res.json({ success: true, data: sanitizeData(data) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Generic Implementation for new requested tools
  const newModules = ["surface_scanner", "os_explorer", "search_agg", "public_records", "site_profiler", "internet_scanner", "deep_search", "hidden_sources", "archive_miner", "research_engine", "dark_monitor", "leak_scanner", "threat_feed", "entity_mapper", "watch_engine", "case_manager"];
  newModules.forEach(mod => {
    apiRouter.post(`/module/${mod}`, async (req, res) => {
      setTimeout(() => {
        res.json({
          success: true,
          data: {
            "System Notice": "Module Active. Executing comprehensive simulated analysis.",
            "Target Analyzed": req.body.target || "System Test",
            "Confidence Level": Math.floor(Math.random() * 20 + 80) + "%",
            "Risk Score": Math.floor(Math.random() * 5 + 5) + "/10",
            "Data Points Correlated": Math.floor(Math.random() * 5000 + 1000),
            "Findings": "12 critical nodes identified. Dark web presence minimal. No exposed credentials in recent breaches.",
            "Timestamp Iso": new Date().toISOString()
          }
        });
      }, 1500);
    });
  });

  // Simple Visit Logger
  apiRouter.post("/visit", async (req, res) => {
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const ua = req.headers['user-agent'] || 'Unknown';
      const fp = req.body?.fp || 'Unknown';
      
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      
      if (botToken && chatId) {
        const message = `🚨 *New Visitor on Nexus* 🚨\n\n*IP:* \`${ip}\`\n*Fingerprint:* \`${fp}\`\n*User-Agent:* \`${ua}\``;
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' })
        }).catch(e => console.error("Telegram notification failed:", e));
      }
      
      res.json({ success: true });
    } catch(e) {
      res.status(500).json({ error: "Failed" });
    }
  });

  const getDeviceQuota = (fp: string) => {
    return { credits: 3, resetAt: Date.now() + 86400000, abuseScore: 0 };
  };

  apiRouter.get("/quota", (req, res) => {
    const fp = req.headers['x-device-fingerprint'] as string;
    if (!fp || req.headers['x-admin-token'] === 'rudra_admin_auth_token_99') {
      return res.json({ credits: 999, resetAt: 0, abuseScore: 0 });
    }
    const quota = getDeviceQuota(fp);
    res.json(quota);
  });

  app.use("/api", apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nexus OSINT Gateway active on port ${PORT}`);
  });
}

startServer();
