import { useState, useMemo, useRef, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

// ── html2canvas loader ───────────────────────────────────────────────────────
function useHtml2Canvas() {
  const [ready, setReady] = useState(!!window.html2canvas);
  useEffect(() => {
    if (window.html2canvas) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);
  return ready;
}

// ── Data ─────────────────────────────────────────────────────────────────────
const initialData = [
  { id:1, day:"10", month:"2", year:"2568", name:"สมศักดิ์ ใจดี",   phone:"081-234-5678", lineId:"somsak.j",   leftSphere:"-2.00", leftCylinder:"-0.75", leftAxis:"180", rightSphere:"-1.75", rightCylinder:"-0.50", rightAxis:"175", lensType:"Seiko 1.67 Blue UV", frame:"TI-2024-001", price:"12500" },
  { id:2, day:"14", month:"2", year:"2568", name:"วิไล รักสวย",     phone:"089-876-5432", lineId:"wilai_r",    leftSphere:"-3.50", leftCylinder:"0.00",  leftAxis:"0",   rightSphere:"-3.25", rightCylinder:"-0.25", rightAxis:"90",  lensType:"Nikon 1.60 HCC",   frame:"AC-2024-088", price:"7800"  },
  { id:3, day:"5",  month:"3", year:"2568", name:"ประสิทธิ์ มีสุข", phone:"085-111-2233", lineId:"prasit_m",   leftSphere:"-1.00", leftCylinder:"-0.50", leftAxis:"90",  rightSphere:"-1.25", rightCylinder:"0.00",  rightAxis:"0",   lensType:"Essilor 1.74",     frame:"TI-2024-055", price:"9500"  },
  { id:4, day:"22", month:"3", year:"2568", name:"นภา สดใส",        phone:"091-444-5566", lineId:"napa_s",     leftSphere:"-4.00", leftCylinder:"-1.00", leftAxis:"180", rightSphere:"-3.75", rightCylinder:"-0.75", rightAxis:"175", lensType:"Seiko 1.67 Blue UV",frame:"AC-2024-102", price:"15000" },
  { id:5, day:"8",  month:"4", year:"2568", name:"สุรชัย ดีงาม",    phone:"086-777-8899", lineId:"surachai_d", leftSphere:"-2.50", leftCylinder:"-0.25", leftAxis:"90",  rightSphere:"-2.25", rightCylinder:"-0.50", rightAxis:"85",  lensType:"Hoya 1.60 UV400",  frame:"TI-2024-077", price:"11000" },
  { id:6, day:"25", month:"4", year:"2568", name:"มาลี ใจงาม",      phone:"083-222-3344", lineId:"malee_j",    leftSphere:"-1.75", leftCylinder:"0.00",  leftAxis:"0",   rightSphere:"-2.00", rightCylinder:"-0.25", rightAxis:"90",  lensType:"Nikon 1.60 HCC",   frame:"AC-2024-120", price:"8900"  },
  { id:7, day:"12", month:"5", year:"2568", name:"อนุชา พรมมา",     phone:"087-555-6677", lineId:"anucha_p",   leftSphere:"-3.00", leftCylinder:"-0.75", leftAxis:"180", rightSphere:"-3.25", rightCylinder:"-1.00", rightAxis:"170", lensType:"Essilor 1.74",     frame:"TI-2024-090", price:"18500" },
  { id:8, day:"28", month:"5", year:"2568", name:"ลัดดา สุขใจ",     phone:"092-888-9900", lineId:"ladda_s",    leftSphere:"-0.75", leftCylinder:"-0.25", leftAxis:"90",  rightSphere:"-1.00", rightCylinder:"0.00",  rightAxis:"0",   lensType:"Hoya 1.60 UV400",  frame:"AC-2024-135", price:"7200"  },
  { id:9, day:"10", month:"6", year:"2568", name:"วีระ กล้าหาญ",    phone:"084-333-4455", lineId:"weera_k",    leftSphere:"-2.25", leftCylinder:"-0.50", leftAxis:"180", rightSphere:"-2.00", rightCylinder:"-0.75", rightAxis:"175", lensType:"Seiko 1.67 Blue UV",frame:"TI-2024-111", price:"13500" },
  { id:10,day:"29", month:"6", year:"2568", name:"สมหญิง ดวงดี",    phone:"090-666-7788", lineId:"somying_d",  leftSphere:"-5.00", leftCylinder:"-1.25", leftAxis:"90",  rightSphere:"-4.75", rightCylinder:"-1.00", rightAxis:"85",  lensType:"Essilor 1.74",     frame:"AC-2024-150", price:"22000" },
];

const THAI_MONTHS       = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const THAI_MONTHS_SHORT = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

const now   = new Date();
const EMPTY = {
  day:String(now.getDate()), month:String(now.getMonth()+1), year:String(now.getFullYear()+543),
  name:"", phone:"", lineId:"",
  leftSphere:"", leftCylinder:"", leftAxis:"",
  rightSphere:"", rightCylinder:"", rightAxis:"",
  lensType:"", frame:"", price:"",
};

const fmt     = v => v ? "฿"+Number(v).toLocaleString("th-TH") : "–";
const fmtDate = r => r.day&&r.month&&r.year ? `${r.day} ${THAI_MONTHS_SHORT[+r.month-1]} ${r.year}` : "–";

// ── CSS ──────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=K2D:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --white:#fff;--snow:#f0f6ff;--ice:#ddeeff;
  --blue-lt:#5aabf8;--blue:#1a7fe8;--blue-dk:#1558b0;--navy:#0d3b7a;
  --text:#0d2d5a;--t2:#3b6490;--t3:#7ba3c8;
}
body{font-family:'K2D',sans-serif;background:var(--snow);}
.root{min-height:100vh;background:linear-gradient(160deg,#e8f3ff 0%,#f5f9ff 35%,#eaf3ff 65%,#ddeeff 100%);position:relative;overflow-x:hidden;}
.blob{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;animation:bf 9s ease-in-out infinite alternate;}
.b1{width:560px;height:560px;background:rgba(90,171,248,0.18);top:-120px;left:-160px;}
.b2{width:420px;height:420px;background:rgba(26,127,232,0.1);bottom:-60px;right:-100px;animation-delay:3s;}
.b3{width:320px;height:320px;background:rgba(180,220,255,0.2);top:38%;left:28%;animation-delay:5s;}
@keyframes bf{from{transform:translate(0,0) scale(1);}to{transform:translate(25px,-18px) scale(1.04);}}
.glass{background:rgba(255,255,255,0.75);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.92);border-radius:20px;box-shadow:0 4px 24px rgba(26,100,200,0.08),inset 0 1px 0 #fff;}
.glass-deep{background:rgba(255,255,255,0.88);backdrop-filter:blur(32px);-webkit-backdrop-filter:blur(32px);border:1px solid rgba(255,255,255,0.95);border-radius:20px;box-shadow:0 8px 40px rgba(26,100,200,0.1),inset 0 1px 0 #fff;}
.inp{width:100%;padding:10px 14px;background:rgba(240,248,255,0.8);border:1px solid rgba(26,127,232,0.18);border-radius:10px;font-family:'K2D',sans-serif;font-size:14px;color:var(--text);outline:none;transition:all 0.2s;}
.inp::placeholder{color:var(--t3);}
.inp:focus{border-color:var(--blue);background:#fff;box-shadow:0 0 0 3px rgba(26,127,232,0.1),0 2px 8px rgba(26,127,232,0.06);}
.lbl{display:block;font-size:11px;font-weight:700;color:var(--t2);letter-spacing:0.09em;text-transform:uppercase;margin-bottom:6px;font-family:'K2D',sans-serif;}
.sel{width:100%;padding:10px 14px;background:rgba(240,248,255,0.8);border:1px solid rgba(26,127,232,0.18);border-radius:10px;font-family:'K2D',sans-serif;font-size:14px;color:var(--text);outline:none;transition:all 0.2s;appearance:none;cursor:pointer;}
.sel:focus{border-color:var(--blue);background:#fff;box-shadow:0 0 0 3px rgba(26,127,232,0.1);}
.btn-save{background:linear-gradient(135deg,#1a7fe8,#1558b0);color:#fff;border:none;border-radius:11px;padding:11px 30px;font-size:14px;font-weight:700;font-family:'K2D',sans-serif;cursor:pointer;box-shadow:0 4px 16px rgba(26,127,232,0.35),inset 0 1px 0 rgba(255,255,255,0.2);transition:all 0.2s;}
.btn-save:hover{transform:translateY(-1px);box-shadow:0 6px 22px rgba(26,127,232,0.45);}
.btn-ghost2{background:rgba(26,127,232,0.07);color:var(--blue);border:1px solid rgba(26,127,232,0.2);border-radius:8px;padding:5px 13px;font-size:11px;font-weight:700;font-family:'K2D',sans-serif;cursor:pointer;transition:all 0.2s;}
.btn-ghost2:hover{background:rgba(26,127,232,0.14);}
.act-b{background:rgba(26,127,232,0.08);color:#1558b0;border:1px solid rgba(26,127,232,0.2);border-radius:7px;padding:5px 10px;font-size:11px;font-weight:700;font-family:'K2D',sans-serif;cursor:pointer;transition:all 0.15s;}
.act-g{background:rgba(5,150,105,0.07);color:#047857;border:1px solid rgba(5,150,105,0.2);border-radius:7px;padding:5px 10px;font-size:11px;font-weight:700;font-family:'K2D',sans-serif;cursor:pointer;transition:all 0.15s;}
.act-r{background:rgba(220,38,38,0.06);color:#b91c1c;border:1px solid rgba(220,38,38,0.18);border-radius:7px;padding:5px 10px;font-size:11px;font-weight:700;font-family:'K2D',sans-serif;cursor:pointer;transition:all 0.15s;}
.act-b:hover{background:rgba(26,127,232,0.18);}
.act-g:hover{background:rgba(5,150,105,0.16);}
.act-r:hover{background:rgba(220,38,38,0.15);}
.tabs{display:flex;background:rgba(26,127,232,0.06);border:1px solid rgba(26,127,232,0.12);border-radius:13px;padding:4px;gap:2px;width:fit-content;}
.tab{padding:9px 20px;border-radius:10px;border:none;font-size:13px;font-weight:700;font-family:'K2D',sans-serif;cursor:pointer;transition:all 0.2s;white-space:nowrap;}
.tab-on{background:linear-gradient(135deg,#1a7fe8,#1558b0);color:#fff;box-shadow:0 2px 12px rgba(26,127,232,0.35);}
.tab-off{background:transparent;color:var(--t2);}
.tab-off:hover{color:var(--blue);}
.presc-wrap{background:linear-gradient(135deg,rgba(224,240,255,0.7),rgba(209,232,255,0.5));border:1px solid rgba(26,127,232,0.18);border-radius:14px;padding:16px 18px;}
.badge-r{background:rgba(26,127,232,0.12);color:#1558b0;border:1px solid rgba(26,127,232,0.25);border-radius:7px;padding:3px 12px;font-weight:800;font-size:13px;text-align:center;}
.badge-l{background:rgba(5,150,105,0.1);color:#047857;border:1px solid rgba(5,150,105,0.22);border-radius:7px;padding:3px 12px;font-weight:800;font-size:13px;text-align:center;}
.tbl{width:100%;border-collapse:collapse;}
.tbl thead tr{background:linear-gradient(135deg,rgba(26,127,232,0.1),rgba(21,88,176,0.07));}
.tbl th{padding:11px 13px;font-size:11px;font-weight:700;color:var(--blue-dk);text-align:left;white-space:nowrap;letter-spacing:0.07em;text-transform:uppercase;font-family:'K2D',sans-serif;}
.tbl td{padding:12px 13px;font-size:13px;color:var(--text);border-bottom:1px solid rgba(26,127,232,0.07);vertical-align:middle;font-family:'K2D',sans-serif;}
.tbl tr:last-child td{border-bottom:none;}
.tbl tbody tr{transition:background 0.15s;}
.tbl tbody tr:hover td{background:rgba(26,127,232,0.04);}
.shimmer{background:linear-gradient(90deg,#ffffff 20%,#cbd5e1 50%,#ffffff 80%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:sh 3.5s linear infinite;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.15));}
@keyframes sh{to{background-position:-200% center;}}
.stat{background:rgba(255,255,255,0.78);backdrop-filter:blur(16px);border:1px solid rgba(26,127,232,0.14);border-radius:14px;padding:12px 18px;box-shadow:0 2px 12px rgba(26,100,200,0.07),inset 0 1px 0 #fff;}
.toast{display:inline-flex;align-items:center;gap:6px;background:rgba(5,150,105,0.1);border:1px solid rgba(5,150,105,0.25);color:#047857;border-radius:9px;padding:6px 15px;font-size:13px;font-weight:700;animation:pop .3s ease;font-family:'K2D',sans-serif;}
@keyframes pop{from{opacity:0;transform:scale(0.9);}to{opacity:1;transform:scale(1);}}
@keyframes fi{from{opacity:0;}to{opacity:1;}}
@keyframes su{from{transform:translateY(20px);opacity:0;}to{transform:translateY(0);opacity:1;}}
@keyframes spin{to{transform:rotate(360deg);}}
::-webkit-scrollbar{width:6px;height:6px;}
::-webkit-scrollbar-track{background:rgba(26,127,232,0.04);}
::-webkit-scrollbar-thumb{background:rgba(26,127,232,0.18);border-radius:3px;}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
.gpresc{display:grid;grid-template-columns:56px 1fr 1fr 1fr;gap:8px;align-items:center;}
.date-row{display:grid;grid-template-columns:1fr 2fr 1fr;gap:8px;}
.sel-wrap{position:relative;}
.sel-wrap::after{content:"▾";position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--t3);pointer-events:none;font-size:12px;}
.log-card{background:rgba(255,255,255,0.82);backdrop-filter:blur(16px);border:1px solid rgba(26,127,232,0.12);border-radius:16px;padding:16px;margin-bottom:12px;box-shadow:0 2px 12px rgba(26,100,200,0.07);}
.wrap{max-width:1000px;margin:0 auto;padding:20px 16px 48px;position:relative;z-index:1;}
.show-mob{display:none;}

/* ── Dashboard ─────────────────────────────────────────────────────────── */
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px;}
.kpi{background:rgba(255,255,255,0.88);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.95);border-radius:16px;padding:18px 20px;box-shadow:0 4px 20px rgba(26,100,200,0.08),inset 0 1px 0 #fff;position:relative;overflow:hidden;}
.kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:16px 16px 0 0;}
.kpi-b::before{background:linear-gradient(90deg,#1a7fe8,#5aabf8);}
.kpi-g::before{background:linear-gradient(90deg,#047857,#34d399);}
.kpi-p::before{background:linear-gradient(90deg,#7c3aed,#a78bfa);}
.kpi-a::before{background:linear-gradient(90deg,#d97706,#fbbf24);}
.kpi-lbl{font-size:11px;font-weight:700;color:var(--t2);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;}
.kpi-val{font-size:22px;font-weight:800;color:var(--navy);line-height:1.1;}
.kpi-sub{font-size:11px;color:var(--t3);margin-top:5px;}
.chart-card{background:rgba(255,255,255,0.88);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.95);border-radius:20px;padding:22px;box-shadow:0 4px 20px rgba(26,100,200,0.08),inset 0 1px 0 #fff;margin-bottom:14px;}
.chart-ttl{font-size:14px;font-weight:800;color:var(--navy);margin-bottom:3px;}
.chart-sub{font-size:12px;color:var(--t3);margin-bottom:18px;}
.mrow{display:grid;grid-template-columns:72px 1fr 60px 100px 76px;gap:0;align-items:center;padding:11px 16px;border-bottom:1px solid rgba(26,127,232,0.07);transition:background 0.15s;}
.mrow:hover{background:rgba(26,127,232,0.025);}
.mrow:last-child{border-bottom:none;}
.bar-bg{height:7px;background:rgba(26,127,232,0.1);border-radius:99px;overflow:hidden;}
.bar-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#1a7fe8,#5aabf8);transition:width .8s cubic-bezier(.34,1.56,.64,1);}
.year-sel{background:rgba(240,248,255,0.9);border:1px solid rgba(26,127,232,0.18);border-radius:9px;font-family:'K2D',sans-serif;font-size:13px;color:var(--text);padding:7px 32px 7px 12px;outline:none;appearance:none;cursor:pointer;}

@media(max-width:900px){
  .kpi-grid{grid-template-columns:1fr 1fr;}
  .dash-side{display:none!important;}
}
@media(max-width:768px){
  .mrow{grid-template-columns:60px 1fr 80px;}
  .hide-sm{display:none!important;}
}
@media(max-width:640px){
  .g3{grid-template-columns:1fr;}
  .hide-mob{display:none!important;}
  .tab{padding:8px 12px;font-size:12px;}
  .date-row{grid-template-columns:1fr 1fr 1fr;}
  .show-mob{display:block;}
  .kpi-grid{grid-template-columns:1fr 1fr;}
}
`;

// ── CustomerCard ─────────────────────────────────────────────────────────────
function CustomerCard({ r }) {
  return (
    <div id="customer-card" style={{
      width:400, minHeight:750,
      background:"linear-gradient(170deg,#e8f3ff 0%,#ffffff 40%,#f0f7ff 70%,#ddeeff 100%)",
      borderRadius:0, padding:"36px 30px 32px",
      fontFamily:"'K2D',sans-serif", position:"relative",
      overflow:"hidden", color:"#0d2d5a", boxSizing:"border-box",
    }}>
      {/* Watermark */}
      <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",opacity:0.045,pointerEvents:"none",userSelect:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:8,width:300 }}>
        <svg width="200" height="80" viewBox="0 0 200 80" fill="none">
          <rect x="4" y="20" width="76" height="50" rx="25" stroke="#0d3b7a" strokeWidth="7"/>
          <rect x="120" y="20" width="76" height="50" rx="25" stroke="#0d3b7a" strokeWidth="7"/>
          <path d="M80 45 Q100 38 120 45" stroke="#0d3b7a" strokeWidth="7" fill="none" strokeLinecap="round"/>
          <line x1="4" y1="38" x2="0" y2="20" stroke="#0d3b7a" strokeWidth="6" strokeLinecap="round"/>
          <line x1="196" y1="38" x2="200" y2="20" stroke="#0d3b7a" strokeWidth="6" strokeLinecap="round"/>
        </svg>
        <div style={{ fontSize:38,fontWeight:800,color:"#0d3b7a",letterSpacing:"0.05em",lineHeight:1 }}>MASTER</div>
        <div style={{ fontSize:16,fontWeight:600,color:"#0d3b7a",letterSpacing:"0.3em" }}>OPTIC</div>
      </div>
      {/* Dot pattern */}
      <div style={{ position:"absolute",inset:0,pointerEvents:"none",backgroundImage:"radial-gradient(rgba(26,127,232,0.06) 1px,transparent 1px)",backgroundSize:"20px 20px" }}/>
      {/* Corner accents */}
      {[{top:16,left:16,borderTop:"2px solid rgba(26,127,232,0.25)",borderLeft:"2px solid rgba(26,127,232,0.25)",borderRadius:"4px 0 0 0"},{top:16,right:16,borderTop:"2px solid rgba(26,127,232,0.25)",borderRight:"2px solid rgba(26,127,232,0.25)",borderRadius:"0 4px 0 0"},{bottom:16,left:16,borderBottom:"2px solid rgba(26,127,232,0.25)",borderLeft:"2px solid rgba(26,127,232,0.25)",borderRadius:"0 0 0 4px"},{bottom:16,right:16,borderBottom:"2px solid rgba(26,127,232,0.25)",borderRight:"2px solid rgba(26,127,232,0.25)",borderRadius:"0 0 4px 0"}].map((s,i)=><div key={i} style={{ position:"absolute",width:28,height:28,...s }}/>)}

      <div style={{ position:"relative",zIndex:1 }}>
        {/* Header */}
        <div style={{ textAlign:"center",marginBottom:22 }}>
          <div style={{ display:"inline-flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#1a7fe8,#1558b0)",borderRadius:30,padding:"6px 20px",marginBottom:10 }}>
            <span style={{ fontSize:16 }}>👓</span>
            <span style={{ fontSize:14,fontWeight:800,color:"white",letterSpacing:"0.12em" }}>MASTER OPTIC</span>
          </div>
          <div style={{ fontSize:19,fontWeight:800,color:"#0d3b7a" }}>บิลบันทึกข้อมูลลูกค้า</div>
          <div style={{ fontSize:11,color:"#7ba3c8",marginTop:3,letterSpacing:"0.05em" }}>เพื่อการจัดการข้อมูลลูกค้าอย่างมีประสิทธิภาพ</div>
        </div>
        {/* Divider */}
        <div style={{ position:"relative",marginBottom:18,textAlign:"center" }}>
          <div style={{ height:1,background:"linear-gradient(90deg,transparent,#1a7fe8,transparent)" }}/>
          <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"white",padding:"0 10px" }}><div style={{ width:6,height:6,borderRadius:"50%",background:"#1a7fe8",margin:"0 auto" }}/></div>
        </div>
        {/* Date + No */}
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:18,fontSize:14,color:"#7ba3c8" }}>
          <div>วันที่: <strong style={{ color:"#3b6490" }}>{fmtDate(r)}</strong></div>
          <div>#{String(r.id).padStart(4,"0")}</div>
        </div>
        {/* Customer */}
        <div style={{ background:"linear-gradient(135deg,rgba(26,127,232,0.08),rgba(21,88,176,0.05))",border:"1px solid rgba(26,127,232,0.18)",borderRadius:14,padding:"14px 16px",marginBottom:14 }}>
          <div style={{ fontSize:10,color:"#7ba3c8",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8 }}>ข้อมูลติดต่อลูกค้า</div>
          <div style={{ fontSize:18,fontWeight:800,color:"#0d3b7a",marginBottom:6 }}>{r.name}</div>
          <div style={{ display:"flex",gap:16,fontSize:14,color:"#3b6490",flexWrap:"wrap",alignItems:"center" }}>
            <span>📞 {r.phone}</span>
            {r.lineId&&<span style={{ color:"#06b6d4" }}>💬 {r.lineId}</span>}
          </div>
        </div>
        {/* Prescription */}
        <div style={{ background:"rgba(240,248,255,0.9)",border:"1px solid rgba(26,127,232,0.15)",borderRadius:14,padding:"14px 16px",marginBottom:14 }}>
          <div style={{ fontSize:10,color:"#7ba3c8",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12 }}>🔍 ค่าสายตา</div>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
            <thead><tr><th style={{ width:36,padding:"4px 0",color:"#7ba3c8",fontWeight:700,fontSize:10,textAlign:"center" }}></th>{["Sphere","Cylinder","Axis"].map(h=><th key={h} style={{ padding:"4px 6px",color:"#3b6490",fontWeight:700,fontSize:10,textAlign:"center",letterSpacing:"0.05em" }}>{h}</th>)}</tr></thead>
            <tbody>{[{eye:"R",color:"#1558b0",bg:"rgba(26,127,232,0.1)",border:"rgba(26,127,232,0.2)",vals:[r.rightSphere,r.rightCylinder,r.rightAxis]},{eye:"L",color:"#047857",bg:"rgba(5,150,105,0.08)",border:"rgba(5,150,105,0.18)",vals:[r.leftSphere,r.leftCylinder,r.leftAxis]}].map(row=><tr key={row.eye}><td style={{ padding:"6px 0" }}><div style={{ background:row.bg,color:row.color,border:`1px solid ${row.border}`,borderRadius:6,padding:"3px 0",fontWeight:800,fontSize:13,textAlign:"center" }}>{row.eye}</div></td>{row.vals.map((v,i)=><td key={i} style={{ textAlign:"center",padding:"6px",color:v?"#0d2d5a":"#c0d0e0",fontWeight:v?600:400,fontSize:14 }}>{v||"–"}</td>)}</tr>)}</tbody>
          </table>
        </div>
        {/* Product */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14 }}>
          {[{icon:"🔬",label:"ชนิดเลนส์",val:r.lensType},{icon:"👓",label:"รหัสกรอบ",val:r.frame,mono:true}].map(({icon,label,val,mono})=>(
            <div key={label} style={{ background:"rgba(240,248,255,0.85)",border:"1px solid rgba(26,127,232,0.1)",borderRadius:12,padding:"11px 13px" }}>
              <div style={{ fontSize:11,color:"#7ba3c8",fontWeight:700,marginBottom:4 }}>{icon} {label}</div>
              <div style={{ fontSize:14,fontWeight:700,color:"#0d2d5a",fontFamily:mono?"monospace,K2D,sans-serif":"K2D,sans-serif" }}>{val||"–"}</div>
            </div>
          ))}
        </div>
        {/* Price */}
        <div style={{ background:"linear-gradient(135deg,#1a7fe8,#1558b0)",borderRadius:14,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 4px 16px rgba(26,127,232,0.25),inset 0 1px 0 rgba(255,255,255,0.15)",marginBottom:18 }}>
          <div>
            <div style={{ fontSize:13,color:"rgba(255,255,255,0.7)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2 }}>ราคารวมทั้งสิ้น</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.55)" }}>Total Amount</div>
          </div>
          <div style={{ fontSize:28,fontWeight:800,color:"white" }}>{r.price?"฿"+Number(r.price).toLocaleString("th-TH"):"–"}</div>
        </div>
        {/* Footer */}
        <div style={{ height:1,background:"linear-gradient(90deg,transparent,rgba(26,127,232,0.2),transparent)",marginBottom:14 }}/>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:11,color:"#7ba3c8",marginBottom:3 }}>ขอบคุณที่ใช้บริการ</div>
          <div style={{ fontSize:10,color:"#a0bcd8",letterSpacing:"0.1em" }}>MASTER OPTIC • masteroptic.com</div>
        </div>
      </div>
    </div>
  );
}

// ── CardModal ────────────────────────────────────────────────────────────────
function CardModal({ r, onClose }) {
  const h2cReady = useHtml2Canvas();
  const [saving, setSaving] = useState(false);
  const handleDownload = () => {
    if (!h2cReady||!window.html2canvas) return;
    setSaving(true);
    window.html2canvas(document.getElementById("customer-card"),{scale:3,useCORS:true,backgroundColor:"#e8f3ff",logging:false})
      .then(c=>{ const a=document.createElement("a"); a.download=`MasterOptic-${r.name}.png`; a.href=c.toDataURL("image/png"); a.click(); setSaving(false); })
      .catch(()=>setSaving(false));
  };
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(13,45,90,0.55)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,animation:"fi .2s ease",overflowY:"auto" }}>
      <div style={{ animation:"su .25s ease",display:"flex",flexDirection:"column",alignItems:"center",gap:12 }}>
        <div style={{ boxShadow:"0 24px 60px rgba(13,45,90,0.35),0 0 0 1px rgba(26,127,232,0.12)" }}><CustomerCard r={r}/></div>
        <div style={{ display:"flex",gap:10,width:400,maxWidth:"100%" }}>
          <button onClick={onClose} style={{ flex:1,padding:"11px",borderRadius:10,background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.22)",color:"white",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"K2D,sans-serif" }}>ปิด</button>
          <button onClick={handleDownload} disabled={!h2cReady||saving} style={{ flex:2.5,padding:"11px 0",borderRadius:10,background:saving?"rgba(26,127,232,0.5)":"linear-gradient(135deg,#1a7fe8,#1558b0)",color:"white",border:"none",cursor:saving?"wait":"pointer",fontSize:14,fontWeight:800,fontFamily:"K2D,sans-serif",boxShadow:"0 4px 16px rgba(26,127,232,0.4)",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
            {saving?<><span style={{ animation:"spin .8s linear infinite",display:"inline-block" }}>⏳</span>กำลังบันทึก...</>:<><span>📥</span>บันทึกเป็นรูปภาพ</>}
          </button>
        </div>
        <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",fontFamily:"K2D,sans-serif" }}>ความละเอียดสูง 3× • รูปแบบ PNG</div>
      </div>
    </div>
  );
}

// ── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:"rgba(255,255,255,0.97)",backdropFilter:"blur(16px)",border:"1px solid rgba(26,127,232,0.18)",borderRadius:12,padding:"12px 16px",boxShadow:"0 8px 24px rgba(26,100,200,0.15)",fontFamily:"K2D,sans-serif" }}>
      <div style={{ fontSize:13,fontWeight:800,color:"#0d3b7a",marginBottom:6 }}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{ fontSize:12,fontWeight:700,color:p.dataKey==="revenue"?"#1a7fe8":"#047857" }}>
          {p.dataKey==="revenue"?"ยอดขาย: ฿"+Number(p.value).toLocaleString("th-TH"):`จำนวน: ${p.value} ราย`}
        </div>
      ))}
    </div>
  );
}

// ── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab({ records }) {
  const availYears = useMemo(()=>{
    const ys=[...new Set(records.map(r=>r.year))].sort((a,b)=>+b-+a);
    return ys.length?ys:[String(now.getFullYear()+543)];
  },[records]);

  const [selYear, setSelYear] = useState(()=>{
    const ys=[...new Set(records.map(r=>r.year))].sort((a,b)=>+b-+a);
    return ys[0]||String(now.getFullYear()+543);
  });

  const monthlyData = useMemo(()=>
    THAI_MONTHS_SHORT.map((label,i)=>{
      const recs=records.filter(r=>r.year===selYear&&+r.month===i+1);
      return { label, month:i+1, revenue:recs.reduce((a,r)=>a+(+r.price||0),0), count:recs.length };
    })
  ,[records,selYear]);

  const yearRecs  = records.filter(r=>r.year===selYear);
  const yearTotal = yearRecs.reduce((a,r)=>a+(+r.price||0),0);
  const maxRev    = Math.max(...monthlyData.map(d=>d.revenue),1);
  const best      = [...monthlyData].reduce((a,b)=>b.revenue>a.revenue?b:a, monthlyData[0]);
  const avg       = yearRecs.length?Math.round(yearTotal/yearRecs.length):0;

  // lens breakdown
  const lensBrk = useMemo(()=>{
    const m={};
    yearRecs.forEach(r=>{ if(r.lensType) m[r.lensType]=(m[r.lensType]||0)+1; });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  },[yearRecs]);

  const barColors = monthlyData.map(d=>d.revenue===maxRev&&d.revenue>0?"#1a7fe8":"#93c5fd");
  const LENS_COLORS = ["#1a7fe8","#34d399","#f59e0b","#a78bfa","#f87171","#38bdf8"];

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:12 }}>
        <div>
          <div style={{ fontSize:18,fontWeight:800,color:"var(--navy)" }}>📊 สรุปยอดรายเดือน</div>
          <div style={{ fontSize:12,color:"var(--t3)",marginTop:2 }}>ภาพรวมรายได้และจำนวนลูกค้า</div>
        </div>
        <div style={{ position:"relative" }}>
          <select value={selYear} onChange={e=>setSelYear(e.target.value)} className="year-sel" style={{ paddingRight:30 }}>
            {availYears.map(y=><option key={y} value={y}>ปี พ.ศ. {y}</option>)}
          </select>
          <span style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:"var(--t3)",fontSize:11,pointerEvents:"none" }}>▾</span>
        </div>
      </div>

      {/* KPI */}
      <div className="kpi-grid">
        {[
          { cls:"kpi-b", icon:"💰", label:"ยอดรวมทั้งปี",    val:"฿"+yearTotal.toLocaleString("th-TH"),                    sub:`ปี พ.ศ. ${selYear}` },
          { cls:"kpi-g", icon:"👥", label:"ลูกค้าทั้งปี",   val:`${yearRecs.length} ราย`,                                 sub:"ใบสั่งทั้งหมด" },
          { cls:"kpi-p", icon:"🏆", label:"เดือนที่ดีที่สุด", val:best.revenue>0?best.label:"–",                           sub:best.revenue>0?"฿"+best.revenue.toLocaleString("th-TH"):"ยังไม่มีข้อมูล" },
          { cls:"kpi-a", icon:"🏷️", label:"เฉลี่ยต่อราย",   val:avg>0?"฿"+avg.toLocaleString("th-TH"):"–",                sub:"ยอดเฉลี่ยต่อลูกค้า" },
        ].map(({cls,icon,label,val,sub})=>(
          <div key={label} className={`kpi ${cls}`}>
            <div style={{ fontSize:22,marginBottom:6 }}>{icon}</div>
            <div className="kpi-lbl">{label}</div>
            <div className="kpi-val">{val}</div>
            <div className="kpi-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="chart-card">
        <div className="chart-ttl">ยอดขายรายเดือน</div>
        <div className="chart-sub">ปี พ.ศ. {selYear} — แถบสีเข้มคือเดือนที่ขายสูงสุด</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData} margin={{top:4,right:4,left:0,bottom:0}} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,127,232,0.07)" vertical={false}/>
            <XAxis dataKey="label" tick={{fontSize:11,fill:"#7ba3c8",fontFamily:"K2D,sans-serif"}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:11,fill:"#7ba3c8",fontFamily:"K2D,sans-serif"}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${v/1000}k`:v} width={34}/>
            <Tooltip content={<ChartTip/>}/>
            <Bar dataKey="revenue" radius={[7,7,0,0]}>
              {monthlyData.map((_,i)=><Cell key={i} fill={barColors[i]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table + Side */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 270px",gap:14,alignItems:"start" }}>

        {/* Monthly detail table */}
        <div className="chart-card" style={{ padding:0,overflow:"hidden" }}>
          <div style={{ padding:"16px 18px 12px",borderBottom:"1px solid rgba(26,127,232,0.08)" }}>
            <div className="chart-ttl">รายละเอียดรายเดือน</div>
          </div>
          {/* table header */}
          <div className="mrow" style={{ background:"rgba(26,127,232,0.04)",cursor:"default" }}>
            {["เดือน",<span style={{ paddingLeft:12 }}>สัดส่วน</span>,"ราย","ยอดขาย","เฉลี่ย/ราย"].map((h,i)=>(
              <div key={i} style={{ fontSize:10,fontWeight:700,color:"var(--t2)",letterSpacing:"0.07em",textTransform:"uppercase" }} className={i>=2&&i<=4?["","","hide-sm","","hide-sm"][i]:""}>
                {h}
              </div>
            ))}
          </div>
          {monthlyData.map(d=>(
            <div key={d.month} className="mrow">
              <div style={{ fontSize:13,fontWeight:700,color:d.revenue>0?"var(--navy)":"var(--t3)" }}>{d.label}</div>
              <div style={{ padding:"0 10px" }}><div className="bar-bg"><div className="bar-fill" style={{ width:`${maxRev>0?d.revenue/maxRev*100:0}%` }}/></div></div>
              <div className="hide-sm" style={{ textAlign:"right",fontSize:12,color:d.count>0?"var(--blue)":"var(--t3)",fontWeight:700 }}>{d.count||"–"}</div>
              <div style={{ textAlign:"right",fontSize:13,fontWeight:800,color:d.revenue>0?"var(--navy)":"var(--t3)" }}>{d.revenue>0?"฿"+d.revenue.toLocaleString("th-TH"):"–"}</div>
              <div className="hide-sm" style={{ textAlign:"right",fontSize:11,color:"var(--t3)" }}>{d.count>0?"฿"+Math.round(d.revenue/d.count).toLocaleString("th-TH"):"–"}</div>
            </div>
          ))}
          {/* Total */}
          <div className="mrow" style={{ background:"linear-gradient(135deg,rgba(26,127,232,0.07),rgba(21,88,176,0.04))",borderTop:"1px solid rgba(26,127,232,0.1)" }}>
            <div style={{ fontSize:13,fontWeight:800,color:"var(--navy)" }}>รวม</div>
            <div/>
            <div className="hide-sm" style={{ textAlign:"right",fontSize:13,fontWeight:800,color:"var(--blue)" }}>{yearRecs.length}</div>
            <div style={{ textAlign:"right",fontSize:14,fontWeight:800,color:"var(--blue)" }}>{"฿"+yearTotal.toLocaleString("th-TH")}</div>
            <div className="hide-sm"/>
          </div>
        </div>

        {/* Side panels */}
        <div className="dash-side" style={{ display:"flex",flexDirection:"column",gap:14 }}>

          {/* Lens breakdown */}
          <div className="chart-card">
            <div className="chart-ttl">เลนส์ที่ขายได้</div>
            <div className="chart-sub" style={{ marginBottom:14 }}>ปี พ.ศ. {selYear}</div>
            {lensBrk.length===0&&<div style={{ fontSize:12,color:"var(--t3)",textAlign:"center",padding:"10px 0" }}>ยังไม่มีข้อมูล</div>}
            {lensBrk.map(([name,count],i)=>(
              <div key={name} style={{ marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                  <span style={{ fontSize:11,fontWeight:700,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"70%" }}>{name}</span>
                  <span style={{ fontSize:12,fontWeight:800,color:LENS_COLORS[i%LENS_COLORS.length],flexShrink:0,marginLeft:6 }}>{count} ราย</span>
                </div>
                <div style={{ height:6,background:"rgba(26,127,232,0.08)",borderRadius:99,overflow:"hidden" }}>
                  <div style={{ height:"100%",borderRadius:99,background:LENS_COLORS[i%LENS_COLORS.length],width:`${count/lensBrk[0][1]*100}%`,transition:"width .6s ease" }}/>
                </div>
              </div>
            ))}
          </div>

          {/* Top customers */}
          <div className="chart-card">
            <div className="chart-ttl">ลูกค้ายอดสูงสุด</div>
            <div className="chart-sub" style={{ marginBottom:14 }}>ปี พ.ศ. {selYear}</div>
            {yearRecs.length===0&&<div style={{ fontSize:12,color:"var(--t3)",textAlign:"center",padding:"10px 0" }}>ยังไม่มีข้อมูล</div>}
            {[...yearRecs].sort((a,b)=>(+b.price||0)-(+a.price||0)).slice(0,4).map((r,i)=>(
              <div key={r.id} style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
                <div style={{ width:24,height:24,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"white",background:["linear-gradient(135deg,#f59e0b,#fbbf24)","linear-gradient(135deg,#9ca3af,#d1d5db)","linear-gradient(135deg,#b45309,#d97706)","linear-gradient(135deg,#1a7fe8,#5aabf8)"][i] }}>{i+1}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:12,fontWeight:700,color:"var(--navy)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.name}</div>
                  <div style={{ fontSize:11,color:"var(--t3)" }}>{fmtDate(r)}</div>
                </div>
                <div style={{ fontSize:12,fontWeight:800,color:"var(--blue)",flexShrink:0 }}>฿{(+r.price||0).toLocaleString("th-TH")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [records, setRecords] = useState(initialData);
  const [form,    setForm]    = useState(EMPTY);
  const [search,  setSearch]  = useState("");
  const [tab,     setTab]     = useState("form");
  const [cardRec, setCardRec] = useState(null);
  const [editId,  setEditId]  = useState(null);
  const [saved,   setSaved]   = useState(false);
  const nid = useRef(100);

  const filtered = useMemo(()=>{
    const q=search.trim().toLowerCase();
    return q?records.filter(r=>r.name.toLowerCase().includes(q)||r.phone.includes(q)):records;
  },[records,search]);

  const total = records.reduce((a,r)=>a+(+r.price||0),0);
  const ch = e=>setForm(f=>({...f,[e.target.name]:e.target.value}));

  // Google Sheets sync
  const saveToGoogleSheet = async (formData) => {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyDqh1VE1be7-iVyvQ7r_cxsrrULyV4FHOFUZEiQKMyXdpFai3i6kvyvgn6ZgG0Ya0z/exec";
    try {
      await fetch(SCRIPT_URL,{
        method:"POST", mode:"no-cors",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          date:`${formData.day}/${formData.month}/${formData.year}`,
          name:formData.name,
          contact:formData.phone+(formData.lineId?` (Line: ${formData.lineId})`:""),
          eyeR:`SPH:${formData.rightSphere} CYL:${formData.rightCylinder} AX:${formData.rightAxis}`,
          eyeL:`SPH:${formData.leftSphere} CYL:${formData.leftCylinder} AX:${formData.leftAxis}`,
          lens:formData.lensType, frame:formData.frame, price:formData.price,
        }),
      });
    } catch(e){ console.error("❌ Sheets sync failed:",e); }
  };

  const submit = e=>{
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editId!==null){
      setRecords(rs=>rs.map(r=>r.id===editId?{...form,id:editId}:r));
      setEditId(null);
    } else {
      const rec={...form,id:nid.current++};
      setRecords(rs=>[rec,...rs]);
      saveToGoogleSheet(rec);
    }
    setForm(EMPTY); setSaved(true); setTimeout(()=>setSaved(false),2500); setTab("log");
  };

  const edit = r=>{ setForm({...r}); setEditId(r.id); setTab("form"); window.scrollTo({top:0,behavior:"smooth"}); };
  const del  = id=>{ if(confirm("ต้องการลบข้อมูลนี้?")) setRecords(rs=>rs.filter(r=>r.id!==id)); };

  const days  = Array.from({length:31},(_,i)=>i+1);
  const years = Array.from({length:10},(_,i)=>String(now.getFullYear()+543-i));

  return (
    <div className="root">
      <style>{css}</style>
      <div className="blob b1"/><div className="blob b2"/><div className="blob b3"/>

      {/* HEADER */}
      <div style={{ position:"relative",zIndex:10,background:"linear-gradient(135deg,#1a7fe8 0%,#0d3b7a 100%)",padding:"25px 20px",boxShadow:"0 4px 20px rgba(13,59,122,0.2)",borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ maxWidth:1000,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:15 }}>
          <div style={{ display:"flex",alignItems:"center",gap:15 }}>
            <img src="/logo22.png" alt="Logo" style={{ height:"80px",width:"auto",objectFit:"contain" }}/>
            <div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.7)",letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:3,fontFamily:"K2D,sans-serif",fontWeight:600 }}>Master Optic Management System</div>
              <div style={{ fontSize:26,fontWeight:800,fontFamily:"K2D,sans-serif" }}><span className="shimmer">MASTER OPTIC</span></div>
            </div>
          </div>
          <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
            <div className="stat" style={{ background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",backdropFilter:"blur(10px)" }}>
              <div style={{ fontSize:10,color:"rgba(255,255,255,0.8)",marginBottom:2 }}>ลูกค้าทั้งหมด</div>
              <div style={{ fontSize:24,fontWeight:800,color:"#ffffff" }}>{records.length}</div>
            </div>
            <div className="stat" style={{ background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",backdropFilter:"blur(10px)" }}>
              <div style={{ fontSize:10,color:"rgba(255,255,255,0.8)",marginBottom:2 }}>ยอดรวม</div>
              <div style={{ fontSize:19,fontWeight:800,color:"#4ade80" }}>฿{total.toLocaleString("th-TH")}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap">
        {/* TABS — 3 เมนู */}
        <div style={{ marginBottom:20,overflowX:"auto",paddingBottom:2 }}>
          <div className="tabs">
            {[
              ["form","📝 บันทึกข้อมูล"],
              ["log",`📋 ฐานข้อมูล (${records.length})`],
              ["dashboard","📊 สรุปยอด"],
            ].map(([k,l])=>(
              <button key={k} className={`tab ${tab===k?"tab-on":"tab-off"}`} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>
        </div>

        {/* ── FORM ── */}
        {tab==="form"&&(
          <form onSubmit={submit}>
            <div className="glass-deep" style={{ overflow:"hidden" }}>
              <div style={{ background:"linear-gradient(135deg,rgba(26,127,232,0.12),rgba(21,88,176,0.08))",borderBottom:"1px solid rgba(26,127,232,0.12)",padding:"14px 22px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div style={{ fontWeight:800,fontSize:15,color:"var(--navy)" }}>{editId?"✏️ แก้ไขข้อมูลลูกค้า":"➕ บันทึกประวัติการวัดสายตา"}</div>
                {editId&&<button type="button" className="btn-ghost2" onClick={()=>{setForm(EMPTY);setEditId(null);}}>ยกเลิก</button>}
              </div>
              <div style={{ padding:"22px" }}>
                {/* Row 1: date / name / contact */}
                <div className="g3" style={{ marginBottom:16 }}>
                  <div>
                    <label className="lbl">วันที่</label>
                    <div className="date-row">
                      {[{name:"day",opts:days.map(d=><option key={d} value={d}>{d}</option>)},{name:"month",opts:THAI_MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)},{name:"year",opts:years.map(y=><option key={y} value={y}>{y}</option>)}].map(({name,opts})=>(
                        <div key={name} className="sel-wrap"><select name={name} value={form[name]} onChange={ch} className="sel" style={{ paddingRight:28 }}>{opts}</select></div>
                      ))}
                    </div>
                  </div>
                  <div><label className="lbl">ชื่อลูกค้า</label><input name="name" value={form.name} onChange={ch} placeholder="กรอกชื่อ-นามสกุล" className="inp"/></div>
                  <div>
                    <label className="lbl">เบอร์โทร / Line ID</label>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                      <input name="phone"  value={form.phone}  onChange={ch} placeholder="08X-XXX-XXXX" className="inp"/>
                      <input name="lineId" value={form.lineId} onChange={ch} placeholder="Line ID"      className="inp"/>
                    </div>
                  </div>
                </div>

                {/* Prescription */}
                <div className="presc-wrap" style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11,fontWeight:800,color:"var(--blue-dk)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:13 }}>🔍 ค่าสายตา (Prescription)</div>
                  <div className="gpresc">
                    <div/>
                    {["Sphere (SPH)","Cylinder (CYL)","Axis"].map(h=><div key={h} style={{ fontSize:10,fontWeight:700,color:"var(--t2)",textAlign:"center" }}>{h}</div>)}
                    <div className="badge-r">R</div>
                    {["rightSphere","rightCylinder","rightAxis"].map(n=><input key={n} name={n} value={form[n]} onChange={ch} placeholder="–" className="inp" style={{ textAlign:"center",padding:"8px 6px" }}/>)}
                    <div className="badge-l">L</div>
                    {["leftSphere","leftCylinder","leftAxis"].map(n=><input key={n} name={n} value={form[n]} onChange={ch} placeholder="–" className="inp" style={{ textAlign:"center",padding:"8px 6px" }}/>)}
                  </div>
                </div>

                {/* ── รายละเอียดเลนส์ (กรอกเอง) + กรอบ + ราคา ── */}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 140px",gap:14,marginBottom:20 }}>
                  <div>
                    <label className="lbl">ชนิดเลนส์</label>
                    <input
                      name="lensType"
                      value={form.lensType}
                      onChange={ch}
                      placeholder="เช่น Seiko 1.67 Blue UV"
                      className="inp"
                    />
                  </div>
                  <div>
                    <label className="lbl">รหัสกรอบแว่น</label>
                    <input name="frame" value={form.frame} onChange={ch} placeholder="เช่น TI-2024-001" className="inp"/>
                  </div>
                  <div>
                    <label className="lbl">ราคา (฿)</label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"var(--t3)",fontSize:14,fontWeight:600,pointerEvents:"none" }}>฿</span>
                      <input name="price" type="number" value={form.price} onChange={ch} placeholder="0" className="inp" style={{ paddingLeft:28 }}/>
                    </div>
                  </div>
                </div>

                <div style={{ display:"flex",justifyContent:"flex-end",alignItems:"center",gap:12,flexWrap:"wrap" }}>
                  {saved&&<span className="toast">✓ บันทึกสำเร็จแล้ว</span>}
                  <button type="submit" className="btn-save">{editId?"💾 อัปเดตข้อมูล":"💾 บันทึกข้อมูล"}</button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ── LOG ── */}
        {tab==="log"&&(
          <div>
            <div className="glass" style={{ padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10,borderRadius:14 }}>
              <span style={{ color:"var(--blue-lt)",fontSize:17,flexShrink:0 }}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาจากชื่อลูกค้า หรือ เบอร์โทรศัพท์..." style={{ flex:1,background:"none",border:"none",outline:"none",fontSize:14,color:"var(--text)",fontFamily:"K2D,sans-serif" }}/>
              {search&&<button onClick={()=>setSearch("")} style={{ background:"none",border:"none",color:"var(--t3)",cursor:"pointer",fontSize:15 }}>✕</button>}
              <span style={{ fontSize:12,color:"var(--t3)",flexShrink:0 }}>{filtered.length} รายการ</span>
            </div>
            <div className="glass hide-mob" style={{ overflow:"hidden" }}>
              <div style={{ overflowX:"auto" }}>
                <table className="tbl">
                  <thead><tr>{["วันที่","ชื่อลูกค้า","ติดต่อ","ค่าสายตา R","ค่าสายตา L","เลนส์","รหัสกรอบ","ราคา",""].map(h=><th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filtered.length===0&&<tr><td colSpan={9} style={{ textAlign:"center",padding:36,color:"var(--t3)" }}>ไม่พบข้อมูลที่ค้นหา</td></tr>}
                    {filtered.map(r=>(
                      <tr key={r.id}>
                        <td style={{ whiteSpace:"nowrap",color:"var(--t2)",fontSize:12 }}>{fmtDate(r)}</td>
                        <td style={{ fontWeight:700,color:"var(--navy)",whiteSpace:"nowrap" }}>{r.name}</td>
                        <td style={{ fontSize:12 }}><div>{r.phone}</div>{r.lineId&&<div style={{ color:"#0284c7",fontSize:11 }}>{r.lineId}</div>}</td>
                        <td style={{ fontSize:12,color:"var(--blue-dk)",whiteSpace:"nowrap" }}>{r.rightSphere||"–"}/{r.rightCylinder||"–"}/{r.rightAxis||"–"}</td>
                        <td style={{ fontSize:12,color:"#047857",whiteSpace:"nowrap" }}>{r.leftSphere||"–"}/{r.leftCylinder||"–"}/{r.leftAxis||"–"}</td>
                        <td style={{ fontSize:12,color:"var(--t2)",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.lensType||"–"}</td>
                        <td style={{ fontSize:12,color:"var(--t2)",fontFamily:"monospace,K2D,sans-serif" }}>{r.frame||"–"}</td>
                        <td style={{ fontWeight:800,color:"var(--blue)",whiteSpace:"nowrap" }}>{fmt(r.price)}</td>
                        <td><div style={{ display:"flex",gap:5 }}><button className="act-b" onClick={()=>setCardRec(r)}>ใบสั่ง</button><button className="act-g" onClick={()=>edit(r)}>แก้ไข</button><button className="act-r" onClick={()=>del(r.id)}>ลบ</button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding:"10px 16px",borderTop:"1px solid rgba(26,127,232,0.07)",display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--t3)" }}>
                <span>ฐานข้อมูลลูกค้าร้านแว่นตามาสเตอร์</span>
                <span>ยอดรวม: <strong style={{ color:"var(--blue)" }}>฿{total.toLocaleString("th-TH")}</strong></span>
              </div>
            </div>
            <div className="show-mob">
              {filtered.length===0&&<div style={{ textAlign:"center",padding:40,color:"var(--t3)" }}>ไม่พบข้อมูลที่ค้นหา</div>}
              {filtered.map(r=>(
                <div key={r.id} className="log-card">
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}><div style={{ fontWeight:800,fontSize:16,color:"var(--navy)" }}>{r.name}</div><div style={{ fontWeight:800,color:"var(--blue)" }}>{fmt(r.price)}</div></div>
                  <div style={{ fontSize:12,color:"var(--t2)",marginBottom:6 }}>{fmtDate(r)} • {r.phone}</div>
                  <div style={{ fontSize:11,color:"var(--t3)",marginBottom:6 }}>{r.lensType||"–"}</div>
                  <div style={{ fontSize:11,color:"var(--t3)",marginBottom:10 }}>R: {r.rightSphere||"–"}/{r.rightCylinder||"–"}/{r.rightAxis||"–"} | L: {r.leftSphere||"–"}/{r.leftCylinder||"–"}/{r.leftAxis||"–"}</div>
                  <div style={{ display:"flex",gap:7 }}><button className="act-b" style={{ flex:1 }} onClick={()=>setCardRec(r)}>ดูใบสั่ง</button><button className="act-g" style={{ flex:1 }} onClick={()=>edit(r)}>แก้ไข</button><button className="act-r" style={{ flex:1 }} onClick={()=>del(r.id)}>ลบ</button></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {tab==="dashboard"&&<DashboardTab records={records}/>}
      </div>

      {cardRec&&<CardModal r={cardRec} onClose={()=>setCardRec(null)}/>}
    </div>
  );
}