const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyDqh1VE1be7-iVyvQ7r_cxsrrULyV4FHOFUZEiQKMyXdpFai3i6kvyvgn6ZgG0Ya0z/exec";
import { useState, useMemo, useRef, useEffect } from "react";

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
  {
    id: 1, day: "10", month: "2", year: "2568", name: "สมศักดิ์ ใจดี",
    phone: "081-234-5678", lineId: "somsak.j",
    leftSphere: "-2.00", leftCylinder: "-0.75", leftAxis: "180",
    rightSphere: "-1.75", rightCylinder: "-0.50", rightAxis: "175",
    lensType: "เลนส์ 1", frame: "TI-2024-001", price: "12500",
  },
  {
    id: 2, day: "14", month: "2", year: "2568", name: "วิไล รักสวย",
    phone: "089-876-5432", lineId: "wilai_r",
    leftSphere: "-3.50", leftCylinder: "0.00", leftAxis: "0",
    rightSphere: "-3.25", rightCylinder: "-0.25", rightAxis: "90",
    lensType: "เลนส์ 2", frame: "AC-2024-088", price: "7800",
  },
];

const LENS_OPTIONS = ["เลนส์ 1", "เลนส์ 2", "เลนส์ 3"];

const THAI_MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];
const THAI_MONTHS_SHORT = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

const now = new Date();
const EMPTY = {
  day: String(now.getDate()), month: String(now.getMonth() + 1),
  year: String(now.getFullYear() + 543),
  name: "", phone: "", lineId: "",
  leftSphere: "", leftCylinder: "", leftAxis: "",
  rightSphere: "", rightCylinder: "", rightAxis: "",
  lensType: "", frame: "", price: "",
};

const fmt    = v => v ? "฿" + Number(v).toLocaleString("th-TH") : "–";
const fmtDate = r => r.day && r.month && r.year
  ? `${r.day} ${THAI_MONTHS_SHORT[+r.month - 1]} ${r.year}` : "–";
  
  const saveToGoogleSheet = async (record) => {
  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      mode: "no-cors", // เพื่อป้องกันปัญหาความปลอดภัยของเบราว์เซอร์
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record)
    });
    alert("ซิงค์ข้อมูลลง Google Sheets สำเร็จ!");
  } catch (err) {
    console.error("ซิงค์ไม่สำเร็จ:", err);
  }
};

// ตอนที่พี่บันทึกลงในเครื่องเสร็จ ให้เรียกใช้แบบนี้:
// saveToGoogleSheet(ข้อมูลที่คีย์ใหม่);

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
.tabs{display:flex;background:rgba(26,127,232,0.06);border:1px solid rgba(26,127,232,0.12);border-radius:13px;padding:4px;width:fit-content;}
.tab{padding:9px 22px;border-radius:10px;border:none;font-size:13px;font-weight:700;font-family:'K2D',sans-serif;cursor:pointer;transition:all 0.2s;white-space:nowrap;}
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
/* แก้ไขส่วน .shimmer ให้เป็นโทนสีขาว */
.shimmer {
  /* เปลี่ยนจากสีน้ำเงิน/กรมท่า เป็นขาวและเทาอ่อน */
  background: linear-gradient(90deg, #ffffff 20%, #cbd5e1 50%, #ffffff 80%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: sh 3.5s linear infinite;
  
  /* เพิ่ม Drop Shadow ให้ตัวหนังสือสีขาวลอยเด่นขึ้น */
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
}
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
.g31{display:grid;grid-template-columns:1fr 1fr 140px;gap:14px;}
.gpresc{display:grid;grid-template-columns:56px 1fr 1fr 1fr;gap:8px;align-items:center;}
.lens-wrap{display:flex;gap:8px;flex-wrap:wrap;}
.lens-pill{padding:8px 18px;border-radius:20px;border:1.5px solid rgba(26,127,232,0.25);background:rgba(240,248,255,0.8);color:var(--t2);font-family:'K2D',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;}
.lens-pill:hover{border-color:var(--blue);color:var(--blue);background:rgba(26,127,232,0.06);}
.lens-pill.active{background:linear-gradient(135deg,#1a7fe8,#1558b0);color:#fff;border-color:transparent;box-shadow:0 3px 10px rgba(26,127,232,0.3);}
.date-row{display:grid;grid-template-columns:1fr 2fr 1fr;gap:8px;}
.sel-wrap{position:relative;}
.sel-wrap::after{content:"▾";position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--t3);pointer-events:none;font-size:12px;}
.log-card{background:rgba(255,255,255,0.82);backdrop-filter:blur(16px);border:1px solid rgba(26,127,232,0.12);border-radius:16px;padding:16px;margin-bottom:12px;box-shadow:0 2px 12px rgba(26,100,200,0.07);}
.wrap{max-width:1000px;margin:0 auto;padding:20px 16px 48px;position:relative;z-index:1;}
.show-mob{display:none;}
@media(max-width:640px){
  .g3{grid-template-columns:1fr;}
  .g31{grid-template-columns:1fr 1fr;}
  .hide-mob{display:none!important;}
  .tab{padding:8px 14px;font-size:12px;}
  .date-row{grid-template-columns:1fr 1fr 1fr;}
  .show-mob{display:block;}
}
`;

// ── CustomerCard (slip size 400×750) ────────────────────────────────────────
function CustomerCard({ r }) {
  const date = fmtDate(r);
  return (
    <div id="customer-card" style={{
      width: 400, minHeight: 750,
      background: "linear-gradient(170deg,#e8f3ff 0%,#ffffff 40%,#f0f7ff 70%,#ddeeff 100%)",
      borderRadius: 0, padding: "36px 30px 32px",
      fontFamily: "'K2D', sans-serif", position: "relative",
      overflow: "hidden", color: "#0d2d5a", boxSizing: "border-box",
    }}>
      {/* Watermark */}
      <div style={{
        position:"absolute", top:"50%", left:"50%",
        transform:"translate(-50%,-50%)", opacity:0.045,
        pointerEvents:"none", userSelect:"none",
        display:"flex", flexDirection:"column", alignItems:"center", gap:8, width:300,
      }}>
        <svg width="200" height="80" viewBox="0 0 200 80" fill="none">
          <rect x="4"   y="20" width="76" height="50" rx="25" stroke="#0d3b7a" strokeWidth="7"/>
          <rect x="120" y="20" width="76" height="50" rx="25" stroke="#0d3b7a" strokeWidth="7"/>
          <path d="M80 45 Q100 38 120 45" stroke="#0d3b7a" strokeWidth="7" fill="none" strokeLinecap="round"/>
          <line x1="4"   y1="38" x2="0"   y2="20" stroke="#0d3b7a" strokeWidth="6" strokeLinecap="round"/>
          <line x1="196" y1="38" x2="200" y2="20" stroke="#0d3b7a" strokeWidth="6" strokeLinecap="round"/>
        </svg>
        <div style={{ fontSize:38, fontWeight:800, color:"#0d3b7a", letterSpacing:"0.05em", lineHeight:1 }}>MASTER</div>
        <div style={{ fontSize:16, fontWeight:600, color:"#0d3b7a", letterSpacing:"0.3em" }}>OPTIC</div>
      </div>

      {/* Dot pattern */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        backgroundImage:"radial-gradient(rgba(26,127,232,0.06) 1px, transparent 1px)",
        backgroundSize:"20px 20px",
      }}/>

      {/* Corner accents */}
      {[
        { top:16, left:16,  borderTop:"2px solid rgba(26,127,232,0.25)", borderLeft:"2px solid rgba(26,127,232,0.25)",   borderRadius:"4px 0 0 0" },
        { top:16, right:16, borderTop:"2px solid rgba(26,127,232,0.25)", borderRight:"2px solid rgba(26,127,232,0.25)",  borderRadius:"0 4px 0 0" },
        { bottom:16, left:16,  borderBottom:"2px solid rgba(26,127,232,0.25)", borderLeft:"2px solid rgba(26,127,232,0.25)",  borderRadius:"0 0 0 4px" },
        { bottom:16, right:16, borderBottom:"2px solid rgba(26,127,232,0.25)", borderRight:"2px solid rgba(26,127,232,0.25)", borderRadius:"0 0 4px 0" },
      ].map((s, i) => (
        <div key={i} style={{ position:"absolute", width:28, height:28, ...s }}/>
      ))}

      {/* Content */}
      <div style={{ position:"relative", zIndex:1 }}>

        {/* Brand header */}
        <div style={{ textAlign:"center", marginBottom:22 }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:8,
            background:"linear-gradient(135deg,#1a7fe8,#1558b0)",
            borderRadius:30, padding:"6px 20px", marginBottom:10,
          }}>
{/* HEADER - ลบกล่องสีน้ำเงินออก เหลือแค่โลโก้เปล่าๆ */}
<header style={{ position: "relative", zIndex: 10, padding: "30px 20px" }}>
  <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", gap: 20 }}>
    
    {/* ชื่อร้าน (ถ้าไม่เอาบรรทัดนี้ สามารถลบออกได้เลยครับ) */}
<div>
  <h1 style={{ 
    fontSize: 26, 
    fontWeight: 800, 
    margin: 0, 
    color: "#ffffff", // เปลี่ยนเป็นสีขาวตรงนี้ครับ
    fontFamily: "K2D",
    textShadow: "0 2px 4px rgba(0,0,0,0.1)" // แถม: ใส่เงาจางๆ ให้ตัวหนังสือดูมีมิติบนพื้นหลังสว่าง
  }}>
    <span className="shimmer">MASTER OPTIC</span>
  </h1>
</div>

  </div>
</header>
          </div>
          <div style={{ fontSize:19, fontWeight:800, color:"#0d3b7a" }}>บิลบันทึกข้อมูลลูกค้า</div>
          <div style={{ fontSize:11, color:"#7ba3c8", marginTop:3, letterSpacing:"0.05em" }}>เพื่อการจัดการข้อมูลลูกค้าอย่างมีประสิทธิภาพ</div>
        </div>

        {/* Divider */}
        <div style={{ position:"relative", marginBottom:18, textAlign:"center" }}>
          <div style={{ height:1, background:"linear-gradient(90deg,transparent,#1a7fe8,transparent)" }}/>
          <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", background:"white", padding:"0 10px" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#1a7fe8", margin:"0 auto" }}/>
          </div>
        </div>

        {/* Date + No */}
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18, fontSize:16, color:"#7ba3c8" }}>
          <div> วันที่: <strong style={{ color:"#3b6490" }}>{date}</strong></div>
          <div>#{String(r.id).padStart(4, "0")}</div>
        </div>

        {/* Customer */}
        <div style={{ background:"linear-gradient(135deg,rgba(26,127,232,0.08),rgba(21,88,176,0.05))", border:"1px solid rgba(26,127,232,0.18)", borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ fontSize:11, color:"#7ba3c8", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>ข้อมูลติดต่อลูกค้า</div>
          <div style={{ fontSize:18, fontWeight:800, color:"#0d3b7a", marginBottom:5 }}>{r.name}</div>
  <div style={{ display:"flex", gap:18, fontSize:18, color:"#3b6490", flexWrap:"wrap" }}>
    <span>📞 {r.phone}</span>
    {r.lineId && (
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
        {/* โลโก้ LINE */}
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" 
          alt="Line" 
          style={{ width: 20, height: 20, objectFit: "contain" }} 
        />
        {/* ไอดีไลน์ */}
        <span style={{ color: "#06b6d4", fontSize: 18, fontWeight: 600 }}>
          {r.lineId}
        </span>
      </div>
    )}
  </div>
</div>

{/* Prescription */}
        <div style={{ background:"rgba(240,248,255,0.9)", border:"1px solid rgba(26,127,232,0.15)", borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ fontSize:11, color:"#7ba3c8", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>🔍 ค่าสายตา</div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr>
                <th style={{ width:36, padding:"4px 0", color:"#7ba3c8", fontWeight:700, fontSize:10, textAlign:"center" }}></th>
                {["Sphere","Cylinder","Axis"].map(h => (
                  <th key={h} style={{ padding:"4px 6px", color:"#3b6490", fontWeight:700, fontSize:10, textAlign:"center", letterSpacing:"0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { eye:"R", color:"#1558b0", bg:"rgba(26,127,232,0.1)",  border:"rgba(26,127,232,0.2)",  vals:[r.rightSphere,r.rightCylinder,r.rightAxis] },
                { eye:"L", color:"#047857", bg:"rgba(5,150,105,0.08)",  border:"rgba(5,150,105,0.18)",  vals:[r.leftSphere,r.leftCylinder,r.leftAxis]   },
              ].map(row => (
                <tr key={row.eye}>
                  <td style={{ padding:"6px 0" }}>
                    <div style={{ background:row.bg, color:row.color, border:`1px solid ${row.border}`, borderRadius:6, padding:"3px 0", fontWeight:800, fontSize:13, textAlign:"center" }}>{row.eye}</div>
                  </td>
                  {row.vals.map((v, i) => (
                    <td key={i} style={{ textAlign:"center", padding:"6px", color:v?"#0d2d5a":"#c0d0e0", fontWeight:v?600:400, fontSize:14 }}>{v||"–"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Product */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          {[
            { icon:"", label:"ชนิดเลนส์", val:r.lensType },
            { icon:"👓",  label:"รหัสกรอบ",   val:r.frame, mono:true },
          ].map(({ icon, label, val, mono }) => (
            <div key={label} style={{ background:"rgba(240,248,255,0.85)", border:"1px solid rgba(26,127,232,0.1)", borderRadius:12, padding:"11px 13px" }}>
              <div style={{ fontSize:18, color:"#7ba3c8", fontWeight:700, marginBottom:4 }}>{icon} {label}</div>
              <div style={{ fontSize:18, fontWeight:700, color:"#0d2d5a", fontFamily: mono?"monospace,K2D,sans-serif":"K2D,sans-serif" }}>{val||"–"}</div>
            </div>
          ))}
        </div>

        {/* Price */}
        <div style={{
          background:"linear-gradient(135deg,#1a7fe8,#1558b0)",
          borderRadius:14, padding:"16px 20px",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          boxShadow:"0 4px 16px rgba(26,127,232,0.25),inset 0 1px 0 rgba(255,255,255,0.15)",
          marginBottom:18,
        }}>
          <div>
            <div style={{ fontSize:18, color:"rgba(255,255,255,0.7)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2 }}>ราคารวมทั้งสิ้น</div>
            <div style={{ fontSize:14, color:"rgba(255,255,255,0.55)" }}>Total Amount</div>
          </div>
          <div style={{ fontSize:28, fontWeight:800, color:"white" }}>
            {r.price ? "฿" + Number(r.price).toLocaleString("th-TH") : "–"}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:11, color:"#7ba3c8", marginBottom:3 }}>ขอบคุณที่ใช้บริการ</div>
          <div style={{ fontSize:10, color:"#a0bcd8", letterSpacing:"0.1em" }}>MASTER OPTIC • masteroptic.com</div>
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
    if (!h2cReady || !window.html2canvas) return;
    setSaving(true);
    const target = document.getElementById("customer-card");
    window.html2canvas(target, {
      scale: 3, useCORS: true, backgroundColor: "#e8f3ff", logging: false,
    }).then(canvas => {
      const link = document.createElement("a");
      link.download = `MasterOptic-${r.name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setSaving(false);
    }).catch(() => setSaving(false));
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position:"fixed", inset:0, zIndex:200,
        background:"rgba(13,45,90,0.55)", backdropFilter:"blur(12px)",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:16, animation:"fi .2s ease", overflowY:"auto",
      }}
    >
      <div style={{ animation:"su .25s ease", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
        <div style={{ boxShadow:"0 24px 60px rgba(13,45,90,0.35),0 0 0 1px rgba(26,127,232,0.12)" }}>
          <CustomerCard r={r}/>
        </div>
        <div style={{ display:"flex", gap:10, width:400, maxWidth:"100%" }}>
          <button onClick={onClose} style={{
            flex:1, padding:"11px", borderRadius:10,
            background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.22)",
            color:"white", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"K2D,sans-serif",
          }}>ปิด</button>
          <button onClick={handleDownload} disabled={!h2cReady || saving} style={{
            flex:2.5, padding:"11px 0", borderRadius:10,
            background: saving ? "rgba(26,127,232,0.5)" : "linear-gradient(135deg,#1a7fe8,#1558b0)",
            color:"white", border:"none", cursor: saving ? "wait" : "pointer",
            fontSize:14, fontWeight:800, fontFamily:"K2D,sans-serif",
            boxShadow:"0 4px 16px rgba(26,127,232,0.4)",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          }}>
            {saving
              ? <><span style={{ animation:"spin .8s linear infinite", display:"inline-block" }}>⏳</span> กำลังบันทึก...</>
              : <><span>📥</span> บันทึกเป็นรูปภาพ</>
            }
          </button>
        </div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontFamily:"K2D,sans-serif" }}>
          ความละเอียดสูง 3× • รูปแบบ PNG
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? records.filter(r => r.name.toLowerCase().includes(q) || r.phone.includes(q)) : records;
  }, [records, search]);

  const total = records.reduce((a, r) => a + (+r.price || 0), 0);
  const ch = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = e => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editId !== null) {
      setRecords(rs => rs.map(r => r.id === editId ? { ...form, id: editId } : r));
      setEditId(null);
    } else {
      setRecords(rs => [{ ...form, id: nid.current++ }, ...rs]);
    }
    setForm(EMPTY); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setTab("log");
  };

  const edit = r => { setForm({ ...r }); setEditId(r.id); setTab("form"); window.scrollTo({ top:0, behavior:"smooth" }); };
  const del  = id => { if (confirm("ต้องการลบข้อมูลนี้?")) setRecords(rs => rs.filter(r => r.id !== id)); };

  const days  = Array.from({ length:31 }, (_,i) => i + 1);
  const years = Array.from({ length:10 }, (_,i) => String(now.getFullYear() + 543 - i));

  return (
    <div className="root">
      <style>{css}</style>
      <div className="blob b1"/><div className="blob b2"/><div className="blob b3"/>

{/* HEADER - ปรับเป็นพื้นหลังสีฟ้าเข้มเพื่อให้อ่านง่ายขึ้น */}
      <div style={{ 
        position: "relative", 
        zIndex: 10, 
        background: "linear-gradient(135deg, #1a7fe8 0%, #0d3b7a 100%)", // สีฟ้าเข้มไล่เฉดแบบในรูป
        padding: "25px 20px", 
        boxShadow: "0 4px 20px rgba(13, 59, 122, 0.2)",
        borderBottom: "1px solid rgba(255,255,255,0.1)"
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 15 }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            {/* โลโก้ของคุณ */}
            <img 
              src="/logo22.png" 
              alt="Master Optic Logo" 
              style={{ height: "110px", width: "auto", objectFit: "contain" }} 
            />
            
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 3, fontFamily: "K2D,sans-serif", fontWeight: 600 }}>
                Master Optic Management System
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "K2D,sans-serif" }}>
                {/* ตัวหนังสือเปลี่ยนเป็นสีขาว Shimmer */}
                <span className="shimmer" style={{ color: "#ffffff" }}>MASTER OPTIC</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {/* กล่องสถิติปรับเป็นแบบโปร่งแสงบนพื้นเข้ม */}
            <div className="stat" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", marginBottom: 2 }}>ลูกค้าทั้งหมด</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#ffffff" }}>{records.length}</div>
            </div>
            <div className="stat" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", marginBottom: 2 }}>ยอดรวม</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: "#4ade80" }}>฿{total.toLocaleString("th-TH")}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap">
        {/* TABS */}
        <div style={{ marginBottom:20 }}>
          <div className="tabs">
            {[["form","📝 บันทึกข้อมูล"],["log",`📋 ฐานข้อมูล (${records.length})`]].map(([k,l]) => (
              <button key={k} className={`tab ${tab===k?"tab-on":"tab-off"}`} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>
        </div>

        {/* FORM */}
        {tab === "form" && (
          <form onSubmit={submit}>
            <div className="glass-deep" style={{ overflow:"hidden" }}>
              <div style={{ background:"linear-gradient(135deg,rgba(26,127,232,0.12),rgba(21,88,176,0.08))",borderBottom:"1px solid rgba(26,127,232,0.12)",padding:"14px 22px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div style={{ fontWeight:800,fontSize:15,color:"var(--navy)" }}>
                  {editId ? "✏️ แก้ไขข้อมูลลูกค้า" : "➕ บันทึกประวัติการวัดสายตา"}
                </div>
                {editId && <button type="button" className="btn-ghost2" onClick={() => { setForm(EMPTY); setEditId(null); }}>ยกเลิก</button>}
              </div>

              <div style={{ padding:"22px" }}>
                {/* Row 1 */}
                <div className="g3" style={{ marginBottom:16 }}>
                  {/* Thai date */}
                  <div>
                    <label className="lbl">วันที่</label>
                    <div className="date-row">
                      {[
                        { name:"day",   el: <>{days.map(d => <option key={d} value={d}>{d}</option>)}</> },
                        { name:"month", el: <>{THAI_MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}</> },
                        { name:"year",  el: <>{years.map(y => <option key={y} value={y}>{y}</option>)}</> },
                      ].map(({ name, el }) => (
                        <div key={name} className="sel-wrap">
                          <select name={name} value={form[name]} onChange={ch} className="sel" style={{ paddingRight:28 }}>{el}</select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="lbl">ชื่อลูกค้า</label>
                    <input name="name" value={form.name} onChange={ch} placeholder="กรอกชื่อ-นามสกุล" className="inp"/>
                  </div>

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
                    {["Sphere (SPH)","Cylinder (CYL)","Axis"].map(h => (
                      <div key={h} style={{ fontSize:10,fontWeight:700,color:"var(--t2)",textAlign:"center" }}>{h}</div>
                    ))}
                    <div className="badge-r">R</div>
                    {["rightSphere","rightCylinder","rightAxis"].map(n => (
                      <input key={n} name={n} value={form[n]} onChange={ch} placeholder="–" className="inp" style={{ textAlign:"center",padding:"8px 6px" }}/>
                    ))}
                    <div className="badge-l">L</div>
                    {["leftSphere","leftCylinder","leftAxis"].map(n => (
                      <input key={n} name={n} value={form[n]} onChange={ch} placeholder="–" className="inp" style={{ textAlign:"center",padding:"8px 6px" }}/>
                    ))}
                  </div>
                </div>

                {/* Lens pills */}
                <div style={{ marginBottom:16 }}>
                  <label className="lbl">ชนิดเลนส์</label>
                  <div className="lens-wrap">
                    {LENS_OPTIONS.map(opt => (
                      <button key={opt} type="button"
                        className={`lens-pill${form.lensType === opt ? " active" : ""}`}
                        onClick={() => setForm(f => ({ ...f, lensType: opt }))}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frame + Price */}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 140px",gap:14,marginBottom:20 }}>
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
                  {saved && <span className="toast">✓ บันทึกสำเร็จแล้ว</span>}
                  <button type="submit" className="btn-save">{editId ? "💾 อัปเดตข้อมูล" : "💾 บันทึกข้อมูล"}</button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* LOG */}
        {tab === "log" && (
          <div>
            <div className="glass" style={{ padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10,borderRadius:14 }}>
              <span style={{ color:"var(--blue-lt)",fontSize:17,flexShrink:0 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="ค้นหาจากชื่อลูกค้า หรือ เบอร์โทรศัพท์..."
                style={{ flex:1,background:"none",border:"none",outline:"none",fontSize:14,color:"var(--text)",fontFamily:"K2D,sans-serif" }}/>
              {search && <button onClick={() => setSearch("")} style={{ background:"none",border:"none",color:"var(--t3)",cursor:"pointer",fontSize:15 }}>✕</button>}
              <span style={{ fontSize:12,color:"var(--t3)",flexShrink:0 }}>{filtered.length} รายการ</span>
            </div>

            {/* Desktop table */}
            <div className="glass hide-mob" style={{ overflow:"hidden" }}>
              <div style={{ overflowX:"auto" }}>
                <table className="tbl">
                  <thead>
                    <tr>{["วันที่","ชื่อลูกค้า","ติดต่อ","ค่าสายตา R","ค่าสายตา L","เลนส์","รหัสกรอบ","ราคา",""].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && <tr><td colSpan={9} style={{ textAlign:"center",padding:36,color:"var(--t3)" }}>ไม่พบข้อมูลที่ค้นหา</td></tr>}
                    {filtered.map(r => (
                      <tr key={r.id}>
                        <td style={{ whiteSpace:"nowrap",color:"var(--t2)",fontSize:12 }}>{fmtDate(r)}</td>
                        <td style={{ fontWeight:700,color:"var(--navy)",whiteSpace:"nowrap" }}>{r.name}</td>
                        <td style={{ fontSize:12 }}>
                          <div>{r.phone}</div>
                          {r.lineId && <div style={{ color:"#0284c7",fontSize:11 }}>{r.lineId}</div>}
                        </td>
                        <td style={{ fontSize:12,color:"var(--blue-dk)",whiteSpace:"nowrap" }}>{r.rightSphere||"–"}/{r.rightCylinder||"–"}/{r.rightAxis||"–"}</td>
                        <td style={{ fontSize:12,color:"#047857",whiteSpace:"nowrap"   }}>{r.leftSphere||"–"}/{r.leftCylinder||"–"}/{r.leftAxis||"–"}</td>
                        <td style={{ fontSize:12,color:"var(--t2)" }}>{r.lensType||"–"}</td>
                        <td style={{ fontSize:12,color:"var(--t2)",fontFamily:"monospace,K2D,sans-serif" }}>{r.frame||"–"}</td>
                        <td style={{ fontWeight:800,color:"var(--blue)",whiteSpace:"nowrap" }}>{fmt(r.price)}</td>
                        <td>
                          <div style={{ display:"flex",gap:5 }}>
                            <button className="act-b" onClick={() => setCardRec(r)}>ใบสั่ง</button>
                            <button className="act-g" onClick={() => edit(r)}>แก้ไข</button>
                            <button className="act-r" onClick={() => del(r.id)}>ลบ</button>
                          </div>
                        </td>
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

            {/* Mobile */}
            <div className="show-mob">
              {filtered.length === 0 && <div style={{ textAlign:"center",padding:40,color:"var(--t3)" }}>ไม่พบข้อมูลที่ค้นหา</div>}
              {filtered.map(r => (
                <div key={r.id} className="log-card">
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                    <div style={{ fontWeight:800,fontSize:16,color:"var(--navy)" }}>{r.name}</div>
                    <div style={{ fontWeight:800,color:"var(--blue)" }}>{fmt(r.price)}</div>
                  </div>
                  <div style={{ fontSize:12,color:"var(--t2)",marginBottom:6 }}>{fmtDate(r)} • {r.phone}</div>
                  <div style={{ fontSize:11,color:"var(--t3)",marginBottom:10 }}>
                    R: {r.rightSphere||"–"}/{r.rightCylinder||"–"}/{r.rightAxis||"–"} | L: {r.leftSphere||"–"}/{r.leftCylinder||"–"}/{r.leftAxis||"–"}
                  </div>
                  <div style={{ display:"flex",gap:7 }}>
                    <button className="act-b" style={{ flex:1 }} onClick={() => setCardRec(r)}>ดูใบสั่ง</button>
                    <button className="act-g" style={{ flex:1 }} onClick={() => edit(r)}>แก้ไข</button>
                    <button className="act-r" style={{ flex:1 }} onClick={() => del(r.id)}>ลบ</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {cardRec && <CardModal r={cardRec} onClose={() => setCardRec(null)}/>}
    </div>
  );
}