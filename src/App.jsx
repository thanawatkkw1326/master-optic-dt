import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// Script loader — โหลด jsPDF / html2canvas จาก CDN
// (ไม่ใช้ import เพราะ Artifact ไม่รองรับ npm package เหล่านี้)
// ─────────────────────────────────────────────────────────────────────────────
function loadScript(src, checkFn) {
  return new Promise((resolve) => {
    if (checkFn()) { resolve(); return; }
    if (document.querySelector(`script[src="${src}"]`)) {
      const iv = setInterval(() => { if (checkFn()) { clearInterval(iv); resolve(); } }, 150);
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => { const iv = setInterval(() => { if (checkFn()) { clearInterval(iv); resolve(); } }, 150); };
    s.onerror = resolve;
    document.head.appendChild(s);
  });
}

function useJsPDF() {
  const [ready, setReady] = useState(() => !!(window.jspdf?.jsPDF));
  useEffect(() => {
    if (window.jspdf?.jsPDF) { setReady(true); return; }
    loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      () => !!(window.jspdf?.jsPDF)
    ).then(() => setReady(true));
  }, []);
  return ready;
}

function useHtml2Canvas() {
  const [ready, setReady] = useState(() => !!window.html2canvas);
  useEffect(() => {
    if (window.html2canvas) { setReady(true); return; }
    loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      () => !!window.html2canvas
    ).then(() => setReady(true));
  }, []);
  return ready;
}

// ─────────────────────────────────────────────────────────────────────────────
// Data & Constants
// ─────────────────────────────────────────────────────────────────────────────
const THAI_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const THAI_SHORT  = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const LENS_COLORS = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#f97316","#84cc16"];

const now = new Date();
const EMPTY = {
  day:String(now.getDate()), month:String(now.getMonth()+1), year:String(now.getFullYear()+543),
  name:"", phone:"", lineId:"",
  leftSphere:"", leftCylinder:"", leftAxis:"",
  rightSphere:"", rightCylinder:"", rightAxis:"",
  lensType:"", frame:"", price:"",
};

const INIT = [
  { id:1, day:"10", month:"2", year:"2568", name:"สมศักดิ์ ใจดี", phone:"081-234-5678", lineId:"somsak.j", leftSphere:"-2.00", leftCylinder:"-0.75", leftAxis:"180", rightSphere:"-1.75", rightCylinder:"-0.50", rightAxis:"175", lensType:"Seiko 1.67 Blue UV", frame:"TI-2024-001", price:"12500" },
  { id:2, day:"5",  month:"3", year:"2568", name:"นางสาวสมหญิง แสนดี", phone:"089-876-5432", lineId:"somying.s", leftSphere:"-1.25", leftCylinder:"-0.50", leftAxis:"90", rightSphere:"-1.00", rightCylinder:"-0.25", rightAxis:"85", lensType:"Hoya 1.74 Green UV", frame:"TI-2024-002", price:"15800" },
  { id:3, day:"18", month:"3", year:"2568", name:"นายวิชัย รุ่งเรือง", phone:"062-111-2233", lineId:"", leftSphere:"-3.50", leftCylinder:"-1.00", leftAxis:"175", rightSphere:"-3.25", rightCylinder:"-0.75", rightAxis:"170", lensType:"Seiko 1.67 Blue UV", frame:"TI-2024-003", price:"18500" },
  { id:4, day:"2",  month:"4", year:"2568", name:"นางมาลี สุขสันต์", phone:"081-999-0011", lineId:"malee_s", leftSphere:"+1.00", leftCylinder:"0.00", leftAxis:"0", rightSphere:"+1.25", rightCylinder:"-0.25", rightAxis:"90", lensType:"Hoya 1.74 Green UV", frame:"TI-2024-004", price:"22000" },
];

const fmtDate  = r => r.day&&r.month&&r.year ? `${r.day} ${THAI_SHORT[+r.month-1]} ${r.year}` : "–";
const fmtPrice = v => v ? "฿"+Number(v).toLocaleString("th-TH") : "–";

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=K2D:wght@700;800&display=swap');

*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#f0f4ff;
  --surface:#ffffff;
  --surface2:#f7f9ff;
  --border:#e2e8f8;
  --blue:#2563eb;--blue2:#1d4ed8;--blue-lt:#eff6ff;--blue-mid:#bfdbfe;
  --navy:#0f2057;--navy2:#1e3a8a;
  --green:#059669;--green-lt:#ecfdf5;
  --red:#dc2626;--red-lt:#fef2f2;
  --amber:#d97706;--amber-lt:#fffbeb;
  --purple:#7c3aed;--purple-lt:#f5f3ff;
  --text:#1e293b;--text2:#475569;--text3:#94a3b8;
  --shadow:0 1px 3px rgba(0,0,0,0.07),0 4px 16px rgba(37,99,235,0.06);
  --shadow-lg:0 4px 24px rgba(0,0,0,0.1),0 12px 48px rgba(37,99,235,0.1);
  --r:14px;--r-sm:9px;
}
body{font-family:'Sarabun',sans-serif;background:var(--bg);color:var(--text);}
.app{min-height:100vh;}

.hdr{background:linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 50%,#2563eb 100%);position:sticky;top:0;z-index:100;box-shadow:0 2px 20px rgba(15,32,87,0.3);}
.hdr-inner{max-width:1080px;margin:0 auto;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
.hdr-brand{display:flex;align-items:center;gap:12px;}
.hdr-icon{width:44px;height:44px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;backdrop-filter:blur(10px);}
.hdr-title{font-family:'K2D',sans-serif;font-size:22px;font-weight:800;color:#fff;letter-spacing:0.04em;line-height:1;}
.hdr-sub{font-size:11px;color:rgba(255,255,255,0.6);margin-top:2px;letter-spacing:0.1em;}
.hdr-stats{display:flex;gap:10px;}
.hdr-stat{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:8px 16px;text-align:center;backdrop-filter:blur(10px);}
.hdr-stat-lbl{font-size:10px;color:rgba(255,255,255,0.7);letter-spacing:0.08em;margin-bottom:2px;}
.hdr-stat-val{font-size:18px;font-weight:800;color:#fff;line-height:1;}

.wrap{max-width:1080px;margin:0 auto;padding:24px 20px 60px;}

.tabs{display:inline-flex;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:4px;gap:3px;margin-bottom:22px;box-shadow:var(--shadow);}
.tab{padding:9px 22px;border-radius:9px;border:none;font-family:'Sarabun',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.18s;white-space:nowrap;color:var(--text2);background:transparent;}
.tab:hover{color:var(--blue);background:var(--blue-lt);}
.tab.on{background:linear-gradient(135deg,var(--blue),var(--blue2));color:#fff;box-shadow:0 2px 10px rgba(37,99,235,0.35);}

.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--shadow);overflow:hidden;}
.card-head{padding:16px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,var(--blue-lt),var(--surface));}
.card-title{font-size:15px;font-weight:800;color:var(--navy);display:flex;align-items:center;gap:8px;}
.card-body{padding:22px;}

.lbl{display:block;font-size:11px;font-weight:700;color:var(--text2);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;}
.inp{width:100%;padding:10px 14px;background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--r-sm);font-family:'Sarabun',sans-serif;font-size:14px;color:var(--text);outline:none;transition:all 0.18s;}
.inp:hover{border-color:#93c5fd;}
.inp:focus{border-color:var(--blue);background:#fff;box-shadow:0 0 0 3px rgba(37,99,235,0.12);}
.inp::placeholder{color:var(--text3);}
.sel{width:100%;padding:10px 14px;background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--r-sm);font-family:'Sarabun',sans-serif;font-size:14px;color:var(--text);outline:none;transition:all 0.18s;appearance:none;cursor:pointer;}
.sel:focus{border-color:var(--blue);background:#fff;box-shadow:0 0 0 3px rgba(37,99,235,0.12);}
.sel-wrap{position:relative;}
.sel-wrap::after{content:"▾";position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none;font-size:11px;}

.btn{font-family:'Sarabun',sans-serif;font-weight:700;cursor:pointer;border:none;border-radius:var(--r-sm);transition:all 0.18s;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;}
.btn-primary{background:linear-gradient(135deg,var(--blue),var(--blue2));color:#fff;padding:11px 28px;font-size:14px;box-shadow:0 3px 12px rgba(37,99,235,0.3);}
.btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 5px 18px rgba(37,99,235,0.45);}
.btn-primary:disabled{opacity:0.5;cursor:not-allowed;}
.btn-ghost{background:var(--blue-lt);color:var(--blue);border:1.5px solid var(--blue-mid);padding:8px 16px;font-size:12px;}
.btn-ghost:hover{background:var(--blue-mid);}
.btn-green{background:linear-gradient(135deg,var(--green),#047857);color:#fff;padding:9px 20px;font-size:13px;box-shadow:0 3px 10px rgba(5,150,105,0.28);}
.btn-green:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 5px 14px rgba(5,150,105,0.4);}
.btn-green:disabled{opacity:0.5;cursor:not-allowed;}
.btn-icon{padding:6px 12px;font-size:12px;}
.btn-edit{background:var(--blue-lt);color:var(--blue);border:1px solid var(--blue-mid);}
.btn-edit:hover{background:var(--blue-mid);}
.btn-del{background:var(--red-lt);color:var(--red);border:1px solid #fecaca;}
.btn-del:hover{background:#fecaca;}
.btn-bill{background:var(--green-lt);color:var(--green);border:1px solid #a7f3d0;}
.btn-bill:hover{background:#a7f3d0;}

.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
.date-g{display:grid;grid-template-columns:60px 1fr 90px;gap:8px;}
.presc-g{display:grid;grid-template-columns:52px 1fr 1fr 1fr;gap:8px;align-items:center;}

.badge{display:inline-flex;align-items:center;justify-content:center;border-radius:7px;font-weight:800;font-size:13px;padding:3px 14px;}
.badge-r{background:#eff6ff;color:#1d4ed8;border:1.5px solid #bfdbfe;}
.badge-l{background:#ecfdf5;color:#047857;border:1.5px solid #a7f3d0;}

.toast{display:inline-flex;align-items:center;gap:6px;background:var(--green-lt);border:1.5px solid #a7f3d0;color:var(--green);border-radius:9px;padding:7px 16px;font-size:13px;font-weight:700;animation:popIn .25s ease;}

.tbl{width:100%;border-collapse:collapse;}
.tbl th{padding:11px 14px;font-size:11px;font-weight:700;color:var(--text2);text-align:left;white-space:nowrap;letter-spacing:0.07em;text-transform:uppercase;background:var(--surface2);border-bottom:2px solid var(--border);}
.tbl td{padding:12px 14px;font-size:13px;color:var(--text);border-bottom:1px solid var(--border);vertical-align:middle;}
.tbl tr:last-child td{border-bottom:none;}
.tbl tbody tr:hover td{background:var(--blue-lt);}

.kpi{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:20px;box-shadow:var(--shadow);position:relative;overflow:hidden;}
.kpi::after{content:'';position:absolute;top:0;left:0;right:0;height:3px;}
.kpi-blue::after{background:linear-gradient(90deg,#2563eb,#60a5fa);}
.kpi-green::after{background:linear-gradient(90deg,#059669,#34d399);}
.kpi-purple::after{background:linear-gradient(90deg,#7c3aed,#a78bfa);}
.kpi-amber::after{background:linear-gradient(90deg,#d97706,#fbbf24);}
.kpi-lbl{font-size:11px;font-weight:700;color:var(--text2);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;}
.kpi-val{font-size:24px;font-weight:800;color:var(--navy);line-height:1;}
.kpi-sub{font-size:11px;color:var(--text3);margin-top:5px;}
.kpi-icon{font-size:26px;margin-bottom:8px;}

.cc{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:22px;box-shadow:var(--shadow);margin-bottom:16px;}
.cc-title{font-size:15px;font-weight:800;color:var(--navy);margin-bottom:3px;}
.cc-sub{font-size:12px;color:var(--text3);margin-bottom:16px;}

.mrow{display:grid;grid-template-columns:64px 1fr 56px 110px;align-items:center;padding:10px 16px;border-bottom:1px solid var(--border);transition:background 0.12s;}
.mrow:hover{background:var(--surface2);}
.mrow:last-child{border-bottom:none;}
.bar-track{height:6px;background:var(--border);border-radius:99px;overflow:hidden;}
.bar-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#3b82f6,#60a5fa);transition:width .7s cubic-bezier(.34,1.56,.64,1);}

.presc-box{background:linear-gradient(135deg,#eff6ff,#f0fdf4);border:1.5px solid #bfdbfe;border-radius:12px;padding:16px 18px;}

.mob-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:10px;box-shadow:var(--shadow);}

.overlay{position:fixed;inset:0;z-index:200;background:rgba(15,32,87,0.55);backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;animation:fadeIn .2s ease;}

.search-bar{background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:10px 16px;display:flex;align-items:center;gap:10px;box-shadow:var(--shadow);margin-bottom:16px;}
.search-bar input{flex:1;border:none;outline:none;background:none;font-family:'Sarabun',sans-serif;font-size:14px;color:var(--text);}
.search-bar input::placeholder{color:var(--text3);}

::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:var(--bg);}
::-webkit-scrollbar-thumb{background:var(--blue-mid);border-radius:3px;}

@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes slideUp{from{transform:translateY(16px);opacity:0;}to{transform:translateY(0);opacity:1;}}
@keyframes popIn{from{transform:scale(0.9);opacity:0;}to{transform:scale(1);opacity:1;}}
@keyframes shimmer{to{background-position:-200% center;}}

.slide-up{animation:slideUp .22s ease;}
.shimmer-text{
  background:linear-gradient(90deg,#ffffff 20%,#bfdbfe 50%,#ffffff 80%);
  background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
  background-clip:text;animation:shimmer 3s linear infinite;
}

@media(max-width:860px){.g4{grid-template-columns:1fr 1fr;}}
@media(max-width:640px){
  .g3{grid-template-columns:1fr;}.g2{grid-template-columns:1fr;}
  .hdr-stats{display:none;}.tab{padding:8px 14px;font-size:12px;}
  .hide-sm{display:none!important;}.show-sm{display:block!important;}
}
.show-sm{display:none;}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Bill Card Component
// ─────────────────────────────────────────────────────────────────────────────
function BillCard({ r }) {
  return (
    <div id="bill-card" style={{ width:400, background:"#fff", fontFamily:"'Sarabun',sans-serif", color:"#1e293b", boxSizing:"border-box" }}>
      <div style={{ background:"linear-gradient(135deg,#1e3a8a,#2563eb)", padding:"28px 28px 22px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-30, right:-30, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }}/>
        <div style={{ position:"absolute", bottom:-20, left:20, width:70, height:70, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }}/>
        <div style={{ position:"relative", zIndex:1, textAlign:"center" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:24, padding:"5px 18px", marginBottom:10 }}>
            <span style={{ fontSize:15 }}>👓</span>
            <span style={{ fontSize:13, fontWeight:800, color:"#fff", letterSpacing:"0.14em", fontFamily:"'K2D',sans-serif" }}>MASTER OPTIC</span>
          </div>
          <div style={{ fontSize:20, fontWeight:800, color:"#fff", marginBottom:4 }}>ใบบันทึกข้อมูลลูกค้า</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.65)", letterSpacing:"0.06em" }}>Customer Record Card</div>
        </div>
      </div>
      <div style={{ padding:"20px 24px 24px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, padding:"8px 12px", background:"#f8faff", borderRadius:8, border:"1px solid #e2e8f8" }}>
          <span style={{ fontSize:13, color:"#475569" }}>📅 {fmtDate(r)}</span>
          <span style={{ fontSize:12, color:"#94a3b8", fontFamily:"monospace" }}>#{String(r.id).padStart(5,"0")}</span>
        </div>
        <div style={{ background:"linear-gradient(135deg,#eff6ff,#e0f2fe)", border:"1.5px solid #bfdbfe", borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#3b82f6", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>👤 ข้อมูลผู้ใช้บริการ</div>
          <div style={{ fontSize:18, fontWeight:800, color:"#0f2057", marginBottom:6 }}>{r.name}</div>
          <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
            <span style={{ fontSize:13, color:"#475569" }}>📞 {r.phone||"–"}</span>
            {r.lineId && <span style={{ fontSize:13, color:"#0891b2" }}>💬 {r.lineId}</span>}
          </div>
        </div>
        <div style={{ background:"#f8faff", border:"1.5px solid #e2e8f8", borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#475569", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>🔍 ค่าสายตา (Prescription)</div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr>
                <th style={{ width:36, textAlign:"center", color:"#94a3b8", fontSize:10, paddingBottom:6, fontWeight:700 }}></th>
                {["Sphere","Cylinder","Axis"].map(h => <th key={h} style={{ textAlign:"center", color:"#64748b", fontSize:10, fontWeight:700, letterSpacing:"0.05em", paddingBottom:6 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                { eye:"R", bg:"#eff6ff", color:"#1d4ed8", border:"#bfdbfe", vals:[r.rightSphere,r.rightCylinder,r.rightAxis] },
                { eye:"L", bg:"#ecfdf5", color:"#047857", border:"#a7f3d0", vals:[r.leftSphere,r.leftCylinder,r.leftAxis] },
              ].map(row => (
                <tr key={row.eye}>
                  <td style={{ padding:"5px 0" }}>
                    <div style={{ background:row.bg, color:row.color, border:`1.5px solid ${row.border}`, borderRadius:7, padding:"2px 0", fontWeight:800, fontSize:13, textAlign:"center" }}>{row.eye}</div>
                  </td>
                  {row.vals.map((v,i) => (
                    <td key={i} style={{ textAlign:"center", padding:"5px 4px", color:v?"#1e293b":"#cbd5e1", fontWeight:v?700:400, fontSize:14 }}>{v||"–"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          {[{icon:"🔬",label:"ชนิดเลนส์",val:r.lensType},{icon:"👓",label:"รหัสกรอบ",val:r.frame,mono:true}].map(({ icon,label,val,mono }) => (
            <div key={label} style={{ background:"#f8faff", border:"1px solid #e2e8f8", borderRadius:10, padding:"10px 12px" }}>
              <div style={{ fontSize:10, color:"#94a3b8", fontWeight:700, marginBottom:4 }}>{icon} {label}</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#1e293b", fontFamily:mono?"monospace":"inherit", wordBreak:"break-all" }}>{val||"–"}</div>
            </div>
          ))}
        </div>
        <div style={{ background:"linear-gradient(135deg,#1e3a8a,#2563eb)", borderRadius:12, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, boxShadow:"0 4px 16px rgba(37,99,235,0.25)" }}>
          <div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:1 }}>ราคารวมทั้งสิ้น</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>Total Amount (THB)</div>
          </div>
          <div style={{ fontSize:28, fontWeight:800, color:"#fff" }}>{r.price ? "฿"+Number(r.price).toLocaleString("th-TH") : "–"}</div>
        </div>
        <div style={{ borderTop:"1px solid #e2e8f8", paddingTop:14, textAlign:"center" }}>
          <div style={{ fontSize:12, color:"#94a3b8", marginBottom:3 }}>✨ ขอบคุณที่ใช้บริการ Master Optic</div>
          <div style={{ fontSize:10, color:"#cbd5e1", letterSpacing:"0.1em" }}>masteroptic.com</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bill Modal
// ─────────────────────────────────────────────────────────────────────────────
function BillModal({ r, onClose }) {
  const h2cReady = useHtml2Canvas();
  const [saving, setSaving] = useState(false);

  const handleDownload = () => {
    if (!h2cReady) return;
    setSaving(true);
    window.html2canvas(document.getElementById("bill-card"), {
      scale:3, useCORS:true, backgroundColor:"#ffffff", logging:false,
    }).then(c => {
      const a = document.createElement("a");
      a.download = `MasterOptic-${r.name}.png`;
      a.href = c.toDataURL("image/png");
      a.click();
      setSaving(false);
    }).catch(() => setSaving(false));
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="slide-up" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
        <div style={{ boxShadow:"0 20px 60px rgba(15,32,87,0.4)", borderRadius:16, overflow:"hidden" }}>
          <BillCard r={r} />
        </div>
        <div style={{ display:"flex", gap:10, width:400, maxWidth:"100%" }}>
          <button onClick={onClose} style={{ flex:1, padding:11, borderRadius:10, background:"rgba(255,255,255,0.14)", border:"1px solid rgba(255,255,255,0.25)", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"Sarabun,sans-serif" }}>
            ✕ ปิด
          </button>
          <button onClick={handleDownload} disabled={!h2cReady || saving} className="btn btn-primary" style={{ flex:2 }}>
            {saving ? "⏳ กำลังบันทึก..." : "📥 บันทึกรูปภาพ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart Tooltip
// ─────────────────────────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#fff", border:"1.5px solid #bfdbfe", borderRadius:10, padding:"10px 14px", boxShadow:"0 6px 20px rgba(37,99,235,0.15)", fontFamily:"Sarabun,sans-serif" }}>
      <div style={{ fontSize:13, fontWeight:800, color:"#0f2057", marginBottom:5 }}>{label}</div>
      <div style={{ fontSize:12, fontWeight:700, color:"#2563eb" }}>
        💰 ฿{Number(payload[0]?.value||0).toLocaleString("th-TH")}
      </div>
    </div>
  );
}
const K2D_REGULAR = "AAEAAAAPAIAAAwBwRkZUTZFdrgEAAaOwAAAAHEdERUY6dDz1AAEkzAAAAOhHUE9TEQoXfQABL2AAAHRQR1NVQoV6yrcAASW0AAAJrE9TLzJffJPUAAABeAAAAGBjbWFwCB7mMAAADbgAAAVWZ2FzcAAAABAAASTEAAAACGdseWbQDlAdAAAZHAAA7LxoZWFkEISLTwAAAPwAAAA2aGhlYQY9BjYAAAE0AAAAJGhtdHgosDWMAAAB2AAAC95sb2Nhi23F6gAAExAAAAYMbWF4cAMUAQ0AAAFYAAAAIG5hbWXB/YYvAAEF2AAABsBwb3N0onCZ0wABDJgAABgsAAEAAAABAACJNTgvXw889QALA+gAAAAA14sTaAAAAADXuDQS/VL97wTQBQEAAAAIAAIAAAAAAAAAAQAABBj/BAAABPr9Uv9NBNAAAQAAAAAAAAAAAAAAAAAAAuoAAQAAAwUAoAAHAGwABAAAAAAAAAAAAAAAAAAAAAMAAQAEAkcB9AAFAAACigJYAAAASwKKAlgAAAFeADIBLAAAAAAGAAAAAAAAACEAAAcAAAABAAAAAAAAAABDREsgAMAADfsCBBj/BAAABTsCQSABAZMAAAAAAfQCvAAAACAACALhAF0AAAAAAQIAAAAAAAABAgAAASIAQgGHACsDJwArAocALgOBACsC1AArAPQAKwFJACsBSQAhAe8AKwJ1ACsA8wArAc8AKwDiACsCNAArApQAOgFWACECbQArAnYAKwKJACECbAArAoQAKwJcACECfgArAoQAKwDxACsA8wArApUAKwJ0ACsClQArAiMAKwM8ACsCqgArApgAQgKtADYCuQBCAnMAQgJcAEICtAA2AqwAQgEYAFYCZQAoAowAQgJFAEIDLQBCAq0AQgKcACsCqQBCAqoAKwKbAEIChwAuApIAIQK0AD0CvwArA5oAKwK4ACsCsQArAq8AKwFuAEICNAArAW4AKwJzACsCWQArAUoAKwIYACsCLgBCAgIAOgIuADoCDgA6AY8AIQIrADcCLQBCARMAQgGFACECGwBCAV4AQQMHAEICLgBCAg4AKwIqAEICKwA3AZ4AQgH9ADUBnwAjAiwAOQIzACsC4wArAjMAKwI8ACsCCQArAYQAKwDsAEIBhAArAmwAKwECAAABIgBCAgIAOgJCAC0C1AArArEAKwDsAEICAgAvAZMAKwMzACsBuwAjAgUAKwJVACsBzwArAzMAKwGlACsBlQArAnUAKwHRACEB1AAeAUkAKwJ9ACsA4gArATUAKwE1ACEBuwArAgUAKwOJACsDxQArBBwAKwIjACsCqgArAqoAKwKqACsCqgArAqoAKwKqACsDhgArAq0ANgJzAEICcwBCAnMAQgJzAEIBGP/hARgAVgEY/9wBGP/vAvkAKwKtAEICnAArApwAKwKcACsCnAArApwAKwIiACsCnAArArQAPQK0AD0CtAA9ArQAPQKxACsChABCAkcAPQIYACsCGAArAhgAKwIYACsCGAArAhgAKwNOACsCAgA6Ag4AOgIOADoCDgA6Ag4AOgDo/8oA6ABCAOj/xQDo/9gCdwArAi4AQgIOACsCDgArAg4AKwIOACsCDgArAnQAKwIOACsCLAA5AiwAOQIsADkCLAA5AjwAKwIfAEICPAArAqoAKwIYACsCqgArAhgAKwKqACsCGAArAq0ANgICADoCrQA2AgIAOgKtADYCAgA6Aq0ANgICADoCuQBCArEAOgL8ACsCSgA6AnMAQgIOADoCcwBCAg4AOgJzAEICDgA6AnMAQgIOADoCcwBCAg4AOgK0ADYCKwA3ArQANgIrADcCtAA2AisANwK0ADYCKwA3AqwAQgItAEIDCwAeAksAHQEY/+gA6P/RARj/5QDo/84BGP/eAOj/xwEYABoBEwAHARgAUQDoAEIDQgBWAi8AQgJlACgBbgAhAowAQgIbAEICHwBCAkUAQgFeAEECRQBCAV4AQQJoAEIBqwBBAk0AQgGgAEECdQAhAZQAJAKtAEICLgBCAq0AQgIuAEICrQBCAi4AQgJ9//ACrQBCAi4AQgKcACsCDgArApwAKwIOACsCnAArAg4AKwQ4ACsDUQArApsAQgGeAEICmwBCAZ4AIwKbAEIBngAqAocALgH9ADUChwAuAf0ANQKHAC4B/QA1AocALgH9ADUCkgAhAZ8AIwKSACEB7gAjApIAIQGfACMCtAA9AiwAOQK0AD0CLAA5ArQAPQIsADkCtAA9AiwAOQK0AD0CLAA5ArQAPQIsADkDmgArAuMAKwKxACsCPAArArEAKwKvACsCCQArAq8AKwIJACsCrwArAgkAKwKkAC4CcwAhAsIAKwI7ACsDDQA9AlkAOQKqACsCGAArARj/2wDo/8QCnAArAg4AKwK0AD0CLAA5ArQAPQIsADkCtAA9AiwAOQK0AD0CLAA5ArQAPQIsADkCtAA2AisANwKqACsCGAArA4YAKwNOACsCnAArAg4AKwKHAC4B/QA1ApIAIQGfACMBbgAhAi4AOgIKACcA8wArAPMAKwAAAAAAAP+IAboAKwG6ACsAAP/MAaUAKwAA/5sAAP9NAAD/zAGzACsAzQArAUEAKwEIACsBnwArAf4AKwAA/vkAAP8HAAD/TwAA/owAAP9YAAD/UQAA/8QAAP9iAAD/BQAA/4gAAP5QAAD/TgAA/6IAAP9dAAD/YQAA/zgAAP+WAAD/jQAA/1IAAP9YArkAIwMNACsCNABBApgAIQJVACUCYwAmAnYAJgJpADoCaQA6ApUAJgHzABwCNQAcAngAJgJxACYCfwAmA2QAJgOPACYCbgAcAm4AHAJCACYCyAAcA4cAOgN9ACUCawA6AmsAOgJVACYChwAcAlEAJgKGABwCoAAcAqsAHAJkADoCZgA6ArIAHAK0ABwCbAAcAngAJgJPACYCMQAeAlcAJQJFACYCbgAcAgkAHAJsADoCowAcAkIAJgJ9ABwC/AAcAlAAJgJdACYCJwAmAfMAJgAA/k0B+wAcAfv/GAAA/dEAAP3RAAD90QAA/dEAAP74AAD+XwAA/0sCmABCATEAOgI7ADoBwQAEAacAEgGrAAwB9wAcAh4AJgAA/hoAAP9iAAD+dwAA/hQAAP7qAAD+4QAA/xsAAP5kAlAAKwJ2ACsCiAAnAtoAIQKfAD8CvgArAr4AKwKyACEDVwA/Aq8AKwLAACsDCwAmBFAAKwK5AEICLgA6ArkAQgIuADoCtAA2AisANwKsAEICLQBCAqwAQgItAEICRQBCAV4AQQJF/+ABXv/VAkUAQgFeAB4DLQBCAwcAQgKtAEICLgBCAq0AQgIuAEICrQBCAi4AQgKbAEIBngA0ApsAQgGeADQCmwBCAZ7/yQKHAC4B/QA1AocALgH9ADUCkgAhAZ8AIwKSACEBnwAjA5oAKwLjACsDmgArAuMAKwOaACsC4wArArEAKwI8ACsCrwArAgkAKwGfAB4CYgA4AqoAKwIYACsCqgArAhgAKwKqACsCGAArAqoAKwIYACsCqgArAhgAKwKqACsCGAArAqoAKwIYACsCqgArAhgAKwKqACsCGAArAqoAKwIYACsCqgArAhgAKwKqACsCGAArAnMAQgIOADoCcwBCAg4AOgJzAEICDgA6AnMAQgIOADoCcwBCAg4AOgJzAEICDgA6AnMAQgIOADoCcwBCAg4AOgEYAB8A6AAJARgAUAETAEICnAArAg4AKwKcACsCDgArApwAKwIOACsCnAArAg4AKwKcACsCDgArApwAKwIOACsCnAArAg4AKwLCACsCOwArAsIAKwI7ACsCwgArAjsAKwLCACsCOwArAsIAKwI7ACsCtAA9AiwAOQK0AD0CLAA5Aw0APQJZADkDDQA9AlkAOQMNAD0CWQA5Aw0APQJZADkDDQA9AlkAOQKxACsCPAArArEAKwI8ACsCsQArAjwAKwKxACsCPAArApQAAAHPACsCfgArAn0AKwL9ACsC9QArAPIAKwDyACsA8gArAa8AKwGvACsBrwArAkIAKwJCACsBWgArAs0AKwT6ACsBCQArAaIAKwFeACsBXgArAlIAKwHwADAB7QAhAeQAKwH4ACsBywAhAfEAKwHQABcBHAArARwAIQHbAEIB8AAwATUAIQHRACEB1AAeAe0AIQHkACsB+AArAcsAIQHxACsB0AAXARwAKwEcACECAgA6AkYALAMVACEDAgAhAmIAOgLpACEDCAAhAroAOgKwADoCowAhAi8AIQLeACECKwA3AZkAIQMzACsDVQArA3AAKwMSACsDygArBGkAKwPFACsEYwArBE0AKwQAACsC3AArAZ0AKwLcACsBnQArAncAKwKzAEIC4gArAnUAKwI1ACsBegArApAAKwN/ACsCBwAhAl8AKwJ0ACsChgArAoYAKwI1ACsCmQArApkAKwKaACsCmgArApkAKwKZACsCmgArApoAKwJnACsCMgArAZMAKwGTACsCBwA3AnMAIQK9ACEDgQAmA6EAHAOPACYCbgAcAm4AHAJCACYCVQAlAm4AHAL8ABwBrwArAa8AKwGvACsBrwArAhoAKwG6ACsB8wArAboAKwGhACsAAP1z/2r+XP7A/Zn+dv1S/vn++/4R/W39d/13/Xf9d/8b/vX+1v74/0v++P5f/bv99f31/c/9sP3SAAAAAAADAAAAAwAAABwAAQAAAAADTAADAAEAAAAcAAQDMAAAAMgAgAAGAEgAAAANAH4AtAF+AY8BkgGhAbAB3AHnAf8CGwI3AlECWQK8Ar8CzALdAwQDDAMb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ApQQIgBLAAAQBwF7ARIAHv//AEL/RgJpAsUQIgAsAAAQBwGEAb7/+v//AEL/TAH0AsUQIgBMAAAQAwGEAXsAAP//AEL/FwJpAsUQIgAsAAAQBwGJAVj/+v//AEL/HQH0AsUQIgBMAAAQAwGJARUAAP//AEL/TAIlAsUQIgAwAAAQAwGEAZoAAP//AEH/TAE9AsUQIgBQAAAQAwGEASwAAP///+D/TAIlA1wQIgAwAAAQJwF7AIgA5hADAYQBmgAA////1f9MAT0DXhAiAFAAABAjAYQBLAAAEAcBewB9AOj//wBC/3kCJQLFECIAMAAAEAMBigEzAAD//wAe/3kBbgLFECIAUAAAEAMBigDGAAD//wBC/0wC6gLFECIAMQAAEAMBhAH6AAD//wBC/0wCzgH9ECIAUQAAEAMBhAHSAAD//wBC//cCawN5ECIAMgAAEAcBfQFZAOb//wBC//cB9AKxECIAUgAAEAcBfQEdAB7//wBC/0wCawLFECIAMgAAEAMBhAG/AAD//wBC/0wB9AH9ECIAUgAAEAMBhAF/AAD//wBC/3kCawLFECIAMgAAEAMBigFZAAD//wBC/3kB9AH9ECIAUgAAEAMBigEZAAD//wBC/0wCYwK8ECIANgAAEAMBhAGtAAD//wA0/0wBfgH9ECIAVgAAEAMBhADXAAD//wBC/0wCYwNcECIANgAAECMBhAGtAAAQBwF7AUYA5v//ADT/TAGEApQQIgBWAAAQIwGEANcAABAHAXsA3AAe//8AQv95AmMCvBAiADYAABADAYoBRgAA////yf95AX4B/RAiAFYAABACAYpxAAAA//8ALv/3AlwDeRAiADcAABAHAX0BQQDm//8ANf/3AdUCsRAiAFcAABAHAX0A+wAe//8ALv9MAlwCxRAiADcAABADAYQBswAA//8ANf9MAdUB/RAiAFcAABADAYQBagAA//8AIf9MAnECvBAiADgAABADAYQBrgAA//8AI/9MAXwCkxAiAFgAABADAYQBZQAA//8AIf95AnECvBAiADgAABADAYoBSAAA//8AI/95AacCkxAiAFgAABADAYoA/wAA//8AK//3A3ADpRAiADsAABAHAXcCKQDm//8AK//3ArgC3RAiAFsAABAHAXcBzQAe//8AK//3A3ADpBAiADsAABAHAXgClwDm//8AK//3ArgC3BAiAFsAABAHAXgCOgAe//8AK//3A3ADeRAiADsAABAHAX4BzgDm//8AK//3ArgCsRAiAFsAABAHAX4BcgAe//8AK//3AocDeRAiAD0AABAHAX0BWgDm//8AK/8wAhECsRAiAF0AABAHAX0BHwAe//8AK/9MAoQCvBAiAD4AABADAYQBxAAA//8AK/9MAd8B9BAiAF4AABADAYQBZwAA//8AHv/3AXwDTxAiAFgAABAHAX4AvAC8AAEAOP/3AjoCxQAoAAABLgEjIgYVERQGIxE0NjMyHgEVBx4BFRQGIyImNTQ3HgEzMjY1NCYnNQGeAkM6P0EyNX1rRmo7elZTcmU7TAwSOyQ5O09iAhonK0pH/mMlIgHkbX0uVTh5E2NRYnEtIxUQDQ8/O0A7BksA//8AK/9MAn8CxRAiACUAABADAYQBvAAA//8AK/9MAdsB/RAiAEUAABADAYQBcgAA//8AK//3An8D1RAiACUAABAHAX8B4wDm//8AK//3AdsDDRAiAEUAABAHAX8BmAAe//8AK//3An8EKhAiACUAABAHAuQAdwDm//8AK//3Ag0DYhAiAEUAABAGAuQtHgAA//8AK//3An8EKhAiACUAABAHAuUAdwDm//8AK//3AdsDYhAiAEUAABAGAuUtHgAA//8AK//3An8ESRAiACUAABAHAuYAdwDm//8AK//3AfUDgRAiAEUAABAGAuYtHgAA//8AK//3An8EUhAiACUAABAHAucAdwDm//8AK//3AdsDihAiAEUAABAGAuctHgAA//8AK/9MAn8DvBAiACUAABAjAYQBvAAAEAcBeQFWAOb//wAr/0wB2wL0ECIARQAAECMBhAFyAAAQBwF5AQsAHv//ACv/9wJ/BCwQIgAlAAAQBwLgAH4A5v//ACv/9wHbA2QQIgBFAAAQBgLgNB4AAP//ACv/9wJ/BCwQIgAlAAAQBwLhAH4A5v//ACv/9wHbA2QQIgBFAAAQBgLhNB4AAP//ACv/9wJ/BFYQIgAlAAAQBwLiAH0A5v//ACv/9wHbA44QIgBFAAAQBgLiMh4AAP//ACv/9wJ/BFUQIgAlAAAQBwLjAH4A5v//ACv/9wHbA40QIgBFAAAQBgLjNB4AAP//ACv/TAJ/A70QIgAlAAAQIwGEAbwAABAHAXwBVgDm//8AK/9MAdsC9RAiAEUAABAjAYQBcgAAEAcBfAELAB7//wBC/0wCSQK8ECIAKQAAEAMBhAGdAAD//wA6/0wB4wH9ECIASQAAEAMBhAF3AAD//wBCAAACSQPVECIAKQAAEAcBfwHEAOb//wA6//cB4wMNECIASQAAEAcBfwGfAB7//wBCAAACSQOJECIAKQAAEAcBegIGAL///wA6//cB4wLBECIASQAAEAcBegHh//f//wBCAAACSQQqECIAKQAAEAcC5ABZAOb//wA6//cCFANiECIASQAAEAYC5DQeAAD//wBCAAACSQQqECIAKQAAEAcC5QBZAOb//wA6//cB4wNiECIASQAAEAYC5TQeAAD//wBCAAACSQRJECIAKQAAEAcC5gBZAOb//wA6//cB/AOBECIASQAAEAYC5jQeAAD//wBCAAACSQRSECIAKQAAEAcC5wBZAOb//wA6//cB4wOKECIASQAAEAYC5zQeAAD//wBC/0wCSQO8ECIAKQAAECMBhAGdAAAQBwF5ATcA5v//ADr/TAHjAvQQIgBJAAAQIwGEAXcAABAHAXkBEgAe//8AH//3APsD1RAiAC0AABAHAX8BGgDm//8ACf/3AOUDFhAiAPMAABAHAX8BBAAn//8AUP9MAMgCxRAiAC0AABADAYQA8wAA//8AQv9MANECxRAiAE0AABADAYQA6AAA//8AK/9MAnICxRAiADMAABADAYQBtAAA//8AK/9MAeQB/RAiAFMAABADAYQBbQAA//8AK//3AnID1RAiADMAABAHAX8B2wDm//8AK//3AeQDDRAiAFMAABAHAX8BlAAe//8AK//3AnIEKhAiADMAABAHAuQAcADm//8AK//3AgkDYhAiAFMAABAGAuQpHgAA//8AK//3AnIEKhAiADMAABAHAuUAcADm//8AK//3AeQDYhAiAFMAABAGAuUpHgAA//8AK//3AnIESRAiADMAABAHAuYAcADm//8AK//3AfEDgRAiAFMAABAGAuYpHgAA//8AK//3AnIEUhAiADMAABAHAucAcADm//8AK//3AeQDihAiAFMAABAGAucpHgAA//8AK/9MAnIDvBAiADMAABAjAYQBtAAAEAcBeQFOAOb//wAr/0wB5AL0ECIAUwAAECMBhAFtAAAQBwF5AQcAHv//ACv/9wLsA6QQIgFDAAAQBwF4AhcA5v//ACv/9wJlAuUQIgFEAAAQBwF4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AToBOwE8AT0BPgE/AOIA4wFAAUEBQgFDAUQBRQFGAUcBSAFJAUoBSwFMAU0BTgCwALEBTwFQAVEBUgFTAVQBVQFWAVcBWAD7APwA5ADlAVkBWgFbAVwBXQFeAV8BYAFhAWIBYwFkAWUBZgFnAWgBaQFqAWsBbAFtAW4AuwFvAXABcQFyAOYA5wFzAKYBdAF1AXYBdwF4AXkBegF7AXwBfQF+AX8BgAGBAYIBgwGEAYUBhgGHAYgBiQGKAYsBjAGNAY4BjwGQAZEBkgGTAZQBlQGWAZcBmAGZAZoA2ADhAZsBnAGdAZ4BnwDbANwA3QDgANkA3wGgAaEBogGjAaQBpQGmAacBqAGpAaoBqwGsAa0BrgGvAbABsQGyAbMBtAG1AbYAmwG3AbgBuQG6AbsBvAG9Ab4BvwHAAcEBwgHDAcQBxQHGAccByAHJAcoBywHMAc0BzgHPAdAB0QHSAdMB1AHVAdYB1wHYAdkB2gHbAdwB3QHeAd8B4AHhAeIB4wHkAeUB5gHnAegB6QHqAesB7AHtAe4B7wHwAfEB8gHzAfQB9QH2AfcB+AH5AfoB+wH8Af0B/gH/AgACAQICAgMCBAIFAgYCBwIIAgkCCgILAgwCDQIOAg8CEAIRAhICEwIUAhUCFgIXAhgCGQIaAhsCHAIdAh4CHwIgAiECIgIjAiQCJQImAicCKAIpAioCKwIsAi0CLgIvAjACMQIyAjMCNAI1AjYCNwI4AjkCOgI7AjwCPQI+Aj8CQAJBAkICQwJEAkUCRgJHAkgCSQJKAksCTAJNAk4CTwJQAlECUgJTAlQCVQJWAlcCWAJZAloCWwJcAl0CXgJfAmACYQJiAmMCZAJlAmYCZwJoAmkCagJrAmwCbQJuAm8CcAJxAnICcwJ0AnUCdgJ3AngCeQJ6AnsCfAJ9An4CfwKAAoECggKDAoQChQKGAocCiAKJAooCiwKMAo0CjgKPApACkQKSApMClAKVApYClwKYApkCmgKbApwAsgCzAp0AtgC3AMQAtAC1AMUAggDCAIcAqwDGAp4CnwC+AL8AvAKgAqECogKjAqQCpQKmAqcCqAKpAqoCqwKsAq0CrgKvArACsQKyArMCtAK1ArYCtwK4ArkCugK7ArwCvQK+Ar8CwALBAsICwwLEAsUAjALGAscCyALJAsoCywLMAs0CzgLPAtAAmACaAJkA7wLRAtIApQCSAJwApwCPAJQAlQLTAtQC1QLWAtcC2ALZAtoC2wLcALkC3QLeAt8AwADBAuAC4QLiAuMC5ALlAuYC5wLoAukC6gLrAuwC7QLuAu8C8ALxAvIC8wL0AvUC9gL3AvgC+QL6AvsC/AL9Av4C/wMAAwEDAgMDAwQDBQMGAwcDCAMJAwoDCwMMAw0ETlVMTAd1bmkwMEEwB3VuaTAwQUQHdW5pMDBCMgd1bmkwMEIzB3VuaTAwQjkHQW1hY3JvbgdhbWFjcm9uBkFicmV2ZQZhYnJldmUHQW9nb25lawdhb2dvbmVrC0NjaXJjdW1mbGV4C2NjaXJjdW1mbGV4CkNkb3RhY2NlbnQKY2RvdGFjY2VudAZEY2Fyb24GZGNhcm9uBkRjcm9hdAdFbWFjcm9uB2VtYWNyb24GRWJyZXZlBmVicmV2ZQpFZG90YWNjZW50CmVkb3RhY2NlbnQHRW9nb25lawdlb2dvbmVrBkVjYXJvbgZlY2Fyb24LR2NpcmN1bWZsZXgLZ2NpcmN1bWZsZXgKR2RvdGFjY2VudApnZG90YWNjZW50B3VuaTAxMjIHdW5pMDEyMwtIY2lyY3VtZmxleAtoY2lyY3VtZmxleARIYmFyBGhiYXIGSXRpbGRlBml0aWxkZQdJbWFjcm9uB2ltYWNyb24GSWJyZXZlBmlicmV2ZQdJb2dvbmVrB2lvZ29uZWsCSUoCaWoLSmNpcmN1bWZsZXgLamNpcmN1bWZsZXgHdW5pMDEzNgd1bmkwMTM3DGtncmVlbmxhbmRpYwZMYWN1dGUGbGFjdXRlB3VuaTAxM0IHdW5pMDEzQwZMY2Fyb24GbGNhcm9uBExkb3QEbGRvdAZOYWN1dGUGbmFjdXRlB3VuaTAxNDUHdW5pMDE0NgZOY2Fyb24GbmNhcm9uC25hcG9zdHJvcGhlA0VuZwNlbmcHT21hY3JvbgdvbWFjcm9uBk9icmV2ZQZvYnJldmUNT2h1bmdhcnVtbGF1dA1vaHVuZ2FydW1sYXV0BlJhY3V0ZQZyYWN1dGUHdW5pMDE1Ngd1bmkwMTU3BlJjYXJvbgZyY2Fyb24GU2FjdXRlBnNhY3V0ZQtTY2lyY3VtZmxleAtzY2lyY3VtZmxleAd1bmkwMTYyB3VuaTAxNjMGVGNhcm9uBnRjYXJvbgRUYmFyBHRiYXIGVXRpbGRlBnV0aWxkZQdVbWFjcm9uB3VtYWNyb24GVWJyZXZlBnVicmV2ZQVVcmluZwV1cmluZw1VaHVuZ2FydW1sYXV0DXVodW5nYXJ1bWxhdXQHVW9nb25lawd1b2dvbmVrC1djaXJjdW1mbGV4C3djaXJjdW1mbGV4C1ljaXJjdW1mbGV4C3ljaXJjdW1mbGV4BlphY3V0ZQZ6YWN1dGUKWmRvdGFjY2VudAp6ZG90YWNjZW50B3VuaTAxOEYFT2hvcm4Fb2hvcm4FVWhvcm4FdWhvcm4HdW5pMDFDRAd1bmkwMUNFB3VuaTAxQ0YHdW5pMDFEMAd1bmkwMUQxB3VuaTAxRDIHdW5pMDFEMwd1bmkwMUQ0B3VuaTAxRDUHdW5pMDFENgd1bmkwMUQ3B3VuaTAxRDgHdW5pMDFEOQd1bmkwMURBB3VuaTAxREIHdW5pMDFEQwZHY2Fyb24GZ2Nhcm9uCkFyaW5nYWN1dGUKYXJpbmdhY3V0ZQdBRWFjdXRlB2FlYWN1dGULT3NsYXNoYWN1dGULb3NsYXNoYWN1dGUHdW5pMDIxOAd1bmkwMjE5B3VuaTAyMUEHdW5pMDIxQgd1bmkwMjM3B3VuaTAyNTEHdW5pMDI1OQd1bmkwMkJCB3VuaTAyQkMHdW5pMDJCRQd1bmkwMkJGB3VuaTAyQzgHdW5pMDJDOQd1bmkwMkNBB3VuaTAyQ0IHdW5pMDJDQwlncmF2ZWNvbWIJYWN1dGVjb21iB3VuaTAzMDIJdGlsZGVjb21iB3VuaTAzMDQHdW5pMDMwNgd1bmkwMzA3B3VuaTAzMDgNaG9va2Fib3ZlY29tYgd1bmkwMzBBB3VuaTAzMEIHdW5pMDMwQwd1bmkwMzFCDGRvdGJlbG93Y29tYgd1bmkwMzI0B3VuaTAzMjYHdW5pMDMyNwd1bmkwMzI4B3VuaTAzMkUHdW5pMDMzMQd1bmkwMzk0B3VuaTAzQTkHdW5pMDNCQwd1bmkwRTAxB3VuaTBFMDIHdW5pMEUwMwd1bmkwRTA0B3VuaTBFMDUHdW5pMEUwNgd1bmkwRTA3B3VuaTBFMDgHdW5pMEUwOQd1bmkwRTBBB3VuaTBFMEIHdW5pMEUwQwd1bmkwRTBEB3VuaTBFMEUHdW5pMEUwRgd1bmkwRTEwB3VuaTBFMTEHdW5pMEUxMgd1bmkwRTEzB3VuaTBFMTQHdW5pMEUxNQd1bmkwRTE2B3VuaTBFMTcHdW5pMEUxOAd1bmkwRTE5B3VuaTBFMUEHdW5pMEUxQgd1bmkwRTFDB3VuaTBFMUQHdW5pMEUxRQd1bmkwRTFGB3VuaTBFMjAHdW5pMEUyMQd1bmkwRTIyB3VuaTBFMjMHdW5pMEUyNAd1bmkwRTI1B3VuaTBFMjYHdW5pMEUyNwd1bmkwRTI4B3VuaTBFMjkHdW5pMEUyQQd1bmkwRTJCB3VuaTBFMkMHdW5pMEUyRAd1bmkwRTJFB3VuaTBFMkYHdW5pMEUzMAd1bmkwRTMxB3VuaTBFMzIHdW5pMEUzMwd1bmkwRTM0B3VuaTBFMzUHdW5pMEUzNgd1bmkwRTM3B3VuaTBFMzgHdW5pMEUzOQd1bmkwRTNBB3VuaTBFM0YHdW5pMEU0MAd1bmkwRTQxB3VuaTBFNDIHdW5pMEU0Mwd1bmkwRTQ0B3VuaTBFNDUHdW5pMEU0Ngd1bmkwRTQ3B3VuaTBFNDgHdW5pMEU0OQd1bmkwRTRBB3VuaTBFNEIHdW5pMEU0Qwd1bmkwRTREB3VuaTBFNEUHdW5pMEU0Rgd1bmkwRTUwB3VuaTBFNTEHdW5pMEU1Mgd1bmkwRTUzB3VuaTBFNTQHdW5pMEU1NQd1bmkwRTU2B3VuaTBFNTcHdW5pMEU1OAd1bmkwRTU5B3VuaTBFNUEHdW5pMEU1Qgd1bmkxRTBDB3VuaTFFMEQHdW5pMUUwRQd1bmkxRTBGB3VuaTFFMjAHdW5pMUUyMQd1bmkxRTI0B3VuaTFFMjUHdW5pMUUyQQd1bmkxRTJCB3VuaTFFMzYHdW5pMUUzNwd1bmkxRTM4B3VuaTFFMzkHdW5pMUUzQQd1bmkxRTNCB3VuaTFFNDIHdW5pMUU0Mwd1bmkxRTQ0B3VuaTFFNDUHdW5pMUU0Ngd1bmkxRTQ3B3VuaTFFNDgHdW5pMUU0OQd1bmkxRTVBB3VuaTFFNUIHdW5pMUU1Qwd1bmkxRTVEB3VuaTFFNUUHdW5pMUU1Rgd1bmkxRTYwB3VuaTFFNjEHdW5pMUU2Mgd1bmkxRTYzB3VuaTFFNkMHdW5pMUU2RAd1bmkxRTZFB3VuaTFFNkYGV2dyYXZlBndncmF2ZQZXYWN1dGUGd2FjdXRlCVdkaWVyZXNpcwl3ZGllcmVzaXMHdW5pMUU4RQd1bmkxRThGB3VuaTFFOTIHdW5pMUU5Mwd1bmkxRTk3B3VuaTFFOUUHdW5pMUVBMAd1bmkxRUExB3VuaTFFQTIHdW5pMUVBMwd1bmkxRUE0B3VuaTFFQTUHdW5pMUVBNgd1bmkxRUE3B3VuaTFFQTgHdW5pMUVBOQd1bmkxRUFBB3VuaTFFQUIHdW5pMUVBQwd1bmkxRUFEB3VuaTFFQUUHdW5pMUVBRgd1bmkxRUIwB3VuaTFFQjEHdW5pMUVCMgd1bmkxRUIzB3VuaTFFQjQHdW5pMUVCNQd1bmkxRUI2B3VuaTFFQjcHdW5pMUVCOAd1bmkxRUI5B3VuaTFFQkEHdW5pMUVCQgd1bmkxRUJDB3VuaTFFQkQHdW5pMUVCRQd1bmkxRUJGB3VuaTFFQzAHdW5pMUVDMQd1bmkxRUMyB3VuaTFFQzMHdW5pMUVDNAd1bmkxRUM1B3VuaTFFQzYHdW5pMUVDNwd1bmkxRUM4B3VuaTFFQzkHdW5pMUVDQQd1bmkxRUNCB3VuaTFFQ0MHdW5pMUVDRAd1bmkxRUNFB3VuaTFFQ0YHdW5pMUVEMAd1bmkxRUQxB3VuaTFFRDIHdW5pMUVEMwd1bmkxRUQ0B3VuaTFFRDUHdW5pMUVENgd1bmkxRUQ3B3VuaTFFRDgHdW5pMUVEOQd1bmkxRURBB3VuaTFFREIHdW5pMUVEQwd1bmkxRUREB3VuaTFFREUHdW5pMUVERgd1bmkxRUUwB3VuaTFFRTEHdW5pMUVFMgd1bmkxRUUzB3VuaTFFRTQHdW5pMUVFNQd1bmkxRUU2B3VuaTFFRTcHdW5pMUVFOAd1bmkxRUU5B3VuaTFFRUEHdW5pMUVFQgd1bmkxRUVDB3VuaTFFRUQHdW5pMUVFRQd1bmkxRUVGB3VuaTFFRjAHdW5pMUVGMQZZZ3JhdmUGeWdyYXZlB3VuaTFFRjQHdW5pMUVGNQd1bmkxRUY2B3VuaTFFRjcHdW5pMUVGOAd1bmkxRUY5B3VuaTIwMDcHdW5pMjAxMApmaWd1cmVkYXNoB3VuaTIwMTUGbWludXRlBnNlY29uZAd1bmkyMDcwB3VuaTIwNzQHdW5pMjA3NQd1bmkyMDc2B3VuaTIwNzcHdW5pMjA3OAd1bmkyMDc5B3VuaTIwN0QHdW5pMjA3RQd1bmkyMDdGB3VuaTIwODAHdW5pMjA4MQd1bmkyMDgyB3VuaTIwODMHdW5pMjA4NAd1bmkyMDg1B3VuaTIwODYHdW5pMjA4Nwd1bmkyMDg4B3VuaTIwODkHdW5pMjA4RAd1bmkyMDhFDWNvbG9ubW9uZXRhcnkEbGlyYQd1bmkyMEE2BnBlc2V0YQRkb25nBEV1cm8HdW5pMjBCMQd1bmkyMEIyB3VuaTIwQjUHdW5pMjBCOQd1bmkyMEJBB3VuaTIwQkQHdW5pMjEwQQd1bmkyMTEzB3VuaTIxMTcHdW5pMjEyMAllc3RpbWF0ZWQHdW5pMjE1Mwd1bmkyMTU0CW9uZWVpZ2h0aAx0aHJlZWVpZ2h0aHMLZml2ZWVpZ2h0aHMMc2V2ZW5laWdodGhzCWFycm93bGVmdAdhcnJvd3VwCmFycm93cmlnaHQJYXJyb3dkb3duB3VuaTIyMTUHdW5pMjIxOQlmaWxsZWRib3gHdHJpYWd1cAd1bmkyNUIzB3VuaTI1QjYHdW5pMjVCNwd0cmlhZ2RuB3VuaTI1QkQHdW5pMjVDMAd1bmkyNUMxB3VuaTI1QzYOZGllcmVzaXNfYWN1dGUOZGllcmVzaXNfZ3JhdmUHdW5pRjhGRgt1bmkwRTI0MEU0NQt1bmkwRTI2MEU0NQ95b1lpbmd0aGFpLmxlc3MRZG9DaGFkYXRoYWkuc2hvcnQRdG9QYXRha3RoYWkuc2hvcnQQdGhvVGhhbnRoYWkubGVzcw11bmkwRTI0LnNob3J0DXVuaTBFMjYuc2hvcnQRbG9DaHVsYXRoYWkuc2hvcnQLYnJldmVfYWN1dGULYnJldmVfZ3JhdmUPYnJldmVfaG9va2Fib3ZlC2JyZXZlX3RpbGRlEGNpcmN1bWZsZXhfYWN1dGUQY2lyY3VtZmxleF9ncmF2ZRRjaXJjdW1mbGV4X2hvb2thYm92ZRBjaXJjdW1mbGV4X3RpbGRlDmRpZXJlc2lzX2Nhcm9uDnVuaTBFMzEubmFycm93DXVuaTBFNDguc21hbGwOdW5pMEU0OC5uYXJyb3cNdW5pMEU0OS5zbWFsbA51bmkwRTQ5Lm5hcnJvdw11bmkwRTRBLnNtYWxsDnVuaTBFNEEubmFycm93DXVuaTBFNEIuc21hbGwNdW5pMEU0Qy5zbWFsbA51bmkwRTRDLm5hcnJvdw51bmkwRTQ3Lm5hcnJvdw51bmkwRTM0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ABgAAQAAAA4AAQABAboAAgAEAb8BvwAAAcIBxQABAdEB2AAFAvgC+wANAAMAAAABABQAAgAaACQAAQAAAA4AAQABAboAAQADAcYBxwHIAAIABAG/Ab8AAAHCAcUAAQHRAdgABQL4AvsADQADAAEAKAABABIAAAABAAAADwACAAMBvwG/AAABwgHFAAEB0QHXAAUAAQADAakBqwGtAAMAAQAcAAEAEgAAAAEAAAAPAAIAAQL4AvsAAAABAAMBqQGrAa0AAwABABwAAQASAAAAAQAAABAAAgABAdIB1gAAAAEABQLrAu0C7wLyAv8AAwACAB4AKAABABQAAAABAAAAEQACAAEB0gHWAAAAAQADAcYBxwHIAAEAAwGpAasBrQADAAEAIgABABIAAAABAAAAEQABAAYBvwHCAcMBxAHFAdEAAQAGAukC8wL0AvUC9gL3AAMAAQAcAAEAEgAAAAEAAAASAAIAAQHSAdYAAAABAAIBvwLpAAIADgAEAV8BYAFhAWIAAQAEASABIQEkASUAAgAOAAQBXwFgAWEBYgABAAQBIAEhASQBJQADAAAAAgAUABoAAQAgAAEAAAATAAEAAQBQAAEAAQB5AAEAAQBQAAMAAAACABQAGgABACAAAQAAABMAAQABADAAAQABAHkAAQABADAAAgAeAAwCnAKdApICkwKUApUClgKXApgCmQKaApsAAgACAAwADQAAABQAHQACAAIAHgAMAo8CkAKIAHsAdQB2AokCigKLAowCjQKOAAIAAgAMAA0AAAAUAB0AAgABAHQABQAQADoARgBcAGgABAAKABIAGgAiArIAAwATABwAfgADABMAGAKwAAMAEwAXAH8AAwATABYAAQAEArEAAwATABcAAgAGAA4CswADABMAHACAAAMAEwAYAAEABAK0AAMAEwAcAAEABAK1AAMAEwAcAAEABQAVABYAFwAZABsAAwABABoAAQASAAAAAQAAABQAAQACACUARQACAAEAFAAdAAAAAwABABoAAQASAAAAAQAAABQAAQACADMAUwACAAEAFAAdAAAAAQAyAAMADAAeACgAAgAGAAwC1gACAFAC1QACAE0AAQAEAtcAAgHPAAEABALYAAIBzwABAAMASgGyAbQAAgAoABEA8wFjAtkC2gLbAtwC3QLeAt8C/QL+AvwC6gLsAu4C8ALxAAEAEQBNAE4BmwGcAZ0BngGyAbQBugHGAccByAHSAdMB1AHVAdYAAgAmABAC6QL0AvUC9gL3AvMC6wLtAu8C/wLyAwADAQMCAwMDBAACAAQBvwG/AAABwgHFAAEB0QHXAAUC+AL7AAwAAgAQAAUC6gLsAu4C8ALxAAIAAQHSAdYAAAACABwACwLpAvQC9QL2AvcC8wLrAu0C7wL/AvIAAgADAb8BvwAAAcIBxQABAdEB1gAFAAIAEAAFAuoC7ALuAvAC8QACAAEB0gHWAAAAAQAeAAIACgAUAAEABAEBAAIAeQABAAQBAgACAHkAAQACADAAUAACAA4ABABtAHwAbQB8AAEABAAlADMARQBTAAEAAAAKAE4AggADREZMVAAUbGF0bgAkdGhhaQA0AAQAAAAA//8AAwAAAAEAAgAEAAAAAP//AAMAAAABAAIABAAAAAD//wADAAAAAQACAANrZXJuABRtYXJrAB5ta21rACgAAAADAAAAAQACAAAAAwADAAQABQAAAAQABgAHAAgACQAKABYAHgAsADQAPABEAEwAVABcAGQAAgAIAAEAVgACAAgABACQCvwc7isiAAIACAABLAIABAAAAAEsaAAEAAAAATAwAAQAAAABZZ4ABgEAAAFrtgAGAgAAAWycAAYBAAABb2QABgIAAAFwLAABADQABAAAAAUAFAAaACQALgAuAAEAFf+/AAIAFf+1ABj/0wACABD/vwAS/78AAQAY/9MAAQAFABAAEgAbAnkCewABCEYABAAAARECLAIyAjwCQgJCAkgCTgJCAkICkAKWApwCogKoAq4CqAKiArQCogK6AvwDAgMsAzICrgKuAq4CogKuAzgCogJCA24DjAOeA8ACQgJCA+YCrgKiAkICrgQcBD4EYASaB6wH4ggcAq4CSAJCAkgCSAJIAkgCQgKiAqgCqAKoAqgCqAKoAqICogKiAqIDLAKuAjwCrgKuAq4CrgKuAq4CrgKuAq4CrgKuAkICrgKuAq4CrgJCAq4CQgKuAkICrgJCAq4CQgKiAkICogJIAq4CSAKuAkgCrgJIAq4CSAKuAkICogJCAqICQgKiAkICogJCAkICQgJCApYCnAKcApwCnAKcAqICQgKiAkICogJCAkICogJCAqgCqAKoAkgCogJCAqICQgKiAkICrgKuAq4CrgK0ArQCtAKiAqICogKiAqICogL8AywDLAMyAzIDMgJCAqgCogKuAqgCogKiAqICogKiAkICogKuAkgCqAKuArQCrgKuAkICogJCAqICQgKiAkICQgJCAkICnAKcApwCQgKiAkICogJCAqICQgKiAkICogJCAqICQgKuAq4CtAK0AvwC/AL8AywDMgI8Aq4CrgKuAq4CrgKuAq4CrgKuAq4CrgKuAkgCrgJIAq4CSAKuAkgCrgJIAq4CSAKuAkgCrgJIAq4CqAKoAqgCqAKoAqgCqAKoAqgCqAKoAqgCogKiAqICogKiAqICogMsAywDLAMsAkIAAQA6/8kAAgA6/9MAWv+/AAEAW//pAAEAW//nAAEAW//OABAAEP+rABL/gwAp/9MAOv/nADz/5wBK/4gATf+/AE7/dgBT/28AWP+DAFn/jQBa/4MAW/+DAFz/gwBd/4MAXv+DAAEATv+rAAEAW//VAAEAW/+rAAEAW//dAAEAW//fAAEAW//TAAEAW/+IABAAEP/JABL/0wA6/+cAPP/TAEr/zwBN/94ATv+IAE//0wBT/6EAWP/rAFn/0wBa/78AW//JAFz/ugBd/7oAXv/JAAEAW//JAAoAOv/TADz/5wBO/8AAU//TAFj/0wBa/8kAW//JAFz/0wBd/8kAXv/1AAEAW/+hAAEAW/+/AA0AEP+1ABL/0wBK/78ATf/TAE7/nABT/7UAWP/TAFn/0wBa/78AW//TAFz/vwBd/9MAXv+/AAcATv+tAFP/5wBY//UAWv/nAFv/5wBc/+cAXf/nAAQATv/aAFr/0wBc/9MAXf/1AAgAOv/JAE7/ngBT/9MAWP/1AFr/0wBb/9gAXP/YAF3/1QAJAEr/5wBO/6YAUP/nAFP/5wBY/7oAWv+/AFv/zgBc//UAXf/OAA0AOv+rADz/0wBK/9MATf/nAE7/mQBT/+4AWP/iAFn/7gBa/78AW//TAFz/yQBd/78AXv/dAAgAOv/rAE7/oQBT/+cAWP/dAFr/4gBb/+kAXP/nAF3/5wAIADr/0wBO/7AAU//6AFj/+gBa/+cAW//xAFz/5wBd/+cADgAQ/9MAEv+/ADr/vwA8/8kASv/nAE3/5wBO/34AU/+/AFj/5wBZ/+cAWv/TAFz/0wBd/9MAXv/dAMQAEP/nACX/4gAm//EALP/nADL/3QAz/98ANf/fADj/iAA5/90AOv/JADv/yQA8/8kAPf+hAEb/5wBH/78ASP/LAEn/vwBK/+cAS//LAEz/8QBN/+cATv+NAFH/8QBS//EAU//TAFT/5wBV/8sAV//nAFj/6QBZ//EAWv/TAFv/5wBd/9MAXv/nAIL/4gCD/+IAhP/iAIX/4gCG/+IAh//iAIj/4gCT/90AlP/fAJX/3wCW/98Al//fAJj/3wCa/98Am//dAJz/3QCd/90Anv/dAJ//oQCh//EAqf+/AKr/vwCr/78ArP+/AK3/vwCz//EAwP/nAML/4gDE/+IAxv/iAMn/vwDL/78Azf+/AM//vwDR/8sA0//LANX/vwDX/78A2f+/ANv/vwDd/78A3//LAOH/ywDj/8sA5f/LAOb/5wDn//EA6P/nAOn/8QEF/90BBv/xAQf/3QEI//EBCf/dAQr/8QEL//EBDP/dAQ3/8QEO/98BEP/fARL/3wEU/98BHf/nAR//5wEh/+cBI//nAST/iAEm/4gBKP+IASr/3QEs/90BLv/dATD/3QEy/90BNP/dATb/yQE4/6EBOv+hAUP/3wFF/90BR//iAUv/3wFN/90BT//dAVH/3QFT/90BVf/dAVj/ywFZ/+IBW//iAV3/3wFg/+cBYf+IAWT/vwFl/78B5//LAen/ywHr/8sB7P/nAe3/8QHu/+cB7//xAff/8QH4/90B+f/xAfr/3QH7//EB/P/dAf3/8QIF/+cCB//nAgj/iAIK/4gCDP/JAg7/yQIQ/8kCEv+hAhf/8QIY/+ICGv/iAhz/4gIe/+ICIP/iAiL/4gIk/+ICJv/iAij/4gIq/+ICLP/iAi7/4gIx/78CM/+/AjX/vwI3/78COf+/Ajv/vwI9/78CP/+/AkT/3wJG/98CSP/fAkr/3wJM/98CTv/fAlD/3wJS/98CVP/fAlb/3wJY/98CWv/fAlz/3QJe/90CYP/dAmL/3QJk/90CZv/dAmj/3QJq/6ECbP+hAm7/oQJw/6ECkf/xAA0AOv+6ADz/0wBK/9MATf/nAE7/sABT/8kAWP/iAFn/5wBa/9MAW//TAFz/5wBd/9MAXv/nAA4AOv+6ADz/yQBK/+cATf/nAE7/kgBP/+cAU/+/AFj/0wBZ/+cAWv/TAFv/0wBc/9MAXf/TAF7/0wAKADr/yQA8//UASv/xAE7/vwBT/90AWP/nAFr/3QBb/+cAXP/nAF3/5wABAREAEAASACYAJwAo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AMgAAgDKAMoAAgDMAMwAAgDOAM4AAgDQANAAAwDSANIAAwDUANQABADWANYABADYANgABADaANoABADcANwABADeAN4AAgDgAOAAAgDiAOIAAgDkAOQAAgDmAOYABQDoAOgABQD0APQABgD2APYABgD4APgABwD7APsACAD9AP0ACAD/AP8ACAEBAQEACAEDAQMACAEFAQUACgEHAQcACgEJAQkACgEMAQwACgEOAQ4ACwEQARAACwESARIACwEUARQABAEWARYADQEYARgADQEaARoADQEcARwADgEeAR4ADgEgASAADgEiASIADgEkASQADwEmASYADwEoASgADwEqASoAEAEsASwAEAEuAS4AEAEwATAAEAEyATIAEAE0ATQAEAE2ATYAEQE4ATgAEgE6AToAEgE7ATsAEwE9AT0AEwE/AT8AEwFBAUEAAgFDAUMACwFFAUUAEAFLAUsACwFNAU0AEAFPAU8AEAFRAVEAEAFTAVMAEAFVAVUAEAFXAVcAAgFbAVsABAFdAV0ACwFfAV8ADgFhAWEADwHmAeYAAwHoAegAAwHqAeoAAgHsAewABQHuAe4ABQHwAfAACAHyAfIACAH0AfQACAH2AfYACQH4AfgACgH6AfoACgH8AfwACgH+Af4ADQIAAgAADQICAgIADQIEAgQADgIGAgYADgIIAggADwIKAgoADwIMAgwAEQIOAg4AEQIQAhAAEQISAhIAEgIUAhQAEwIXAhcAAQIwAjAABAIyAjIABAI0AjQABAI2AjYABAI4AjgABAI6AjoABAI8AjwABAI+Aj4ABAJEAkQACwJGAkYACwJIAkgACwJKAkoACwJMAkwACwJOAk4ACwJQAlAACwJSAlIACwJUAlQACwJWAlYACwJYAlgACwJaAloACwJcAlwAEAJeAl4AEAJgAmAAEAJiAmIAEAJkAmQAEAJmAmYAEAJoAmgAEAJqAmoAEgJsAmwAEgJuAm4AEgJwAnAAEgABABACggAcAAAAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXACUAAQAoAAAAAAABACkAAAACAAAAAAAmACcAAwAAAAMAAAAEAAUABgAMAAcADQAIABsAAAAAAAAAAAAAAAAAGAAeAAkACgAJAA4ACgAfACEADwAiACMAHwAfABAAHgAKACAAGgATAB0AFAALABUAFgAZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXABcAFwAXABcAFwAXAAEAAAAAAAAAAAAAAAAAAAAAAAAAJwADAAMAAwADAAMAAAADAAYABgAGAAYACAAAACUAGAAYABgAGAAYABgAGAAJAAkACQAJAAkAAAAAAAAAAAAAAB8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHgAAABcAGAAXABgAFwAYAAEACQABAAkAAQAJAAEACQAAAAoAAAAKAAAACQAAAAkAAAAJAAAACQAAAAkAAQAKAAEACgABAAoAAQAKACkAHwApAB8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJwAfACcAHwAnAB8AHwAnAB8AAwAAAAMAAAADAAAAAwAAAAAAIAAAACAAAAAgAAQAGgAEABoABAAaAAQAGgAFAAAABQAAAAUAAAAGAAAABgAAAAYAAAAGAAAABgAAAAYAAAAHAAsACAAAAAgAGwAAABsAAAAbAAAAAQAAAAMAAAAGAAAAFwAYAAAAAAADAAAABgAAAAYAAAAGAAAABgAAAAYAAAABAAoAFwAYABcAGAADAAAABAAaAAUAAAAAAAkACQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAACgABAAoAKQAfACkAHwAAAAAAAAAAAAAAAAAmAB8AJwAfACcAHwAnAB8AAAAgAAAAIAAAACAABAAaAAQAGgAFAAAABQAAAAcACwAHAAsABwALAAgAAAAbAAAAAAAlABcAGAAXABgAFwAYABcAGAAXABgAFwAYABcAGAAXABgAFwAYABcAGAAXABgAFwAYAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAAAAAAAAADAAAAAwAAAAMAAAADAAAAAwAAAAMAAAADAAAAAwAAAAMAAAADAAAAAwAAAAMAAAAGAAAABgAAAAYAAAAGAAAABgAAAAYAAAAGAAAACAAAAAgAAAAIAAAACAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAEQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHwABAMIAJQAmACcAKAApACoAKwAsAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgCCAIMAhACFAIYAhwCIAIkAigCLAIwAjQCSAJMAlACVAJYAlwCYAJoAmwCcAJ0AngCfAKAAoQDCAMQAxgDIAMoAzADOANAA0gDUANYA2ADaANwA3gDgAOIA5ADmAOgA9AD2APgA+wD9AP8BAQEDAQUBBwEJAQwBDgEQARIBFAEWARgBGgEcAR4BIAEiASQBJgEoASoBLAEuATABMgE0ATYBOAE6ATsBPQE/AUEBQwFFAUcBSwFNAU8BUQFTAVUBVwFZAVsBXQFfAWEB5gHoAeoB7AHuAfAB8gH0AfYB+AH6AfwB/gIAAgICBAIGAggCCgIMAg4CEAISAhQCFwIYAhoCHAIeAiACIgIkAiYCKAIqAiwCLgIwAjICNAI2AjgCOgI8Aj4CRAJGAkgCSgJMAk4CUAJSAlQCVgJYAloCXAJeAmACYgJkAmYCaAJqAmwCbgJwAAINRgAEAAAFsAeyABQAJAAA/7X/3f+r//H/8f/x/63/7v/T/87/yf+/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/6v/0/+rAAAAAP/n/5n/7v/i/7//0//T/9P/0//n/+cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/6v/0/+r//EAAAAA/6H/5//k/9P/0//T/9MAAAAA/+cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/8H/0/+1AAAAAAAA/6v/+v/n/9P/5//xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/7X/3f+/AAAAAAAA/5n/+v/6/93/3f/d/8kAAAAA/+cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/6v/0/+h/9P/0//n/6H/v//n/+f/0//TAAD/v//n/+f/v/+r/9P/5/+//+f/v//nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/3T/0/+S/+cAAAAA/7D/5//T/9P/0//T/8n/0wAA/+0AAAAAAAAAAAAAAAAAAAAA/+cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9MAAAAAAAAAAAAAAAD/0wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/T/7z/uv+/AAAAAAAAAAAAAAAAAAAAAAAAAAD/v/+r/7X/0wAAAAAAAAAA/+cAAP/T/7//4gAAAAAAAAAAAAAAAAAA/7z/0/+/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/8EAAAAAAAD/5wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/TAAAAAAAAAAAAAAAA/7UAAAAA/9X/0//TAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+f/5//xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/90AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/3T/q/9+/+b/7v/nAAAAAAAAAAAAAAAAAAAAAAAAAAD/0wAA/+4AAAAAAAAAAAAA/+cAAP/6AAD/+gAA/+f/5wAAAAAAAAAA/6v/0/+r/+z/9wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+cAAAAAAAAAAAAA//oAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/6v/0/+hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/3T/v/+X/8n/v//TAAAAAAAAAAAAAAAAAAAAAAAAAAD/2AAA/8QAAAAAAAAAAAAA/9//9f/nAAD/5//T/9P/0//TAAAAAAAA/3T/v/+X/7//v//TAAAAAAAAAAAAAAAAAAAAAAAAAAD/5wAA/8kAAAAAAAAAAAAA/9r/9f/nAAD/5wAA/9P/0//T/+cAAAAA/5n/v/+X/7//v//TAAAAAAAAAAAAAAAAAAAAAAAAAAD/vwAA/8H/3QAAAAAAAAAA/9//9f/nAAD/3QAA/9P/0//T/+f/8AAA/6v/3f+h/+f/3QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9MAAAAAAAAAAAAA/98AAAAAAAAAAAAAAAAAAAAAAAAAAAACAFUARgBGAAEARwBHAAIASABIAAMASQBJAAIASgBKAAgASwBLAAMATABMAAQATQBNAAkATgBOAAoATwBPAAsAUABQAAwAUQBSAAQAUwBTAA0AVABUAAEAVQBVAAMAVgBWAAUAVwBXAAYAWABYAA4AWQBZAA8AWgBaABAAWwBbAAcAXABcABEAXQBdABIAXgBeABMAqQCtAAIAswCzAAQAwADAAAEAyQDJAAIAywDLAAIAzQDNAAIAzwDPAAIA0QDRAAMA0wDTAAMA1QDVAAIA1wDXAAIA2QDZAAIA2wDbAAIA3QDdAAIA3wDfAAMA4QDhAAMA4wDjAAMA5QDlAAMA5wDnAAQA6QDpAAQBBgEGAAQBCAEIAAQBCgELAAQBDQENAAQBFwEXAAUBGQEZAAUBGwEbAAUBHQEdAAYBHwEfAAYBIQEhAAYBIwEjAAYBNwE3AAcBWAFYAAMBYAFgAAYBZQFlAAIB5wHnAAMB6QHpAAMB6wHrAAMB7QHtAAQB7wHvAAQB9wH3AAQB+QH5AAQB+wH7AAQB/QH9AAQB/wH/AAUCAQIBAAUCAwIDAAUCBQIFAAYCBwIHAAYCDQINAAcCDwIPAAcCEQIRAAcCMQIxAAICMwIzAAICNQI1AAICNwI3AAICOQI5AAICOwI7AAICPQI9AAICPwI/AAICkQKRAAQAAQAQAscAFQAAABcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEQAAACIAAAAAAAAAIgAfAAAAEgAAAAAAAAAgABkAAAAZAAAAGgABACEADQACAA4AAwAjAAAAAAAAAAAAAAAAAAQAGwAFABMABQAPABMAHQAWAAcAAAAAAB0AHQAIABsAEwAUAAYACQAYAAoAHgALAAwAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEQARABEAEQARABEAEQAiAAAAAAAAAAAAAAAAAAAAAAAAACAAGQAZABkAGQAZAAAAGQAhACEAIQAhAAMAAAAAAAQABAAEAAQABAAEAAQABQAFAAUABQAFAAAAAAAAAAAAAAAdAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABsAAAARAAQAEQAEABEABAAiAAUAIgAFACIABQAiAAUAAAATAAAAEwAAAAUAAAAFAAAABQAAAAUAAAAFACIAEwAiABMAIgATACIAEwAfAB0AHwAdAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAHQAgAB0AIAAdAB0AIAAdABkAAAAZAAAAGQAAABkAAAAAABQAAAAUAAAAFAAaAAYAGgAGABoABgAaAAYAAQAAAAEAAAABAAAAIQAAACEAAAAhAAAAIQAAACEAAAAhAAAAAgAeAAMAAAADACMAAAAjAAAAIwAAACIAAAAZAAAAIQAAABEABAAAAAAAGQAAACEAAAAhAAAAIQAAACEAAAAhAAAAIgATABEABAARAAQAGQAAABoABgABAAAAAAAFAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEwAAABMAIgATAB8AHQAfAB0AAAAAAAAAAAAAAAAAAAAdACAAHQAgAB0AIAAdAAAAFAAA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/8YB/QAB/8YB/QAB/8YB/QAB/0AB/QAB/wUB/QAB/8YDcQAB/wUB/QAB/8YDcQAB/wUB/QAB/8YDcQAB/wUB/QAB/8YDcQAB/8YDcQAB/wUB/QAB/wUB/QAB/zIB/QAB/zIB/QAB/zIB/QAB/zIB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8b/RgAB/8b/RgAB/8b/RgAB/wUB/QAB/wUB/QAB/wUB/QAB/wUB/QAB/wUB/QAB/wUB/QABMtIybgAEMvQADAGTDJoMoAymDKwMsgy4DL4MxAzKDNAM1gzcDOIM6AzuDPQM+g0ADQYNDA0SDRgNHg0kDSoNMA02DTwNQg1IDU4NVA1aDWANZg1sDXINeA1+DYQNig2QDZYNnA2iDagNrg20DboNwA3GDcwN0g3YDd4N5A3qDfAN9g38DgIOCA4ODhQOGg4gDiYOLA4yDjgOPg5EDkoOUA5WDlwOYg5oDm4OdA56DoAOhg6MDpIOmA6eDqQOqg6wDrYOvA7CDsgOzg7UDtoO4A7mDuwO8g74Dv4PBA8KDxAPFg8cDyIPKA8uDzQPOg9AD0YPTA9SD1gPXg9kD2oPcA92D3wPgg+ID44PlA+aD6APpg+sD7IPuA++D8QPyg/QD9YP3A/iD+gP7g/0D/oQABAGEAwQEhAYEB4QJBAqEDAQNhA8EEIQSBBOEFQQWhBgEGYQbBByEHgQfhCEEIoQkBCWEJwQohCoEK4QtBC6EMAQxhDMENIQ2BDeEOQQ6hDwEPYQ/BECEQgRDhEUERoRIBEmESwRMhE4ET4RRBFKEVARVhFcEWIRaBFuEXQRehGAEYYRjBGSEZgRnhGkEaoRsBG2EbwRwhHIEc4R1BHaEeAR5hHsEfIR+BH+EgQSChIQEhYSHBIiEigSLhI0EjoSQBJGEkwSUhJYEl4SZBJqEnASdhJ8EoISiBKOEpQSmhKgEqYSrBKyErgSvhLEEsoS0BLWEtwS4hLoEu4S9BL6EwATBhMMExITGBMeEyQTKhMwEzYTPBNCE0gTThNUE1oTYBNmE2wTchN4E34ThBOKE5ATlhOcE6ITqBOuE7QTuhPAE8YTzBPSE9gT3hPkE+oT8BP2E/wUAhQIFA4UFBQaFCAUJhQsFDIUOBQ+FEQUShRQFFYUXBRiFGgUbhR0FHoUgBSGFIwUkhSYFJ4UpBSqFLAUthS8FMIUyBTOFNQU2hTgFOYU7BTyFPgU/hUEFQoVEBUWFRwVIhUoFS4VNBU6FUAVRhVMFVIVWBVeFWQVahVwFXYVfBWCFYgVjhWUFZoVoBWmFawVshW4Fb4VxBXKFdAV1hXcFeIV6BXuFfQV+hYAFgYWDBYSFhgWHhYkFioWMBY2FjwWQhZIFk4WVBZaFmAWZhZsFnIWeBZ+FoQWihaQFpYWnBaiFqgWrha0FroWwBbGFswW0hbYFt4W5BbqFvAW9hb8FwIXCBcOFxQXGhcgFyYXLBcyFzgXPhdEF0oXUBdWF1wXYhdoF24XdBd6F4AXhheMF5IXmBeeF6QXqhewF7YXvBfCF8gXzhfUF9oX4BfmF+wX8hf4F/4YBBgKGBAYFhgcGCIYKBguGDQYOhhAGEYYTBhSGFgYXhhkGGoYcBh2GHwYghiIGI4YlBiaGKAYphisGLIYuBi+GMQYyhjQGNYY3BjiGOgY7hj0GPoZABkGGQwZEhkYGR4ZJBkqGTAZNhk8GUIZSBlOGVQZWhlgGWYZbBlyGXgZfhmEGYoZkBmWGZwZohmoGa4ZtBm6GcAZxhnMGdIZ2BneGeQZ6hnwGfYZ/BoCGggaDhoUGhoaIBomGiwaMho4Gj4aRBpKGlAaVhpcGmIaaBpuGnQaehqAGoYajBqSGpganhqkGqoasBq2GrwawhrIGs4a1BraGuAa5hrsGvIa+Br+GwQbChsQGxYbHBsiGygbLhs0GzobQBtGG0wbUhtYG14bZBtqG3Abdht8G4IbiBuOG5QbmhugG6YbrBuyG7gbvhvEG8ob0BvWG9wb4hvoG+4b9Bv6HAAcBhwMHBIcGBweHCQcKhwwHDYcPBxCHEgcThxUHFocYBxmHGwcchx4HH4chByKHJAclhycHKIcqByuHLQcuhzAHMYczBzSHNgc3hzkHOoc8Bz2HPwdAh0IHQ4dFB0aHSAdJh0sHTIdOB0+HUQdSh1QHVYdXB1iHWgdbh10HXodgB2GHYwdkh2YHZ4dpB2qHbAdth28HcIdyB3OHdQd2h3gHeYd7B3yHfgd/h4EHgoeEB4WHhweIh4oHi4eNB46HkAeRh5MHlIeWB5eHmQeah5wHnYefB6CHogejh6UHpoeoB6mHqwesh64Hr4exB7KHtAe1h7cHuIe6B7uHvQe+h8AHwYfDB8SHxgfHh8kHyofMB82HzwfQh9IH04fVB9aH2AfZh9sH3IfeB9+H4Qfih+QH5YfnB+iH6gfrh+0H7ofwB/GH8wf0h/YH94f5B/qH/Af9h/8IAIgCCAOIBQgGiAgICYgLCAyIDggPiBEIEogUCBWIFwgYiBoIG4gdCB6IIAghiCMIJIgmCCeIKQgqiCwILYgvCDCIMggziDUINog4CDmIOwg8iD4IP4hBCEKIRAhFiEcISIhKCEuITQhOiFAIUYhTCFSIVghXiFkIWohcCF2IXwhgiGIIY4hlCGaIaAhpiGsIbIhuCG+IcQhyiHQIdYh3CHiIegh7iH0IfoiACIGIgwiEiIYIh4iJCIqIjAiNiI8IkIiSCJOIlQiWiJgImYibCJyIngifiKEIooikCKWIpwioiKoIq4itCK6IsAixiLMItIi2CLeIuQi6iLwIvYi/CMCIwgjDiMUIxojICMmIywjMiM4Iz4jRCNKI1AjViNcI2IjaCNuI3QjeiOAI4YjjCOSI5gjniOkI6ojsCO2I7wjwiPII84j1CPaI+Aj5iPsI/Ij+CP+JAQkCiQQJBYkHCQiJCgkLiQ0JDokQCRGJEwkUiRYJF4kZCRqJHAkdiR8JIIkiCSOJJQkmiSgJKYkrCSyJLgkviTEJMok0CTWJNwk4iToJO4k9CT6JQAlBiUMJRIlGCUeJSQlKiUwJTYlPCVCJUglTiVUJVolYCVmJWwlciV4JX4lhCWKJZAlliWcJaIlqCWuJbQluiXAJcYlzCXSJdgl3iXkJeol8CX2JfwmAiYIJg4mFCYaJiAmJiYsJjImOCY+JkQmSiZQJlYmXCZiJmgmbiZ0JnomgCaGJowmkiaYJp4mpCaqJrAmtia8JsImyCbOJtQm2ibgJuYm7CbyJvgm/icEJwonECcWJxwnIicoJy4nNCc6J0AnRidMJ1InWCdeJ2QnaidwJ3YnfCeCJ4gnjieUJ5onoCemJ6wnsie4J74nxCfKJ9An1ifcJ+In6CfuJ/Qn+igAKAYoDCgSKBgoHigkKCooMCg2KDwoQihIKE4oVChaKGAoZihsKHIoeCh+KIQoiiiQKJYonCiiKKgorii0KLoowCjGKMwo0ijYKN4o5CjqKPAo9ij8KQIpCCkOKRQpGikgKSYpLCkyKTgpPilEKUopUClWKVwpYiloKW4pdCl6KYAphimMKZIpmCmeKaQpqimwKbYpvCnCKcgpzinUKdop4CnmKewp8in4Kf4qBCoKKhAqFiocKiIqKCouKjQqOipAKkYqTCpSKlgqXipkKmoqcCp2KnwqgiqIKo4qlCqaKqAqpiqsKrIquCq+KsQqyirQKtYq3CriKugq7ir0KvorACsGKwwrEisYKx4rJCsqKzArNis8K0IrSCtOK1QrWitgK2YrbCtyK3grfiuEK4orkCuWK5wroiuoK64rtCu6K8ArxivMK9Ir2CveK+Qr6ivwK/Yr/CwCLAgsDiwULBosICwmLCwsMiw4LD4sRCxKLFAsVixcLGIsaCxuLHQseiyALIYsjCySLJgsniykLKossCy2LLwswizILM4s1CzaLOAs5izsLPIs+Cz+LQQtCi0QLRYtHC0iLSgtLi00LTotQC1GLUwtUi1YLV4tZC1qLXAtdi18LYItiC2OLZQtmi2gLaYtrC2yLbgtvi3ELcot0C3WLdwt4i3oLe4t9C36LgAuBi4MLhIuGC4eLiQuKi4wLjYuPC5CLkguTi5ULlouYC5mLmwuci54Ln4uhC6KLpAuli6cLqIuqC6uLrQuui7ALsYuzC7SLtgu3i7kLuou8C72LvwvAi8ILw4vFC8aLyAvJi8sLzIvOC8+L0QvSi9QL1YvXC9iL2gvbi90L3ovgC+GL4wvki+YL54vpC+qL7Avti+8L8IvyC/OL9Qv2i/gL+Yv7C/yL/gv/jAEMAowEDAWMBwwIjAoMC4wNDA6MEAwRjBMMFIwWDBeMGQwajBwMHYwfDCCMIgwjjCUMJowoDCmMKwwsjC4ML4wxDDKMNAw1jDcMOIw6DDuMPQw+jEAMQYxDDESMRgxHjEkMSoxMDE2MTwxQjFIMU4xVDFaMWAxZjFsMXIxeDF+MYQxijGQMZYxnDGiMagxrjG0MboxwDHGMcwx0jHYMd4x5DHqMfAx9jH8MgIyCDIOMhQyGjIgMiYyLDIyMjgyPjJEMkoyUDJWMlwAAQFWAAAAAQJTAAoAAQFWArwAAQAAAAAAAQFSAAAAAQAAAAAAAQFSArwAAQAAAAAAAQFXAAAAAQAAAAAAAQFXArwAAQAAAAAAAQFHAAAAAQAAAAAAAQFHArwAAQAAAAAAAQE3AAAAAQInAAUAAQE3ArwAAQAAAAAAAQEoAAAAAQAAAAAAAQEoArwAAQAAAAAAAQFVAAAAAQAAAAAAAQFVArwAAQAAAAAAAQFY//oAAQAAAAAAAQFYArwAAQAAAAAAAQCNAAAAAQCrACUAAQCNArwAAQAAAAAAAQEvAAAAAQAAAAAAAQGEArwAAQAAAAAAAQFFAAAAAQAAAAAAAQFFArwAAQAAAAAAAQEzAAAAAQAAAAAAAQCIArwAAQJGArwAAQGUAAAAAQAAAAAAAQGUArwAAQAAAAAAAQFZAAAAAQAAAAAAAQFZArwAAQAAAAAAAQFOAAAAAQGDAAsAAQFOArwAAQJkAiwAAQFbAAAAAQAAAAAAAQFbArwAAQAAAAAAAQFOAAAAAQAAAAAAAQFOArwAAQAAAAAAAQFGAAAAAQAAAAAAAQFGArwAAQAAAAAAAQFNAAAAAQAAAAAAAQFBArwAAQAAAAAAAQFIAAAAAQAAAAAAAQFJArwAAQAAAAAAAQFgAAAAAQGOAAUAAQFgArwAAQJ8Ak8AAQFbAAAAAQAAAAAAAQFbArwAAQAAAAAAAQHOAAAAAQAAAAAAAQHOArwAAQAAAAAAAQFcAAAAAQAAAAAAAQFcArwAAQAAAAAAAQFaAAAAAQAAAAAAAQFaArwAAQAAAAAAAQFeAAAAAQAAAAAAAQFeArwAAQAAAAAAAQEMAAAAAQG8ABQAAQELAfQAAQAAAAAAAQEPAAAAAQAAAAAAAQEsArwAAQAAAAAAAQENAAAAAQAAAAAAAQEOAfQAAQAAAAAAAQETAAAAAQAAAAAAAQETArwAAQIcAfQAAQERAAAAAQE/AAUAAQESAfQAAQAAAAAAAQDCAAAAAQAAAAAAAQDCArwAAQAAAAAAAQET/zUAAQAAAAAAAQESAfQAAQAAAAAAAQEVAAAAAQAAAAAAAQERArwAAQAAAAAAAQCCAAAAAQCYAA0AAQAAAAAAAQAAAAAAAQEEAAAAAQAAAAAAAQDvArwAAQAAAAAAAQDGAAAAAQAAAAAAAQB9Ar4AAQEyAdYAAQFsAAAAAQAAAAAAAQGPAfQAAQAAAAAAAQEZAAAAAQAAAAAAAQEdAfQAAQAAAAAAAQEHAAAAAQEnAAsAAQEHAfQAAQHeAW0AAQEY/y8AAQAAAAAAAQEiAfQAAQAAAAAAAQEK/y8AAQAAAAAAAQEKAfQAAQAAAAAAAQBxAAAAAQAAAAAAAQDcAfQAAQAAAAAAAQEEAAAAAQAAAAAAAQD7AfQAAQAAAAAAAQD/AAAAAQAAAAAAAQC8ApIAAQGeAnMAAQEZAAAAAQG/AAoAAQEZAfQAAQHoAYkAAQEgAAAAAQAAAAAAAQEeAfQAAQAAAAAAAQFrAAAAAQAAAAAAAQFyAfQAAQAAAAAAAQEYAAAAAQAAAAAAAQEZAfQAAQAAAAAAAQGqAAAAAQAAAAAAAQEfAfQAAQAAAAAAAQEBAAAAAQAAAAAAAQECAfQAAQAAAAAAAQFWAAAAAQJTAAoAAQFWA6UAAQAAAAAAAQFWAAAAAQJTAAoAAQFbA6UAAQAAAAAAAQFWAAAAAQJTAAoAAQFWA8AAAQAAAAAAAQFWAAAAAQJTAAoAAQFWA3IAAQAAAAAAAQFWAAAAAQJTAAoAAQFWA14AAQAAAAAAAQFWAAAAAQJTAAoAAQFWA6sAAQAAAAAAAQH0AAAAAQAAAAAAAQHxArwAAQAAAAAAAQFX/yoAAQAAAAAAAQAAAAAAAQAAAAAAAQE3AAAAAQInAAUAAQE3A6UAAQAAAAAAAQE3AAAAAQInAAUAAQE8A6UAAQAAAAAAAQE3AAAAAQInAAUAAQE3A8AAAQAAAAAAAQE3AAAAAQInAAUAAQE3A14AAQAAAAAAAQCNAAAAAQCrACUAAQCNA6UAAQAAAAAAAQCNAAAAAQCrACUAAQCSA6UAAQAAAAAAAQCNAAAAAQCrACUAAQCNA8AAAQAAAAAAAQCNAAAAAQCrACUAAQCNA14AAQAAAAAAAQGDAAAAAQAAAAAAAQGDArwAAQAAAAAAAQFZAAAAAQAAAAAAAQFZA3IAAQAAAAAAAQFOAAAAAQGDAAsAAQFOA6UAAQJkAiwAAQFOAAAAAQGDAAsAAQFTA6UAAQJkAiwAAQFOAAAAAQGDAAsAAQFOA8AAAQJkAiwAAQFOAAAAAQGDAAsAAQFOA3IAAQJkAiwAAQFOAAAAAQGDAAsAAQFOA14AAQJkAiwAAQFOAAAAAQAAAAAAAQFOArwAAQAAAAAAAQFgAAAAAQGOAAUAAQFgA6UAAQJ8Ak8AAQFgAAAAAQGOAAUAAQFlA6UAAQJ8Ak8AAQFgAAAAAQGOAAUAAQFgA8AAAQJ8Ak8AAQFgAAAAAQGOAAUAAQFgA14AAQJ8Ak8AAQFaAAAAAQAAAAAAAQFgA6UAAQAAAAAAAQEkAAAAAQAAAAAAAQEdArwAAQAAAAAAAQEMAAAAAQG8ABQAAQELAt0AAQAAAAAAAQEMAAAAAQG8ABQAAQEQAt0AAQAAAAAAAQEMAAAAAQG8ABQAAQELAvgAAQAAAAAAAQEMAAAAAQG8ABQAAQELAqoAAQAAAAAAAQEMAAAAAQG8ABQAAQELApYAAQAAAAAAAQEMAAAAAQG8ABQAAQELAuMAAQAAAAAAAQGuAAAAAQAAAAAAAQGuAf0AAQAAAAAAAQEN/yoAAQAAAAAAAQAAAAAAAQAAAAAAAQERAAAAAQE/AAUAAQESAt0AAQAAAAAAAQERAAAAAQE/AAUAAQEXAt0AAQAAAAAAAQERAAAAAQE/AAUAAQESAvgAAQAAAAAAAQERAAAAAQE/AAUAAQESApYAAQAAAAAAAQB2AAAAAQCDAA0AAQB2AuYAAQAAAAAAAQB2AAAAAQCDAA0AAQB8AuYAAQAAAAAAAQB2AAAAAQCDAA0AAQB2AwEAAQAAAAAAAQB2AAAAAQCDAA0AAQB2Ap8AAQAAAAAAAQEZAAAAAQAAAAAAAQEdAqoAAQAAAAAAAQEHAAAAAQEnAAsAAQEHAt0AAQHeAW0AAQEHAAAAAQEnAAsAAQEMAt0AAQHeAW0AAQEHAAAAAQEnAAsAAQEHAvgAAQHeAW0AAQEHAAAAAQEnAAsAAQEHAqoAAQHeAW0AAQEHAAAAAQEnAAsAAQEHApYAAQHeAW0AAQAAAAAAAQAAAAAAAQEHAf0AAQAAAAAAAQEZAAAAAQG/AAoAAQEZAt0AAQHoAYkAAQEZAAAAAQG/AAoAAQEeAt0AAQHoAYkAAQEZAAAAAQG/AAoAAQEZAvgAAQHoAYkAAQEZAAAAAQG/AAoAAQEZApYAAQHoAYkAAQGqAAAAAQAAAAAAAQElAt0AAQAAAAAAAQGqAAAAAQAAAAAAAQEfApYAAQAAAAAAAQFWAAAAAQJTAAoAAQFWA1QAAQAAAAAAAQEMAAAAAQG8ABQAAQELAowAAQAAAAAAAQFWAAAAAQJTAAoAAQFWA6cAAQAAAAAAAQEMAAAAAQG8ABQAAQELAt8AAQAAAAAAAQFWAAAAAQJTAAoAAQFWArwAAQAAAAAAAQEMAAAAAQG8ABQAAQELAfQAAQAAAAAAAQFXAAAAAQAAAAAAAQFdA6UAAQAAAAAAAQENAAAAAQAAAAAAAQETAt0AAQAAAAAAAQFXAAAAAQAAAAAAAQFXA8AAAQAAAAAAAQENAAAAAQAAAAAAAQEOAvgAAQAAAAAAAQFXAAAAAQAAAAAAAQFXA3YAAQAAAAAAAQENAAAAAQAAAAAAAQEOAq4AAQAAAAAAAQFXAAAAAQAAAAAAAQFXA8AAAQAAAAAAAQENAAAAAQAAAAAAAQEOAvgAAQAAAAAAAQFHAAAAAQAAAAAAAQFHA8AAAQAAAAAAAQETAAAAAQAAAAAAAQETArwAAQIcAfQAAQGGAAAAAQAAAAAAAQGGArwAAQAAAAAAAQETAAAAAQAAAAAAAQETArwAAQIcAfQAAQE3AAAAAQInAAUAAQE3A1QAAQAAAAAAAQERAAAAAQE/AAUAAQESAowAAQAAAAAAAQE3AAAAAQInAAUAAQE3A6cAAQAAAAAAAQERAAAAAQE/AAUAAQESAt8AAQAAAAAAAQE3AAAAAQInAAUAAQE3A3YAAQAAAAAAAQERAAAAAQE/AAUAAQESAq4AAQAAAAAAAQE3AAAAAQInAAUAAQE3ArwAAQAAAAAAAQERAAAAAQE/AAUAAQESAfQAAQAAAAAAAQE3AAAAAQInAAUAAQE3A8AAAQAAAAAAAQERAAAAAQE/AAUAAQESAvgAAQAAAAAAAQFVAAAAAQAAAAAAAQFVA8AAAQAAAAAAAQET/zUAAQAAAAAAAQESAvgAAQAAAAAAAQFVAAAAAQAAAAAAAQFVA6cAAQAAAAAAAQET/zUAAQAAAAAAAQESAt8AAQAAAAAAAQFVAAAAAQAAAAAAAQFVA3YAAQAAAAAAAQET/zUAAQAAAAAAAQESAq4AAQAAAAAAAQFU/tUAAQAAAAAAAQFVArwAAQAAAAAAAQET/zUAAQAAAAAAAQESAfQAAQAAAAAAAQFY//oAAQAAAAAAAQFYA8AAAQAAAAAAAQEVAAAAAQAAAAAAAQERA8AAAQAAAAAAAQGG//oAAQAAAAAAAQGGArwAAQAAAAAAAQE3AAAAAQAAAAAAAQEzArwAAQAAAAAAAQCNAAAAAQCrACUAAQCNA3IAAQAAAAAAAQB2AAAAAQCDAA0AAQB2ArMAAQAAAAAAAQCNAAAAAQCrACUAAQCNA1QAAQAAAAAAAQB2AAAAAQCDAA0AAQB2ApUAAQAAAAAAAQCNAAAAAQCrACUAAQCNA6cAAQAAAAAAAQB2AAAAAQCDAA0AAQB2AugAAQAAAAAAAQCNAAAAAQCrACUAAQCNArwAAQAAAAAAAQCCAAAAAQCYAA0AAQAAAAAAAQAAAAAAAQCNAAAAAQCrACUAAQCNA3YAAQAAAAAAAQB2AAAAAQCDAA0AAQB2Af0AAQAAAAAAAQEvAAAAAQAAAAAAAQGEA8AAAQAAAAAAAQCbAAAAAQAAAAAAAQD2AvAAAQAAAAAAAQFE/tUAAQAAAAAAAQFFArwAAQAAAAAAAQED/tUAAQAAAAAAAQDvArwAAQAAAAAAAQEzAAAAAQAAAAAAAQCNA6UAAQJGArwAAQDGAAAAAQAAAAAAAQCCA6cAAQEyAdYAAQEy/tUAAQAAAAAAAQCIArwAAQJGArwAAQDF/tUAAQAAAAAAAQB9Ar4AAQEyAdYAAQEzAAAAAQAAAAAAAQCIArwAAQJGArwAAQDGAAAAAQAAAAAAAQB9Ar4AAQEyAdYAAQEzAAAAAQAAAAAAAQCIArwAAQJGArwAAQDGAAAAAQAAAAAAAQB9Ar4AAQEyAdYAAQFjAAAAAQAAAAAAAQC3ArwAAQJ1ArwAAQD6AAAAAQAAAAAAAQCxAr4AAQFmAdYAAQFZAAAAAQAAAAAAAQFeA6UAAQAAAAAAAQEZAAAAAQAAAAAAAQEjAt0AAQAAAAAAAQFY/tUAAQAAAAAAAQFZArwAAQAAAAAAAQEY/tUAAQAAAAAAAQEdAfQAAQAAAAAAAQFZAAAAAQAAAAAAAQFZA8AAAQAAAAAAAQEZAAAAAQAAAAAAAQEdAvgAAQAAAAAAAQFoAAAAAQAAAAAAAQFtAfQAAQAAAAAAAQFOAAAAAQGDAAsAAQFOA1QAAQJkAiwAAQEHAAAAAQEnAAsAAQEHAowAAQHeAW0AAQFOAAAAAQGDAAsAAQFOA6cAAQJkAiwAAQEHAAAAAQEnAAsAAQEHAt8AAQHeAW0AAQFOAAAAAQGDAAsAAQFyA8UAAQJkAiwAAQEHAAAAAQEnAAsAAQErAv0AAQHeAW0AAQIDAAAAAQAAAAAAAQIBArwAAQAAAAAAAQGD//4AAQGiAAsAAQGuAf0AAQAAAAAAAQFGAAAAAQAAAAAAAQFMA6UAAQAAAAAAAQBxAAAAAQAAAAAAAQDiAt0AAQAAAAAAAQFF/tUAAQAAAAAAAQFGArwAAQAAAAAAAQBw/tUAAQAAAAAAAQDcAfQAAQAAAAAAAQFGAAAAAQAAAAAAAQFGA8AAAQAAAAAAAQBxAAAAAQAAAAAAAQDcAvgAAQAAAAAAAQFNAAAAAQAAAAAAAQFGA6UAAQAAAAAAAQEEAAAAAQAAAAAAAQEAAt0AAQAAAAAAAQFNAAAAAQAAAAAAAQFBA8AAAQAAAAAAAQEEAAAAAQAAAAAAAQD7AvgAAQAAAAAAAQFN/yoAAQAAAAAAAQAAAAAAAQAAAAAAAQEE/yoAAQAAAAAAAQAAAAAAAQAAAAAAAQFNAAAAAQAAAAAAAQFBA8AAAQAAAAAAAQEEAAAAAQAAAAAAAQD7AvgAAQAAAAAAAQD//yoAAQAAAAAAAQAAAAAAAQGeAnMAAQFIAAAAAQAAAAAAAQFJA8AAAQAAAAAAAQD/AAAAAQAAAAAAAQC8ApIAAQGeAnMAAQFIAAAAAQAAAAAAAQFJArwAAQAAAAAAAQD/AAAAAQAAAAAAAQC8ApIAAQGeAnMAAQFgAAAAAQGOAAUAAQFgA3IAAQJ8Ak8AAQEZAAAAAQG/AAoAAQEZAqoAAQHoAYkAAQFgAAAAAQGOAAUAAQFgA1QAAQJ8Ak8AAQEZAAAAAQG/AAoAAQEZAowAAQHoAYkAAQFgAAAAAQGOAAUAAQFgA6cAAQJ8Ak8AAQEZAAAAAQG/AAoAAQEZAt8AAQHoAYkAAQFgAAAAAQGOAAUAAQFgA6sAAQJ8Ak8AAQEZAAAAAQG/AAoAAQEZAuMAAQHoAYkAAQFgAAAAAQGOAAUAAQGEA8UAAQJ8Ak8AAQEZAAAAAQG/AAoAAQE9Av0AAQHoAYkAAQFgAAAAAQGOAAUAAQFgArwAAQJ8Ak8AAQEZAAAAAQG/AAoAAQEZAfQAAQHoAYkAAQHOAAAAAQAAAAAAAQHOA8AAAQAAAAAAAQFrAAAAAQAAAAAAAQFyAvgAAQAAAAAAAQFaAAAAAQAAAAAAAQFaA8AAAQAAAAAAAQGqAAAAAQAAAAAAAQEfAvgAAQAAAAAAAQFaAAAAAQAAAAAAAQFaA14AAQAAAAAAAQFeAAAAAQAAAAAAAQFkA6UAAQAAAAAAAQEBAAAAAQAAAAAAAQEHAt0AAQAAAAAAAQFeAAAAAQAAAAAAAQFeA3YAAQAAAAAAAQEBAAAAAQAAAAAAAQECAq4AAQAAAAAAAQFeAAAAAQAAAAAAAQFeA8AAAQAAAAAAAQEBAAAAAQAAAAAAAQECAvgAAQAAAAAAAQFPAAAAAQGDAAsAAQFPArwAAQJkAiwAAQEyAAAAAQEnAAsAAQEyAf0AAQHeAW0AAQFeAAAAAQGOAAUAAQFgArwAAQJ8Ak8AAQESAAAAAQG/AAoAAQESAfQAAQHoAYkAAQFWAAAAAQJTAAoAAQFWA8AAAQAAAAAAAQEMAAAAAQG8ABQAAQELAvgAAQAAAAAAAQCNAAAAAQCrACUAAQCNA8AAAQAAAAAAAQB2AAAAAQCDAA0AAQB2AwEAAQAAAAAAAQFOAAAAAQGDAAsAAQFOA8AAAQJkAiwAAQEHAAAAAQEnAAsAAQEHAvgAAQHeAW0AAQFgAAAAAQGOAAUAAQFgA8AAAQJ8Ak8AAQEZAAAAAQG/AAoAAQEZAvgAAQHoAYkAAQFgAAAAAQGOAAUAAQFgA/YAAQJ8Ak8AAQEZAAAAAQG/AAoAAQEZAy4AAQHoAYkAAQFgAAAAAQGOAAUAAQFgBEYAAQJ8Ak8AAQEZAAAAAQG/AAoAAQEZA34AAQHoAYkAAQFgAAAAAQGOAAUAAQFgBEYAAQJ8Ak8AAQEZAAAAAQG/AAoAAQEZA34AAQHoAYkAAQFgAAAAAQGOAAUAAQFgBEYAAQJ8Ak8AAQEZAAAAAQG/AAoAAQEZA34AAQHoAYkAAQFVAAAAAQAAAAAAAQFVA8AAAQAAAAAAAQET/zUAAQAAAAAAAQESAvgAAQAAAAAAAQAAAAAAAQJTAAoAAQFaBGYAAQAAAAAAAQAAAAAAAQG8ABQAAQEPA54AAQAAAAAAAQH0AAAAAQAAAAAAAQH2A6UAAQAAAAAAAQGuAAAAAQAAAAAAAQGzAuYAAQAAAAAAAQFOAAAAAQAAAAAAAQFTA6UAAQAAAAAAAQAAAAAAAQAAAAAAAQEMAuYAAQAAAAAAAQFM/tUAAQAAAAAAAQFBArwAAQAAAAAAAQED/tUAAQAAAAAAAQD7AfQAAQAAAAAAAQFH/tUAAQAAAAAAAQFJArwAAQAAAAAAAQD+/tUAAQAAAAAAAQC8ApIAAQGeAnMAAQCbAAAAAQAAAAAAAQDdAewAAQAAAAAAAQFH/10AAQAAAAAAAQFHArwAAQAAAAAAAQET/10AAQAAAAAAAQETArwAAQIcAfQAAQFH/5IAAQAAAAAAAQFHArwAAQAAAAAAAQET/5IAAQAAAAAAAQETArwAAQIcAfQAAQFVAAAAAQAAAAAAAQFVA1QAAQAAAAAAAQET/zUAAQAAAAAAAQESAowAAQAAAAAAAQFY/1cAAQAAAAAAAQFYArwAAQAAAAAAAQEV/10AAQAAAAAAAQERArwAAQAAAAAAAQFY/0MAAQAAAAAAAQFYArwAAQAAAAAAAQEV/0kAAQAAAAAAAQERArwAAQAAAAAAAQEz/10AAQAAAAAAAQCIArwAAQJGArwAAQDG/10AAQAAAAAAAQB9Ar4AAQEyAdYAAQEz/10AAQAAAAAAAQCIA1QAAQJGArwAAQDG/10AAQAAAAAAAQB9A1YAAQEyAdYAAQEz/5IAAQAAAAAAAQCIArwAAQJGArwAAQDG/5IAAQAAAAAAAQB9Ar4AAQEyAdYAAQGU/10AAQAAAAAAAQGUArwAAQAAAAAAAQFs/10AAQAAAAAAAQGPAfQAAQAAAAAAAQFZAAAAAQAAAAAAAQFZA3YAAQAAAAAAAQEZAAAAAQAAAAAAAQEdAq4AAQAAAAAAAQFZ/10AAQAAAAAAAQFZArwAAQAAAAAAAQEZ/10AAQAAAAAAAQEdAfQAAQAAAAAAAQFZ/5IAAQAAAAAAAQFZArwAAQAAAAAAAQEZ/5IAAQAAAAAAAQEdAfQAAQAAAAAAAQFG/10AAQAAAAAAAQFGArwAAQAAAAAAAQBx/10AAQAAAAAAAQDcAfQAAQAAAAAAAQFG/10AAQAAAAAAAQFGA1QAAQAAAAAAAQBx/10AAQAAAAAAAQDcAowAAQAAAAAAAQFG/5IAAQAAAAAAAQFGArwAAQAAAAAAAQBx/5IAAQAAAAAAAQDcAfQAAQAAAAAAAQFNAAAAAQAAAAAAAQFBA3YAAQAAAAAAAQEEAAAAAQAAAAAAAQD7Aq4AAQAAAAAAAQFN/10AAQAAAAAAAQFBArwAAQAAAAAAAQEE/10AAQAAAAAAAQD7AfQAAQAAAAAAAQFI/10AAQAAAAAAAQFJArwAAQAAAAAAAQD//10AAQAAAAAAAQC8ApIAAQGeAnMAAQFI/5IAAQAAAAAAAQFJArwAAQAAAAAAAQD//5IAAQAAAAAAAQC8ApIAAQGeAnMAAQHOAAAAAQAAAAAAAQHOA6UAAQAAAAAAAQFrAAAAAQAAAAAAAQFyAt0AAQAAAAAAAQHOAAAAAQAAAAAAAQHUA6UAAQAAAAAAAQFrAAAAAQAAAAAAAQF3At0AAQAAAAAAAQHOAAAAAQAAAAAAAQHOA14AAQAAAAAAAQFrAAAAAQAAAAAAAQFyApYAAQAAAAAAAQFaAAAAAQAAAAAAAQFaA3YAAQAAAAAAAQGqAAAAAQAAAAAAAQEfAq4AAQAAAAAAAQFe/10AAQAAAAAAAQFeArwAAQAAAAAAAQEB/10AAQAAAAAAAQECAfQAAQAAAAAAAQD/AAAAAQAAAAAAAQC8AzQAAQGeAnMAAQFW/10AAQJTAAoAAQFWArwAAQAAAAAAAQEM/10AAQG8ABQAAQELAfQAAQAAAAAAAQFWAAAAAQJTAAoAAQFWA8AAAQAAAAAAAQEMAAAAAQG8ABQAAQELAvgAAQAAAAAAAQFWAAAAAQJTAAoAAQFWBCYAAQAAAAAAAQEMAAAAAQG8ABQAAQELA14AAQAAAAAAAQFWAAAAAQJTAAoAAQFWBCYAAQAAAAAAAQEMAAAAAQG8ABQAAQELA14AAQAAAAAAAQFWAAAAAQJTAAoAAQFWBCYAAQAAAAAAAQEMAAAAAQG8ABQAAQELA14AAQAAAAAAAQFWAAAAAQJTAAoAAQFWBEUAAQAAAAAAAQEMAAAAAQG8ABQAAQELA30AAQAAAAAAAQFW/10AAQJTAAoAAQFWA8AAAQAAAAAAAQEM/10AAQG8ABQAAQELAvgAAQAAAAAAAQFWAAAAAQJTAAoAAQFWBD0AAQAAAAAAAQEMAAAAAQG8ABQAAQELA3UAAQAAAAAAAQFWAAAAAQJTAAoAAQFWBD0AAQAAAAAAAQEMAAAAAQG8ABQAAQELA3UAAQAAAAAAAQFWAAAAAQJTAAoAAQFWBD0AAQAAAAAAAQEMAAAAAQG8ABQAAQELA3UAAQAAAAAAAQFWAAAAAQJTAAoAAQFWBD0AAQAAAAAAAQEMAAAAAQG8ABQAAQELA3UAAQAAAAAAAQFW/10AAQJTAAoAAQFWA6cAAQAAAAAAAQEM/10AAQG8ABQAAQELAt8AAQAAAAAAAQE3/10AAQInAAUAAQE3ArwAAQAAAAAAAQER/10AAQE/AAUAAQESAfQAAQAAAAAAAQE3AAAAAQInAAUAAQE3A8AAAQAAAAAAAQERAAAAAQE/AAUAAQESAvgAAQAAAAAAAQE3AAAAAQInAAUAAQE3A3IAAQAAAAAAAQERAAAAAQE/AAUAAQESAqoAAQAAAAAAAQE3AAAAAQInAAUAAQE3BCYAAQAAAAAAAQERAAAAAQE/AAUAAQESA14AAQAAAAAAAQE3AAAAAQInAAUAAQE3BCYAAQAAAAAAAQERAAAAAQE/AAUAAQESA14AAQAAAAAAAQE3AAAAAQInAAUAAQE3BCYAAQAAAAAAAQERAAAAAQE/AAUAAQESA14AAQAAAAAAAQE3AAAAAQInAAUAAQE3BEUAAQAAAAAAAQERAAAAAQE/AAUAAQESA30AAQAAAAAAAQE3/10AAQInAAUAAQE3A8AAAQAAAAAAAQER/10AAQE/AAUAAQESAvgAAQAAAAAAAQCNAAAAAQCrACUAAQCNA8AAAQAAAAAAAQB2AAAAAQCDAA0AAQB2AwEAAQAAAAAAAQCN/10AAQCrACUAAQCNArwAAQAAAAAAAQCC/10AAQCYAA0AAQAAAAAAAQAAAAAAAQFO/10AAQGDAAsAAQFOArwAAQJkAiwAAQEH/10AAQEnAAsAAQEHAfQAAQHeAW0AAQFOAAAAAQGDAAsAAQFOA8AAAQJkAiwAAQEHAAAAAQEnAAsAAQEHAvgAAQHeAW0AAQFOAAAAAQGDAAsAAQFOBCYAAQJkAiwAAQEHAAAAAQEnAAsAAQEHA14AAQHeAW0AAQFOAAAAAQGDAAsAAQFOBCYAAQJkAiwAAQEHAAAAAQEnAAsAAQEHA14AAQHeAW0AAQFOAAAAAQGDAAsAAQFOBCYAAQJkAiwAAQEHAAAAAQEnAAsAAQEHA14AAQHeAW0AAQFOAAAAAQGDAAsAAQFOBEUAAQJkAiwAAQEHAAAAAQEnAAsAAQEHA30AAQHeAW0AAQFO/10AAQGDAAsAAQFOA8AAAQJkAiwAAQEH/10AAQEnAAsAAQEHAvgAAQHeAW0AAQFPAAAAAQGDAAsAAQFUA6UAAQJkAiwAAQEyAAAAAQEnAAsAAQE4AuYAAQHeAW0AAQFPAAAAAQGDAAsAAQFPA6UAAQJkAiwAAQEyAAAAAQEnAAsAAQEyAuYAAQHeAW0AAQFPAAAAAQGDAAsAAQFPA8AAAQJkAiwAAQEyAAAAAQEnAAsAAQEyAwEAAQHeAW0AAQFPAAAAAQGDAAsAAQFPA3IAAQJkAiwAAQEyAAAAAQEnAAsAAQEyArMAAQHeAW0AAQFP/10AAQGDAAsAAQFPArwAAQJkAiwAAQEy/10AAQEnAAsAAQEyAf0AAQHeAW0AAQFg/10AAQGOAAUAAQFgArwAAQJ8Ak8AAQEZ/10AAQG/AAoAAQEZAfQAAQHoAYkAAQFgAAAAAQGOAAUAAQFgA8AAAQJ8Ak8AAQEZAAAAAQG/AAoAAQEZAvgAAQHoAYkAAQFeAAAAAQGOAAUAAQFmA6UAAQJ8Ak8AAQESAAAAAQG/AAoAAQEYAt0AAQHoAYkAAQFeAAAAAQGOAAUAAQFgA6UAAQJ8Ak8AAQESAAAAAQG/AAoAAQESAt0AAQHoAYkAAQFeAAAAAQGOAAUAAQFgA8AAAQJ8Ak8AAQESAAAAAQG/AAoAAQESAvgAAQHoAYkAAQFeAAAAAQGOAAUAAQFgA3IAAQJ8Ak8AAQESAAAAAQG/AAoAAQESAqoAAQHoAYkAAQFe/10AAQGOAAUAAQFgArwAAQJ8Ak8AAQES/10AAQG/AAoAAQESAfQAAQHoAYkAAQFaAAAAAQAAAAAAAQFaA6UAAQAAAAAAAQGqAAAAAQAAAAAAAQEfAt0AAQAAAAAAAQFa/10AAQAAAAAAAQFaArwAAQAAAAAAAQGq/10AAQAAAAAAAQEfAfQAAQAAAAAAAQFaAAAAAQAAAAAAAQFaA8AAAQAAAAAAAQGqAAAAAQAAAAAAAQEfAvgAAQAAAAAAAQFaAAAAAQAAAAAAAQFaA3IAAQAAAAAAAQGqAAAAAQAAAAAAAQEfAqoAAQAAAAAAAgAQACUAPgAAAEUATQAaAE8AXgAjAIIAmAAzAJoAnwBKAKEAsQBQALMAuABhALoAvwBnAMEA8wBtAPYA+QCgAPsBCwCkAQ4BIwC1ASUBQADLAUMBYwDnAeYCFgEIAhgCcQE5AAIABQF3AYoAAAG/Ab8AFAHCAcgAFQHRAdgAHALpAwQAJABAAAIBAgACAQgAAgEOAAIBFAACARoAAgEgAAIBJgACASwAAgEyAAIBOAACAT4AAgFEAAMBSgAAAVAAAAFWAAABXAAAAWIAAQFoAAABbgAAAXQAAgF6AAIBgAACAYYAAgGMAAIBkgAAAZgAAAGeAAABpAACAaoAAgGwAAIBtgACAbwAAgHCAAIByAACAc4AAgHUAAIB2gACAeAAAgHmAAIB7AACAfIAAgH4AAIB/gACAgQAAgIKAAICEAACAhYAAgIcAAICIgACAigAAgIuAAICNAACAjoAAgJAAAICRgAAAkwAAAJSAAACWAACAl4AAgJkAAICagACAnAAAgJ2AAICfAAB/6UB1gAB/zgB1gABAAAB1gAB/zEB/QABAAAB1gABAAAB1gABAAAB1gABAAAB1gAB/3IB1gABAAAB1gAB/uUB1gABAAAB1gAB/8MBTwAB/5oAAAABAAAAAAAB/4YAAAABAAEAAAABAB4ACgABAAAAAAABAAAAAAAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YAAAAB/8YAAAAB/8YAAAAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/0AB/QAB/wUB/QAB/8YDcQAB/wUB/QAB/8YDcQAB/wUB/QAB/8YDcQAB/wUB/QAB/8YDcQAB/8YDcQAB/wUB/QAB/wUB/QAB/zIB/QAB/zIB/QAB/zIB/QAB/zIB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8b/RgAB/8b/RgAB/8b/RgAB/wUB/QAB/wUB/QAB/wUB/QAB/wUB/QAB/wUB/QAB/wUB/QABA4QDbgACA7IADAA2ANoA4ADmAOwA8gD4AP4BBAEKARABFgEcASIBKAEuATQBOgFAAUYBTAFSAVgBXgFkAWoBcAF2AXwBggGIAY4BlAGaAaABpgGsAbIBuAG+AcQBygHQAdYB3AHiAegB7gH0AfoCAAIGAgwCEgIYAh4CJAIqAjACNgI8AkICSAJOAlQCWgJgAmYCbAJyAngCfgKEAooCkAKWApwCogKoAq4CtAK6AsACxgLMAtIC2ALeAuQC6gLwAvYC/AMCAwgDDgMUAxoDIAMmAywDMgM4Az4DRANKA1ADVgNcAAECGwAAAAECGwH9AAECKQAAAAECKQH9AAECPAAAAAECPAH9AAECMAAAAAECMAH9AAECMAAAAAECMAH9AAECXAAAAAECXAH9AAEBuQAAAAEBuQH9AAEB+QAAAAEB+QH9AAECMwAAAAECMwH9AAECOgAAAAECOgH9AAECPgAAAAECPgH9AAEDKwAAAAEDKwH9AAEDVf8vAAEDVQH9AAECNP8GAAECNAH9AAECNP8GAAECNAH9AAECA/7YAAECAwH9AAECjwAAAAECjwH9AAEDTgAAAAEDTgH9AAEDKwAAAAEDKwH9AAECMQAAAAECMQH9AAECMQAAAAECMQH9AAECGwAAAAECGwH9AAECTgAAAAECTgH9AAECCwAAAAECCwH9AAECQQAAAAECQQH9AAECZgAAAAECZgH9AAECZwAAAAEB3QH9AAECKwAAAAECKwH9AAECLQAAAAEBmAH9AAECeAAAAAECeAH9AAECegAAAAEB5gH9AAECMgAAAAECMgH9AAECPwAAAAECPwH9AAECFgAAAAECFgH9AAEBrQAAAAEB8wH9AAECHf8TAAECHQH9AAECDAAAAAECDAH9AAECNP8TAAECNAH9AAEB0QAAAAEB0QH9AAECMAAAAAECMAH9AAECaQAAAAECaQH9AAECDAAAAAECDAH9AAECRgAAAAECRgH9AAECegAAAAECdQKxAAECFwAAAAECFwH9AAECHAAAAAECHAH9AAEBUgAAAAEBUgK8AAEDVQAAAAEDVQH9AAECM/9MAAECMwH9AAECNP9MAAECNAH9AAECAwAAAAECAwH9AAECHP90AAECHAH9AAECNP90AAECNAH9AAECegAAAAECegH9AAIAAwGPAbwAAAHJAckALgLZAt8ALwACAAcBdwGCAAABhAGHAAwBiQGKABABvwG/ABIBwgHIABMB0QHYABoC6QMEACIAPgABAPoAAQEAAAEBBgABAQwAAQESAAEBGAABAR4AAQEkAAEBKgABATAAAQE2AAEBPAAAAUIAAAFIAAABTgAAAVQAAAFaAAABYAABAWYAAQFsAAEBcgABAXgAAQF+AAABhAAAAYoAAAGQAAEBlgABAZwAAQGiAAEBqAABAa4AAQG0AAEBugABAcAAAQHGAAEBzAABAdIAAQHYAAEB3gABAeQAAQHqAAEB8AABAfYAAQH8AAECAgABAggAAQIOAAECFAABAhoAAQIgAAECJgABAiwAAQIyAAACOAAAAj4AAAJEAAECSgABAlAAAQJWAAECXAABAmIAAQJoAAH/pQHWAAH/OAHWAAEAAAHWAAH/MQH9AAEAAAHWAAEAAAHWAAEAAAHWAAEAAAHWAAH/cgHWAAEAAAHWAAH+5QHWAAEAAAHWAAH/mgAAAAEAAAAAAAH/hgAAAAEAAQAAAAEAAAAAAAEAAAAAAAH/xgH9AAH/xgH9AAH/xgH9AAH/xgH9AAH/xgH9AAH/xgAAAAH/xgAAAAH/xgAAAAH/xgH9AAH/xgH9AAH/xgH9AAH/xgH9AAH/xgH9AAH/xgH9AAH/xgH9AAH/QAH9AAH/BQH9AAH/xgNxAAH/BQH9AAH/xgNxAAH/BQH9AAH/xgNxAAH/BQH9AAH/xgNxAAH/xgNxAAH/BQH9AAH/BQH9AAH/MgH9AAH/MgH9AAH/MgH9AAH/MgH9AAH/xgH9AAH/xgH9AAH/xgH9AAH/xgH9AAH/xv9GAAH/xv9GAAH/xv9GAAH/BQH9AAH/BQH9AAH/BQH9AAH/BQH9AAH/BQH9AAH/BQH9AAEAWABGAAEAdAAMAAcAEAAWABwAIgAoAC4ANAABAJ7/KgAB/5r/XQABAAD/YwAB/4X+1QABAAH/KgABAAD/SQABAAD/kgABAAcAegGEAYUBhgGHAYkBigABAAwBhAGFAYYBhwGJAYoBxgHHAcgC/AL9Av4ADAAAADIAAAA4AAAAPgAAAEQAAABKAAAAUAAAAFYAAABcAAAAYgAAAGgAAABuAAAAdAAB/5oAAAABAAAAAAAB/4YAAAABAAEAAAABAAAAAAABAAAAAAAB/8YAAAAB/8YAAAAB/8YAAAAB/8b/RgAB/8b/RgAB/8b/RgABALIAlgABANoADAARACQAKgAwADYAPABCAEgATgBUAFoAYABmAGwAcgB4AH4AhAABAMcCvwABAIwCvwABAPUC3wAB/6UCvwAB/z0CvwABAAAC2gAB/zECswABAAACbgABAAACwQABAAACkAABAAACeAAB/3IC2gABAAACxQAB/wkC3wABAAAC2gABAMoDYAABAMsDYAACAAQARABEAAAAdwB3AAEBdgGCAAIC0gLTAA8AAgAGAXcBggAAAb8BvwAMAcIBxQANAdEB2AARAukC+wAZAv8DBAAsADIAAADKAAAA0AAAANYAAADcAAAA4gAAAOgAAADuAAAA9AAAAPoAAAEAAAABBgAAAQwAAAESAAABGAAAAR4AAAEkAAABKgAAATAAAAE2AAABPAAAAUIAAAFIAAABTgAAAVQAAAFaAAABYAAAAWYAAAFsAAABcgAAAXgAAAF+AAABhAAAAYoAAAGQAAABlgAAAZwAAAGiAAABqAAAAa4AAAG0AAABugAAAcAAAAHGAAABzAAAAdIAAAHYAAAB3gAAAeQAAAHqAAAB8AAB/6UB1gAB/zgB1gABAAAB1gAB/zEB/QABAAAB1gABAAAB1gABAAAB1gABAAAB1gAB/3IB1gABAAAB1gAB/uUB1gABAAAB1gAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/0AB/QAB/wUB/QAB/8YDcQAB/wUB/QAB/8YDcQAB/wUB/QAB/8YDcQAB/wUB/QAB/8YDcQAB/8YDcQAB/wUB/QAB/wUB/QAB/zIB/QAB/zIB/QAB/zIB/QAB/zIB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/wUB/QAB/wUB/QAB/wUB/QAB/wUB/QAB/wUB/QAB/wUB/QABADoALgABAFYADAAEAAoAEAAWABwAAf/G/qEAAf/G/qAAAf/G/V4AAf/G/V4AAQAEAcYBxwL9Av4AAQAMAYQBhQGGAYcBiQGKAcYBxwHIAvwC/QL+AAwAAAAyAAAAOAAAAD4AAABEAAAASgAAAFAAAABWAAAAXAAAAGIAAABoAAAAbgAAAHQAAf+aAAAAAQAAAAAAAf+GAAAAAQABAAAAAQAAAAAAAQAAAAAAAf/GAAAAAf/GAAAAAf/GAAAAAf/G/0YAAf/G/0YAAf/G/0YAAQEgAP4AAQFIAAwAHgA+AEQASgBQAFYAXABiAGgAbgB0AHoAgACGAIwAkgCYAJ4ApACqALAAtgC8AMIAyADOANQA2gDgAOYA7AAB/6MDdQAB/8YDagAB/8YDhwAB/7cDhwAB/8YDhwAB/2kDfwAB/8YDVgAB/7ADbwAB/1sDcQAB/8YDfwAB/8YDfwAB/8YDagAB/0ADfwAB/sEDdQAB/8YEOgAB/vsDTAAB/8YEZwAB/qADWAAB/60EcAAB/nsDWAAB/8YEYwAB/8YEMwAB/vkDkQAB/qQDjwAB/zIDagAB/zIDhwAB/yMDhwAB/zIDhwAB/u8DTAAB/qYDagACAAUBvwG/AAABwgHFAAEB0QHYAAUC6QL3AA0C/wMAABwAAgAGAXcBggAAAb8BvwAMAcIBxQANAdEB2AARAukC+wAZAv8DBAAsADIAAADKAAAA0AAAANYAAADcAAAA4gAAAOgAAADuAAAA9AAAAPoAAAEAAAABBgAAAQwAAAESAAABGAAAAR4AAAEkAAABKgAAATAAAAE2AAABPAAAAUIAAAFIAAABTgAAAVQAAAFaAAABYAAAAWYAAAFsAAABcgAAAXgAAAF+AAABhAAAAYoAAAGQAAABlgAAAZwAAAGiAAABqAAAAa4AAAG0AAABugAAAcAAAAHGAAABzAAAAdIAAAHYAAAB3gAAAeQAAAHqAAAB8AAB/6UB1gAB/zgB1gABAAAB1gAB/zEB/QABAAAB1gABAAAB1gABAAAB1gABAAAB1gAB/3IB1gABAAAB1gAB/uUB1gABAAAB1gAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/0AB/QAB/wUB/QAB/8YDcQAB/wUB/QAB/8YDcQAB/wUB/QAB/8YDcQAB/wUB/QAB/8YDcQAB/8YDcQAB/wUB/QAB/wUB/QAB/zIB/QAB/zIB/QAB/zIB/QAB/zIB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/8YB/QAB/wUB/QAB/wUB/QAB/wUB/QAB/wUB/QAB/wUB/QAB/wUB/QAAAAEAAAAA4hpmhgAAAADXixNoAAAAANe4NBI=";
// ─────────────────────────────────────────────────────────────────────────────
// PDF Report Builder (pure jsPDF)
// ─────────────────────────────────────────────────────────────────────────────
function buildPDFReport({ selYear, yearRecs, monthlyData, yearTotal, maxRev, best, avg, lensBrk }) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");
  pdf.addFileToVFS("K2D-Regular.ttf", K2D_REGULAR);
  pdf.addFont("K2D-Regular.ttf", "K2D", "normal");
  pdf.setFont("K2D"); // สั่งให้เริ่มใช้ฟอนต์ K2D ทันที
  const W = 210, H = 297, M = 18, CW = W - M * 2;
  let y = 0;

const setFont = (size, bold, col) => {
    pdf.setFontSize(size);
    
    // --- แก้บรรทัดนี้ครับ ---
    // เปลี่ยนจาก "helvetica" เป็น "K2D" 
    // และเนื่องจากเรามีฟอนต์เดียว ให้ใช้ "normal" ไปก่อนครับ
    pdf.setFont("K2D", "normal"); 
    
    if (col) { Array.isArray(col) ? pdf.setTextColor(...col) : pdf.setTextColor(col); }
  };
  const txt = (text, x, yy, size, bold, col, align = "left") => {
    setFont(size, bold, col);
    pdf.text(String(text), x, yy, { align });
  };
  const rect = (x, yy, w, h, fill, stroke) => {
    if (fill)  { pdf.setFillColor(...fill);   pdf.rect(x, yy, w, h, "F"); }
    if (stroke){ pdf.setDrawColor(...stroke); pdf.setLineWidth(0.3); pdf.rect(x, yy, w, h, "S"); }
  };
  const line = (x1, yy, x2, col = [220,228,240], lw = 0.25) => {
    pdf.setDrawColor(...col); pdf.setLineWidth(lw); pdf.line(x1, yy, x2, yy);
  };

  const today = new Date();
  const thDate = `${today.getDate()} ${THAI_MONTHS[today.getMonth()]} ${today.getFullYear()+543}`;
  const docNo  = `RPT-${selYear}-${String(today.getMonth()+1).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}`;

  // ── PAGE HEADER ──────────────────────────────────────────────────
  rect(0, 0, W, 30, [30,58,138]);
  rect(0, 0, W, 3,  [37,99,235]);
  rect(0, 27, W, 3, [37,99,235]);
  txt("MASTER OPTIC",           W/2, 12, 20, true, [255,255,255], "center");
  txt("รายงานสรุปยอดขายประจำปี", W/2, 20, 11, false,[191,219,254], "center");
  txt(`ปีพุทธศักราช ${selYear}`,  W/2, 26,  9, false,[147,197,253], "center");
  y = 40;

  txt(`วันที่จัดทำ: ${thDate}`, M,     y, 9, false, [71,85,105]);
  txt(`เลขที่: ${docNo}`,       W-M,   y, 9, false, [71,85,105], "right");
  y += 3; line(M, y, W-M, [226,232,240], 0.5); y += 9;

  // ── SECTION 1: KPI ───────────────────────────────────────────────
  rect(M, y-4, CW, 8, [239,246,255]);
  rect(M, y-4, 3,  8, [37,99,235]);
  txt("1.  ภาพรวมสรุปยอดขายประจำปี", M+6, y+1, 11, true, [15,32,87]);
  y += 13;

  const kpis = [
    { label:"ยอดขายรวม (บาท)",  val:"฿"+yearTotal.toLocaleString("th-TH"), sub:`ปี พ.ศ. ${selYear}`, c:[37,99,235]  },
    { label:"ลูกค้าทั้งหมด",    val:`${yearRecs.length} ราย`,              sub:"จำนวนใบสั่งซื้อ",   c:[5,150,105]  },
    { label:"เดือนยอดสูงสุด",   val:best.revenue>0?best.label:"–",        sub:best.revenue>0?"฿"+best.revenue.toLocaleString("th-TH"):"ไม่มีข้อมูล", c:[124,58,237] },
    { label:"ยอดเฉลี่ย/ราย",   val:avg>0?"฿"+avg.toLocaleString("th-TH"):"–", sub:"บาทต่อลูกค้า", c:[217,119,6]  },
  ];
  const bw = (CW - 9) / 4;
  kpis.forEach((k, i) => {
    const bx = M + i*(bw+3);
    rect(bx, y, bw, 22, [248,250,255], [226,232,240]);
    rect(bx, y, bw, 3, k.c);
    txt(k.label, bx+bw/2, y+9,    7,  false, [100,116,139], "center");
    txt(k.val,   bx+bw/2, y+15.5, 10, true,  k.c,           "center");
    txt(k.sub,   bx+bw/2, y+21,   6,  false, [148,163,184], "center");
  });
  y += 30;

  // ── SECTION 2: MONTHLY TABLE ─────────────────────────────────────
  rect(M, y-4, CW, 8, [239,246,255]);
  rect(M, y-4, 3,  8, [37,99,235]);
  txt("2.  ตารางรายละเอียดยอดขายรายเดือน", M+6, y+1, 11, true, [15,32,87]);
  y += 13;

  // Header
  rect(M, y-4, CW, 8, [30,58,138]);
  const cols = [
    { lbl:"เดือน",       x:M+3     },
    { lbl:"ยอดขาย (฿)", x:M+29    },
    { lbl:"ราย",         x:M+76    },
    { lbl:"% ของปี",    x:M+97    },
    { lbl:"กราฟ",        x:M+122   },
  ];
  cols.forEach(c => txt(c.lbl, c.x, y, 7.5, true, [255,255,255]));
  y += 6;

  monthlyData.forEach((d, i) => {
    if (y > 265) { pdf.addPage(); y = 20; }
    const isBest = d.revenue === maxRev && d.revenue > 0;
    if (i%2===0) rect(M, y-3.5, CW, 6.5, [248,250,255]);
    if (isBest)  rect(M, y-3.5, CW, 6.5, [239,246,255]);
    const pct = yearTotal>0 ? ((d.revenue/yearTotal)*100).toFixed(1) : "0.0";
    txt(d.label,                                                      cols[0].x,    y, 8, isBest, isBest?[30,58,138]:[30,41,59]);
    txt(d.revenue>0?"฿"+d.revenue.toLocaleString("th-TH"):"–",       cols[1].x+44, y, 8, isBest, isBest?[37,99,235]:[30,41,59],    "right");
    txt(d.count>0?String(d.count):"–",                               cols[2].x+8,  y, 8, false,  d.count>0?[5,150,105]:[148,163,184], "center");
    txt(d.revenue>0?pct+"%":"–",                                     cols[3].x+10, y, 8, false,  [100,116,139],                       "center");
    if (d.revenue>0) {
      const blen = (d.revenue/maxRev)*42;
      rect(cols[4].x, y-2.5, 42, 3, [226,232,240]);
      rect(cols[4].x, y-2.5, blen, 3, isBest?[37,99,235]:[147,197,253]);
    }
    if (isBest) txt("★", cols[4].x+46, y, 8, true, [245,158,11]);
    line(M, y+3, W-M, [241,245,249], 0.2);
    y += 7;
  });

  // Total row
  rect(M, y-1, CW, 8, [30,58,138]);
  txt("รวมทั้งสิ้น",                       cols[0].x,    y+4.5, 9, true, [255,255,255]);
  txt("฿"+yearTotal.toLocaleString("th-TH"), cols[1].x+44, y+4.5, 9, true, [255,255,255], "right");
  txt(yearRecs.length+" ราย",               cols[2].x+8,  y+4.5, 9, true, [255,255,255], "center");
  txt("100%",                               cols[3].x+10, y+4.5, 9, true, [255,255,255], "center");
  y += 16;

  // ── SECTION 3: BAR CHART ─────────────────────────────────────────
  if (y > 218) { pdf.addPage(); y = 20; }
  rect(M, y-4, CW, 8, [239,246,255]);
  rect(M, y-4, 3,  8, [37,99,235]);
  txt("3.  แผนภูมิแท่งยอดขายรายเดือน", M+6, y+1, 11, true, [15,32,87]);
  y += 13;

  const CH=44, CX=M+14, CW2=CW-16;
  const slot=CW2/12, bwd=slot*0.62;
  pdf.setDrawColor(200,210,230); pdf.setLineWidth(0.3);
  pdf.line(CX, y, CX, y+CH);
  pdf.line(CX, y+CH, CX+CW2, y+CH);

  [0,0.25,0.5,0.75,1].forEach(f => {
    const gy = y+CH - f*CH;
    if (f>0) { pdf.setDrawColor(241,245,249); pdf.setLineWidth(0.15); pdf.line(CX, gy, CX+CW2, gy); }
    const lv = Math.round(maxRev*f);
    txt(lv>=1000?`${(lv/1000).toFixed(0)}k`:String(lv), CX-2, gy+1.5, 5.5, false, [148,163,184], "right");
  });

  monthlyData.forEach((d, i) => {
    const bx = CX + i*slot + (slot-bwd)/2;
    const bh = maxRev>0 ? (d.revenue/maxRev)*CH : 0;
    const by = y+CH-bh;
    const isBest = d.revenue===maxRev && d.revenue>0;
    if (bh>0) {
      rect(bx, by, bwd, bh, isBest?[37,99,235]:[191,219,254]);
      rect(bx, by, bwd*0.45, bh, isBest?[59,130,246]:[219,234,254]);
      if (d.revenue>0) {
        const sv = d.revenue>=1000?`${Math.round(d.revenue/1000)}k`:String(d.revenue);
        txt(sv, bx+bwd/2, by-1.5, 5, isBest, isBest?[30,58,138]:[100,116,139], "center");
      }
    }
    txt(d.label, bx+bwd/2, y+CH+4.5, 5.5, false, [100,116,139], "center");
  });
  y += CH + 14;

  // ── SECTION 4: LENS BREAKDOWN ────────────────────────────────────
  if (lensBrk.length > 0) {
    if (y > 228) { pdf.addPage(); y = 20; }
    rect(M, y-4, CW, 8, [239,246,255]);
    rect(M, y-4, 3,  8, [37,99,235]);
    txt("4.  สรุปยอดขายแยกตามชนิดเลนส์", M+6, y+1, 11, true, [15,32,87]);
    y += 13;

    rect(M, y-4, CW, 8, [30,58,138]);
    txt("ชนิดเลนส์",  M+8,   y, 7.5, true, [255,255,255]);
    txt("จำนวน",      M+108, y, 7.5, true, [255,255,255], "center");
    txt("สัดส่วน",    M+136, y, 7.5, true, [255,255,255], "center");
    txt("กราฟ",       W-M-10,y, 7.5, true, [255,255,255], "center");
    y += 6;

    const totalLens = lensBrk.reduce((a,[,c]) => a+c, 0);
    const lc = [[37,99,235],[5,150,105],[245,158,11],[124,58,237],[239,68,68],[6,182,212]];
    lensBrk.forEach(([name,count], i) => {
      if (y > 270) { pdf.addPage(); y = 20; }
      if (i%2===0) rect(M, y-3.5, CW, 6.5, [248,250,255]);
      const c = lc[i%lc.length];
      rect(M+3, y-1.5, 3, 3, c);
      txt(name,          M+8,   y, 8, false, [30,41,59]);
      txt(count+" ราย",  M+108, y, 8, true,  c,           "center");
      txt(((count/totalLens)*100).toFixed(1)+"%", M+136, y, 8, false, [100,116,139], "center");
      const bl = (count/lensBrk[0][1])*38;
      rect(W-M-40, y-2.5, 38, 3.5, [226,232,240]);
      rect(W-M-40, y-2.5, bl, 3.5, c);
      line(M, y+3, W-M, [241,245,249], 0.2);
      y += 7;
    });
    y += 6;
  }

  // ── FOOTER ───────────────────────────────────────────────────────
  rect(0, H-14, W, 14, [30,58,138]);
  rect(0, H-14, W, 2,  [37,99,235]);
  txt("MASTER OPTIC  |  ระบบจัดการข้อมูลลูกค้า  |  เอกสารสร้างโดยอัตโนมัติ", W/2, H-7, 7.5, false, [147,197,253], "center");
  txt(`พิมพ์วันที่ ${thDate}   เลขที่ ${docNo}`, W/2, H-2.5, 6, false, [100,130,190], "center");

  return pdf;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Tab
// ─────────────────────────────────────────────────────────────────────────────
function DashboardTab({ records }) {
  const jsPDFReady = useJsPDF();

  const availYears = useMemo(() => {
    const ys = [...new Set(records.map(r => r.year))].sort((a,b) => +b-+a);
    return ys.length ? ys : [String(new Date().getFullYear()+543)];
  }, [records]);

  const [selYear, setSelYear] = useState(availYears[0]);
  const [exporting, setExporting] = useState(false);

  const yearRecs    = useMemo(() => records.filter(r => r.year===selYear), [records, selYear]);
  const monthlyData = useMemo(() => THAI_SHORT.map((label,i) => {
    const recs = yearRecs.filter(r => +r.month===i+1);
    return { label, month:i+1, revenue:recs.reduce((a,r)=>a+(+r.price||0),0), count:recs.length };
  }), [yearRecs]);

  const yearTotal = yearRecs.reduce((a,r) => a+(+r.price||0), 0);
  const maxRev    = Math.max(...monthlyData.map(d=>d.revenue), 1);
  const best      = [...monthlyData].reduce((a,b) => b.revenue>a.revenue?b:a, monthlyData[0]);
  const avg       = yearRecs.length ? Math.round(yearTotal/yearRecs.length) : 0;

  const lensBrk = useMemo(() => {
    const m = {};
    yearRecs.forEach(r => { if (r.lensType) m[r.lensType]=(m[r.lensType]||0)+1; });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  }, [yearRecs]);

  const barColors = monthlyData.map(d => d.revenue===maxRev && d.revenue>0 ? "#2563eb" : "#93c5fd");

  const handleExportPDF = useCallback(() => {
    if (!jsPDFReady || exporting) return;
    setExporting(true);
    try {
      const pdf = buildPDFReport({ selYear, yearRecs, monthlyData, yearTotal, maxRev, best, avg, lensBrk });
      pdf.save(`SalesReport-MasterOptic-${selYear}.pdf`);
    } catch(e) {
      console.error("PDF error:", e);
      alert("เกิดข้อผิดพลาด: " + e.message);
    }
    setExporting(false);
  }, [jsPDFReady, exporting, selYear, yearRecs, monthlyData, yearTotal, maxRev, best, avg, lensBrk]);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"var(--navy)", fontFamily:"'K2D',sans-serif" }}>📊 สรุปยอดรายเดือน</div>
          <div style={{ fontSize:12, color:"var(--text3)", marginTop:2 }}>ภาพรวมรายได้และจำนวนลูกค้าประจำปี</div>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <button onClick={handleExportPDF} disabled={!jsPDFReady||exporting} className="btn btn-green">
            {!jsPDFReady ? "⏳ กำลังโหลด..." : exporting ? "⏳ กำลังสร้าง..." : "📄 ออกรายงาน PDF"}
          </button>
          <div className="sel-wrap" style={{ width:160 }}>
            <select value={selYear} onChange={e => setSelYear(e.target.value)} className="sel" style={{ fontSize:13 }}>
              {availYears.map(y => <option key={y} value={y}>ปี พ.ศ. {y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="g4" style={{ marginBottom:18 }}>
        {[
          { cls:"kpi-blue",   icon:"💰", label:"ยอดรวมทั้งปี",    val:"฿"+yearTotal.toLocaleString("th-TH"), sub:`ปี พ.ศ. ${selYear}` },
          { cls:"kpi-green",  icon:"👥", label:"ลูกค้าทั้งปี",   val:`${yearRecs.length} ราย`,              sub:"ใบสั่งซื้อทั้งหมด" },
          { cls:"kpi-purple", icon:"🏆", label:"เดือนยอดสูงสุด", val:best.revenue>0?best.label:"–",         sub:best.revenue>0?"฿"+best.revenue.toLocaleString("th-TH"):"ยังไม่มีข้อมูล" },
          { cls:"kpi-amber",  icon:"🏷️", label:"เฉลี่ยต่อราย",  val:avg>0?"฿"+avg.toLocaleString("th-TH"):"–", sub:"บาทต่อลูกค้า" },
        ].map(({ cls,icon,label,val,sub }) => (
          <div key={label} className={`kpi ${cls}`}>
            <div className="kpi-icon">{icon}</div>
            <div className="kpi-lbl">{label}</div>
            <div className="kpi-val">{val}</div>
            <div className="kpi-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="cc">
        <div className="cc-title">ยอดขายรายเดือน</div>
        <div className="cc-sub">ปี พ.ศ. {selYear} — แถบสีเข้มคือเดือนที่มียอดสูงสุด</div>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={monthlyData} margin={{ top:8,right:8,left:0,bottom:0 }} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(37,99,235,0.06)" vertical={false}/>
            <XAxis dataKey="label" tick={{ fontSize:11,fill:"#94a3b8",fontFamily:"Sarabun,sans-serif" }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:11,fill:"#94a3b8",fontFamily:"Sarabun,sans-serif" }} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${v/1000}k`:v} width={36}/>
            <Tooltip content={<ChartTip/>}/>
            <Bar dataKey="revenue" radius={[6,6,0,0]}>
              {monthlyData.map((_,i) => <Cell key={i} fill={barColors[i]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table + sidebar */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 264px", gap:16, alignItems:"start" }}>
        <div className="card" style={{ overflow:"hidden" }}>
          <div className="card-head"><span className="card-title">📋 รายละเอียดรายเดือน</span></div>
          <div className="mrow" style={{ background:"var(--surface2)", cursor:"default", borderBottom:"2px solid var(--border)" }}>
            {["เดือน","สัดส่วน","ราย","ยอดขาย"].map((h,i) => (
              <div key={h} style={{ fontSize:10, fontWeight:700, color:"var(--text2)", letterSpacing:"0.07em", textTransform:"uppercase", textAlign:i>=2?"right":"left", paddingLeft:i===1?12:0 }}>{h}</div>
            ))}
          </div>
          {monthlyData.map(d => (
            <div key={d.month} className="mrow">
              <div style={{ fontSize:13, fontWeight:700, color:d.revenue>0?"var(--navy)":"var(--text3)" }}>{d.label}</div>
              <div style={{ padding:"0 12px" }}><div className="bar-track"><div className="bar-fill" style={{ width:`${maxRev>0?d.revenue/maxRev*100:0}%` }}/></div></div>
              <div style={{ textAlign:"right", fontSize:12, fontWeight:700, color:d.count>0?"var(--green)":"var(--text3)" }}>{d.count||"–"}</div>
              <div style={{ textAlign:"right", fontSize:13, fontWeight:800, color:d.revenue>0?"var(--navy)":"var(--text3)" }}>{d.revenue>0?"฿"+d.revenue.toLocaleString("th-TH"):"–"}</div>
            </div>
          ))}
          <div className="mrow" style={{ background:"linear-gradient(135deg,var(--blue-lt),var(--surface2))", borderTop:"2px solid var(--border)" }}>
            <div style={{ fontSize:13, fontWeight:800, color:"var(--navy)" }}>รวม</div>
            <div/>
            <div style={{ textAlign:"right", fontSize:13, fontWeight:800, color:"var(--blue)" }}>{yearRecs.length}</div>
            <div style={{ textAlign:"right", fontSize:14, fontWeight:800, color:"var(--blue)" }}>{"฿"+yearTotal.toLocaleString("th-TH")}</div>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div className="card">
            <div className="card-head"><span className="card-title">🔬 เลนส์ที่ขายได้</span></div>
            <div style={{ padding:"16px 18px" }}>
              {lensBrk.length===0 && <div style={{ fontSize:12, color:"var(--text3)", textAlign:"center", padding:"12px 0" }}>ยังไม่มีข้อมูล</div>}
              {lensBrk.map(([name,count],i) => (
                <div key={name} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontSize:12, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"70%" }}>{name}</span>
                    <span style={{ fontSize:12, fontWeight:800, color:LENS_COLORS[i%LENS_COLORS.length], flexShrink:0, marginLeft:6 }}>{count} ราย</span>
                  </div>
                  <div style={{ height:7, background:"var(--border)", borderRadius:99, overflow:"hidden" }}>
                    <div style={{ height:"100%", background:LENS_COLORS[i%LENS_COLORS.length], width:`${(count/lensBrk[0][1])*100}%`, transition:"width .6s ease", borderRadius:99 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><span className="card-title">🏆 ลูกค้ายอดสูงสุด</span></div>
            <div style={{ padding:"16px 18px" }}>
              {yearRecs.length===0 && <div style={{ fontSize:12, color:"var(--text3)", textAlign:"center", padding:"12px 0" }}>ยังไม่มีข้อมูล</div>}
              {[...yearRecs].sort((a,b)=>(+b.price||0)-(+a.price||0)).slice(0,4).map((r,i) => (
                <div key={r.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <div style={{ width:26, height:26, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#fff", background:["linear-gradient(135deg,#f59e0b,#fbbf24)","linear-gradient(135deg,#94a3b8,#cbd5e1)","linear-gradient(135deg,#b45309,#d97706)","linear-gradient(135deg,#3b82f6,#60a5fa)"][i] }}>{i+1}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"var(--navy)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.name}</div>
                    <div style={{ fontSize:11, color:"var(--text3)" }}>{fmtDate(r)}</div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:800, color:"var(--blue)", flexShrink:0 }}>฿{(+r.price||0).toLocaleString("th-TH")}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Form Tab
// ─────────────────────────────────────────────────────────────────────────────
function FormTab({ onSave, editData, onCancelEdit }) {
  const [form, setForm] = useState(editData || EMPTY);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(editData || EMPTY); }, [editData]);

  const ch = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
    if (!editData) setForm(EMPTY);
  };

  const days  = Array.from({ length:31 }, (_,i) => String(i+1));
  const years = Array.from({ length:10 }, (_,i) => String(2568+i));

  return (
    <div className="card slide-up">
      <div className="card-head">
        <span className="card-title">{editData ? "✏️ แก้ไขข้อมูลลูกค้า" : "➕ บันทึกประวัติการวัดสายตา"}</span>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {saved && <span className="toast">✓ บันทึกสำเร็จ</span>}
          {editData && <button className="btn btn-ghost" onClick={onCancelEdit}>ยกเลิก</button>}
        </div>
      </div>
      <div className="card-body">
        <div className="g3" style={{ marginBottom:18 }}>
          <div>
            <label className="lbl">วันที่</label>
            <div className="date-g">
              <div className="sel-wrap"><select name="day" value={form.day} onChange={ch} className="sel">{days.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
              <div className="sel-wrap"><select name="month" value={form.month} onChange={ch} className="sel">{THAI_MONTHS.map((m,i)=><option key={i+1} value={String(i+1)}>{m}</option>)}</select></div>
              <div className="sel-wrap"><select name="year" value={form.year} onChange={ch} className="sel">{years.map(y=><option key={y} value={y}>{y}</option>)}</select></div>
            </div>
          </div>
          <div>
            <label className="lbl">ชื่อ-นามสกุล *</label>
            <input name="name" value={form.name} onChange={ch} placeholder="กรอกชื่อลูกค้า" className="inp"/>
          </div>
          <div>
            <label className="lbl">เบอร์โทร / Line ID</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <input name="phone"  value={form.phone}  onChange={ch} placeholder="08X-XXX-XXXX" className="inp"/>
              <input name="lineId" value={form.lineId} onChange={ch} placeholder="Line ID" className="inp"/>
            </div>
          </div>
        </div>

        <div className="presc-box" style={{ marginBottom:18 }}>
          <div style={{ fontSize:11, fontWeight:800, color:"var(--blue2)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:14 }}>🔍 ค่าสายตา (Prescription)</div>
          <div className="presc-g" style={{ marginBottom:6 }}>
            <div/>
            {["Sphere (SPH)","Cylinder (CYL)","Axis"].map(h => (
              <div key={h} style={{ fontSize:10, fontWeight:700, color:"var(--text2)", textAlign:"center" }}>{h}</div>
            ))}
          </div>
          {[
            { side:"R", cls:"badge-r", fields:["rightSphere","rightCylinder","rightAxis"] },
            { side:"L", cls:"badge-l", fields:["leftSphere","leftCylinder","leftAxis"] },
          ].map(row => (
            <div key={row.side} className="presc-g" style={{ marginBottom:8 }}>
              <div className={`badge ${row.cls}`}>{row.side}</div>
              {row.fields.map(n => (
                <input key={n} name={n} value={form[n]} onChange={ch} placeholder="–" className="inp" style={{ textAlign:"center", padding:"8px 6px" }}/>
              ))}
            </div>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 130px", gap:14, marginBottom:22 }}>
          <div>
            <label className="lbl">ชนิดเลนส์</label>
            <input name="lensType" value={form.lensType} onChange={ch} placeholder="เช่น Seiko 1.67 Blue UV" className="inp"/>
          </div>
          <div>
            <label className="lbl">รหัสกรอบแว่น</label>
            <input name="frame" value={form.frame} onChange={ch} placeholder="เช่น TI-2024-001" className="inp"/>
          </div>
          <div>
            <label className="lbl">ราคา (บาท)</label>
            <input name="price" type="number" value={form.price} onChange={ch} placeholder="0" className="inp"/>
          </div>
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {editData ? "💾 อัปเดตข้อมูล" : "💾 บันทึกข้อมูล"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Log Tab
// ─────────────────────────────────────────────────────────────────────────────
function LogTab({ records, onEdit, onDelete, onViewBill }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? records.filter(r => r.name.toLowerCase().includes(q)||r.phone.includes(q)) : records;
  }, [records, search]);

  return (
    <div>
      <div className="search-bar">
        <span style={{ color:"var(--blue)", fontSize:16 }}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาจากชื่อลูกค้า หรือเบอร์โทร..."/>
        {search && <button onClick={()=>setSearch("")} style={{ background:"none", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:16, padding:0 }}>✕</button>}
        <span style={{ fontSize:12, color:"var(--text3)", whiteSpace:"nowrap", flexShrink:0 }}>{filtered.length} รายการ</span>
      </div>

      <div className="card hide-sm" style={{ overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>วันที่</th><th>ชื่อลูกค้า</th><th>ติดต่อ</th>
                <th>ค่าสายตา R</th><th>ค่าสายตา L</th>
                <th>เลนส์</th><th>รหัสกรอบ</th><th>ราคา</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 && (
                <tr><td colSpan={9} style={{ textAlign:"center", padding:40, color:"var(--text3)" }}>ไม่พบข้อมูลที่ค้นหา</td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ whiteSpace:"nowrap", fontSize:12, color:"var(--text2)" }}>{fmtDate(r)}</td>
                  <td style={{ fontWeight:700, color:"var(--navy)", whiteSpace:"nowrap" }}>{r.name}</td>
                  <td style={{ fontSize:12 }}><div>{r.phone}</div>{r.lineId&&<div style={{ color:"#0891b2",fontSize:11 }}>{r.lineId}</div>}</td>
                  <td style={{ fontSize:12, color:"var(--blue2)", fontFamily:"monospace", whiteSpace:"nowrap" }}>{r.rightSphere||"–"}/{r.rightCylinder||"–"}/{r.rightAxis||"–"}</td>
                  <td style={{ fontSize:12, color:"var(--green)", fontFamily:"monospace", whiteSpace:"nowrap" }}>{r.leftSphere||"–"}/{r.leftCylinder||"–"}/{r.leftAxis||"–"}</td>
                  <td style={{ fontSize:12, color:"var(--text2)", maxWidth:150, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.lensType||"–"}</td>
                  <td style={{ fontSize:12, fontFamily:"monospace", color:"var(--text2)" }}>{r.frame||"–"}</td>
                  <td style={{ fontWeight:800, color:"var(--blue)", whiteSpace:"nowrap" }}>{fmtPrice(r.price)}</td>
                  <td>
                    <div style={{ display:"flex", gap:5 }}>
                      <button className="btn btn-bill btn-icon" onClick={()=>onViewBill(r)}>📋 บิล</button>
                      <button className="btn btn-edit btn-icon" onClick={()=>onEdit(r)}>✏️</button>
                      <button className="btn btn-del  btn-icon" onClick={()=>onDelete(r.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:"10px 16px", borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between", fontSize:12, color:"var(--text3)" }}>
          <span>ฐานข้อมูลลูกค้า Master Optic</span>
          <span>ยอดรวม: <strong style={{ color:"var(--blue)" }}>฿{records.reduce((a,r)=>a+(+r.price||0),0).toLocaleString("th-TH")}</strong></span>
        </div>
      </div>

      {/* Mobile */}
      <div className="show-sm">
        {filtered.length===0 && <div style={{ textAlign:"center", padding:40, color:"var(--text3)" }}>ไม่พบข้อมูลที่ค้นหา</div>}
        {filtered.map(r => (
          <div key={r.id} className="mob-card">
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <div style={{ fontWeight:800, fontSize:16, color:"var(--navy)" }}>{r.name}</div>
              <div style={{ fontWeight:800, color:"var(--blue)" }}>{fmtPrice(r.price)}</div>
            </div>
            <div style={{ fontSize:12, color:"var(--text2)", marginBottom:4 }}>{fmtDate(r)} • {r.phone}</div>
            <div style={{ fontSize:11, color:"var(--text3)", marginBottom:4 }}>{r.lensType||"–"}</div>
            <div style={{ fontSize:11, color:"var(--text3)", marginBottom:12 }}>
              R: {r.rightSphere||"–"}/{r.rightCylinder||"–"}/{r.rightAxis||"–"} | L: {r.leftSphere||"–"}/{r.leftCylinder||"–"}/{r.leftAxis||"–"}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn btn-bill btn-icon" style={{ flex:1 }} onClick={()=>onViewBill(r)}>📋 บิล</button>
              <button className="btn btn-edit btn-icon" style={{ flex:1 }} onClick={()=>onEdit(r)}>✏️ แก้ไข</button>
              <button className="btn btn-del  btn-icon" style={{ flex:1 }} onClick={()=>onDelete(r.id)}>🗑 ลบ</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// App Root
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [records, setRecords] = useState(INIT);
  const [tab,     setTab]     = useState("form");
  const [billRec, setBillRec] = useState(null);
  const [editRec, setEditRec] = useState(null);
  const nid = useRef(200);

  const total = records.reduce((a,r) => a+(+r.price||0), 0);

  const syncSheet = async (data) => {
    const URL = "https://script.google.com/macros/s/AKfycbyDqh1VE1be7-iVyvQ7r_cxsrrULyV4FHOFUZEiQKMyXdpFai3i6kvyvgn6ZgG0Ya0z/exec";
    try {
      await fetch(URL, {
        method:"POST", mode:"no-cors", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          date:`${data.day}/${data.month}/${data.year}`, name:data.name,
          contact:data.phone+(data.lineId?` (Line: ${data.lineId})`:""),
          eyeR:`SPH:${data.rightSphere} CYL:${data.rightCylinder} AX:${data.rightAxis}`,
          eyeL:`SPH:${data.leftSphere} CYL:${data.leftCylinder} AX:${data.leftAxis}`,
          lens:data.lensType, frame:data.frame, price:data.price,
        }),
      });
    } catch(e) { console.error("Sheets sync:", e); }
  };

  const handleSave = (form) => {
    if (editRec) {
      setRecords(rs => rs.map(r => r.id===editRec.id ? { ...form, id:r.id } : r));
      setEditRec(null);
    } else {
      const rec = { ...form, id:++nid.current };
      setRecords(rs => [rec, ...rs]);
      syncSheet(rec);
    }
    setTab("log");
  };

  const handleEdit   = (r) => { setEditRec(r); setTab("form"); window.scrollTo({ top:0, behavior:"smooth" }); };
  const handleDelete = (id) => { if (confirm("ต้องการลบข้อมูลนี้?")) setRecords(rs => rs.filter(r => r.id!==id)); };

  return (
    <div className="app">
      <style>{CSS}</style>

      <header className="hdr">
        <div className="hdr-inner">
          <div className="hdr-brand">
            <div className="hdr-icon">👓</div>
            <div>
              <div className="hdr-title shimmer-text">MASTER OPTIC</div>
              <div className="hdr-sub">MANAGEMENT SYSTEM</div>
            </div>
          </div>
          <div className="hdr-stats">
            <div className="hdr-stat">
              <div className="hdr-stat-lbl">ลูกค้าทั้งหมด</div>
              <div className="hdr-stat-val">{records.length}</div>
            </div>
            <div className="hdr-stat">
              <div className="hdr-stat-lbl">ยอดรวม</div>
              <div className="hdr-stat-val" style={{ color:"#4ade80", fontSize:16 }}>฿{total.toLocaleString("th-TH")}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="wrap">
        <div className="tabs">
          {[
            ["form",      "📝 บันทึกข้อมูล"],
            ["log",       `📋 ฐานข้อมูล (${records.length})`],
            ["dashboard", "📊 สรุปยอด"],
          ].map(([k,l]) => (
            <button key={k} className={`tab${tab===k?" on":""}`} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>

        {tab==="form"      && <FormTab onSave={handleSave} editData={editRec} onCancelEdit={()=>setEditRec(null)}/>}
        {tab==="log"       && <LogTab records={records} onEdit={handleEdit} onDelete={handleDelete} onViewBill={setBillRec}/>}
        {tab==="dashboard" && <DashboardTab records={records}/>}
      </main>

      {billRec && <BillModal r={billRec} onClose={()=>setBillRec(null)}/>}
    </div>
  );
}