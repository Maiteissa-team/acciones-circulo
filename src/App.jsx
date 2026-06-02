import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = "https://ymxrybldumxnnsebzjhy.supabase.co";
const SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteHJ5YmxkdW14bm5zZWJ6amh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjU5ODMsImV4cCI6MjA5NTkwMTk4M30.EzNrqLOinF8KvczfDAkZVmTSe9AoxZYLucI4b4fbHjk";
const ADMIN_CODE      = "ESTEFANY2026";
const GUARDIANA_CODE  = "GUARDIANAS2026"; // ← change this anytime
const supabase        = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── helpers ────────────────────────────────────────────
function getWeekLabel(dateStr) {
  if (!dateStr) return "Sin fecha";
  const d = new Date(dateStr);
  const now = new Date();
  const startOfWeek = (dt) => { const d2 = new Date(dt); d2.setDate(d2.getDate() - d2.getDay() + 1); d2.setHours(0,0,0,0); return d2; };
  const sw = startOfWeek(now);
  const dw = startOfWeek(d);
  const diff = Math.round((dw - sw) / (7*24*3600*1000));
  if (diff === 0) return "Esta semana";
  if (diff === -1) return "Semana pasada";
  if (diff === 1) return "Próxima semana";
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `Semana del ${d.getDate()} ${months[d.getMonth()]}`;
}

// ─── styles ─────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#0A0A0A;font-family:'Montserrat',sans-serif;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-thumb{background:#B8960C;border-radius:2px;}

  .login-wrap{min-height:100vh;background:#0A0A0A;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
  .login-ring{position:absolute;border-radius:50%;border:1px solid rgba(184,150,12,0.07);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;}
  .login-btn{background:transparent;border:1px solid rgba(184,150,12,0.5);color:#B8960C;padding:12px 32px;font-family:'Montserrat',sans-serif;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;cursor:pointer;transition:all 0.3s;width:100%;}
  .login-btn:hover{background:#B8960C;color:#0A0A0A;}
  .login-btn.secondary{border-color:rgba(255,255,255,0.2);color:rgba(255,255,255,0.5);}
  .login-btn.secondary:hover{background:rgba(255,255,255,0.1);color:#fff;}
  .login-btn.ghost{border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.3);font-size:9px;}
  .login-btn.ghost:hover{background:transparent;color:rgba(255,255,255,0.5);}
  .login-input{width:100%;padding:11px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(184,150,12,0.3);color:#fff;font-family:'Montserrat',sans-serif;font-size:13px;outline:none;transition:border 0.2s;}
  .login-input:focus{border-color:#B8960C;}
  .login-input::placeholder{color:rgba(255,255,255,0.25);}

  .app{min-height:100vh;background:#FAF7F2;}
  .header{background:#0A0A0A;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 32px;position:sticky;top:0;z-index:100;border-bottom:1px solid rgba(184,150,12,0.2);}
  .header-logo{font-family:'Cormorant Garamond',serif;font-size:11px;letter-spacing:6px;color:rgba(184,150,12,0.7);text-transform:uppercase;}
  .header-title{font-family:'Cormorant Garamond',serif;font-size:19px;color:#fff;font-weight:300;letter-spacing:1px;}
  .header-right{display:flex;align-items:center;gap:16px;}
  .sync-dot{width:6px;height:6px;border-radius:50%;background:#B8960C;animation:pulse 2s infinite;}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
  .user-avatar{width:28px;height:28px;border:1px solid #B8960C;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:13px;color:#B8960C;}
  .user-name{font-family:'Montserrat',sans-serif;font-size:10px;color:rgba(255,255,255,0.6);letter-spacing:1px;}
  .exit-btn{background:transparent;border:none;color:rgba(255,255,255,0.3);font-size:10px;cursor:pointer;font-family:'Montserrat',sans-serif;letter-spacing:1px;}

  .main{max-width:900px;margin:0 auto;padding:36px 24px 80px;}
  .page-header{border-left:2px solid #B8960C;padding-left:20px;margin-bottom:32px;}
  .page-eyebrow{font-size:9px;letter-spacing:4px;color:#B8960C;text-transform:uppercase;margin-bottom:4px;}
  .page-title{font-family:'Cormorant Garamond',serif;font-size:30px;color:#1E1408;font-weight:400;}
  .page-sub{font-size:11px;color:rgba(30,20,8,0.45);margin-top:6px;}

  .gold-btn{background:#B8960C;border:none;color:#fff;padding:10px 24px;font-family:'Montserrat',sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all 0.2s;}
  .gold-btn:hover{background:#9A7A08;}
  .ghost-btn{background:transparent;border:1px solid rgba(30,20,10,0.2);color:rgba(30,20,10,0.5);padding:10px 24px;font-family:'Montserrat',sans-serif;font-size:10px;letter-spacing:2px;cursor:pointer;transition:all 0.2s;}
  .ghost-btn:hover{border-color:rgba(30,20,10,0.4);color:rgba(30,20,10,0.7);}
  .danger-btn{background:transparent;border:1px solid rgba(192,57,43,0.3);color:#C0392B;padding:8px 12px;font-family:'Montserrat',sans-serif;font-size:10px;cursor:pointer;transition:all 0.2s;}
  .danger-btn:hover{background:#C0392B;color:#fff;}
  .icon-btn{background:transparent;border:1px solid rgba(0,0,0,0.1);color:rgba(0,0,0,0.35);padding:6px 10px;cursor:pointer;font-size:11px;transition:all 0.2s;}
  .icon-btn.edit:hover{border-color:#B8960C;color:#B8960C;}
  .icon-btn.del:hover{border-color:#C0392B;color:#C0392B;}

  .ci{width:100%;padding:10px 14px;background:#fff;border:1px solid rgba(184,150,12,0.3);color:#1E1408;font-family:'Montserrat',sans-serif;font-size:13px;outline:none;transition:border 0.2s;}
  .ci:focus{border-color:#B8960C;}
  .ci::placeholder{color:rgba(30,20,8,0.3);}
  select.ci option{background:#fff;color:#1E1408;}

  .card{background:#fff;border:1px solid rgba(184,150,12,0.18);transition:all 0.25s;margin-bottom:8px;}
  .card:hover{border-color:rgba(184,150,12,0.4);box-shadow:0 2px 14px rgba(184,150,12,0.07);}
  .add-form{background:#fff;border:1px solid rgba(184,150,12,0.25);padding:24px;margin-bottom:20px;box-shadow:0 4px 20px rgba(184,150,12,0.06);}

  .action-row{display:flex;align-items:flex-start;gap:14px;padding:14px 18px;}
  .check-box{width:22px;height:22px;border:1.5px solid rgba(184,150,12,0.4);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s;background:transparent;margin-top:2px;}
  .check-box.done{background:#B8960C;border-color:#B8960C;}
  .check-box.done::after{content:'✓';color:#fff;font-size:12px;font-weight:700;}
  .check-box.readonly{cursor:default;}
  .action-body{flex:1;min-width:0;}
  .action-name{font-size:10px;letter-spacing:1.5px;color:#B8960C;text-transform:uppercase;margin-bottom:3px;}
  .action-text{font-family:'Cormorant Garamond',serif;font-size:17px;color:#1E1408;line-height:1.3;}
  .action-text.done{color:rgba(30,20,8,0.35);text-decoration:line-through;}
  .action-meta{font-size:10px;color:rgba(30,20,8,0.35);margin-top:4px;}
  .action-actions{display:flex;gap:6px;flex-shrink:0;align-items:flex-start;padding-top:2px;}

  .stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px;}
  .stat-card{background:#fff;border:1px solid rgba(184,150,12,0.18);padding:20px 16px;text-align:center;}
  .stat-num{font-family:'Cormorant Garamond',serif;font-size:36px;color:#B8960C;line-height:1;}
  .stat-label{font-size:9px;letter-spacing:2px;color:rgba(30,20,8,0.45);text-transform:uppercase;margin-top:6px;}

  .filter-row{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;}
  .ftab{padding:6px 16px;font-family:'Montserrat',sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;border:1px solid rgba(184,150,12,0.35);background:transparent;color:rgba(30,20,10,0.45);transition:all 0.2s;}
  .ftab.active{background:#B8960C;color:#fff;border-color:#B8960C;font-weight:600;}
  .ftab:hover:not(.active){border-color:#B8960C;color:#B8960C;}

  .add-trigger{width:100%;padding:13px;border:1px dashed rgba(184,150,12,0.35);background:transparent;color:rgba(184,150,12,0.55);font-size:11px;cursor:pointer;font-family:'Montserrat',sans-serif;letter-spacing:2px;text-transform:uppercase;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:20px;}
  .add-trigger:hover{border-color:#B8960C;color:#B8960C;}

  .empty{text-align:center;padding:48px 0;border:1px dashed rgba(184,150,12,0.2);}
  .empty-icon{font-family:'Cormorant Garamond',serif;font-size:28px;color:rgba(184,150,12,0.3);margin-bottom:8px;}
  .empty-text{font-family:'Cormorant Garamond',serif;font-size:16px;color:rgba(30,20,8,0.3);font-style:italic;}
  .loading{text-align:center;padding:60px 0;font-family:'Cormorant Garamond',serif;font-size:18px;color:rgba(30,20,8,0.3);font-style:italic;}

  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px;}
  .modal{background:#FAF7F2;border:1px solid rgba(184,150,12,0.3);padding:32px;width:100%;max-width:520px;}
  .modal-title{font-family:'Cormorant Garamond',serif;font-size:22px;color:#B8960C;margin-bottom:20px;}

  /* GUARDIANA PANEL */
  .member-block{background:#fff;border:1px solid rgba(184,150,12,0.18);margin-bottom:12px;overflow:hidden;}
  .member-header{display:flex;align-items:center;gap:12px;padding:14px 18px;cursor:pointer;border-bottom:1px solid rgba(184,150,12,0.1);}
  .member-header:hover{background:rgba(184,150,12,0.02);}
  .member-avatar{width:32px;height:32px;border:1px solid #B8960C;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:15px;color:#B8960C;flex-shrink:0;}
  .member-info{flex:1;}
  .member-name-lg{font-family:'Cormorant Garamond',serif;font-size:18px;color:#1E1408;}
  .member-counts{font-size:10px;color:rgba(30,20,8,0.4);letter-spacing:0.5px;margin-top:1px;}
  .progress-bar{background:#EEE9E0;height:6px;flex:1;}
  .progress-fill{height:100%;background:#B8960C;transition:width 0.4s;}

  .week-group{margin:0;}
  .week-label{font-size:9px;letter-spacing:3px;color:#B8960C;text-transform:uppercase;padding:8px 18px;background:rgba(184,150,12,0.04);border-bottom:1px solid rgba(184,150,12,0.08);}

  .admin-section{margin-bottom:36px;}
  .section-title{font-family:'Cormorant Garamond',serif;font-size:22px;color:#1E1408;margin-bottom:16px;border-bottom:1px solid rgba(184,150,12,0.2);padding-bottom:8px;}
  .group-card{background:#fff;border:1px solid rgba(184,150,12,0.2);padding:20px;margin-bottom:12px;}
  .group-name-lg{font-family:'Cormorant Garamond',serif;font-size:18px;color:#1E1408;margin-bottom:4px;}
  .group-meta{font-size:10px;color:rgba(30,20,8,0.4);letter-spacing:1px;margin-bottom:12px;}
  .member-pill{display:inline-flex;align-items:center;gap:6px;background:#FAF7F2;border:1px solid rgba(184,150,12,0.2);padding:4px 10px;margin:3px;font-size:11px;color:#1E1408;}
  .member-pill button{background:none;border:none;color:rgba(192,57,43,0.5);cursor:pointer;font-size:12px;padding:0;}
  .member-pill button:hover{color:#C0392B;}
  .code-badge{display:inline-block;background:#0A0A0A;color:#B8960C;font-family:'Montserrat',sans-serif;font-size:10px;letter-spacing:3px;padding:3px 8px;}

  .error-msg{font-size:11px;color:#E74C3C;letter-spacing:0.5px;margin-top:4px;}

  @media(max-width:600px){
    .stats-row{grid-template-columns:1fr 1fr;}
    .header{padding:0 16px;}
    .main{padding:24px 16px 60px;}
  }
`;

// ─── GoldDots ────────────────────────────────────────────
function GoldDots() {
  return (
    <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",overflow:"visible"}}>
      {[[60,80,3],[90,150,2],[35,230,4],[115,55,2],[1320,55,3],[1365,145,4],[1385,225,2]].map(([x,y,r],i)=>
        <circle key={i} cx={x} cy={y} r={r} fill="#B8960C" opacity="0.5"/>)}
    </svg>
  );
}

// ─── Header ─────────────────────────────────────────────
function Header({ title, user, onExit }) {
  return (
    <div className="header">
      <div>
        <div className="header-logo">maïté issa</div>
        <div className="header-title">{title}</div>
      </div>
      <div className="header-right">
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

// ─── EditModal ───────────────────────────────────────────
function EditModal({ action, onSave, onClose }) {
  const [text, setText] = useState(action.action_text);
  const [date, setDate] = useState(action.action_date);

  const save = async () => {
    if (!text.trim() || !date.trim()) return;
    await supabase.from("actions").update({ action_text: text, action_date: date }).eq("id", action.id);
    onSave();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Editar acción</div>
        <textarea value={text} onChange={e=>setText(e.target.value)} rows={3}
          className="ci" style={{resize:"none",marginBottom:12,lineHeight:1.6}} />
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}
          className="ci" style={{marginBottom:20}} />
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button className="ghost-btn" onClick={onClose}>Cancelar</button>
          <button className="gold-btn" onClick={save}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}

// ─── ActionCard ──────────────────────────────────────────
function ActionCard({ action, currentMemberId, onToggle, onEdit, onDelete, showName=true }) {
  const isOwn = currentMemberId && action.member_id === currentMemberId;

  return (
    <div className="card">
      <div className="action-row">
        <div
          className={`check-box${action.completed?" done":""}${!isOwn?" readonly":""}`}
          onClick={() => isOwn && onToggle && onToggle(action)}
        />
        <div className="action-body">
          {showName && <div className="action-name">{action.member_name}</div>}
          <div className={`action-text${action.completed?" done":""}`}>{action.action_text}</div>
          <div className="action-meta">
            📅 {action.action_date}
            {action.completed && action.completed_at &&
              ` · ✓ Completada el ${new Date(action.completed_at).toLocaleDateString("es-ES")}`}
          </div>
        </div>
        {isOwn && (
          <div className="action-actions">
            {onEdit && <button className="icon-btn edit" onClick={() => onEdit(action)} title="Editar">✎</button>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LOGIN ───────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("select");
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [members, setMembers] = useState([]);
  const [code, setCode] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("groups").select("*").order("name").then(({data}) => { if (data) setGroups(data); });
  }, []);

  useEffect(() => {
    if (!selectedGroup) return setMembers([]);
    supabase.from("members").select("*").eq("group_id", selectedGroup).order("name")
      .then(({data}) => { if (data) setMembers(data); });
  }, [selectedGroup]);

  const handleMemberLogin = () => {
    if (!selectedGroup || !selectedMember) return setError("Selecciona tu grupo y tu nombre.");
    const grp = groups.find(g => g.id == selectedGroup);
    const mbr = members.find(m => m.id == selectedMember);
    if (!grp || !mbr) return setError("Selección no válida.");
    onLogin({ role:"member", group:grp, member:mbr });
  };

  const handleGuardianaLogin = () => {
    if (!selectedGroup) return setError("Selecciona tu grupo.");
    if (code !== GUARDIANA_CODE) return setError("Código incorrecto.");
    const grp = groups.find(g => g.id == selectedGroup);
    onLogin({ role:"guardiana", group:grp, member:null });
  };

  const handleAdminLogin = () => {
    if (adminCode === ADMIN_CODE) onLogin({ role:"admin", group:null, member:null });
    else setError("Código incorrecto.");
  };

  return (
    <div className="login-wrap">
      <GoldDots />
      {[700,500,320].map(s=><div key={s} className="login-ring" style={{width:s,height:s}}/>)}
      <div style={{textAlign:"center",color:"#fff",position:"relative",zIndex:2,padding:"0 24px",width:"100%",maxWidth:420}}>
        <div style={{fontFamily:"'Montserrat',sans-serif",fontSize:9,letterSpacing:7,color:"rgba(184,150,12,0.7)",textTransform:"uppercase",marginBottom:10}}>Maïté Issa</div>
        <div style={{width:48,height:1,background:"linear-gradient(90deg,transparent,#B8960C,transparent)",margin:"0 auto 16px"}}/>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,letterSpacing:5,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",marginBottom:6}}>El Círculo</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:44,fontWeight:300,color:"#fff",lineHeight:1.05,marginBottom:8}}>Mis Acciones</div>
        <div style={{width:48,height:1,background:"linear-gradient(90deg,transparent,#B8960C,transparent)",margin:"0 auto 36px"}}/>

        {mode === "select" && (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <button className="login-btn" onClick={()=>{setMode("member");setError("");}}>Soy alumna</button>
            <button className="login-btn secondary" onClick={()=>{setMode("guardiana");setError("");}}>Soy guardiana</button>
            <button className="login-btn ghost" onClick={()=>{setMode("admin");setError("");}}>Admin</button>
          </div>
        )}

        {mode === "member" && (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <select className="login-input" value={selectedGroup} onChange={e=>{setSelectedGroup(e.target.value);setSelectedMember("");}}>
              <option value="">Selecciona tu grupo...</option>
              {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            {members.length > 0 && (
              <select className="login-input" value={selectedMember} onChange={e=>setSelectedMember(e.target.value)}>
                <option value="">Selecciona tu nombre...</option>
                {members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}
            {error && <div className="error-msg">{error}</div>}
            <button className="login-btn" onClick={handleMemberLogin}>Entrar</button>
            <button className="login-btn ghost" onClick={()=>setMode("select")}>← Volver</button>
          </div>
        )}

        {mode === "guardiana" && (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <select className="login-input" value={selectedGroup} onChange={e=>setSelectedGroup(e.target.value)}>
              <option value="">Selecciona tu grupo...</option>
              {groups.map(g=><option key={g.id} value={g.id}>{g.name} — {g.guardiana}</option>)}
            </select>
            <input className="login-input" type="password" placeholder="Código de guardiana..."
              value={code} onChange={e=>setCode(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleGuardianaLogin()} />
            {error && <div className="error-msg">{error}</div>}
            <button className="login-btn" onClick={handleGuardianaLogin}>Entrar como guardiana</button>
            <button className="login-btn ghost" onClick={()=>setMode("select")}>← Volver</button>
          </div>
        )}

        {mode === "admin" && (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <input className="login-input" type="password" placeholder="Código de admin..."
              value={adminCode} onChange={e=>setAdminCode(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleAdminLogin()} />
            {error && <div className="error-msg">{error}</div>}
            <button className="login-btn" onClick={handleAdminLogin}>Entrar</button>
            <button className="login-btn ghost" onClick={()=>setMode("select")}>← Volver</button>
          </div>
        )}
        <div style={{marginTop:36,fontSize:9,color:"rgba(255,255,255,0.15)",letterSpacing:3,textTransform:"uppercase"}}>Mentoría Personalizada · 2026</div>
      </div>
    </div>
  );
}

// ─── MEMBER VIEW ─────────────────────────────────────────
function MemberView({ session, onExit }) {
  const { group, member } = session;
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");
  const [editingAction, setEditingAction] = useState(null);
  const [newAction, setNewAction] = useState({ action_text:"", action_date:"" });

  const loadActions = useCallback(async () => {
    const { data } = await supabase.from("actions").select("*")
      .eq("group_id", group.id).order("created_at", { ascending: false });
    if (data) setActions(data);
    setLoading(false);
  }, [group.id]);

  useEffect(() => {
    loadActions();
    const sub = supabase.channel(`member-actions-${group.id}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"actions",
        filter:`group_id=eq.${group.id}` }, () => loadActions())
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [loadActions]);

  const addAction = async () => {
    if (!newAction.action_text.trim() || !newAction.action_date.trim()) return;
    const { data } = await supabase.from("actions").insert({
      group_id: group.id, member_id: member.id,
      member_name: member.name,
      action_text: newAction.action_text,
      action_date: newAction.action_date,
      completed: false
    }).select().single();
    if (data) {
      setActions(prev => [data, ...prev]);
      setNewAction({ action_text:"", action_date:"" });
      setShowAdd(false);
    }
  };

  const toggleComplete = async (action) => {
    const newVal = !action.completed;
    // Optimistic update
    setActions(prev => prev.map(a => a.id === action.id
      ? { ...a, completed: newVal, completed_at: newVal ? new Date().toISOString() : null }
      : a));
    await supabase.from("actions").update({
      completed: newVal,
      completed_at: newVal ? new Date().toISOString() : null
    }).eq("id", action.id);
  };

  const myActions = actions.filter(a => a.member_id === member.id);
  const myDone = myActions.filter(a => a.completed).length;

  const displayed = filter === "all" ? actions
    : filter === "mine" ? myActions
    : filter === "pending" ? actions.filter(a => !a.completed)
    : actions.filter(a => a.completed);

  return (
    <div className="app">
      {editingAction && (
        <EditModal action={editingAction} onSave={loadActions} onClose={() => setEditingAction(null)} />
      )}
      <Header title={group.name} user={member.name} onExit={onExit} />
      <div className="main">
        <div className="page-header">
          <div className="page-eyebrow">Mis compromisos</div>
          <div className="page-title">Seguimiento de acciones</div>
          <div className="page-sub">Guardiana: {group.guardiana} · {group.name}</div>
        </div>

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
            <div className="stat-num">{actions.length}</div>
            <div className="stat-label">Total grupo</div>
          </div>
        </div>

        <button className="add-trigger" onClick={() => setShowAdd(!showAdd)}>✦ Añadir mi acción</button>

        {showAdd && (
          <div className="add-form">
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"#B8960C",marginBottom:16}}>Nueva acción</div>
            <textarea placeholder="¿Qué acción vas a tomar? Sé específica..."
              value={newAction.action_text}
              onChange={e=>setNewAction(p=>({...p,action_text:e.target.value}))}
              rows={3} className="ci" style={{resize:"none",marginBottom:12,lineHeight:1.6}} />
            <input type="date" value={newAction.action_date}
              onChange={e=>setNewAction(p=>({...p,action_date:e.target.value}))}
              className="ci" style={{marginBottom:16}} />
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button className="ghost-btn" onClick={()=>setShowAdd(false)}>Cancelar</button>
              <button className="gold-btn" onClick={addAction}>Comprometerse ✦</button>
            </div>
          </div>
        )}

        <div className="filter-row">
          {[["all","Todas"],["mine","Las mías"],["pending","Pendientes"],["done","Completadas"]].map(([id,label])=>(
            <button key={id} className={`ftab${filter===id?" active":""}`} onClick={()=>setFilter(id)}>{label}</button>
          ))}
        </div>

        {loading && <div className="loading">Cargando acciones...</div>}
        {!loading && displayed.length === 0 && (
          <div className="empty"><div className="empty-icon">✦</div><div className="empty-text">No hay acciones aquí todavía</div></div>
        )}
        {displayed.map(action => (
          <ActionCard key={action.id} action={action}
            currentMemberId={member.id}
            onToggle={toggleComplete}
            onEdit={setEditingAction} />
        ))}
      </div>
    </div>
  );
}

// ─── GUARDIANA VIEW ──────────────────────────────────────
function GuardianaView({ session, onExit }) {
  const { group } = session;
  const [actions, setActions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedMembers, setExpandedMembers] = useState({});
  const [weekFilter, setWeekFilter] = useState("all");

  const loadAll = useCallback(async () => {
    const [{ data: a }, { data: m }] = await Promise.all([
      supabase.from("actions").select("*").eq("group_id", group.id).order("action_date", { ascending: true }),
      supabase.from("members").select("*").eq("group_id", group.id).order("name")
    ]);
    if (a) setActions(a);
    if (m) {
      setMembers(m);
      // Expand all by default
      const exp = {};
      m.forEach(mb => { exp[mb.id] = true; });
      setExpandedMembers(exp);
    }
    setLoading(false);
  }, [group.id]);

  useEffect(() => {
    loadAll();
    const sub = supabase.channel(`guard-actions-${group.id}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"actions",
        filter:`group_id=eq.${group.id}` }, () => loadAll())
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [loadAll]);

  const toggleMember = (id) => setExpandedMembers(p => ({ ...p, [id]: !p[id] }));

  // Stats
  const totalDone = actions.filter(a=>a.completed).length;
  const totalPending = actions.filter(a=>!a.completed).length;

  // Get unique weeks from actions
  const allWeeks = [...new Set(actions.map(a => getWeekLabel(a.action_date)))];

  // Filter actions
  let filteredActions = actions;
  if (filter === "pending") filteredActions = actions.filter(a=>!a.completed);
  if (filter === "done") filteredActions = actions.filter(a=>a.completed);
  if (weekFilter !== "all") filteredActions = filteredActions.filter(a => getWeekLabel(a.action_date) === weekFilter);

  // Group by member — only show members with actions matching the current filter.
  // Exception: in "all" view with no week filter, also show members with zero actions
  // so the guardiana can see who hasn't submitted anything yet.
  const byMember = {};
  filteredActions.forEach(a => {
    if (!byMember[a.member_id]) {
      const fullMember = members.find(m => m.id === a.member_id);
      byMember[a.member_id] = {
        member: fullMember || { id: a.member_id, name: a.member_name },
        actions: []
      };
    }
    byMember[a.member_id].actions.push(a);
  });
  if (filter === "all" && weekFilter === "all") {
    members.forEach(m => {
      if (!byMember[m.id]) byMember[m.id] = { member: m, actions: [] };
    });
  }

  // Group member's actions by week
  const groupByWeek = (acts) => {
    const map = {};
    acts.forEach(a => {
      const w = getWeekLabel(a.action_date);
      if (!map[w]) map[w] = [];
      map[w].push(a);
    });
    return map;
  };

  return (
    <div className="app">
      <Header title={`${group.name} — Guardiana`} user={group.guardiana} onExit={onExit} />
      <div className="main">
        <div className="page-header">
          <div className="page-eyebrow">Panel de guardiana</div>
          <div className="page-title">Seguimiento del grupo</div>
          <div className="page-sub">{group.name} · {actions.length} acciones · {members.length} alumnas</div>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-num">{actions.length}</div>
            <div className="stat-label">Acciones totales</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{color:"#1A6B3C"}}>{totalDone}</div>
            <div className="stat-label">Completadas ✓</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{color:"#C0392B"}}>{totalPending}</div>
            <div className="stat-label">Pendientes</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-row">
          {[["all","Todas"],["pending","Pendientes"],["done","Completadas"]].map(([id,label])=>(
            <button key={id} className={`ftab${filter===id?" active":""}`} onClick={()=>setFilter(id)}>{label}</button>
          ))}
          {allWeeks.length > 0 && <>
            <div style={{width:1,background:"rgba(184,150,12,0.3)",margin:"0 4px"}}/>
            <button className={`ftab${weekFilter==="all"?" active":""}`} onClick={()=>setWeekFilter("all")}>Todas las semanas</button>
            {allWeeks.map(w=>(
              <button key={w} className={`ftab${weekFilter===w?" active":""}`} onClick={()=>setWeekFilter(w)}>{w}</button>
            ))}
          </>}
        </div>

        {loading && <div className="loading">Cargando...</div>}

        {!loading && Object.values(byMember).length === 0 && (
          <div className="empty"><div className="empty-icon">◇</div><div className="empty-text">No hay acciones todavía</div></div>
        )}

        {/* Member blocks */}
        {Object.values(byMember).map(({ member: mb, actions: acts }) => {
          const done = acts.filter(a=>a.completed).length;
          const pct = acts.length > 0 ? Math.round(done/acts.length*100) : 0;
          const isExpanded = expandedMembers[mb.id];
          const byWeek = groupByWeek(acts);

          return (
            <div key={mb.id} className="member-block">
              {/* Member header */}
              <div className="member-header" onClick={()=>toggleMember(mb.id)}>
                <div className="member-avatar">{mb.name[0]}</div>
                <div className="member-info">
                  <div className="member-name-lg">{mb.name}</div>
                  <div className="member-counts">{done}/{acts.length} completadas · {pct}%</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                  <div style={{width:100}}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width:`${pct}%`, background: pct===100?"#1A6B3C":"#B8960C"}}/>
                    </div>
                  </div>
                  <div style={{color:"#B8960C",fontSize:11,opacity:0.6,width:12}}>{isExpanded?"▲":"▼"}</div>
                </div>
              </div>

              {/* Expanded: actions grouped by week */}
              {isExpanded && acts.length > 0 && (
                <div>
                  {Object.entries(byWeek).map(([week, weekActs]) => (
                    <div key={week} className="week-group">
                      <div className="week-label">{week} · {weekActs.filter(a=>a.completed).length}/{weekActs.length} completadas</div>
                      {weekActs.map(action => (
                        <ActionCard key={action.id} action={action}
                          currentMemberId={null} onToggle={null} onEdit={null} showName={false} />
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {isExpanded && acts.length === 0 && (
                <div style={{padding:"16px 18px",fontSize:12,color:"rgba(30,20,8,0.35)",fontStyle:"italic"}}>
                  Esta alumna no tiene acciones en este filtro
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ADMIN VIEW ──────────────────────────────────────────
function AdminView({ session, onExit }) {
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddMember, setShowAddMember] = useState(null);
  const [newGroup, setNewGroup] = useState({ name:"", guardiana:"", code:"" });
  const [newMemberName, setNewMemberName] = useState("");

  const load = useCallback(async () => {
    const [{ data:g },{ data:m }] = await Promise.all([
      supabase.from("groups").select("*").order("name"),
      supabase.from("members").select("*").order("name")
    ]);
    if (g) setGroups(g);
    if (m) setMembers(m);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createGroup = async () => {
    if (!newGroup.name.trim() || !newGroup.guardiana.trim() || !newGroup.code.trim()) return;
    await supabase.from("groups").insert({ ...newGroup, code: newGroup.code.toUpperCase() });
    setNewGroup({ name:"", guardiana:"", code:"" });
    setShowAddGroup(false);
    load();
  };

  const deleteGroup = async (id) => {
    if (!window.confirm("¿Eliminar este grupo y todas sus alumnas y acciones?")) return;
    await supabase.from("groups").delete().eq("id", id);
    load();
  };

  const addMembers = async (groupId) => {
    if (!newMemberName.trim()) return;
    const names = newMemberName.split(",").map(n=>n.trim()).filter(Boolean);
    for (const name of names) await supabase.from("members").insert({ group_id: groupId, name });
    setNewMemberName("");
    setShowAddMember(null);
    load();
  };

  const deleteMember = async (id) => {
    await supabase.from("members").delete().eq("id", id);
    load();
  };

  const getMembersForGroup = (gid) => members.filter(m => m.group_id === gid);

  return (
    <div className="app">
      <Header title="Panel de Administración" user="Estefany" onExit={onExit} />
      <div className="main">
        <div className="page-header">
          <div className="page-eyebrow">Admin</div>
          <div className="page-title">Gestión de grupos y alumnas</div>
          <div className="page-sub">
            Código guardianas: <strong style={{color:"#B8960C",letterSpacing:2}}>{GUARDIANA_CODE}</strong>
            &nbsp;·&nbsp; Código admin: <strong style={{color:"#B8960C",letterSpacing:2}}>{ADMIN_CODE}</strong>
          </div>
        </div>

        <button className="add-trigger" onClick={()=>setShowAddGroup(!showAddGroup)}>✦ Nuevo grupo</button>

        {showAddGroup && (
          <div className="add-form" style={{marginBottom:24}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"#B8960C",marginBottom:16}}>Nuevo grupo</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <input placeholder="Nombre del grupo (ej. Grupo Ofelia A)" value={newGroup.name}
                onChange={e=>setNewGroup(p=>({...p,name:e.target.value}))} className="ci" />
              <input placeholder="Nombre de la guardiana" value={newGroup.guardiana}
                onChange={e=>setNewGroup(p=>({...p,guardiana:e.target.value}))} className="ci" />
            </div>
            <input placeholder="Código de acceso (ej. OFELIAA)" value={newGroup.code}
              onChange={e=>setNewGroup(p=>({...p,code:e.target.value.toUpperCase().replace(/\s/g,"")}))}
              className="ci" style={{marginBottom:16}} />
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button className="ghost-btn" onClick={()=>setShowAddGroup(false)}>Cancelar</button>
              <button className="gold-btn" onClick={createGroup}>Crear grupo</button>
            </div>
          </div>
        )}

        {loading && <div className="loading">Cargando...</div>}

        {groups.map(group => {
          const grpMembers = getMembersForGroup(group.id);
          return (
            <div key={group.id} className="group-card">
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
                <div>
                  <div className="group-name-lg">{group.name}</div>
                  <div className="group-meta">
                    Guardiana: {group.guardiana}&nbsp;·&nbsp;
                    <span className="code-badge">{group.code}</span>
                    &nbsp;·&nbsp;{grpMembers.length} alumnas
                  </div>
                </div>
                <button className="danger-btn" onClick={()=>deleteGroup(group.id)}>Eliminar</button>
              </div>
              <div style={{marginBottom:12}}>
                {grpMembers.map(m=>(
                  <span key={m.id} className="member-pill">
                    {m.name}
                    <button onClick={()=>deleteMember(m.id)}>✕</button>
                  </span>
                ))}
                {grpMembers.length === 0 && (
                  <span style={{fontSize:11,color:"rgba(30,20,8,0.35)",fontStyle:"italic"}}>Sin alumnas todavía</span>
                )}
              </div>
              {showAddMember === group.id ? (
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input placeholder="Nombre/s separados por coma" value={newMemberName}
                    onChange={e=>setNewMemberName(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&addMembers(group.id)}
                    className="ci" style={{flex:1}} />
                  <button className="gold-btn" onClick={()=>addMembers(group.id)}>Añadir</button>
                  <button className="ghost-btn" onClick={()=>setShowAddMember(null)}>✕</button>
                </div>
              ) : (
                <button className="ghost-btn" style={{fontSize:10,letterSpacing:1.5}}
                  onClick={()=>{setShowAddMember(group.id);setNewMemberName("");}}>
                  + Añadir alumnas
                </button>
              )}
            </div>
          );
        })}

        {groups.length === 0 && !loading && (
          <div className="empty"><div className="empty-icon">◇</div><div className="empty-text">No hay grupos creados todavía</div></div>
        )}
      </div>
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  if (!session) return <LoginScreen onLogin={setSession} />;
  if (session.role === "admin") return <AdminView session={session} onExit={()=>setSession(null)} />;
  if (session.role === "guardiana") return <GuardianaView session={session} onExit={()=>setSession(null)} />;
  return <MemberView session={session} onExit={()=>setSession(null)} />;
}
