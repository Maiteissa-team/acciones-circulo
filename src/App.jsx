import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = "https://ymxrybldumxnnsebzjhy.supabase.co";
const SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteHJ5YmxkdW14bm5zZWJ6amh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjU5ODMsImV4cCI6MjA5NTkwMTk4M30.EzNrqLOinF8KvczfDAkZVmTSe9AoxZYLucI4b4fbHjk";
const ADMIN_CODE     = "ESTEFANY2026";
const GUARDIANA_CODE = "GUARDIANAS2026";
const supabase       = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── helpers ────────────────────────────────────────────
function getWeekLabel(dateStr) {
  if (!dateStr) return "Sin fecha";
  const d = new Date(dateStr + "T12:00:00"); // noon to avoid timezone shifts
  // Get Monday of the week (ISO: Mon=1...Sun=7)
  const startOfWeek = (dt) => {
    const d2 = new Date(dt);
    const day = d2.getDay(); // 0=Sun,1=Mon,...,6=Sat
    const diffToMon = day === 0 ? -6 : 1 - day; // Sun goes back 6, others go back to Mon
    d2.setDate(d2.getDate() + diffToMon);
    d2.setHours(0,0,0,0);
    return d2;
  };
  const sw = startOfWeek(new Date());
  const dw = startOfWeek(d);
  const diff = Math.round((dw - sw) / (7*24*3600*1000));
  if (diff === 0) return "Esta semana";
  if (diff === -1) return "Semana pasada";
  if (diff === 1) return "Próxima semana";
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `Semana del ${dw.getDate()} ${months[dw.getMonth()]}`;
}
function daysSince(isoStr) { if (!isoStr) return 999; return Math.floor((Date.now()-new Date(isoStr).getTime())/(1000*3600*24)); }
function isOverdue(dateStr, completed) { if (completed||!dateStr) return false; return new Date(dateStr)<new Date(new Date().toDateString()); }
function streak(actions) {
  if (!actions.length) return 0;
  const startOfWeek=(dt)=>{const d=new Date(dt);d.setDate(d.getDate()-d.getDay()+1);d.setHours(0,0,0,0);return d.getTime();};
  const weeksWithAction=new Set(actions.map(a=>startOfWeek(new Date(a.created_at))));
  let count=0,cur=startOfWeek(new Date());
  while(weeksWithAction.has(cur)){count++;cur-=7*24*3600*1000;} return count;
}

// Calendar helpers
function getDaysInMonth(year, month) { return new Date(year, month+1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { const d=new Date(year,month,1).getDay(); return d===0?6:d-1; }
const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAY_NAMES = ["L","M","X","J","V","S","D"];

// ─── STYLES ─────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#0A0A0A;font-family:'Montserrat',sans-serif;}
  ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#B8960C;border-radius:2px;}

  /* LOGIN */
  .login-wrap{min-height:100vh;background:#0A0A0A;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
  .login-ring{position:absolute;border-radius:50%;border:1px solid rgba(184,150,12,0.07);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;}
  .login-btn{background:transparent;border:1px solid rgba(184,150,12,0.5);color:#B8960C;padding:12px 32px;font-family:'Montserrat',sans-serif;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;cursor:pointer;transition:all 0.3s;width:100%;}
  .login-btn:hover{background:#B8960C;color:#0A0A0A;}
  .login-btn.secondary{border-color:rgba(255,255,255,0.2);color:rgba(255,255,255,0.5);}
  .login-btn.secondary:hover{background:rgba(255,255,255,0.1);color:#fff;}
  .login-btn.ghost{border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.3);font-size:9px;}
  .login-btn.ghost:hover{background:transparent;color:rgba(255,255,255,0.5);}
  .login-input{width:100%;padding:11px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(184,150,12,0.3);color:#fff;font-family:'Montserrat',sans-serif;font-size:13px;outline:none;transition:border 0.2s;}
  .login-input:focus{border-color:#B8960C;} .login-input::placeholder{color:rgba(255,255,255,0.25);}

  /* APP */
  .app{min-height:100vh;background:#FAF7F2;}
  .header{background:#0A0A0A;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 32px;position:sticky;top:0;z-index:100;border-bottom:1px solid rgba(184,150,12,0.2);}
  .header-logo{font-family:'Cormorant Garamond',serif;font-size:11px;letter-spacing:6px;color:rgba(184,150,12,0.7);text-transform:uppercase;}
  .header-title{font-family:'Cormorant Garamond',serif;font-size:19px;color:#fff;font-weight:300;letter-spacing:1px;}
  .sync-dot{width:6px;height:6px;border-radius:50%;background:#B8960C;animation:pulse 2s infinite;}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
  .user-avatar{width:28px;height:28px;border:1px solid #B8960C;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:13px;color:#B8960C;}
  .user-name{font-family:'Montserrat',sans-serif;font-size:10px;color:rgba(255,255,255,0.6);letter-spacing:1px;}
  .exit-btn{background:transparent;border:none;color:rgba(255,255,255,0.3);font-size:10px;cursor:pointer;font-family:'Montserrat',sans-serif;}

  .main{max-width:920px;margin:0 auto;padding:36px 24px 80px;}
  .page-header{border-left:2px solid #B8960C;padding-left:20px;margin-bottom:28px;}
  .page-eyebrow{font-size:9px;letter-spacing:4px;color:#B8960C;text-transform:uppercase;margin-bottom:4px;}
  .page-title{font-family:'Cormorant Garamond',serif;font-size:30px;color:#1E1408;font-weight:400;}
  .page-sub{font-size:11px;color:rgba(30,20,8,0.45);margin-top:6px;}

  /* TABS (member nav) */
  .member-tabs{display:flex;border-bottom:1px solid rgba(184,150,12,0.2);margin-bottom:28px;}
  .mtab{padding:12px 20px;font-family:'Montserrat',sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border:none;background:transparent;color:rgba(30,20,8,0.4);border-bottom:2px solid transparent;margin-bottom:-1px;transition:all 0.2s;}
  .mtab.active{color:#B8960C;border-bottom-color:#B8960C;}
  .mtab:hover:not(.active){color:rgba(30,20,8,0.7);}

  /* BUTTONS */
  .gold-btn{background:#B8960C;border:none;color:#fff;padding:10px 24px;font-family:'Montserrat',sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all 0.2s;}
  .gold-btn:hover{background:#9A7A08;}
  .ghost-btn{background:transparent;border:1px solid rgba(30,20,10,0.2);color:rgba(30,20,10,0.5);padding:10px 24px;font-family:'Montserrat',sans-serif;font-size:10px;letter-spacing:2px;cursor:pointer;transition:all 0.2s;}
  .ghost-btn:hover{border-color:rgba(30,20,10,0.4);color:rgba(30,20,10,0.7);}
  .danger-btn{background:transparent;border:1px solid rgba(192,57,43,0.3);color:#C0392B;padding:8px 12px;font-family:'Montserrat',sans-serif;font-size:10px;cursor:pointer;transition:all 0.2s;}
  .danger-btn:hover{background:#C0392B;color:#fff;}
  .icon-btn{background:transparent;border:1px solid rgba(0,0,0,0.1);color:rgba(0,0,0,0.35);padding:6px 10px;cursor:pointer;font-size:11px;transition:all 0.2s;}
  .icon-btn.edit:hover{border-color:#B8960C;color:#B8960C;}
  .view-toggle{display:flex;gap:0;border:1px solid rgba(184,150,12,0.3);}
  .view-toggle-btn{padding:7px 14px;font-size:11px;cursor:pointer;border:none;background:transparent;color:rgba(30,20,8,0.4);font-family:'Montserrat',sans-serif;transition:all 0.2s;}
  .view-toggle-btn.active{background:#B8960C;color:#fff;}

  /* INPUT */
  .ci{width:100%;padding:10px 14px;background:#fff;border:1px solid rgba(184,150,12,0.3);color:#1E1408;font-family:'Montserrat',sans-serif;font-size:13px;outline:none;transition:border 0.2s;}
  .ci:focus{border-color:#B8960C;} .ci::placeholder{color:rgba(30,20,8,0.3);} select.ci option{background:#fff;color:#1E1408;} textarea.ci{resize:none;line-height:1.6;}

  /* CARDS */
  .card{background:#fff;border:1px solid rgba(184,150,12,0.18);transition:all 0.25s;margin-bottom:8px;}
  .card:hover{border-color:rgba(184,150,12,0.4);box-shadow:0 2px 14px rgba(184,150,12,0.07);}
  .card.overdue{border-left:3px solid #C0392B !important;}
  .add-form{background:#fff;border:1px solid rgba(184,150,12,0.25);padding:24px;margin-bottom:20px;box-shadow:0 4px 20px rgba(184,150,12,0.06);}

  /* ACTION ROW */
  .action-row{display:flex;align-items:flex-start;gap:14px;padding:14px 18px;}
  .check-box{width:22px;height:22px;border:1.5px solid rgba(184,150,12,0.4);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s;background:transparent;margin-top:2px;}
  .check-box.done{background:#B8960C;border-color:#B8960C;}
  .check-box.done::after{content:'✓';color:#fff;font-size:12px;font-weight:700;}
  .check-box.readonly{cursor:default;}
  .action-body{flex:1;min-width:0;}
  .action-name{font-size:10px;letter-spacing:1.5px;color:#B8960C;text-transform:uppercase;margin-bottom:3px;}
  .action-text{font-family:'Cormorant Garamond',serif;font-size:17px;color:#1E1408;line-height:1.3;}
  .action-text.done{color:rgba(30,20,8,0.35);text-decoration:line-through;}
  .action-meta{font-size:10px;color:rgba(30,20,8,0.35);margin-top:4px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
  .overdue-badge{font-size:9px;letter-spacing:1px;color:#C0392B;background:rgba(192,57,43,0.08);padding:2px 6px;text-transform:uppercase;}
  .action-actions{display:flex;gap:6px;flex-shrink:0;align-items:flex-start;padding-top:2px;}

  /* COMMENT */
  .comment-area{padding:0 18px 14px;border-top:1px solid rgba(184,150,12,0.08);}
  .comment-label{font-size:9px;letter-spacing:2px;color:rgba(30,20,8,0.35);text-transform:uppercase;margin-bottom:6px;padding-top:10px;}
  .comment-text{font-size:12px;color:rgba(30,20,8,0.6);font-style:italic;line-height:1.5;}
  .comment-input-row{display:flex;gap:8px;margin-top:8px;}
  .comment-input{flex:1;padding:8px 12px;background:#FAF7F2;border:1px solid rgba(184,150,12,0.2);color:#1E1408;font-family:'Montserrat',sans-serif;font-size:12px;outline:none;}
  .comment-input:focus{border-color:#B8960C;} .comment-input::placeholder{color:rgba(30,20,8,0.25);}
  .comment-send-btn{background:#B8960C;border:none;color:#fff;padding:8px 14px;cursor:pointer;font-size:11px;font-family:'Montserrat',sans-serif;transition:all 0.2s;}
  .comment-send-btn:hover{background:#9A7A08;}

  /* STATS */
  .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px;}
  .stat-card{background:#fff;border:1px solid rgba(184,150,12,0.18);padding:18px 14px;text-align:center;}
  .stat-num{font-family:'Cormorant Garamond',serif;font-size:34px;color:#B8960C;line-height:1;}
  .stat-label{font-size:9px;letter-spacing:2px;color:rgba(30,20,8,0.45);text-transform:uppercase;margin-top:6px;}

  /* FILTERS */
  .filter-row{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;align-items:center;}
  .ftab{padding:6px 16px;font-family:'Montserrat',sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;border:1px solid rgba(184,150,12,0.35);background:transparent;color:rgba(30,20,10,0.45);transition:all 0.2s;}
  .ftab.active{background:#B8960C;color:#fff;border-color:#B8960C;font-weight:600;}
  .ftab:hover:not(.active){border-color:#B8960C;color:#B8960C;}
  .filter-divider{width:1px;height:20px;background:rgba(184,150,12,0.25);}

  .add-trigger{width:100%;padding:13px;border:1px dashed rgba(184,150,12,0.35);background:transparent;color:rgba(184,150,12,0.55);font-size:11px;cursor:pointer;font-family:'Montserrat',sans-serif;letter-spacing:2px;text-transform:uppercase;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:20px;}
  .add-trigger:hover{border-color:#B8960C;color:#B8960C;}

  .empty{text-align:center;padding:48px 0;border:1px dashed rgba(184,150,12,0.2);}
  .empty-icon{font-family:'Cormorant Garamond',serif;font-size:28px;color:rgba(184,150,12,0.3);margin-bottom:8px;}
  .empty-text{font-family:'Cormorant Garamond',serif;font-size:16px;color:rgba(30,20,8,0.3);font-style:italic;}
  .loading{text-align:center;padding:60px 0;font-family:'Cormorant Garamond',serif;font-size:18px;color:rgba(30,20,8,0.3);font-style:italic;}

  /* MODAL */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px;}
  .modal{background:#FAF7F2;border:1px solid rgba(184,150,12,0.3);padding:32px;width:100%;max-width:540px;max-height:90vh;overflow-y:auto;}
  .modal-title{font-family:'Cormorant Garamond',serif;font-size:22px;color:#B8960C;margin-bottom:20px;}

  /* CELEBRATION */
  .celebration-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:300;display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn 0.3s ease;}
  @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
  .celebration-box{background:#0A0A0A;border:1px solid rgba(184,150,12,0.5);padding:48px 40px;text-align:center;max-width:420px;width:100%;position:relative;animation:slideUp 0.4s ease;}
  @keyframes slideUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
  .celebration-emoji{font-size:48px;margin-bottom:16px;animation:bounce 0.6s ease infinite alternate;}
  @keyframes bounce{from{transform:scale(1);}to{transform:scale(1.15);}}
  .celebration-title{font-family:'Cormorant Garamond',serif;font-size:32px;color:#B8960C;margin-bottom:8px;font-weight:300;}
  .celebration-sub{font-family:'Cormorant Garamond',serif;font-size:18px;color:rgba(255,255,255,0.7);font-style:italic;margin-bottom:24px;line-height:1.5;}
  .confetti{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;}
  .confetti-piece{position:absolute;width:8px;height:8px;animation:confettiFall linear forwards;}
  @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1;}100%{transform:translateY(300px) rotate(720deg);opacity:0;}}

  /* CALENDAR */
  .calendar-wrap{background:#fff;border:1px solid rgba(184,150,12,0.18);padding:20px;}
  .cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
  .cal-title{font-family:'Cormorant Garamond',serif;font-size:20px;color:#1E1408;}
  .cal-nav{background:transparent;border:1px solid rgba(184,150,12,0.3);color:#B8960C;width:32px;height:32px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all 0.2s;}
  .cal-nav:hover{background:#B8960C;color:#fff;}
  .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;}
  .cal-day-name{text-align:center;font-size:9px;letter-spacing:2px;color:rgba(30,20,8,0.4);text-transform:uppercase;padding:6px 0;font-family:'Montserrat',sans-serif;}
  .cal-day{min-height:52px;padding:4px;border:1px solid rgba(184,150,12,0.08);position:relative;cursor:default;}
  .cal-day.has-actions{background:rgba(184,150,12,0.04);cursor:pointer;}
  .cal-day.has-actions:hover{background:rgba(184,150,12,0.08);}
  .cal-day.today{border-color:rgba(184,150,12,0.4);}
  .cal-day.empty{background:transparent;border-color:transparent;}
  .cal-day-num{font-size:11px;color:rgba(30,20,8,0.5);margin-bottom:3px;font-family:'Montserrat',sans-serif;}
  .cal-day.today .cal-day-num{color:#B8960C;font-weight:600;}
  .cal-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin:1px;}
  .cal-dot.done{background:#1A6B3C;} .cal-dot.pending{background:#B8960C;} .cal-dot.overdue{background:#C0392B;}
  .cal-day-popup{position:absolute;top:100%;left:0;z-index:50;background:#fff;border:1px solid rgba(184,150,12,0.3);padding:12px;min-width:200px;box-shadow:0 4px 20px rgba(0,0,0,0.1);}
  .cal-popup-item{font-size:12px;color:#1E1408;padding:4px 0;border-bottom:1px solid rgba(184,150,12,0.08);display:flex;align-items:center;gap:6px;}
  .cal-popup-item:last-child{border-bottom:none;}

  /* GOAL SECTION */
  .goal-section{background:#fff;border:1px solid rgba(184,150,12,0.25);padding:28px;box-shadow:0 2px 16px rgba(184,150,12,0.06);}
  .goal-display{font-family:'Cormorant Garamond',serif;font-size:20px;color:#1E1408;line-height:1.6;min-height:60px;font-style:italic;}
  .goal-empty{font-family:'Cormorant Garamond',serif;font-size:18px;color:rgba(30,20,8,0.3);font-style:italic;}
  .goal-edit-area{width:100%;padding:14px;background:#FAF7F2;border:1px solid rgba(184,150,12,0.3);color:#1E1408;font-family:'Cormorant Garamond',serif;font-size:18px;font-style:italic;outline:none;resize:none;line-height:1.6;transition:border 0.2s;}
  .goal-edit-area:focus{border-color:#B8960C;}

  /* GUARDIANA */
  .member-block{background:#fff;border:1px solid rgba(184,150,12,0.18);margin-bottom:12px;overflow:hidden;}
  .member-block.inactive{border-left:3px solid #C0392B;}
  .member-header{display:flex;align-items:center;gap:12px;padding:14px 18px;cursor:pointer;}
  .member-header:hover{background:rgba(184,150,12,0.02);}
  .member-avatar{width:32px;height:32px;border:1px solid #B8960C;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:15px;color:#B8960C;flex-shrink:0;}
  .member-avatar.inactive{border-color:#C0392B;color:#C0392B;}
  .member-info{flex:1;}
  .member-name-lg{font-family:'Cormorant Garamond',serif;font-size:18px;color:#1E1408;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
  .member-counts{font-size:10px;color:rgba(30,20,8,0.4);letter-spacing:0.5px;margin-top:2px;}
  .progress-bar{background:#EEE9E0;height:6px;flex:1;}
  .progress-fill{height:100%;transition:width 0.4s;}
  .inactive-badge{font-size:9px;letter-spacing:1px;color:#C0392B;background:rgba(192,57,43,0.08);padding:2px 7px;text-transform:uppercase;}
  .streak-badge{font-size:9px;letter-spacing:1px;color:#B8960C;background:rgba(184,150,12,0.1);padding:2px 7px;text-transform:uppercase;}
  .week-group{margin:0;}
  .week-label{font-size:9px;letter-spacing:3px;color:#B8960C;text-transform:uppercase;padding:8px 18px;background:rgba(184,150,12,0.04);border-bottom:1px solid rgba(184,150,12,0.08);border-top:1px solid rgba(184,150,12,0.08);}

  /* ADMIN */
  .global-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px;}
  .global-card{background:#0A0A0A;padding:20px 16px;text-align:center;}
  .global-num{font-family:'Cormorant Garamond',serif;font-size:34px;color:#B8960C;line-height:1;}
  .global-label{font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-top:6px;}
  .group-summary-row{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#fff;border:1px solid rgba(184,150,12,0.15);margin-bottom:8px;}
  .group-summary-name{font-family:'Cormorant Garamond',serif;font-size:16px;color:#1E1408;flex:1;}
  .group-summary-num{font-family:'Cormorant Garamond',serif;font-size:22px;color:#B8960C;}
  .group-summary-sub{font-size:9px;color:rgba(30,20,8,0.4);letter-spacing:1px;}
  .group-card{background:#fff;border:1px solid rgba(184,150,12,0.2);padding:20px;margin-bottom:12px;}
  .group-name-lg{font-family:'Cormorant Garamond',serif;font-size:18px;color:#1E1408;margin-bottom:4px;}
  .group-meta-sm{font-size:10px;color:rgba(30,20,8,0.4);letter-spacing:1px;margin-bottom:12px;}
  .member-pill{display:inline-flex;align-items:center;gap:6px;background:#FAF7F2;border:1px solid rgba(184,150,12,0.2);padding:4px 10px;margin:3px;font-size:11px;color:#1E1408;}
  .member-pill button{background:none;border:none;color:rgba(192,57,43,0.5);cursor:pointer;font-size:12px;padding:0;}
  .member-pill button:hover{color:#C0392B;}
  .code-badge{display:inline-block;background:#0A0A0A;color:#B8960C;font-family:'Montserrat',sans-serif;font-size:10px;letter-spacing:3px;padding:3px 8px;}

  .quick-card{background:#fff;border-left:3px solid #B8960C;padding:12px 16px;margin-bottom:6px;display:flex;align-items:flex-start;gap:10px;}
  .quick-done{border-left-color:#1A6B3C;}
  .quick-done .quick-text{color:rgba(30,20,8,0.4);text-decoration:line-through;}
  .quick-text{font-family:'Cormorant Garamond',serif;font-size:15px;color:#1E1408;}
  .export-area{background:#0A0A0A;color:rgba(255,255,255,0.7);font-family:'Montserrat',sans-serif;font-size:11px;padding:16px;line-height:1.8;white-space:pre-wrap;max-height:300px;overflow-y:auto;margin-top:12px;}

  .error-msg{font-size:11px;color:#E74C3C;letter-spacing:0.5px;}

  @media(max-width:640px){
    .stats-row,.global-grid{grid-template-columns:1fr 1fr;}
    .header{padding:0 16px;} .main{padding:24px 16px 60px;}
    .cal-day{min-height:40px;}
  }
`;

// ─── GoldDots ─────────────────────────────────────────
function GoldDots() {
  return (
    <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",overflow:"visible"}}>
      {[[60,80,3],[90,150,2],[35,230,4],[115,55,2],[1320,55,3],[1365,145,4],[1385,225,2]].map(([x,y,r],i)=>
        <circle key={i} cx={x} cy={y} r={r} fill="#B8960C" opacity="0.5"/>)}
    </svg>
  );
}

// ─── Header ───────────────────────────────────────────
function Header({ title, user, onExit }) {
  return (
    <div className="header">
      <div>
        <div className="header-logo">maïté issa</div>
        <div className="header-title">{title}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div className="sync-dot"/>
          <span style={{fontFamily:"'Montserrat',sans-serif",fontSize:9,color:"rgba(184,150,12,0.6)",letterSpacing:1}}>EN VIVO</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div className="user-avatar">{user[0]}</div>
          <span className="user-name">{user}</span>
          <button className="exit-btn" onClick={onExit}>salir</button>
        </div>
      </div>
    </div>
  );
}

// ─── Celebration ──────────────────────────────────────
function Celebration({ onClose }) {
  const pieces = Array.from({length:18}, (_,i) => ({
    left: `${Math.random()*100}%`,
    delay: `${Math.random()*0.5}s`,
    duration: `${0.8+Math.random()*0.8}s`,
    color: ["#B8960C","#FFD700","#fff","#1A6B3C","#F5ECC8"][i%5],
    size: `${6+Math.random()*6}px`,
  }));

  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="celebration-overlay" onClick={onClose}>
      <div className="celebration-box">
        <div className="confetti">
          {pieces.map((p,i) => (
            <div key={i} className="confetti-piece" style={{
              left:p.left, top:"-10px", width:p.size, height:p.size,
              background:p.color, borderRadius:Math.random()>0.5?"50%":"0",
              animationDelay:p.delay, animationDuration:p.duration
            }}/>
          ))}
        </div>
        <div className="celebration-emoji">🌟</div>
        <div className="celebration-title">¡Yayyy!!</div>
        <div className="celebration-sub">
          ¡Enhorabuena Manifestadora!<br/>
          Has cumplido tu compromiso. ✨<br/>
          Sigue así — ¡lo estás haciendo increíble!
        </div>
        <button className="gold-btn" onClick={onClose} style={{fontSize:10,letterSpacing:2}}>
          ¡A por más! ✦
        </button>
      </div>
    </div>
  );
}

// ─── EditModal ─────────────────────────────────────────
function EditModal({ action, onSave, onClose }) {
  const [text, setText] = useState(action.action_text);
  const [date, setDate] = useState(action.action_date);
  const save = async () => {
    if (!text.trim()||!date.trim()) return;
    await supabase.from("actions").update({ action_text:text, action_date:date }).eq("id", action.id);
    onSave(); onClose();
  };
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-title">Editar acción</div>
        <textarea value={text} onChange={e=>setText(e.target.value)} rows={3} className="ci" style={{marginBottom:12}}/>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="ci" style={{marginBottom:20}}/>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button className="ghost-btn" onClick={onClose}>Cancelar</button>
          <button className="gold-btn" onClick={save}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}

// ─── ExportModal ──────────────────────────────────────
function ExportModal({ group, actions, members, onClose }) {
  const thisWeek = actions.filter(a =>
    getWeekLabel(a.action_date)==="Esta semana" ||
    (a.completed && a.completed_at && getWeekLabel(a.completed_at.split("T")[0])==="Esta semana")
  );
  const byMember = {};
  members.forEach(m => { byMember[m.id]={name:m.name,actions:[]}; });
  thisWeek.forEach(a => { if (byMember[a.member_id]) byMember[a.member_id].actions.push(a); });
  const lines = [
    `RESUMEN SEMANAL — ${group.name}`,
    `Guardiana: ${group.guardiana}`,
    `Esta semana · Generado el ${new Date().toLocaleDateString("es-ES")}`,
    "─".repeat(50), "",
  ];
  Object.values(byMember).forEach(({name,actions:acts})=>{
    const done=acts.filter(a=>a.completed).length;
    lines.push(`${name} (${done}/${acts.length} completadas)`);
    if (!acts.length) lines.push("  · Sin acciones esta semana");
    else acts.forEach(a => {
      const completedInfo = a.completed&&a.completed_at ? ` ✓ completada el ${new Date(a.completed_at).toLocaleDateString("es-ES")}` : "";
      const prefix = a.completed?"✓":"○";
      lines.push(`  ${prefix} ${a.action_text} [límite: ${a.action_date}${completedInfo}]`);
    });
    lines.push("");
  });
  lines.push("─".repeat(50));
  lines.push(`Total: ${thisWeek.length} · Completadas: ${thisWeek.filter(a=>a.completed).length}`);
  const text = lines.join("\n");
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-title">Resumen semanal</div>
        <div style={{fontSize:11,color:"rgba(30,20,8,0.5)",marginBottom:12}}>Copia este texto y envíalo a Maïté antes de la sesión de claridad.</div>
        <div className="export-area">{text}</div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
          <button className="ghost-btn" onClick={onClose}>Cerrar</button>
          <button className="gold-btn" onClick={()=>navigator.clipboard.writeText(text)}>Copiar texto</button>
        </div>
      </div>
    </div>
  );
}

// ─── QuickViewModal ───────────────────────────────────
function QuickViewModal({ actions, members, onClose }) {
  const relevantWeeks = ["Esta semana","Semana pasada"];
  const relevant = actions.filter(a =>
    relevantWeeks.includes(getWeekLabel(a.action_date)) ||
    (a.completed&&a.completed_at&&relevantWeeks.includes(getWeekLabel(a.completed_at.split("T")[0])))
  );
  const byMember = {};
  members.forEach(m=>{ byMember[m.id]={name:m.name,actions:[]}; });
  relevant.forEach(a=>{ if(byMember[a.member_id]) byMember[a.member_id].actions.push(a); });
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:620}}>
        <div className="modal-title">Vista rápida — Para la sesión</div>
        <div style={{fontSize:11,color:"rgba(30,20,8,0.5)",marginBottom:20}}>Acciones de esta semana y la anterior.</div>
        <div style={{maxHeight:"60vh",overflowY:"auto"}}>
          {Object.values(byMember).map(({name,actions:acts})=>(
            <div key={name} style={{marginBottom:16}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"#1E1408",borderBottom:"1px solid rgba(184,150,12,0.15)",paddingBottom:4,marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
                {name}
                {acts.length===0&&<span style={{fontSize:11,color:"#C0392B",fontFamily:"'Montserrat',sans-serif",letterSpacing:1}}>SIN ACTIVIDAD</span>}
              </div>
              {acts.length===0&&<div style={{fontSize:12,color:"rgba(30,20,8,0.35)",fontStyle:"italic",paddingLeft:4}}>No hay acciones registradas</div>}
              {acts.map(a=>(
                <div key={a.id} className={`quick-card${a.completed?" quick-done":""}`}>
                  <div style={{fontSize:14,color:a.completed?"#1A6B3C":"rgba(30,20,8,0.3)",flexShrink:0,marginTop:2}}>{a.completed?"✓":"○"}</div>
                  <div><div className="quick-text">{a.action_text}</div><div style={{fontSize:10,color:"rgba(30,20,8,0.35)",marginTop:2}}>{a.action_date}</div></div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}>
          <button className="ghost-btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ─── ActionCard ───────────────────────────────────────
function ActionCard({ action, currentMemberId, onToggle, onEdit, showName=true, isGuardiana=false, onComment }) {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState(action.guardiana_comment||"");
  const isOwn = currentMemberId && action.member_id===currentMemberId;
  const overdue = isOverdue(action.action_date, action.completed);
  const saveComment = async () => {
    await supabase.from("actions").update({guardiana_comment:commentText}).eq("id",action.id);
    if (onComment) onComment(); setShowCommentInput(false);
  };
  return (
    <div className={`card${overdue?" overdue":""}`}>
      <div className="action-row">
        <div className={`check-box${action.completed?" done":""}${!isOwn?" readonly":""}`}
          onClick={()=>isOwn&&onToggle&&onToggle(action)}/>
        <div className="action-body">
          {showName&&<div className="action-name">{action.member_name}</div>}
          <div className={`action-text${action.completed?" done":""}`}>{action.action_text}</div>
          <div className="action-meta">
            <span>📅 {action.action_date}</span>
            {overdue&&<span className="overdue-badge">⚠ Fuera de plazo</span>}
            {action.completed&&action.completed_at&&<span>✓ Completada el {new Date(action.completed_at).toLocaleDateString("es-ES")}</span>}
          </div>
        </div>
        <div className="action-actions">
          {isOwn&&onEdit&&<button className="icon-btn edit" onClick={()=>onEdit(action)} title="Editar">✎</button>}
          {isGuardiana&&<button className="icon-btn edit" onClick={()=>setShowCommentInput(!showCommentInput)} title="Comentar">💬</button>}
        </div>
      </div>
      {(action.guardiana_comment||isGuardiana)&&(
        <div className="comment-area">
          {action.guardiana_comment&&!showCommentInput&&(
            <>
              <div className="comment-label">Nota de tu guardiana</div>
              <div className="comment-text">"{action.guardiana_comment}"</div>
              {isGuardiana&&<button style={{fontSize:10,color:"rgba(184,150,12,0.6)",background:"none",border:"none",cursor:"pointer",marginTop:4,fontFamily:"'Montserrat',sans-serif",letterSpacing:1}} onClick={()=>setShowCommentInput(true)}>Editar nota</button>}
            </>
          )}
          {isGuardiana&&showCommentInput&&(
            <div className="comment-input-row">
              <input className="comment-input" placeholder="Escribe una nota..." value={commentText}
                onChange={e=>setCommentText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveComment()}/>
              <button className="comment-send-btn" onClick={saveComment}>Guardar</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── WeeklyCalendar ──────────────────────────────
function WeeklyCalendar({ actions, currentMemberId }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [popup, setPopup] = useState(null); // {dayIdx, actions}

  // Compute start of current week (Monday) + offset
  const getWeekStart = (offset) => {
    const now = new Date();
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon=0
    const mon = new Date(now); mon.setDate(now.getDate() - day + offset * 7);
    mon.setHours(0,0,0,0); return mon;
  };

  const weekStart = getWeekStart(weekOffset);
  const days = Array.from({length:7}, (_,i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d;
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const DAY_LABELS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  const MONTHS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

  const weekLabel = () => {
    const s = days[0]; const e = days[6];
    if (s.getMonth() === e.getMonth()) return `${s.getDate()}–${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
    return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
  };

  // Map actions by date string
  const byDate = {};
  actions.forEach(a => {
    if (!byDate[a.action_date]) byDate[a.action_date] = [];
    byDate[a.action_date].push(a);
  });

  const fmtDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  return (
    <div style={{background:"#fff",border:"1px solid rgba(184,150,12,0.18)",overflow:"hidden"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid rgba(184,150,12,0.12)"}}>
        <button className="cal-nav" onClick={()=>setWeekOffset(w=>w-1)}>‹</button>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"#1E1408"}}>{weekLabel()}</div>
          {weekOffset!==0&&<button onClick={()=>setWeekOffset(0)} style={{fontSize:9,letterSpacing:2,color:"#B8960C",background:"none",border:"none",cursor:"pointer",fontFamily:"'Montserrat',sans-serif",marginTop:2}}>HOY</button>}
        </div>
        <button className="cal-nav" onClick={()=>setWeekOffset(w=>w+1)}>›</button>
      </div>

      {/* Day columns */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:0}}>
        {days.map((day,i) => {
          const dateStr = fmtDate(day);
          const isToday = dateStr === todayStr;
          const dayActions = byDate[dateStr] || [];
          const isOpen = popup?.dayIdx === i;

          return (
            <div key={i} style={{borderRight:i<6?"1px solid rgba(184,150,12,0.08)":"none",minHeight:120,position:"relative"}}>
              {/* Day header */}
              <div style={{
                padding:"10px 8px 8px",
                borderBottom:"1px solid rgba(184,150,12,0.08)",
                background:isToday?"rgba(184,150,12,0.06)":"transparent",
                textAlign:"center"
              }}>
                <div style={{fontFamily:"'Montserrat',sans-serif",fontSize:9,letterSpacing:2,color:isToday?"#B8960C":"rgba(30,20,8,0.4)",textTransform:"uppercase"}}>{DAY_LABELS[i]}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:isToday?"#B8960C":"#1E1408",marginTop:2,fontWeight:isToday?600:300}}>{day.getDate()}</div>
              </div>

              {/* Actions */}
              <div style={{padding:"6px 4px"}}>
                {dayActions.length === 0 && (
                  <div style={{height:40}}/>
                )}
                {dayActions.slice(0,3).map((a,idx) => {
                  const isOwn = a.member_id === currentMemberId;
                  const done = a.completed;
                  const over = isOverdue(a.action_date, a.completed);
                  return (
                    <div key={idx}
                      onClick={()=>setPopup(isOpen?null:{dayIdx:i,actions:dayActions})}
                      style={{
                        padding:"4px 6px",marginBottom:3,cursor:"pointer",
                        background:done?"rgba(26,107,60,0.08)":over?"rgba(192,57,43,0.08)":"rgba(184,150,12,0.08)",
                        borderLeft:`2px solid ${done?"#1A6B3C":over?"#C0392B":"#B8960C"}`,
                        borderRadius:0,
                      }}>
                      <div style={{fontFamily:"'Montserrat',sans-serif",fontSize:8,letterSpacing:1,color:done?"#1A6B3C":over?"#C0392B":"#B8960C",textTransform:"uppercase",marginBottom:1}}>
                        {isOwn?"Yo":a.member_name.split(" ")[0]}
                      </div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:12,color:done?"rgba(30,20,8,0.45)":"#1E1408",lineHeight:1.2,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",textDecoration:done?"line-through":"none"}}>
                        {a.action_text}
                      </div>
                    </div>
                  );
                })}
                {dayActions.length > 3 && (
                  <div onClick={()=>setPopup({dayIdx:i,actions:dayActions})}
                    style={{fontSize:9,color:"#B8960C",cursor:"pointer",padding:"2px 6px",letterSpacing:1,fontFamily:"'Montserrat',sans-serif"}}>
                    +{dayActions.length-3} más
                  </div>
                )}
              </div>

{/* Popup rendered outside column via portal-style fixed overlay */}
            </div>
          );
        })}
      </div>

      {/* Day popup — rendered at calendar level to avoid clipping */}
      {popup && (
        <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"rgba(0,0,0,0.25)"}}
          onClick={()=>setPopup(null)}>
          <div style={{background:"#fff",border:"1px solid rgba(184,150,12,0.3)",padding:20,width:"100%",maxWidth:340,maxHeight:"70vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(0,0,0,0.18)"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontFamily:"'Montserrat',sans-serif",fontSize:9,letterSpacing:2,color:"#B8960C",textTransform:"uppercase"}}>
                {DAY_LABELS[popup.dayIdx]} {days[popup.dayIdx].getDate()} {MONTHS[days[popup.dayIdx].getMonth()]}
              </div>
              <button onClick={()=>setPopup(null)} style={{background:"none",border:"none",color:"rgba(30,20,8,0.3)",cursor:"pointer",fontSize:16,lineHeight:1}}>✕</button>
            </div>
            {popup.actions.map((a,idx) => {
              const isOwn = a.member_id === currentMemberId;
              const done = a.completed;
              const over = isOverdue(a.action_date, a.completed);
              return (
                <div key={idx} style={{marginBottom:12,paddingBottom:12,borderBottom:idx<popup.actions.length-1?"1px solid rgba(184,150,12,0.1)":"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <div style={{width:20,height:20,border:`1.5px solid ${done?"#1A6B3C":over?"#C0392B":"rgba(184,150,12,0.4)"}`,background:done?"#1A6B3C":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {done&&<span style={{color:"#fff",fontSize:11,fontWeight:700}}>✓</span>}
                    </div>
                    <span style={{fontFamily:"'Montserrat',sans-serif",fontSize:9,letterSpacing:1.5,color:done?"#1A6B3C":over?"#C0392B":"#B8960C",textTransform:"uppercase",fontWeight:600}}>
                      {isOwn?"Yo ✦":a.member_name}
                    </span>
                  </div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:done?"rgba(30,20,8,0.4)":"#1E1408",lineHeight:1.5,textDecoration:done?"line-through":"none",paddingLeft:28}}>
                    {a.action_text}
                  </div>
                  {over&&<div style={{fontSize:9,color:"#C0392B",letterSpacing:1,marginTop:4,paddingLeft:28,fontFamily:"'Montserrat',sans-serif"}}>⚠ FUERA DE PLAZO</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{display:"flex",gap:16,padding:"10px 16px",borderTop:"1px solid rgba(184,150,12,0.08)"}}>
        {[["#1A6B3C","Completada"],["#B8960C","Pendiente"],["#C0392B","Fuera de plazo"]].map(([c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:8,height:8,background:c}}/>
            <span style={{fontSize:9,color:"rgba(30,20,8,0.5)",fontFamily:"'Montserrat',sans-serif",letterSpacing:0.5}}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GoalSection ──────────────────────────────────────────
function GoalSection({ member, groupId }) {
  const [myGoal, setMyGoal] = useState(null);
  const [allGoals, setAllGoals] = useState([]);
  const [goalComments, setGoalComments] = useState({}); // member_id -> comment_text
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: mine } = await supabase.from("member_goals").select("*").eq("member_id", member.id).single();
    if (mine) { setMyGoal(mine); setText(mine.goal_text); }

    const { data: members } = await supabase.from("members").select("*").eq("group_id", groupId);
    if (members) {
      const ids = members.map(m => m.id);
      const { data: goals } = await supabase.from("member_goals").select("*, members(name)").in("member_id", ids);
      if (goals) setAllGoals(goals.filter(g => g.member_id !== member.id && g.goal_text));

      // Load guardiana comments for all goals in group
      const { data: comments } = await supabase.from("goal_comments").select("*").in("member_id", ids);
      if (comments) {
        const map = {};
        comments.forEach(c => { map[c.member_id] = c.comment_text; });
        setGoalComments(map);
      }
    }
    setLoading(false);
  }, [member.id, groupId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!text.trim()) return;
    if (myGoal) {
      await supabase.from("member_goals").update({ goal_text: text, updated_at: new Date().toISOString() }).eq("id", myGoal.id);
    } else {
      await supabase.from("member_goals").insert({ member_id: member.id, goal_text: text });
    }
    setEditing(false); load();
  };

  if (loading) return <div className="loading" style={{padding:"32px 0"}}>Cargando...</div>;

  return (
    <div>
      <div className="page-header" style={{marginBottom:20}}>
        <div className="page-eyebrow">Mi propósito</div>
        <div className="page-title">Objetivos de Manifestadora Experta</div>
        <div className="page-sub">Comparte tu objetivo claro y poderoso con el grupo.</div>
      </div>

      {/* MY GOAL */}
      <div className="goal-section" style={{marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{width:32,height:32,border:"1px solid #B8960C",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"#B8960C",flexShrink:0}}>{member.name[0]}</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"#1E1408"}}>{member.name}</div>
          {/* Notification badge if guardiana left a comment */}
          {goalComments[member.id] && (
            <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(184,150,12,0.1)",border:"1px solid rgba(184,150,12,0.4)",padding:"3px 10px"}}>
              <span style={{fontSize:11}}>💬</span>
              <span style={{fontFamily:"'Montserrat',sans-serif",fontSize:9,letterSpacing:1.5,color:"#B8960C",textTransform:"uppercase"}}>Tu guardiana te ha dejado una nota</span>
            </div>
          )}
          <div style={{flex:1,height:1,background:"linear-gradient(90deg,rgba(184,150,12,0.3),transparent)"}}/>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:11,color:"rgba(184,150,12,0.6)",letterSpacing:3}}>✦</div>
        </div>

        {!editing ? (
          <>
            {myGoal?.goal_text
              ? <div className="goal-display">"{myGoal.goal_text}"</div>
              : <div className="goal-empty">Aún no has definido tu objetivo. Tómate un momento y comparte con tus compis. ¿Cuál es tu objetivo de Manifestadora Experta?</div>}
            {myGoal?.updated_at && (
              <div style={{fontSize:10,color:"rgba(30,20,8,0.3)",marginTop:10,letterSpacing:0.5}}>
                Última actualización: {new Date(myGoal.updated_at).toLocaleDateString("es-ES")}
              </div>
            )}
            <div style={{marginTop:16}}>
              <button className="gold-btn" onClick={()=>setEditing(true)}>
                {myGoal?.goal_text ? "Actualizar mi objetivo" : "Definir mi objetivo ✦"}
              </button>
            </div>
          </>
        ) : (
          <>
            <textarea className="goal-edit-area" rows={4} value={text}
              onChange={e=>setText(e.target.value)}
              placeholder="Escribe aquí tu objetivo de Manifestadora Experta..."
              autoFocus/>
            <div style={{display:"flex",gap:10,marginTop:14}}>
              <button className="ghost-btn" onClick={()=>{setEditing(false);setText(myGoal?.goal_text||"");}}>Cancelar</button>
              <button className="gold-btn" onClick={save}>Guardar mi objetivo ✦</button>
            </div>
          </>
        )}

        {/* Guardiana comment on MY goal */}
        {goalComments[member.id] && (
          <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid rgba(184,150,12,0.15)"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:14}}>💬</span>
              <span style={{fontFamily:"'Montserrat',sans-serif",fontSize:9,letterSpacing:2,color:"#B8960C",textTransform:"uppercase"}}>Nota de tu guardiana</span>
            </div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"#1E1408",fontStyle:"italic",lineHeight:1.6,paddingLeft:22}}>
              "{goalComments[member.id]}"
            </div>
          </div>
        )}
      </div>

      {/* Motivational message */}
      {myGoal?.goal_text && (
        <div style={{marginTop:16,padding:"18px 24px",background:"#0A0A0A",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,right:0,fontFamily:"'Cormorant Garamond',serif",fontSize:80,color:"rgba(184,150,12,0.06)",lineHeight:1,pointerEvents:"none",userSelect:"none"}}>✦</div>
          <div style={{fontFamily:"'Montserrat',sans-serif",fontSize:9,letterSpacing:4,color:"rgba(184,150,12,0.6)",textTransform:"uppercase",marginBottom:8}}>Recuerda</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"rgba(255,255,255,0.85)",lineHeight:1.75,fontStyle:"italic",position:"relative",zIndex:1}}>
            Este es tu compromiso contigo misma.<br/>
            <span style={{color:"#B8960C"}}>Cada acción que tomas desde hoy te acerca un paso más a vivir la vida que ya sabes que es para ti.</span>
          </div>
        </div>
      )}

      {/* GROUP GOALS */}
      {allGoals.length > 0 && (
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"#1E1408",marginBottom:16,borderBottom:"1px solid rgba(184,150,12,0.15)",paddingBottom:8,display:"flex",alignItems:"center",gap:10}}>
            El objetivo de tus compañeras
            <span style={{fontFamily:"'Montserrat',sans-serif",fontSize:9,letterSpacing:2,color:"rgba(184,150,12,0.6)",textTransform:"uppercase"}}>({allGoals.length})</span>
          </div>
          {allGoals.map(g => (
            <div key={g.id} style={{background:"#fff",border:"1px solid rgba(184,150,12,0.15)",padding:"18px 20px",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{width:26,height:26,border:"1px solid rgba(184,150,12,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:"#B8960C",flexShrink:0}}>{g.members?.name?.[0]||"?"}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:"rgba(30,20,8,0.6)",letterSpacing:0.5}}>{g.members?.name||"Compañera"}</div>
              </div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"#1E1408",fontStyle:"italic",lineHeight:1.5,paddingLeft:36}}>
                "{g.goal_text}"
              </div>
              {goalComments[g.member_id] && (
                <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(184,150,12,0.1)",paddingLeft:36}}>
                  <div style={{fontSize:9,letterSpacing:2,color:"rgba(30,20,8,0.35)",textTransform:"uppercase",fontFamily:"'Montserrat',sans-serif",marginBottom:4}}>Nota de tu guardiana</div>
                  <div style={{fontSize:12,color:"rgba(30,20,8,0.6)",fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",fontSize:15,lineHeight:1.5}}>"{goalComments[g.member_id]}"</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {allGoals.length === 0 && myGoal?.goal_text && (
        <div style={{textAlign:"center",padding:"32px 0",border:"1px dashed rgba(184,150,12,0.2)"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"rgba(30,20,8,0.3)",fontStyle:"italic"}}>Aún no hay objetivos de otras compañeras</div>
        </div>
      )}

    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("select");
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [members, setMembers] = useState([]);
  const [code, setCode] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");

  useEffect(()=>{ supabase.from("groups").select("*").order("name").then(({data})=>{ if(data) setGroups(data); }); },[]);
  useEffect(()=>{
    if(!selectedGroup) return setMembers([]);
    supabase.from("members").select("*").eq("group_id",selectedGroup).order("name").then(({data})=>{ if(data) setMembers(data); });
  },[selectedGroup]);

  const handleMemberLogin = ()=>{
    if(!selectedGroup||!selectedMember) return setError("Selecciona tu grupo y tu nombre.");
    const grp=groups.find(g=>g.id==selectedGroup); const mbr=members.find(m=>m.id==selectedMember);
    if(!grp||!mbr) return setError("Selección no válida.");
    onLogin({role:"member",group:grp,member:mbr});
  };
  const handleGuardianaLogin = ()=>{
    if(!selectedGroup) return setError("Selecciona tu grupo.");
    if(code!==GUARDIANA_CODE) return setError("Código incorrecto.");
    onLogin({role:"guardiana",group:groups.find(g=>g.id==selectedGroup),member:null});
  };
  const handleAdminLogin = ()=>{
    if(adminCode===ADMIN_CODE) onLogin({role:"admin",group:null,member:null});
    else setError("Código incorrecto.");
  };

  return (
    <div className="login-wrap">
      <GoldDots/>
      {[700,500,320].map(s=><div key={s} className="login-ring" style={{width:s,height:s}}/>)}
      <div style={{textAlign:"center",color:"#fff",position:"relative",zIndex:2,padding:"0 24px",width:"100%",maxWidth:420}}>
        <div style={{fontFamily:"'Montserrat',sans-serif",fontSize:9,letterSpacing:7,color:"rgba(184,150,12,0.7)",textTransform:"uppercase",marginBottom:10}}>Maïté Issa</div>
        <div style={{width:48,height:1,background:"linear-gradient(90deg,transparent,#B8960C,transparent)",margin:"0 auto 16px"}}/>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,letterSpacing:5,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",marginBottom:6}}>El Círculo</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:44,fontWeight:300,color:"#fff",lineHeight:1.05,marginBottom:8}}>Mis Acciones</div>
        <div style={{width:48,height:1,background:"linear-gradient(90deg,transparent,#B8960C,transparent)",margin:"0 auto 36px"}}/>

        {mode==="select"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <button className="login-btn" onClick={()=>{setMode("member");setError("");}}>Soy alumna</button>
            <button className="login-btn secondary" onClick={()=>{setMode("guardiana");setError("");}}>Soy guardiana</button>
            <button className="login-btn ghost" onClick={()=>{setMode("admin");setError("");}}>Admin</button>
          </div>
        )}
        {mode==="member"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <select className="login-input" value={selectedGroup} onChange={e=>{setSelectedGroup(e.target.value);setSelectedMember("");}}>
              <option value="">Selecciona tu grupo...</option>
              {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            {members.length>0&&(
              <select className="login-input" value={selectedMember} onChange={e=>setSelectedMember(e.target.value)}>
                <option value="">Selecciona tu nombre...</option>
                {members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}
            {error&&<div className="error-msg">{error}</div>}
            <button className="login-btn" onClick={handleMemberLogin}>Entrar</button>
            <button className="login-btn ghost" onClick={()=>setMode("select")}>← Volver</button>
          </div>
        )}
        {mode==="guardiana"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <select className="login-input" value={selectedGroup} onChange={e=>setSelectedGroup(e.target.value)}>
              <option value="">Selecciona tu grupo...</option>
              {groups.map(g=><option key={g.id} value={g.id}>{g.name} — {g.guardiana}</option>)}
            </select>
            <input className="login-input" type="password" placeholder="Código de guardiana..." value={code}
              onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleGuardianaLogin()}/>
            {error&&<div className="error-msg">{error}</div>}
            <button className="login-btn" onClick={handleGuardianaLogin}>Entrar como guardiana</button>
            <button className="login-btn ghost" onClick={()=>setMode("select")}>← Volver</button>
          </div>
        )}
        {mode==="admin"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <input className="login-input" type="password" placeholder="Código de admin..." value={adminCode}
              onChange={e=>setAdminCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdminLogin()}/>
            {error&&<div className="error-msg">{error}</div>}
            <button className="login-btn" onClick={handleAdminLogin}>Entrar</button>
            <button className="login-btn ghost" onClick={()=>setMode("select")}>← Volver</button>
          </div>
        )}
        <div style={{marginTop:36,fontSize:9,color:"rgba(255,255,255,0.15)",letterSpacing:3,textTransform:"uppercase"}}>Mentoría Personalizada · 2026</div>
      </div>
    </div>
  );
}

// ─── GoalNotificationDot ─────────────────────────────────
function GoalNotificationDot({ memberId }) {
  const [hasComment, setHasComment] = useState(false);
  useEffect(() => {
    supabase.from("goal_comments").select("id").eq("member_id", memberId).single()
      .then(({ data }) => { if (data) setHasComment(true); });
  }, [memberId]);
  if (!hasComment) return null;
  return (
    <span style={{
      display:"inline-block", width:8, height:8, borderRadius:"50%",
      background:"#C0392B", flexShrink:0,
      animation:"pulse 2s infinite"
    }}/>
  );
}

// ─── MEMBER VIEW ──────────────────────────────────────
function MemberView({ session, onExit }) {
  const { group, member } = session;
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list"); // list | calendar
  const [activeTab, setActiveTab] = useState("actions"); // actions | goal
  const [editingAction, setEditingAction] = useState(null);
  const [celebration, setCelebration] = useState(false);
  const [newAction, setNewAction] = useState({ action_text:"", action_date:"" });

  const loadActions = useCallback(async () => {
    const { data } = await supabase.from("actions").select("*")
      .eq("group_id", group.id).order("created_at", { ascending:false });
    if (data) setActions(data); setLoading(false);
  }, [group.id]);

  useEffect(()=>{
    loadActions();
    const sub = supabase.channel(`member-${group.id}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"actions",filter:`group_id=eq.${group.id}`},loadActions)
      .subscribe();
    return ()=>supabase.removeChannel(sub);
  },[loadActions]);

  const addAction = async () => {
    if(!newAction.action_text.trim()||!newAction.action_date.trim()) return;
    const { data } = await supabase.from("actions").insert({
      group_id:group.id, member_id:member.id, member_name:member.name,
      action_text:newAction.action_text, action_date:newAction.action_date, completed:false
    }).select().single();
    if (data) { setActions(prev=>[data,...prev]); setNewAction({action_text:"",action_date:""}); setShowAdd(false); }
  };

  const toggleComplete = async (action) => {
    const newVal = !action.completed;
    setActions(prev=>prev.map(a=>a.id===action.id?{...a,completed:newVal,completed_at:newVal?new Date().toISOString():null}:a));
    await supabase.from("actions").update({completed:newVal,completed_at:newVal?new Date().toISOString():null}).eq("id",action.id);
    if (newVal) setCelebration(true);
  };

  const myActions = actions.filter(a=>a.member_id===member.id);
  const myDone = myActions.filter(a=>a.completed).length;
  const myStreak = streak(myActions);
  const overdueCount = myActions.filter(a=>isOverdue(a.action_date,a.completed)).length;

  const displayed = filter==="all"?actions
    :filter==="mine"?myActions
    :filter==="pending"?actions.filter(a=>!a.completed)
    :filter==="overdue"?actions.filter(a=>isOverdue(a.action_date,a.completed))
    :actions.filter(a=>a.completed);

  return (
    <div className="app">
      {celebration&&<Celebration onClose={()=>setCelebration(false)}/>}
      {editingAction&&<EditModal action={editingAction} onSave={loadActions} onClose={()=>setEditingAction(null)}/>}
      <Header title={group.name} user={member.name} onExit={onExit}/>
      <div className="main">
        <div className="page-header">
          <div className="page-eyebrow">El Círculo · {group.guardiana}</div>
          <div className="page-title">{member.name}</div>
          <div className="page-sub">{group.name}</div>
        </div>

        {/* TABS */}
        <div className="member-tabs">
          <button className={`mtab${activeTab==="actions"?" active":""}`} onClick={()=>setActiveTab("actions")}>
            Mis acciones de Manifestadora Experta
          </button>
          <button className={`mtab${activeTab==="goal"?" active":""}`} onClick={()=>setActiveTab("goal")}
            style={{position:"relative",display:"flex",alignItems:"center",gap:6}}>
            Mi objetivo ✦
            <GoalNotificationDot memberId={member.id}/>
          </button>
        </div>

        {/* ACTIONS TAB */}
        {activeTab==="actions"&&(
          <>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-num">{myActions.length}</div>
                <div className="stat-label">Mis acciones</div>
              </div>
              <div className="stat-card">
                <div className="stat-num" style={{color:myDone===myActions.length&&myActions.length>0?"#1A6B3C":"#B8960C"}}>{myDone}</div>
                <div className="stat-label">Completadas</div>
              </div>
              <div className="stat-card">
                <div className="stat-num" style={{color:overdueCount>0?"#C0392B":"#B8960C"}}>{overdueCount}</div>
                <div className="stat-label">Fuera de plazo</div>
              </div>
              <div className="stat-card">
                <div className="stat-num" style={{color:myStreak>0?"#1A6B3C":"#B8960C"}}>🔥 {myStreak}</div>
                <div className="stat-label">Semanas seguidas</div>
              </div>
            </div>

            <button className="add-trigger" onClick={()=>setShowAdd(!showAdd)}>✦ Añadir mi acción</button>

            {showAdd&&(
              <div className="add-form">
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"#B8960C",marginBottom:16}}>Nueva acción</div>
                <textarea placeholder="¿Qué acción vas a tomar? Sé específica..."
                  value={newAction.action_text} onChange={e=>setNewAction(p=>({...p,action_text:e.target.value}))}
                  rows={3} className="ci" style={{marginBottom:12}}/>
                <input type="date" value={newAction.action_date} onChange={e=>setNewAction(p=>({...p,action_date:e.target.value}))}
                  className="ci" style={{marginBottom:16}}/>
                <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                  <button className="ghost-btn" onClick={()=>setShowAdd(false)}>Cancelar</button>
                  <button className="gold-btn" onClick={addAction}>Me comprometo ✦</button>
                </div>
              </div>
            )}

            {/* Filter + view toggle */}
            <div className="filter-row">
              {[["all","Todas"],["mine","Las mías"],["pending","Pendientes"],["done","Completadas"],["overdue","Fuera de plazo"]].map(([id,label])=>(
                <button key={id} className={`ftab${filter===id?" active":""}`} onClick={()=>setFilter(id)}>{label}</button>
              ))}
              <div style={{marginLeft:"auto"}}>
                <div className="view-toggle">
                  <button className={`view-toggle-btn${viewMode==="list"?" active":""}`} onClick={()=>setViewMode("list")} title="Vista lista">☰</button>
                  <button className={`view-toggle-btn${viewMode==="calendar"?" active":""}`} onClick={()=>setViewMode("calendar")} title="Vista calendario">▦</button>
                </div>
              </div>
            </div>

            {loading&&<div className="loading">Cargando acciones...</div>}

            {!loading&&viewMode==="calendar"&&(
              <WeeklyCalendar actions={actions} currentMemberId={member.id}/>
            )}

            {!loading&&viewMode==="list"&&(
              <>
                {displayed.length===0&&<div className="empty"><div className="empty-icon">✦</div><div className="empty-text">No hay acciones aquí todavía</div></div>}
                {displayed.map(action=>(
                  <ActionCard key={action.id} action={action} currentMemberId={member.id}
                    onToggle={toggleComplete} onEdit={setEditingAction}/>
                ))}
              </>
            )}
          </>
        )}

        {/* GOAL TAB */}
        {activeTab==="goal"&&<GoalSection member={member} groupId={group.id}/>}
      </div>
    </div>
  );
}

// ─── GoalCommentsPanel (Guardiana) ────────────────────────
function GoalCommentsPanel({ memberStats, groupId }) {
  const [comments, setComments] = useState({});   // member_id -> text
  const [editing, setEditing]   = useState(null); // member_id being edited
  const [draft, setDraft]       = useState("");

  const loadComments = useCallback(async () => {
    const ids = memberStats.map(s => s.member.id);
    const { data } = await supabase.from("goal_comments").select("*").in("member_id", ids);
    if (data) {
      const map = {};
      data.forEach(c => { map[c.member_id] = c.comment_text; });
      setComments(map);
    }
  }, [memberStats]);

  useEffect(() => { loadComments(); }, [loadComments]);

  const saveComment = async (memberId) => {
    const existing = await supabase.from("goal_comments").select("id").eq("member_id", memberId).single();
    if (existing.data) {
      await supabase.from("goal_comments").update({ comment_text: draft }).eq("id", existing.data.id);
    } else {
      await supabase.from("goal_comments").insert({ member_id: memberId, group_id: groupId, comment_text: draft });
    }
    setEditing(null); setDraft(""); loadComments();
  };

  const defined = memberStats.filter(s => s.hasGoal).length;

  return (
    <div>
      <div style={{marginBottom:20,fontSize:11,color:"rgba(30,20,8,0.45)"}}>
        {defined}/{memberStats.length} alumnas han definido su objetivo
      </div>
      {memberStats.map(s => (
        <div key={s.member.id} style={{background:"#fff",border:`1px solid ${s.hasGoal?"rgba(184,150,12,0.2)":"rgba(192,57,43,0.2)"}`,padding:"18px 20px",marginBottom:8}}>
          {/* Header */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:s.hasGoal?10:0}}>
            <div style={{width:28,height:28,border:`1px solid ${s.hasGoal?"#B8960C":"#C0392B"}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:s.hasGoal?"#B8960C":"#C0392B",flexShrink:0}}>{s.member.name[0]}</div>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"#1E1408",flex:1}}>{s.member.name}</span>
            {!s.hasGoal && <span style={{fontSize:9,letterSpacing:1.5,color:"#C0392B",background:"rgba(192,57,43,0.08)",padding:"2px 7px",fontFamily:"'Montserrat',sans-serif",textTransform:"uppercase"}}>Sin definir</span>}
            {s.hasGoal && (
              <button className="icon-btn edit" style={{fontSize:10,padding:"5px 10px"}}
                onClick={()=>{ setEditing(s.member.id); setDraft(comments[s.member.id]||""); }}>
                💬 {comments[s.member.id] ? "Editar nota" : "Añadir nota"}
              </button>
            )}
          </div>

          {/* Goal text */}
          {s.hasGoal && (
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"#1E1408",fontStyle:"italic",lineHeight:1.6,paddingLeft:38,marginBottom:comments[s.member.id]||editing===s.member.id?10:0}}>
              "{s.goal}"
            </div>
          )}

          {/* Existing comment */}
          {comments[s.member.id] && editing !== s.member.id && (
            <div style={{paddingLeft:38,paddingTop:8,borderTop:"1px solid rgba(184,150,12,0.1)",marginTop:8}}>
              <div style={{fontSize:9,letterSpacing:2,color:"rgba(30,20,8,0.35)",textTransform:"uppercase",fontFamily:"'Montserrat',sans-serif",marginBottom:4}}>Tu nota</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"rgba(30,20,8,0.6)",fontStyle:"italic",lineHeight:1.5}}>"{comments[s.member.id]}"</div>
            </div>
          )}

          {/* Edit comment input */}
          {editing === s.member.id && (
            <div style={{paddingLeft:38,paddingTop:8,borderTop:"1px solid rgba(184,150,12,0.1)",marginTop:8}}>
              <div className="comment-input-row">
                <input className="comment-input"
                  placeholder="Escribe una nota sobre el objetivo de esta alumna..."
                  value={draft} onChange={e=>setDraft(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&saveComment(s.member.id)}
                  autoFocus/>
                <button className="comment-send-btn" onClick={()=>saveComment(s.member.id)}>Guardar</button>
                <button onClick={()=>setEditing(null)} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(30,20,8,0.4)",fontSize:16,padding:"0 6px"}}>✕</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── GUARDIANA VIEW ───────────────────────────────────
function GuardianaView({ session, onExit }) {
  const { group } = session;
  const [actions, setActions]           = useState([]);
  const [members, setMembers]           = useState([]);
  const [goals, setGoals]               = useState([]);
  const [memberNotes, setMemberNotes]   = useState({}); // { member_id: note_text }
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState("acciones");
  const [filter, setFilter]             = useState("all");
  const [weekFilter, setWeekFilter]     = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [expandedMembers, setExpandedMembers] = useState({});
  const [showQuickView, setShowQuickView]     = useState(false);
  const [showExport, setShowExport]           = useState(false);
  const [editingNote, setEditingNote]         = useState(null); // member_id
  const [noteText, setNoteText]               = useState("");

  const [allGroups, setAllGroups]   = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [allActions, setAllActions] = useState([]);

  const loadAll = useCallback(async () => {
    const [{ data:a },{ data:m },{ data:g },{ data:n },{ data:ag },{ data:am },{ data:aa }] = await Promise.all([
      supabase.from("actions").select("*").eq("group_id", group.id).order("action_date", { ascending:true }),
      supabase.from("members").select("*").eq("group_id", group.id).order("name"),
      supabase.from("member_goals").select("*, members(name)").in("member_id",
        (await supabase.from("members").select("id").eq("group_id", group.id)).data?.map(x=>x.id) || []
      ),
      supabase.from("guardiana_notes").select("*").eq("group_id", group.id),
      // All groups for team view
      supabase.from("groups").select("*").order("name"),
      supabase.from("members").select("*"),
      supabase.from("actions").select("*"),
    ]);
    if (a) setActions(a);
    if (m) { setMembers(m); const exp={}; m.forEach(mb=>{exp[mb.id]=true;}); setExpandedMembers(exp); }
    if (g) setGoals(g);
    if (n) { const map={}; n.forEach(x=>{map[x.member_id]=x.note_text;}); setMemberNotes(map); }
    if (ag) setAllGroups(ag);
    if (am) setAllMembers(am);
    if (aa) setAllActions(aa);
    setLoading(false);
  }, [group.id]);

  useEffect(() => {
    loadAll();
    const sub = supabase.channel(`guard-${group.id}`)
      .on("postgres_changes", {event:"*",schema:"public",table:"actions",filter:`group_id=eq.${group.id}`}, loadAll)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [loadAll]);

  const saveNote = async (memberId) => {
    const existing = await supabase.from("guardiana_notes").select("id").eq("member_id", memberId).eq("group_id", group.id).single();
    if (existing.data) {
      await supabase.from("guardiana_notes").update({ note_text: noteText }).eq("id", existing.data.id);
    } else {
      await supabase.from("guardiana_notes").insert({ member_id: memberId, group_id: group.id, note_text: noteText });
    }
    setEditingNote(null); setNoteText(""); loadAll();
  };

  // Derived data
  const lastActionDate = {};
  actions.forEach(a => { if (!lastActionDate[a.member_id] || new Date(a.created_at) > new Date(lastActionDate[a.member_id])) lastActionDate[a.member_id] = a.created_at; });

  const totalDone    = actions.filter(a=>a.completed).length;
  const overdueTotal = actions.filter(a=>isOverdue(a.action_date,a.completed)).length;
  const inactiveCount = members.filter(m=>!lastActionDate[m.id]||daysSince(lastActionDate[m.id])>7).length;
  const allWeeks = [...new Set(actions.map(a=>getWeekLabel(a.action_date)))];

  // Member stats for summary tab
  const memberStats = members.map(m => {
    const mActions = actions.filter(a=>a.member_id===m.id);
    const mDone = mActions.filter(a=>a.completed).length;
    const mThisWeek = mActions.filter(a=>getWeekLabel(a.action_date)==="Esta semana"||
      (a.completed&&a.completed_at&&getWeekLabel(a.completed_at.split("T")[0])==="Esta semana"));
    const mStreak = streak(mActions);
    const mGoal = goals.find(g=>g.member_id===m.id);
    const mInactive = !lastActionDate[m.id]||daysSince(lastActionDate[m.id])>7;
    const mNote = memberNotes[m.id];
    return { member:m, total:mActions.length, done:mDone, thisWeek:mThisWeek.length,
      streak:mStreak, hasGoal:!!mGoal?.goal_text, goal:mGoal?.goal_text||"",
      inactive:mInactive, note:mNote };
  }).sort((a,b)=>{
    if(a.inactive&&!b.inactive) return -1;
    if(!a.inactive&&b.inactive) return 1;
    return a.member.name.localeCompare(b.member.name);
  });

  // Streak ranking
  const streakRanking = [...memberStats].sort((a,b)=>b.streak-a.streak);

  // Actions filtering
  let filteredActions = actions;
  if (filter==="pending")  filteredActions = filteredActions.filter(a=>!a.completed);
  if (filter==="done")     filteredActions = filteredActions.filter(a=>a.completed);
  if (filter==="overdue")  filteredActions = filteredActions.filter(a=>isOverdue(a.action_date,a.completed));
  if (weekFilter!=="all")  filteredActions = filteredActions.filter(a=>getWeekLabel(a.action_date)===weekFilter);
  if (memberFilter!=="all") filteredActions = filteredActions.filter(a=>String(a.member_id)===String(memberFilter));

  const byMember = {};
  filteredActions.forEach(a => {
    if (!byMember[a.member_id]) { const fm=members.find(m=>m.id===a.member_id); byMember[a.member_id]={member:fm||{id:a.member_id,name:a.member_name},actions:[]}; }
    byMember[a.member_id].actions.push(a);
  });
  if (filter==="all" && weekFilter==="all" && memberFilter==="all") {
    members.forEach(m => { if (!byMember[m.id]) byMember[m.id]={member:m,actions:[]}; });
  }

  const groupByWeek = acts => { const map={}; acts.forEach(a=>{const w=getWeekLabel(a.action_date);if(!map[w])map[w]=[];map[w].push(a);}); return map; };

  return (
    <div className="app">
      {showQuickView&&<QuickViewModal actions={actions} members={members} onClose={()=>setShowQuickView(false)}/>}
      {showExport&&<ExportModal group={group} actions={actions} members={members} onClose={()=>setShowExport(false)}/>}

      <Header title={`${group.name} — Guardiana`} user={group.guardiana} onExit={onExit}/>
      <div className="main">

        {/* Page header + action buttons */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:20}}>
          <div style={{borderLeft:"2px solid #B8960C",paddingLeft:20}}>
            <div className="page-eyebrow">Panel de guardiana</div>
            <div className="page-title">{group.name}</div>
            <div className="page-sub">{members.length} alumnas · {actions.length} acciones</div>
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0,paddingTop:4}}>
            <button className="ghost-btn" style={{fontSize:10,letterSpacing:1.5,padding:"8px 14px"}} onClick={()=>setShowQuickView(true)}>⚡ Vista sesión</button>
            <button className="ghost-btn" style={{fontSize:10,letterSpacing:1.5,padding:"8px 14px"}} onClick={()=>setShowExport(true)}>📋 Resumen</button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card"><div className="stat-num">{actions.length}</div><div className="stat-label">Acciones totales</div></div>
          <div className="stat-card"><div className="stat-num" style={{color:"#1A6B3C"}}>{totalDone}</div><div className="stat-label">Completadas ✓</div></div>
          <div className="stat-card"><div className="stat-num" style={{color:overdueTotal>0?"#C0392B":"#B8960C"}}>{overdueTotal}</div><div className="stat-label">Fuera de plazo</div></div>
          <div className="stat-card"><div className="stat-num" style={{color:inactiveCount>0?"#C0392B":"#1A6B3C"}}>{inactiveCount}</div><div className="stat-label">Sin actividad 7d</div></div>
        </div>

        {/* Inactivity alert */}
        {inactiveCount>0&&(
          <div style={{background:"rgba(192,57,43,0.06)",border:"1px solid rgba(192,57,43,0.2)",padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:16}}>⚠️</span>
            <span style={{fontSize:12,color:"#C0392B"}}>
              {members.filter(m=>!lastActionDate[m.id]||daysSince(lastActionDate[m.id])>7).map(m=>m.name).join(", ")} — sin actividad en los últimos 7 días
            </span>
          </div>
        )}

        {/* TABS */}
        <div className="member-tabs">
          {[["acciones","Acciones"],["resumen","Resumen general"],["objetivos","Objetivos"],["rachas","Rachas 🔥"],["equipo","El equipo"]].map(([id,label])=>(
            <button key={id} className={`mtab${activeTab===id?" active":""}`} onClick={()=>setActiveTab(id)}>{label}</button>
          ))}
        </div>

        {loading&&<div className="loading">Cargando...</div>}

        {/* ── TAB: ACCIONES ── */}
        {!loading&&activeTab==="acciones"&&(
          <>
            <div className="filter-row">
              {/* Status filters */}
              {[["all","Todas"],["pending","Pendientes"],["done","Completadas"],["overdue","Fuera de plazo"]].map(([id,label])=>(
                <button key={id} className={`ftab${filter===id?" active":""}`} onClick={()=>setFilter(id)}>{label}</button>
              ))}
              <div className="filter-divider"/>
              {/* Member filter */}
              <select value={memberFilter} onChange={e=>setMemberFilter(e.target.value)}
                style={{padding:"6px 12px",fontFamily:"'Montserrat',sans-serif",fontSize:10,letterSpacing:1,border:"1px solid rgba(184,150,12,0.35)",background:"transparent",color:"rgba(30,20,10,0.6)",cursor:"pointer",outline:"none"}}>
                <option value="all">Todas las alumnas</option>
                {members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {/* Week filter */}
              {allWeeks.length>0&&<>
                <div className="filter-divider"/>
                <button className={`ftab${weekFilter==="all"?" active":""}`} onClick={()=>setWeekFilter("all")}>Todas las semanas</button>
                {allWeeks.map(w=><button key={w} className={`ftab${weekFilter===w?" active":""}`} onClick={()=>setWeekFilter(w)}>{w}</button>)}
              </>}
            </div>

            {Object.values(byMember).length===0&&<div className="empty"><div className="empty-icon">◇</div><div className="empty-text">No hay acciones en este filtro</div></div>}

            {Object.values(byMember)
              .sort((a,b)=>{ const aI=!lastActionDate[a.member.id]||daysSince(lastActionDate[a.member.id])>7; const bI=!lastActionDate[b.member.id]||daysSince(lastActionDate[b.member.id])>7; if(aI&&!bI) return -1; if(!aI&&bI) return 1; return a.member.name.localeCompare(b.member.name); })
              .map(({member:mb,actions:acts})=>{
                const done=acts.filter(a=>a.completed).length;
                const pct=acts.length>0?Math.round(done/acts.length*100):0;
                const isExpanded=expandedMembers[mb.id];
                const isInactive=!lastActionDate[mb.id]||daysSince(lastActionDate[mb.id])>7;
                const memberStreak=streak(actions.filter(a=>a.member_id===mb.id));
                const byWeek=groupByWeek(acts);
                return (
                  <div key={mb.id} className={`member-block${isInactive?" inactive":""}`}>
                    <div className="member-header" onClick={()=>setExpandedMembers(p=>({...p,[mb.id]:!p[mb.id]}))}>
                      <div className={`member-avatar${isInactive?" inactive":""}`}>{mb.name[0]}</div>
                      <div className="member-info">
                        <div className="member-name-lg">
                          {mb.name}
                          {isInactive&&<span className="inactive-badge">Sin actividad</span>}
                          {!isInactive&&memberStreak>1&&<span className="streak-badge">🔥 {memberStreak} sem.</span>}
                        </div>
                        <div className="member-counts">{done}/{acts.length} completadas · {pct}%</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                        <div style={{width:80}}><div className="progress-bar"><div className="progress-fill" style={{width:`${pct}%`,background:pct===100?"#1A6B3C":isInactive?"#C0392B":"#B8960C"}}/></div></div>
                        <div style={{color:"#B8960C",fontSize:11,opacity:0.6}}>{isExpanded?"▲":"▼"}</div>
                      </div>
                    </div>
                    {isExpanded&&(
                      <div>
                        {acts.length===0&&<div style={{padding:"12px 18px",fontSize:12,color:"rgba(30,20,8,0.35)",fontStyle:"italic",borderTop:"1px solid rgba(184,150,12,0.08)"}}>Sin acciones en este filtro.</div>}
                        {Object.entries(byWeek).map(([week,wActs])=>(
                          <div key={week} className="week-group">
                            <div className="week-label">{week} · {wActs.filter(a=>a.completed).length}/{wActs.length}</div>
                            {wActs.map(action=><ActionCard key={action.id} action={action} currentMemberId={null} onToggle={null} onEdit={null} showName={false} isGuardiana={true} onComment={loadAll}/>)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </>
        )}

        {/* ── TAB: RESUMEN GENERAL ── */}
        {!loading&&activeTab==="resumen"&&(
          <div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",background:"#fff",border:"1px solid rgba(184,150,12,0.18)"}}>
                <thead>
                  <tr style={{background:"#0A0A0A"}}>
                    {["Alumna","Acciones","Completadas","Esta semana","Racha","Objetivo","Última actividad","Nota"].map(h=>(
                      <th key={h} style={{padding:"10px 14px",fontFamily:"'Montserrat',sans-serif",fontSize:9,letterSpacing:2,color:"rgba(184,150,12,0.8)",textTransform:"uppercase",textAlign:"left",whiteSpace:"nowrap",borderRight:"1px solid rgba(184,150,12,0.1)"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {memberStats.map((s,idx)=>(
                    <tr key={s.member.id} style={{background:s.inactive?"rgba(192,57,43,0.03)":idx%2===0?"#fff":"rgba(184,150,12,0.02)",borderBottom:"1px solid rgba(184,150,12,0.08)"}}>
                      {/* Name */}
                      <td style={{padding:"12px 14px",borderRight:"1px solid rgba(184,150,12,0.08)"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:24,height:24,border:`1px solid ${s.inactive?"#C0392B":"#B8960C"}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cormorant Garamond',serif",fontSize:12,color:s.inactive?"#C0392B":"#B8960C",flexShrink:0}}>{s.member.name[0]}</div>
                          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#1E1408"}}>{s.member.name}</span>
                          {s.inactive&&<span className="inactive-badge">!</span>}
                        </div>
                      </td>
                      {/* Total */}
                      <td style={{padding:"12px 14px",textAlign:"center",fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"#B8960C",borderRight:"1px solid rgba(184,150,12,0.08)"}}>{s.total}</td>
                      {/* Done */}
                      <td style={{padding:"12px 14px",textAlign:"center",borderRight:"1px solid rgba(184,150,12,0.08)"}}>
                        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:s.done===s.total&&s.total>0?"#1A6B3C":"#1E1408"}}>{s.done}</span>
                        <span style={{fontSize:10,color:"rgba(30,20,8,0.35)",marginLeft:3}}>/{s.total}</span>
                      </td>
                      {/* This week */}
                      <td style={{padding:"12px 14px",textAlign:"center",fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:s.thisWeek>0?"#1A6B3C":"rgba(30,20,8,0.3)",borderRight:"1px solid rgba(184,150,12,0.08)"}}>{s.thisWeek}</td>
                      {/* Streak */}
                      <td style={{padding:"12px 14px",textAlign:"center",borderRight:"1px solid rgba(184,150,12,0.08)"}}>
                        {s.streak>0?<span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"#B8960C"}}>🔥 {s.streak}</span>:<span style={{fontSize:12,color:"rgba(30,20,8,0.25)"}}>—</span>}
                      </td>
                      {/* Goal */}
                      <td style={{padding:"12px 14px",borderRight:"1px solid rgba(184,150,12,0.08)",maxWidth:200}}>
                        {s.hasGoal
                          ? <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:"#1E1408",fontStyle:"italic",lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>"{s.goal}"</div>
                          : <span style={{fontSize:10,color:"#C0392B",letterSpacing:1,fontFamily:"'Montserrat',sans-serif"}}>Sin definir</span>}
                      </td>
                      {/* Last activity */}
                      <td style={{padding:"12px 14px",textAlign:"center",borderRight:"1px solid rgba(184,150,12,0.08)"}}>
                        {lastActionDate[s.member.id]
                          ? <span style={{fontSize:11,color:s.inactive?"#C0392B":"rgba(30,20,8,0.5)",fontFamily:"'Montserrat',sans-serif"}}>hace {daysSince(lastActionDate[s.member.id])}d</span>
                          : <span style={{fontSize:10,color:"rgba(30,20,8,0.25)"}}>—</span>}
                      </td>
                      {/* Note */}
                      <td style={{padding:"12px 14px",minWidth:180}}>
                        {editingNote===s.member.id ? (
                          <div style={{display:"flex",gap:6,alignItems:"center"}}>
                            <input value={noteText} onChange={e=>setNoteText(e.target.value)}
                              onKeyDown={e=>e.key==="Enter"&&saveNote(s.member.id)}
                              style={{flex:1,padding:"5px 8px",border:"1px solid rgba(184,150,12,0.3)",fontSize:11,fontFamily:"'Montserrat',sans-serif",outline:"none",background:"#FAF7F2",color:"#1E1408"}}
                              placeholder="Nota privada..." autoFocus/>
                            <button onClick={()=>saveNote(s.member.id)} className="comment-send-btn" style={{padding:"5px 10px",fontSize:10}}>✓</button>
                            <button onClick={()=>setEditingNote(null)} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(30,20,8,0.4)",fontSize:14}}>✕</button>
                          </div>
                        ) : (
                          <div style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}} onClick={()=>{setEditingNote(s.member.id);setNoteText(s.note||"");}}>
                            {s.note
                              ? <span style={{fontSize:11,color:"rgba(30,20,8,0.6)",fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",flex:1,lineHeight:1.3}}>{s.note}</span>
                              : <span style={{fontSize:10,color:"rgba(184,150,12,0.5)",letterSpacing:1,fontFamily:"'Montserrat',sans-serif"}}>+ Añadir nota</span>}
                            <span style={{fontSize:10,color:"rgba(184,150,12,0.4)",flexShrink:0}}>✎</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{fontSize:10,color:"rgba(30,20,8,0.3)",marginTop:10,fontFamily:"'Montserrat',sans-serif",fontStyle:"italic"}}>
              * Las notas son privadas — solo las ve la guardiana.
            </div>
          </div>
        )}

        {/* ── TAB: OBJETIVOS ── */}
        {!loading&&activeTab==="objetivos"&&(
          <GoalCommentsPanel memberStats={memberStats} groupId={group.id} />
        )}

        {/* ── TAB: RACHAS ── */}
        {!loading&&activeTab==="rachas"&&(
          <div>
            <div style={{marginBottom:20,fontSize:11,color:"rgba(30,20,8,0.45)"}}>
              Semanas consecutivas con al menos una acción registrada
            </div>
            {streakRanking.map((s,idx)=>{
              const pct = streakRanking[0].streak > 0 ? Math.round(s.streak/streakRanking[0].streak*100) : 0;
              const medals = ["🥇","🥈","🥉"];
              return (
                <div key={s.member.id} style={{background:"#fff",border:`1px solid ${idx===0?"rgba(184,150,12,0.5)":"rgba(184,150,12,0.18)"}`,padding:"16px 20px",marginBottom:8,display:"flex",alignItems:"center",gap:14}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,width:32,textAlign:"center",flexShrink:0}}>
                    {idx<3 ? medals[idx] : <span style={{color:"rgba(30,20,8,0.3)",fontSize:14}}>#{idx+1}</span>}
                  </div>
                  <div style={{width:32,height:32,border:`1px solid ${s.streak>0?"#B8960C":"rgba(30,20,8,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:s.streak>0?"#B8960C":"rgba(30,20,8,0.3)",flexShrink:0}}>{s.member.name[0]}</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"#1E1408",marginBottom:5}}>{s.member.name}</div>
                    <div className="progress-bar" style={{height:8}}>
                      <div className="progress-fill" style={{width:`${pct}%`,background:idx===0?"#B8960C":idx===1?"rgba(184,150,12,0.7)":"rgba(184,150,12,0.4)"}}/>
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    {s.streak>0
                      ? <div><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:"#B8960C"}}>🔥 {s.streak}</span><div style={{fontSize:9,color:"rgba(30,20,8,0.4)",letterSpacing:1,fontFamily:"'Montserrat',sans-serif",marginTop:2}}>semanas</div></div>
                      : <span style={{fontSize:12,color:"rgba(30,20,8,0.3)",fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif"}}>Sin racha</span>}
                  </div>
                </div>
              );
            })}
            {streakRanking[0]?.streak>0&&(
              <div style={{marginTop:16,padding:"14px 18px",background:"rgba(184,150,12,0.05)",border:"1px solid rgba(184,150,12,0.15)",fontSize:12,color:"rgba(30,20,8,0.6)",fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",lineHeight:1.6}}>
                💡 Menciona en la próxima sesión a <strong style={{fontStyle:"normal"}}>{streakRanking[0].member.name}</strong> — lleva <strong style={{fontStyle:"normal"}}>{streakRanking[0].streak} semanas</strong> seguidas tomando acción. ¡Es un ejemplo para el grupo!
              </div>
            )}
          </div>
        )}

        {/* ── TAB: EL EQUIPO ── */}
        {!loading&&activeTab==="equipo"&&(
          <div>
            <div style={{marginBottom:20}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:"#B8960C",letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>Visión global</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:"#1E1408",marginBottom:4}}>El equipo de guardianas</div>
              <div style={{fontSize:11,color:"rgba(30,20,8,0.45)"}}>Progreso de todos los grupos esta semana. Tu grupo aparece destacado.</div>
            </div>

            {/* Global stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
              {[
                [allMembers.length,"Alumnas en total"],
                [allActions.filter(a=>getWeekLabel(a.action_date)==="Esta semana").length,"Acciones esta semana"],
                [allActions.filter(a=>a.completed).length,"Completadas en total"],
              ].map(([num,label])=>(
                <div key={label} style={{background:"#0A0A0A",padding:"18px 14px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,color:"#B8960C",lineHeight:1}}>{num}</div>
                  <div style={{fontSize:9,letterSpacing:2,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",marginTop:6,fontFamily:"'Montserrat',sans-serif"}}>{label}</div>
                </div>
              ))}
            </div>

            {/* Per-group ranking */}
            {allGroups.map((g,idx) => {
              const isMyGroup = g.id === group.id;
              const gMembers = allMembers.filter(m=>m.group_id===g.id);
              const gActions = allActions.filter(a=>a.group_id===g.id);
              const gDone = gActions.filter(a=>a.completed).length;
              const gThisWeek = gActions.filter(a=>getWeekLabel(a.action_date)==="Esta semana"||(a.completed&&a.completed_at&&getWeekLabel(a.completed_at.split("T")[0])==="Esta semana"));
              const gActive = gMembers.filter(m=>{
                const last = gActions.filter(a=>a.member_id===m.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
                return last && daysSince(last.created_at)<=7;
              }).length;
              const activePct = gMembers.length>0 ? Math.round(gActive/gMembers.length*100) : 0;
              const donePct = gActions.length>0 ? Math.round(gDone/gActions.length*100) : 0;
              const maxThisWeek = Math.max(...allGroups.map(gg => allActions.filter(a=>a.group_id===gg.id&&(getWeekLabel(a.action_date)==="Esta semana"||(a.completed&&a.completed_at&&getWeekLabel(a.completed_at.split("T")[0])==="Esta semana"))).length), 1);
              const weekPct = Math.round(gThisWeek.length/maxThisWeek*100);

              return (
                <div key={g.id} style={{
                  background:"#fff",
                  border:`1px solid ${isMyGroup?"rgba(184,150,12,0.6)":"rgba(184,150,12,0.18)"}`,
                  borderLeft:isMyGroup?"3px solid #B8960C":"1px solid rgba(184,150,12,0.18)",
                  padding:"18px 20px",marginBottom:10,
                  boxShadow:isMyGroup?"0 2px 16px rgba(184,150,12,0.1)":"none"
                }}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"#1E1408"}}>{g.name}</div>
                        {isMyGroup&&<span style={{fontSize:9,letterSpacing:2,color:"#B8960C",background:"rgba(184,150,12,0.08)",padding:"2px 8px",fontFamily:"'Montserrat',sans-serif",textTransform:"uppercase"}}>Tu grupo</span>}
                      </div>
                      <div style={{fontSize:10,color:"rgba(30,20,8,0.4)",letterSpacing:0.5,fontFamily:"'Montserrat',sans-serif"}}>
                        Guardiana: {g.guardiana} · {gMembers.length} alumnas
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:"#B8960C",lineHeight:1}}>{gActive}/{gMembers.length}</div>
                      <div style={{fontSize:9,color:"rgba(30,20,8,0.4)",letterSpacing:1,fontFamily:"'Montserrat',sans-serif"}}>activas esta semana</div>
                    </div>
                  </div>

                  {/* Three progress bars */}
                  {[
                    ["Alumnas activas esta semana", activePct, "#B8960C"],
                    ["Acciones completadas (total)", donePct, "#1A6B3C"],
                    ["Acciones esta semana vs. mejor grupo", weekPct, "#B8960C"],
                  ].map(([label, pct, color])=>(
                    <div key={label} style={{marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:9,color:"rgba(30,20,8,0.45)",fontFamily:"'Montserrat',sans-serif",letterSpacing:0.5}}>{label}</span>
                        <span style={{fontSize:9,color:color,fontFamily:"'Montserrat',sans-serif",fontWeight:600}}>{pct}%</span>
                      </div>
                      <div style={{background:"#EEE9E0",height:6}}>
                        <div style={{width:`${pct}%`,height:"100%",background:color,transition:"width 0.4s"}}/>
                      </div>
                    </div>
                  ))}

                  {/* Quick numbers */}
                  <div style={{display:"flex",gap:20,marginTop:10,paddingTop:10,borderTop:"1px solid rgba(184,150,12,0.08)"}}>
                    {[
                      [gActions.length,"acciones totales"],
                      [gDone,"completadas"],
                      [gThisWeek.length,"esta semana"],
                      [gActions.filter(a=>isOverdue(a.action_date,a.completed)).length,"fuera de plazo"],
                    ].map(([num,label])=>(
                      <div key={label} style={{textAlign:"center"}}>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:label==="fuera de plazo"&&num>0?"#C0392B":"#1E1408"}}>{num}</div>
                        <div style={{fontSize:9,color:"rgba(30,20,8,0.35)",fontFamily:"'Montserrat',sans-serif",letterSpacing:0.5}}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

// ─── ADMIN VIEW ───────────────────────────────────────
function AdminView({ session, onExit }) {
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [allActions, setAllActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddMember, setShowAddMember] = useState(null);
  const [newGroup, setNewGroup] = useState({name:"",guardiana:"",code:""});
  const [newMemberName, setNewMemberName] = useState("");

  const load = useCallback(async()=>{
    const [{data:g},{data:m},{data:a}]=await Promise.all([
      supabase.from("groups").select("*").order("name"),
      supabase.from("members").select("*").order("name"),
      supabase.from("actions").select("*")
    ]);
    if(g) setGroups(g); if(m) setMembers(m); if(a) setAllActions(a); setLoading(false);
  },[]);

  useEffect(()=>{load();},[load]);
  const createGroup=async()=>{ if(!newGroup.name.trim()||!newGroup.guardiana.trim()||!newGroup.code.trim()) return; await supabase.from("groups").insert({...newGroup,code:newGroup.code.toUpperCase()}); setNewGroup({name:"",guardiana:"",code:""}); setShowAddGroup(false); load(); };
  const deleteGroup=async(id)=>{ if(!window.confirm("¿Eliminar este grupo y todas sus alumnas y acciones?")) return; await supabase.from("groups").delete().eq("id",id); load(); };
  const addMembers=async(gid)=>{ if(!newMemberName.trim()) return; const names=newMemberName.split(",").map(n=>n.trim()).filter(Boolean); for(const name of names) await supabase.from("members").insert({group_id:gid,name}); setNewMemberName(""); setShowAddMember(null); load(); };
  const deleteMember=async(id)=>{ await supabase.from("members").delete().eq("id",id); load(); };
  const [editingGroup, setEditingGroup] = useState(null); // { id, name, guardiana, code }
  const getMembersForGroup=gid=>members.filter(m=>m.group_id===gid);
  const getActionsForGroup=gid=>allActions.filter(a=>a.group_id===gid);

  const saveGroup = async () => {
    if (!editingGroup?.name?.trim() || !editingGroup?.guardiana?.trim()) return;
    await supabase.from("groups").update({
      name: editingGroup.name,
      guardiana: editingGroup.guardiana,
      code: editingGroup.code.toUpperCase().replace(/\s/g,"")
    }).eq("id", editingGroup.id);
    setEditingGroup(null); load();
  };
  const thisWeekActions=allActions.filter(a=>getWeekLabel(a.action_date)==="Esta semana");
  const globalActive=members.filter(m=>{ const last=allActions.filter(a=>a.member_id===m.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0]; return last&&daysSince(last.created_at)<=7; }).length;

  return (
    <div className="app">
      <Header title="Panel de Administración" user="Estefany" onExit={onExit}/>
      <div className="main">
        <div className="page-header">
          <div className="page-eyebrow">Admin · Visión global</div>
          <div className="page-title">Gestión de grupos</div>
          <div className="page-sub">Código guardianas: <strong style={{color:"#B8960C",letterSpacing:2}}>{GUARDIANA_CODE}</strong>&nbsp;·&nbsp;Código admin: <strong style={{color:"#B8960C",letterSpacing:2}}>{ADMIN_CODE}</strong></div>
        </div>

        <div className="global-grid">
          <div className="global-card"><div className="global-num">{members.length}</div><div className="global-label">Total alumnas</div></div>
          <div className="global-card"><div className="global-num" style={{color:"#1A6B3C"}}>{globalActive}</div><div className="global-label">Activas esta semana</div></div>
          <div className="global-card"><div className="global-num">{thisWeekActions.length}</div><div className="global-label">Acciones esta semana</div></div>
        </div>

        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"#1E1408",marginBottom:12,borderBottom:"1px solid rgba(184,150,12,0.2)",paddingBottom:8}}>Resumen por grupo</div>
        {groups.map(g=>{
          const gm=getMembersForGroup(g.id); const ga=getActionsForGroup(g.id);
          const gThisWeek=ga.filter(a=>getWeekLabel(a.action_date)==="Esta semana");
          const gActive=gm.filter(m=>{ const last=ga.filter(a=>a.member_id===m.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0]; return last&&daysSince(last.created_at)<=7; }).length;
          const pct=gm.length>0?Math.round(gActive/gm.length*100):0;
          return (
            <div key={g.id} className="group-summary-row">
              <div>
                <div className="group-summary-name">{g.name}</div>
                <div style={{fontSize:10,color:"rgba(30,20,8,0.4)",letterSpacing:0.5}}>Guardiana: {g.guardiana} · {gm.length} alumnas</div>
              </div>
              <div style={{flex:1,margin:"0 16px"}}>
                <div className="progress-bar" style={{height:8}}><div className="progress-fill" style={{width:`${pct}%`,background:pct>70?"#1A6B3C":"#B8960C"}}/></div>
                <div style={{fontSize:9,color:"rgba(30,20,8,0.4)",marginTop:3,letterSpacing:1}}>{pct}% activas esta semana</div>
              </div>
              <div style={{textAlign:"right"}}><div className="group-summary-num">{gActive}/{gm.length}</div><div className="group-summary-sub">{gThisWeek.length} acciones</div></div>
            </div>
          );
        })}

        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"#1E1408",margin:"28px 0 16px",borderBottom:"1px solid rgba(184,150,12,0.2)",paddingBottom:8}}>Gestión de grupos</div>
        <button className="add-trigger" style={{marginBottom:20}} onClick={()=>setShowAddGroup(!showAddGroup)}>✦ Nuevo grupo</button>

        {showAddGroup&&(
          <div className="add-form" style={{marginBottom:24}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"#B8960C",marginBottom:16}}>Nuevo grupo</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <input placeholder="Nombre del grupo" value={newGroup.name} onChange={e=>setNewGroup(p=>({...p,name:e.target.value}))} className="ci"/>
              <input placeholder="Nombre de la guardiana" value={newGroup.guardiana} onChange={e=>setNewGroup(p=>({...p,guardiana:e.target.value}))} className="ci"/>
            </div>
            <input placeholder="Código de acceso (ej. OFELIAA)" value={newGroup.code} onChange={e=>setNewGroup(p=>({...p,code:e.target.value.toUpperCase().replace(/\s/g,"")}))} className="ci" style={{marginBottom:16}}/>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button className="ghost-btn" onClick={()=>setShowAddGroup(false)}>Cancelar</button>
              <button className="gold-btn" onClick={createGroup}>Crear grupo</button>
            </div>
          </div>
        )}

        {loading&&<div className="loading">Cargando...</div>}
        {groups.map(group=>{
          const grpMembers=getMembersForGroup(group.id);
          return (
            <div key={group.id} className="group-card">
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
                <div>
                  <div className="group-name-lg">{group.name}</div>
                  <div className="group-meta-sm">Guardiana: {group.guardiana}&nbsp;·&nbsp;<span className="code-badge">{group.code}</span>&nbsp;·&nbsp;{grpMembers.length} alumnas</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="ghost-btn" style={{fontSize:10,padding:"6px 12px",letterSpacing:1}} onClick={()=>setEditingGroup({id:group.id,name:group.name,guardiana:group.guardiana,code:group.code})}>✎ Editar</button>
                  <button className="danger-btn" onClick={()=>deleteGroup(group.id)}>Eliminar</button>
                </div>
              </div>
              <div style={{marginBottom:12}}>
                {grpMembers.map(m=><span key={m.id} className="member-pill">{m.name}<button onClick={()=>deleteMember(m.id)}>✕</button></span>)}
                {grpMembers.length===0&&<span style={{fontSize:11,color:"rgba(30,20,8,0.35)",fontStyle:"italic"}}>Sin alumnas todavía</span>}
              </div>
              {showAddMember===group.id?(
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input placeholder="Nombre/s separados por coma" value={newMemberName} onChange={e=>setNewMemberName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addMembers(group.id)} className="ci" style={{flex:1}}/>
                  <button className="gold-btn" onClick={()=>addMembers(group.id)}>Añadir</button>
                  <button className="ghost-btn" onClick={()=>setShowAddMember(null)}>✕</button>
                </div>
              ):(
                <button className="ghost-btn" style={{fontSize:10,letterSpacing:1.5}} onClick={()=>{setShowAddMember(group.id);setNewMemberName("");}}>+ Añadir alumnas</button>
              )}
            </div>
          );
        })}
        {groups.length===0&&!loading&&<div className="empty"><div className="empty-icon">◇</div><div className="empty-text">No hay grupos todavía</div></div>}
      </div>

      {/* Edit group modal */}
      {editingGroup && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setEditingGroup(null)}>
          <div className="modal">
            <div className="modal-title">Editar grupo</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <div style={{fontSize:9,letterSpacing:2,color:"rgba(30,20,8,0.4)",textTransform:"uppercase",marginBottom:6,fontFamily:"'Montserrat',sans-serif"}}>Nombre del grupo</div>
                <input value={editingGroup.name} onChange={e=>setEditingGroup(p=>({...p,name:e.target.value}))} className="ci"/>
              </div>
              <div>
                <div style={{fontSize:9,letterSpacing:2,color:"rgba(30,20,8,0.4)",textTransform:"uppercase",marginBottom:6,fontFamily:"'Montserrat',sans-serif"}}>Guardiana</div>
                <input value={editingGroup.guardiana} onChange={e=>setEditingGroup(p=>({...p,guardiana:e.target.value}))} className="ci"/>
              </div>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:9,letterSpacing:2,color:"rgba(30,20,8,0.4)",textTransform:"uppercase",marginBottom:6,fontFamily:"'Montserrat',sans-serif"}}>Código de acceso</div>
              <input value={editingGroup.code} onChange={e=>setEditingGroup(p=>({...p,code:e.target.value.toUpperCase().replace(/\s/g,"")}))} className="ci"/>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button className="ghost-btn" onClick={()=>setEditingGroup(null)}>Cancelar</button>
              <button className="gold-btn" onClick={saveGroup}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  useEffect(()=>{ const el=document.createElement("style"); el.textContent=STYLES; document.head.appendChild(el); return ()=>document.head.removeChild(el); },[]);
  if(!session) return <LoginScreen onLogin={setSession}/>;
  if(session.role==="admin") return <AdminView session={session} onExit={()=>setSession(null)}/>;
  if(session.role==="guardiana") return <GuardianaView session={session} onExit={()=>setSession(null)}/>;
  return <MemberView session={session} onExit={()=>setSession(null)}/>;
}
