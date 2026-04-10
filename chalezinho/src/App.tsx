import { useState, useEffect } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SB_URL = "https://ekodvpaibodkthxwtxrc.supabase.co/rest/v1";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrb2R2cGFpYm9ka3RoeHd0eHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzAwNTEsImV4cCI6MjA5MTQwNjA1MX0.rJfjqFewBDPQ7O5bTwuRuVW-cYjXQO6aMUn8oDw_L3E";
const APP_URL = "https://chalezinho-n7i4.vercel.app";
const HDR = { "apikey": SB_KEY, "Authorization": "Bearer "+SB_KEY, "Content-Type": "application/json", "Prefer": "return=representation" };

const sb = {
  get: async (table, query="") => { const r = await fetch(`${SB_URL}/${table}?${query}`, {headers:HDR}); return r.json(); },
  post: async (table, body) => { const r = await fetch(`${SB_URL}/${table}`, {method:"POST", headers:HDR, body:JSON.stringify(body)}); return r.json(); },
  patch: async (table, match, body) => { const r = await fetch(`${SB_URL}/${table}?${match}`, {method:"PATCH", headers:HDR, body:JSON.stringify(body)}); return r.json(); },
};

// ─── BRAND COLORS ─────────────────────────────────────────────────────────────
const C = {
  bg:"#FFF8F8", surf:"#FFFFFF", surf2:"#FFF0F0", surf3:"#FFE4E4",
  border:"#F0C0C0", primary:"#C01E1E", primaryDark:"#8B1010",
  primaryLight:"#E03030", glow:"rgba(192,30,30,0.15)",
  green:"#2E7D32", red:"#C62828", blue:"#1565C0",
  text:"#1A0505", muted:"#8B4444", soft:"#C49090",
  gold:"#B8860B", silver:"#6B7F8F", bronze:"#8B5530",
  cardShadow:"0 2px 12px rgba(192,30,30,0.08)",
};

const LEVELS = [
  {name:"Iniciante",min:0,   emoji:"🌱",col:"#7B6060"},
  {name:"Bronze",   min:100, emoji:"🥉",col:"#8B5530"},
  {name:"Prata",    min:250, emoji:"🥈",col:"#5A6B7A"},
  {name:"Ouro",     min:500, emoji:"🥇",col:"#B8860B"},
  {name:"Diamante", min:1000,emoji:"💎",col:"#1565C0"},
  {name:"Lenda",    min:2000,emoji:"👑",col:"#6A0DAD"},
];

const BADGES = [
  {id:"b1",  emoji:"⭐",name:"Primeira Estrela",   req:1  },
  {id:"b5",  emoji:"🔥",name:"Pegando Fogo",       req:5  },
  {id:"b10", emoji:"🏅",name:"Parceiro Dedicado",  req:10 },
  {id:"b25", emoji:"🏆",name:"Campeão",            req:25 },
  {id:"b50", emoji:"👑",name:"Lenda do Chalezinho",req:50 },
  {id:"b100",emoji:"💎",name:"Diamante Eterno",    req:100},
];

const PTYPES = {
  guide:    {label:"Guia Turístico",     icon:"🗺️"},
  driver:   {label:"Motorista Executivo",icon:"🚗"},
  uber:     {label:"Motorista de App",   icon:"📱"},
  concierge:{label:"Concierge",          icon:"🏨"},
  hotel:    {label:"Hotel / Pousada",    icon:"🏩"},
  other:    {label:"Outro",              icon:"🤝"},
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2,9);
const calcPts = n => n * 10;
const getLevel = p => [...LEVELS].reverse().find(l => p >= l.min) || LEVELS[0];
const getNextLvl = p => LEVELS.find(l => l.min > p);
const earnedBadges = n => BADGES.filter(b => n >= b.req);

// DB row → app object
const toPartner = r => ({id:r.id, name:r.name, type:r.type, email:r.email, pw:r.pw, code:r.code});
const toCheckin = r => ({id:r.id, partnerId:r.partner_id, tourist:r.tourist, date:r.date, status:r.status});
const toBooking = r => ({id:r.id, partnerId:r.partner_id, tourist:r.tourist, email:r.email, date:r.date, guests:r.guests, status:r.status});

const filterByPeriod = (items, period) => {
  if (period === "all") return items;
  const now = new Date();
  return items.filter(item => {
    const d = new Date(item.date);
    if (period === "week") { const s = new Date(now); s.setDate(now.getDate()-now.getDay()); s.setHours(0,0,0,0); return d >= s; }
    if (period === "month") return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
    if (period === "year")  return d.getFullYear()===now.getFullYear();
    return true;
  });
};

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({size=48}) {
  const h = size, w = size * 3.4;
  const [ok, setOk] = useState(true);
  if (!ok) {
    return (
      <svg width={w} height={h} viewBox="0 0 340 100" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(218,2)">
          <polygon points="42,0 84,32 0,32" fill="#C01E1E"/>
          <rect x="8" y="32" width="68" height="42" fill="#C01E1E"/>
          <rect x="28" y="46" width="16" height="28" fill="#FFF8F8"/>
          <ellipse cx="4" cy="48" rx="7" ry="18" fill="#8B1010"/>
          <ellipse cx="80" cy="48" rx="7" ry="18" fill="#8B1010"/>
        </g>
        <text x="2" y="34" fontFamily="Georgia,serif" fontSize="13" fill="#C01E1E" fontStyle="italic">Era uma vez um</text>
        <text x="0" y="82" fontFamily="Georgia,serif" fontSize="52" fill="#C01E1E" fontWeight="bold" fontStyle="italic" letterSpacing="-2">Chalezinho</text>
      </svg>
    );
  }
  return <img src="https://lh3.googleusercontent.com/d/1pthcir9ziPtKRkihiuE2868qimCIBRrg" alt="Chalezinho" style={{height:h,width:w,objectFit:"contain"}} onError={()=>setOk(false)}/>;
}

// ─── QR CODE (com link real) ───────────────────────────────────────────────────
function QRCode({code, size=140}) {
  const n=17; let seed=0;
  for (const ch of (code+"CHALEZINHO")) seed=(seed*31+ch.charCodeAt(0))>>>0;
  const grid=Array.from({length:n},()=>Array(n).fill(0));
  for (let r=0;r<n;r++) for (let c2=0;c2<n;c2++) { seed=(seed*1664525+1013904223)>>>0; grid[r][c2]=(seed>>16)&1; }
  const finder=(r0,c0)=>{ for(let dr=0;dr<7;dr++) for(let dc=0;dc<7;dc++) { const v=(dr===0||dr===6||dc===0||dc===6||(dr>=2&&dr<=4&&dc>=2&&dc<=4))?1:0; if(r0+dr<n&&c0+dc<n)grid[r0+dr][c0+dc]=v; } };
  finder(0,0); finder(0,n-7); finder(n-7,0);
  const cell=size/n;
  const link = `${APP_URL}?code=${code}`;
  return (
    <a href={link} target="_blank" rel="noreferrer" title={`Abrir: ${link}`}>
      <div style={{background:"#fff",padding:10,borderRadius:12,display:"inline-block",boxShadow:"0 4px 20px rgba(192,30,30,0.15)",border:"1px solid "+C.border,cursor:"pointer"}}>
        <svg width={size} height={size}>
          {grid.flatMap((row,r)=>row.map((v,c2)=>v?<rect key={r+"-"+c2} x={c2*cell} y={r*cell} width={cell+0.5} height={cell+0.5} fill={C.primary}/>:null))}
        </svg>
      </div>
    </a>
  );
}

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Card({children,style}) { return <div style={{background:C.surf,borderRadius:16,padding:18,border:"1px solid "+C.border,boxShadow:C.cardShadow,...style}}>{children}</div>; }

function Btn({children,onClick,variant="primary",style}) {
  const v={
    primary:{background:"linear-gradient(135deg,"+C.primary+","+C.primaryDark+")",color:"#fff",fontWeight:700,boxShadow:"0 4px 14px "+C.glow},
    ghost:{background:"transparent",color:C.primary,border:"1.5px solid "+C.primary},
    success:{background:"linear-gradient(135deg,#2E7D32,#1B5E20)",color:"#fff",fontWeight:700},
    dark:{background:C.surf2,color:C.text,border:"1px solid "+C.border},
  };
  return <button onClick={onClick} style={{border:"none",cursor:"pointer",borderRadius:10,padding:"10px 18px",fontSize:14,transition:"all .2s",fontFamily:"inherit",...v[variant],...style}}>{children}</button>;
}

function Input({label,...props}) {
  return (
    <div style={{marginBottom:12}}>
      {label&&<div style={{color:C.muted,fontSize:11,fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:0.7}}>{label}</div>}
      <input style={{width:"100%",background:C.surf2,border:"1.5px solid "+C.border,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}} {...props}
        onFocus={e=>e.target.style.borderColor=C.primary}
        onBlur={e=>e.target.style.borderColor=C.border}/>
    </div>
  );
}

function Select({label,children,...props}) {
  return (
    <div style={{marginBottom:12}}>
      {label&&<div style={{color:C.muted,fontSize:11,fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:0.7}}>{label}</div>}
      <select style={{width:"100%",background:C.surf2,border:"1.5px solid "+C.border,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}} {...props}>{children}</select>
    </div>
  );
}

function Divider() { return <div style={{height:1,background:"linear-gradient(90deg,transparent,"+C.border+",transparent)",margin:"16px 0"}}/>; }

function BadgeChip({b,earned}) {
  return (
    <div title={b.name+" ("+b.req+" check-ins)"} style={{display:"flex",flexDirection:"column",alignItems:"center",opacity:earned?1:0.25,filter:earned?"none":"grayscale(1)",transition:"all .3s",minWidth:54}}>
      <div style={{fontSize:28,background:earned?C.surf2:"#f5f5f5",borderRadius:12,padding:"6px 10px",border:"1px solid "+(earned?C.primary+"55":C.border)}}>{b.emoji}</div>
      <div style={{fontSize:10,color:earned?C.primary:C.soft,marginTop:3,textAlign:"center",fontWeight:600,lineHeight:1.2}}>{b.name}</div>
    </div>
  );
}

function PeriodBar({period,set}) {
  const opts=[["week","Esta Semana"],["month","Este Mês"],["year","Este Ano"],["all","Tudo"]];
  return (
    <div style={{display:"flex",gap:6,marginBottom:18}}>
      {opts.map(([k,l])=>(
        <button key={k} onClick={()=>set(k)} style={{flex:1,border:period===k?"none":"1.5px solid "+C.border,cursor:"pointer",borderRadius:8,padding:"8px 4px",fontSize:12,fontWeight:700,fontFamily:"inherit",transition:"all .2s",background:period===k?"linear-gradient(135deg,"+C.primary+","+C.primaryDark+")":C.surf,color:period===k?"#fff":C.muted,boxShadow:period===k?"0 2px 10px "+C.glow:"none"}}>{l}</button>
      ))}
    </div>
  );
}

const pageBg = "linear-gradient(160deg,#fff5f5 0%,#ffffff 55%,#fff8f0 100%)";

// ─── LANDING ──────────────────────────────────────────────────────────────────
function Landing({go}) {
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:pageBg}}>
      <div style={{position:"fixed",top:0,left:0,right:0,height:4,background:"linear-gradient(90deg,transparent,"+C.primary+",transparent)"}}/>
      <div style={{width:"100%",maxWidth:420,textAlign:"center"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:24}}><Logo size={52}/></div>
        <div style={{height:1,background:"linear-gradient(90deg,transparent,"+C.border+",transparent)",marginBottom:18}}/>
        <p style={{color:C.muted,margin:"0 0 28px",fontSize:14,letterSpacing:0.5}}>✨ Programa de Parceiros & Indicações</p>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Btn onClick={()=>go("login")} style={{width:"100%",padding:"15px 20px",fontSize:16,borderRadius:14}}>🤝 Sou Parceiro</Btn>
          <Btn onClick={()=>go("tourist")} variant="dark" style={{width:"100%",padding:"13px 20px",fontSize:15,borderRadius:14}}>🌎 Fazer Reserva com Código</Btn>
          <Btn onClick={()=>go("leaderboard")} variant="ghost" style={{width:"100%",padding:"12px 20px",fontSize:14,borderRadius:14}}>🏆 Ver Ranking de Parceiros</Btn>
        </div>
        <button onClick={()=>go("admin")} style={{background:"transparent",border:"none",color:C.soft,fontSize:12,cursor:"pointer",marginTop:16,padding:8,fontFamily:"inherit"}}>🔐 Acesso do Restaurante</button>
      </div>
    </div>
  );
}

// ─── PARTNER LOGIN ────────────────────────────────────────────────────────────
function PartnerLogin({partners,setCurrent,go,toast}) {
  const [email,setEmail]=useState(""); const [pw,setPw]=useState("");
  const login=()=>{
    const p=partners.find(x=>x.email===email&&x.pw===pw);
    if(p){setCurrent(p);go("dashboard");}
    else toast("Email ou senha incorretos ❌","err");
  };
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:pageBg}}>
      <Card style={{width:"100%",maxWidth:360}}>
        <Btn onClick={()=>go("landing")} variant="ghost" style={{marginBottom:16,padding:"6px 12px",fontSize:12}}>← Voltar</Btn>
        <div style={{textAlign:"center",marginBottom:16}}><Logo size={42}/></div>
        <Divider/>
        <h2 style={{color:C.primary,margin:"0 0 18px",fontSize:20,textAlign:"center"}}>🤝 Login do Parceiro</h2>
        <Input label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"/>
        <Input label="Senha" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••" onKeyDown={e=>e.key==="Enter"&&login()}/>
        <Btn onClick={login} style={{width:"100%",padding:"12px",fontSize:15,marginTop:4}}>Entrar</Btn>
        <p style={{textAlign:"center",marginTop:14,color:C.muted,fontSize:13}}>Novo parceiro? <span onClick={()=>go("register")} style={{color:C.primary,cursor:"pointer",fontWeight:700}}>Cadastre-se</span></p>
      </Card>
    </div>
  );
}

// ─── PARTNER REGISTER ─────────────────────────────────────────────────────────
function PartnerRegister({partners,savePartners,go,toast}) {
  const [f,setF]=useState({name:"",type:"guide",email:"",pw:""});
  const [loading,setLoading]=useState(false);
  const reg=async()=>{
    if(!f.name||!f.email||!f.pw) return toast("Preencha todos os campos","err");
    if(partners.find(p=>p.email===f.email)) return toast("Email já cadastrado","err");
    setLoading(true);
    const base=f.name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g,"").slice(0,6);
    const newP={id:uid(),name:f.name,type:f.type,email:f.email,pw:f.pw,code:base+uid().slice(0,3).toUpperCase()};
    await sb.post("partners",{id:newP.id,name:newP.name,type:newP.type,email:newP.email,pw:newP.pw,code:newP.code});
    savePartners([...partners,newP]);
    setLoading(false);
    toast("Cadastro realizado! Faça o login 🎉"); go("login");
  };
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:pageBg}}>
      <Card style={{width:"100%",maxWidth:360}}>
        <Btn onClick={()=>go("login")} variant="ghost" style={{marginBottom:16,padding:"6px 12px",fontSize:12}}>← Voltar</Btn>
        <div style={{textAlign:"center",marginBottom:16}}><Logo size={38}/></div>
        <Divider/>
        <h2 style={{color:C.primary,margin:"0 0 18px",fontSize:20,textAlign:"center"}}>✨ Cadastro de Parceiro</h2>
        <Input label="Nome / Empresa" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Seu nome ou empresa"/>
        <Select label="Tipo de Parceiro" value={f.type} onChange={e=>setF({...f,type:e.target.value})}>
          {Object.entries(PTYPES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
        </Select>
        <Input label="Email" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="seu@email.com"/>
        <Input label="Senha" type="password" value={f.pw} onChange={e=>setF({...f,pw:e.target.value})} placeholder="Escolha uma senha"/>
        <Btn onClick={reg} style={{width:"100%",padding:"12px",fontSize:15,marginTop:4}} disabled={loading}>{loading?"Salvando...":"Criar Conta"}</Btn>
      </Card>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({partner,stats,ranking,checkins,bookings,go}) {
  const [tab,setTab]=useState("home");
  const {total,points,level,pending}=stats;
  const nextLvl=getNextLvl(points);
  const rank=ranking.findIndex(p=>p.id===partner.id)+1;
  const pt=PTYPES[partner.type]||PTYPES.other;
  const pct=nextLvl?Math.min(100,((points-level.min)/(nextLvl.min-level.min))*100):100;
  const qrLink = `${APP_URL}?code=${partner.code}`;

  return (
    <div style={{maxWidth:480,margin:"0 auto",paddingBottom:80,background:C.bg,minHeight:"100vh"}}>
      <div style={{background:"linear-gradient(135deg,"+C.surf+","+C.surf2+")",borderBottom:"1px solid "+C.border,padding:"14px 14px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,"+C.primary+","+C.primaryDark+")",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 4px 12px "+C.glow}}>{pt.icon}</div>
            <div>
              <div style={{fontSize:11,color:C.muted}}>{pt.label}</div>
              <div style={{fontWeight:800,fontSize:17,color:C.text}}>{partner.name}</div>
            </div>
          </div>
          <Btn onClick={()=>go("landing")} variant="ghost" style={{padding:"6px 12px",fontSize:12}}>Sair</Btn>
        </div>
      </div>

      <div style={{padding:"14px 14px 0"}}>
        <Card style={{marginBottom:14,background:"linear-gradient(135deg,"+C.surf+","+C.surf2+")",border:"1.5px solid "+level.col+"44",boxShadow:"0 4px 20px "+level.col+"18"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div>
              <div style={{fontSize:34}}>{level.emoji}</div>
              <div style={{fontWeight:800,fontSize:20,color:level.col,marginTop:2}}>{level.name}</div>
              <div style={{color:C.muted,fontSize:13,marginTop:2}}>{points} pontos acumulados</div>
            </div>
            <div style={{textAlign:"center",background:"#fff",borderRadius:14,padding:"10px 16px",border:"1.5px solid "+C.border,boxShadow:C.cardShadow}}>
              <div style={{fontSize:32,fontWeight:900,color:C.primary,lineHeight:1}}>#{rank||"—"}</div>
              <div style={{color:C.muted,fontSize:11,marginTop:2}}>no ranking</div>
            </div>
          </div>
          {nextLvl?(
            <>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:6}}>
                <span>Próximo: {nextLvl.emoji} {nextLvl.name}</span>
                <span style={{color:level.col,fontWeight:700}}>{nextLvl.min-points} pts faltam</span>
              </div>
              <div style={{background:C.surf3,borderRadius:999,height:8,overflow:"hidden",border:"1px solid "+C.border}}>
                <div style={{width:pct+"%",height:"100%",background:"linear-gradient(90deg,"+C.primaryDark+","+level.col+")",borderRadius:999,transition:"width .6s"}}/>
              </div>
            </>
          ):<div style={{fontSize:13,color:level.col,fontWeight:700,textAlign:"center"}}>🏆 Nível máximo atingido!</div>}
        </Card>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
          {[{e:"✅",v:total,l:"Check-ins",c:C.green},{e:"⏳",v:pending,l:"Pendentes",c:C.gold},{e:"⭐",v:points,l:"Pontos",c:C.primary}].map(s=>(
            <Card key={s.l} style={{textAlign:"center",padding:14}}>
              <div style={{fontSize:22}}>{s.e}</div>
              <div style={{fontSize:24,fontWeight:900,color:s.c,lineHeight:1.2}}>{s.v}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:3}}>{s.l}</div>
            </Card>
          ))}
        </div>

        <div style={{display:"flex",gap:6,marginBottom:14,background:C.surf2,borderRadius:12,padding:5,border:"1px solid "+C.border}}>
          {[["home","🏠 Início"],["qr","📲 QR Code"],["hist","📋 Histórico"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,border:"none",cursor:"pointer",borderRadius:9,padding:"9px 0",fontSize:12,fontWeight:700,fontFamily:"inherit",background:tab===t?"linear-gradient(135deg,"+C.primary+","+C.primaryDark+")":"transparent",color:tab===t?"#fff":C.muted,transition:"all .2s"}}>{l}</button>
          ))}
        </div>

        {tab==="home"&&(
          <>
            <Card style={{marginBottom:14}}>
              <div style={{fontWeight:700,marginBottom:14,fontSize:15,color:C.text}}>🏅 Conquistas</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{BADGES.map(b=><BadgeChip key={b.id} b={b} earned={total>=b.req}/>)}</div>
            </Card>
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:15,color:C.text}}>🏆 Top Ranking</div>
                <span onClick={()=>go("leaderboard")} style={{color:C.primary,fontSize:12,cursor:"pointer",fontWeight:700}}>Ver tudo →</span>
              </div>
              {ranking.slice(0,3).map((p,i)=>{
                const lv=getLevel(p.points);
                return (
                  <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 8px",borderBottom:i<2?"1px solid "+C.border:"none",background:p.id===partner.id?C.surf2:"transparent",borderRadius:8}}>
                    <div style={{fontSize:20,width:28,textAlign:"center"}}>{["🥇","🥈","🥉"][i]}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:14,color:p.id===partner.id?C.primary:C.text}}>{p.name}{p.id===partner.id?" (Você)":""}</div>
                      <div style={{fontSize:12,color:C.muted}}>{p.total} check-ins · {lv.emoji} {lv.name}</div>
                    </div>
                    <div style={{fontWeight:800,color:lv.col,fontSize:15}}>{p.points}pts</div>
                  </div>
                );
              })}
              {ranking.length===0&&<div style={{color:C.muted,textAlign:"center",padding:16,fontSize:13}}>Nenhum dado ainda.</div>}
            </Card>
          </>
        )}

        {tab==="qr"&&(
          <Card style={{textAlign:"center"}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:20,color:C.text}}>📲 Seu QR Code & Código</div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18}}>
              <QRCode code={partner.code} size={160}/>
              <div>
                <div style={{color:C.muted,fontSize:12,marginBottom:8}}>Código de Indicação</div>
                <div style={{background:C.surf2,border:"2px dashed "+C.primary,borderRadius:14,padding:"16px 32px",fontSize:26,fontWeight:900,letterSpacing:6,color:C.primary,boxShadow:"0 4px 20px "+C.glow}}>
                  {partner.code}
                </div>
              </div>
              <div style={{background:C.surf2,borderRadius:10,padding:"12px 16px",fontSize:13,color:C.muted,maxWidth:300,lineHeight:1.7,borderLeft:"3px solid "+C.primary}}>
                💡 Escaneie o QR Code ou compartilhe o link abaixo para que o cliente faça a reserva e você ganhe pontos!
              </div>
              <div style={{background:C.surf2,borderRadius:10,padding:"10px 14px",fontSize:12,color:C.primary,wordBreak:"break-all",fontWeight:600,border:"1px solid "+C.border}}>
                🔗 {qrLink}
              </div>
            </div>
          </Card>
        )}

        {tab==="hist"&&(
          <Card>
            <div style={{fontWeight:700,fontSize:15,marginBottom:12,color:C.text}}>📋 Histórico de Indicações</div>
            {checkins.length===0&&bookings.length===0
              ?<div style={{color:C.muted,textAlign:"center",padding:32,fontSize:14}}>Nenhuma indicação ainda. Compartilhe seu código!</div>
              :[...checkins.map(c=>({...c,kind:"ci"})),...bookings.map(b=>({...b,kind:"bk"}))]
                  .sort((a,b)=>a.date<b.date?1:-1)
                  .map(item=>(
                    <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:C.surf2,borderRadius:10,marginBottom:7,border:"1px solid "+C.border}}>
                      <div style={{fontSize:20}}>{item.kind==="ci"?"✅":"⏳"}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:14,color:C.text}}>{item.tourist}</div>
                        <div style={{fontSize:12,color:C.muted}}>{item.date}</div>
                      </div>
                      <div style={{fontSize:12,fontWeight:700,color:item.kind==="ci"?C.green:C.soft}}>{item.kind==="ci"?"+10 pts":"Pendente"}</div>
                    </div>
                  ))
            }
          </Card>
        )}
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"linear-gradient(0deg,"+C.bg+" 60%,transparent)",padding:"14px"}}>
        <div style={{maxWidth:480,margin:"0 auto"}}>
          <Btn onClick={()=>go("leaderboard")} variant="ghost" style={{width:"100%",fontSize:13}}>🏆 Ver Ranking Completo</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── TOURIST VIEW ─────────────────────────────────────────────────────────────
function TouristView({partners,bookings,setBookings,go,toast}) {
  const [step,setStep]=useState("code");
  const [code,setCode]=useState("");
  const [partner,setPartner]=useState(null);
  const [f,setF]=useState({name:"",email:"",date:"",guests:2});
  const [loading,setLoading]=useState(false);

  // Lê ?code= da URL automaticamente
  useEffect(()=>{
    try {
      const params = new URLSearchParams(window.location.search);
      const c = params.get("code");
      if (c) setCode(c.toUpperCase());
    } catch {}
  },[]);

  const checkCode=()=>{
    const p=partners.find(x=>x.code.toUpperCase()===code.toUpperCase().trim());
    if(p){setPartner(p);setStep("form");}
    else toast("Código inválido. Verifique com o seu parceiro. ❌","err");
  };

  const book=async()=>{
    if(!f.name||!f.date) return toast("Preencha todos os campos","err");
    setLoading(true);
    const nb={id:uid(),partner_id:partner.id,tourist:f.name,email:f.email,date:f.date,guests:f.guests,status:"pending"};
    await sb.post("bookings",nb);
    setBookings(prev=>[...prev,{id:nb.id,partnerId:nb.partner_id,tourist:nb.tourist,email:nb.email,date:nb.date,guests:nb.guests,status:nb.status}]);
    setLoading(false);
    setStep("done");
  };

  const reset=()=>{setStep("code");setCode("");setPartner(null);setF({name:"",email:"",date:"",guests:2});};

  if(step==="done") return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:pageBg}}>
      <Card style={{maxWidth:360,textAlign:"center"}}>
        <div style={{fontSize:72,marginBottom:10}}>🎉</div>
        <h2 style={{color:C.green,margin:"0 0 8px"}}>Reserva Enviada!</h2>
        <p style={{color:C.muted,lineHeight:1.7,marginBottom:18}}>Ao chegar no Chalezinho, informe que foi indicado por <strong style={{color:C.primary}}>{partner&&partner.name}</strong>.</p>
        <div style={{background:C.surf2,borderRadius:12,padding:16,marginBottom:18,fontSize:14,lineHeight:2,textAlign:"left",border:"1px solid "+C.border}}>
          <div>👤 {f.name}</div><div>📅 {f.date}</div><div>👥 {f.guests} pessoa(s)</div><div>🤝 via {partner&&partner.name}</div>
        </div>
        <Btn onClick={reset} style={{width:"100%",marginBottom:8}}>Nova Reserva</Btn>
        <Btn onClick={()=>go("landing")} variant="ghost" style={{width:"100%"}}>Voltar ao Início</Btn>
      </Card>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:pageBg}}>
      <Card style={{width:"100%",maxWidth:380}}>
        <Btn onClick={()=>go("landing")} variant="ghost" style={{marginBottom:14,padding:"6px 12px",fontSize:12}}>← Voltar</Btn>
        <div style={{textAlign:"center",marginBottom:18}}>
          <Logo size={44}/>
          <div style={{color:C.muted,fontSize:13,marginTop:10}}>{step==="code"?"Digite o código do seu parceiro":"Indicado por "+(partner&&partner.name)}</div>
        </div>
        <Divider/>
        {step==="code"&&(
          <>
            <div style={{marginBottom:12}}>
              <div style={{color:C.muted,fontSize:11,fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:0.7}}>Código de Indicação</div>
              <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&checkCode()} placeholder="Ex: JOAO24" style={{width:"100%",background:C.surf2,border:"2px solid "+C.border,borderRadius:12,padding:"16px 12px",color:C.primary,fontSize:24,fontWeight:900,letterSpacing:6,textAlign:"center",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
            </div>
            <Btn onClick={checkCode} style={{width:"100%",padding:"14px",fontSize:15}}>Continuar →</Btn>
          </>
        )}
        {step==="form"&&partner&&(
          <>
            <div style={{background:C.surf2,borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10,border:"1.5px solid "+C.primary+"33"}}>
              <div style={{fontSize:24}}>{PTYPES[partner.type]&&PTYPES[partner.type].icon}</div>
              <div><div style={{fontSize:11,color:C.muted}}>Indicado por</div><div style={{color:C.primary,fontWeight:700}}>{partner.name}</div></div>
            </div>
            <Input label="Seu Nome *" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Nome completo"/>
            <Input label="Email (opcional)" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="seu@email.com"/>
            <Input label="Data da Visita *" type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/>
            <div style={{marginBottom:12}}>
              <div style={{color:C.muted,fontSize:11,fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:0.7}}>Número de Pessoas</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {[1,2,3,4,5,6,7,8].map(n=>(
                  <button key={n} onClick={()=>setF({...f,guests:n})} style={{border:f.guests===n?"none":"1.5px solid "+C.border,cursor:"pointer",width:42,height:42,borderRadius:9,fontWeight:700,fontSize:15,fontFamily:"inherit",background:f.guests===n?"linear-gradient(135deg,"+C.primary+","+C.primaryDark+")":C.surf,color:f.guests===n?"#fff":C.muted,transition:"all .15s"}}>{n}</button>
                ))}
              </div>
            </div>
            <Btn onClick={book} variant="success" style={{width:"100%",padding:"14px",fontSize:15,marginTop:4}} disabled={loading}>{loading?"Enviando...":"✅ Confirmar Reserva"}</Btn>
            <Btn onClick={()=>setStep("code")} variant="ghost" style={{width:"100%",marginTop:8}}>← Trocar Código</Btn>
          </>
        )}
      </Card>
    </div>
  );
}

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────
function AdminView({partners,setPartners,checkins,setCheckins,bookings,setBookings,go,toast}) {
  const [authed,setAuthed]=useState(false);
  const [pw,setPw]=useState("");
  const [tab,setTab]=useState("pending");
  const [mPartner,setMPartner]=useState("");
  const [mName,setMName]=useState("");
  const [loading,setLoading]=useState(false);

  // Novo parceiro
  const [np,setNp]=useState({name:"",type:"guide",email:"",pw:"",code:""});

  const pending=bookings.filter(b=>b.status==="pending");

  const confirm=async(b)=>{
    const nc={id:uid(),partner_id:b.partnerId,tourist:b.tourist,date:new Date().toISOString().split("T")[0],status:"confirmed"};
    await sb.post("checkins",nc);
    await sb.patch("bookings","id=eq."+b.id,{status:"confirmed"});
    setCheckins(prev=>[...prev,{id:nc.id,partnerId:nc.partner_id,tourist:nc.tourist,date:nc.date,status:nc.status}]);
    setBookings(prev=>prev.map(x=>x.id===b.id?{...x,status:"confirmed"}:x));
    toast("✅ Check-in de "+b.tourist+" confirmado!");
  };

  const manual=async()=>{
    if(!mPartner||!mName) return toast("Preencha todos os campos","err");
    const nc={id:uid(),partner_id:mPartner,tourist:mName,date:new Date().toISOString().split("T")[0],status:"confirmed"};
    await sb.post("checkins",nc);
    setCheckins(prev=>[...prev,{id:nc.id,partnerId:nc.partner_id,tourist:nc.tourist,date:nc.date,status:nc.status}]);
    toast("✅ Check-in registrado!"); setMName(""); setMPartner("");
  };

  const createPartner=async()=>{
    if(!np.name||!np.email||!np.pw) return toast("Preencha todos os campos","err");
    if(partners.find(p=>p.email===np.email)) return toast("Email já cadastrado","err");
    setLoading(true);
    const base=np.name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g,"").slice(0,6);
    const code=np.code.trim()||base+uid().slice(0,3).toUpperCase();
    const newP={id:uid(),name:np.name,type:np.type,email:np.email,pw:np.pw,code};
    await sb.post("partners",{id:newP.id,name:newP.name,type:newP.type,email:newP.email,pw:newP.pw,code:newP.code});
    setPartners(prev=>[...prev,newP]);
    setLoading(false);
    toast("✅ Parceiro "+newP.name+" criado! Código: "+newP.code);
    setNp({name:"",type:"guide",email:"",pw:"",code:""});
  };

  if(!authed) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:pageBg}}>
      <Card style={{maxWidth:340,width:"100%"}}>
        <Btn onClick={()=>go("landing")} variant="ghost" style={{marginBottom:14,padding:"6px 12px",fontSize:12}}>← Voltar</Btn>
        <div style={{textAlign:"center",marginBottom:16}}><Logo size={40}/></div>
        <Divider/>
        <h2 style={{color:C.primary,margin:"0 0 18px",fontSize:20,textAlign:"center"}}>🔐 Painel do Restaurante</h2>
        <Input label="Senha" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Senha do restaurante" onKeyDown={e=>e.key==="Enter"&&(pw==="admin123"?setAuthed(true):toast("Senha incorreta","err"))}/>
        <Btn onClick={()=>pw==="admin123"?setAuthed(true):toast("Senha incorreta","err")} style={{width:"100%",padding:"12px"}}>Entrar</Btn>
      </Card>
    </div>
  );

  return (
    <div style={{maxWidth:600,margin:"0 auto",paddingBottom:24,background:C.bg,minHeight:"100vh"}}>
      <div style={{background:C.surf,borderBottom:"1px solid "+C.border,padding:"12px 14px",marginBottom:18,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 8px rgba(192,30,30,0.07)"}}>
        <Logo size={34}/><Btn onClick={()=>go("landing")} variant="ghost" style={{padding:"6px 12px",fontSize:12}}>Sair</Btn>
      </div>
      <div style={{padding:"0 14px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
          {[{e:"⏳",v:pending.length,l:"Pendentes",c:C.gold},{e:"✅",v:checkins.length,l:"Total Check-ins",c:C.green},{e:"🤝",v:partners.length,l:"Parceiros",c:C.primary}].map(s=>(
            <Card key={s.l} style={{textAlign:"center",padding:14}}><div style={{fontSize:22}}>{s.e}</div><div style={{fontSize:24,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{s.l}</div></Card>
          ))}
        </div>

        <div style={{display:"flex",gap:4,marginBottom:14,background:C.surf2,borderRadius:12,padding:5,border:"1px solid "+C.border,overflowX:"auto"}}>
          {[["pending","⏳ Reservas ("+pending.length+")"],["manual","➕ Check-in"],["novo","👤 Novo Parceiro"],["ranking","🏆 Ranking"],["hist","📋 Histórico"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,border:"none",cursor:"pointer",borderRadius:9,padding:"9px 6px",fontSize:11,fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap",background:tab===t?"linear-gradient(135deg,"+C.primary+","+C.primaryDark+")":"transparent",color:tab===t?"#fff":C.muted,transition:"all .2s"}}>{l}</button>
          ))}
        </div>

        {tab==="pending"&&(pending.length===0?<Card style={{textAlign:"center",padding:32,color:C.muted}}>Nenhuma reserva pendente 🎉</Card>:
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {pending.map(b=>{const p=partners.find(x=>x.id===b.partnerId);return(
              <Card key={b.id}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontWeight:700,fontSize:16,color:C.text}}>👤 {b.tourist}</div><div style={{fontSize:13,color:C.muted,marginTop:2}}>📅 {b.date} · 👥 {b.guests} pessoa(s)</div><div style={{fontSize:13,color:C.primary,marginTop:2}}>🤝 via {p?p.name:"?"}</div></div>
                <Btn onClick={()=>confirm(b)} variant="success" style={{padding:"10px 16px",fontSize:13}}>✅ Check-in</Btn>
              </div></Card>
            );})}
          </div>
        )}

        {tab==="manual"&&(
          <Card><div style={{fontWeight:700,fontSize:15,marginBottom:16,color:C.text}}>➕ Registrar Presença Manual</div>
            <Select label="Parceiro Indicador" value={mPartner} onChange={e=>setMPartner(e.target.value)}><option value="">Selecione…</option>{partners.map(p=><option key={p.id} value={p.id}>{PTYPES[p.type]&&PTYPES[p.type].icon} {p.name}</option>)}</Select>
            <Input label="Nome do Cliente" value={mName} onChange={e=>setMName(e.target.value)} placeholder="Nome completo"/>
            <Btn onClick={manual} variant="success" style={{width:"100%",padding:"12px"}}>Registrar Presença</Btn>
          </Card>
        )}

        {tab==="novo"&&(
          <Card>
            <div style={{fontWeight:700,fontSize:15,marginBottom:16,color:C.text}}>👤 Criar Novo Parceiro</div>
            <Input label="Nome / Empresa *" value={np.name} onChange={e=>setNp({...np,name:e.target.value})} placeholder="Nome do parceiro"/>
            <Select label="Tipo *" value={np.type} onChange={e=>setNp({...np,type:e.target.value})}>
              {Object.entries(PTYPES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
            </Select>
            <Input label="Email *" type="email" value={np.email} onChange={e=>setNp({...np,email:e.target.value})} placeholder="email@parceiro.com"/>
            <Input label="Senha *" type="text" value={np.pw} onChange={e=>setNp({...np,pw:e.target.value})} placeholder="Senha de acesso"/>
            <Input label="Código personalizado (opcional)" value={np.code} onChange={e=>setNp({...np,code:e.target.value.toUpperCase()})} placeholder="Ex: HOTEL24 (gerado automaticamente se vazio)"/>
            <Btn onClick={createPartner} style={{width:"100%",padding:"12px"}} disabled={loading}>{loading?"Salvando...":"✅ Criar Parceiro"}</Btn>
          </Card>
        )}

        {tab==="ranking"&&<AdminRanking partners={partners} checkins={checkins}/>}

        {tab==="hist"&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {checkins.length===0&&<Card style={{textAlign:"center",padding:32,color:C.muted}}>Nenhum check-in ainda.</Card>}
            {[...checkins].reverse().map(c=>{const p=partners.find(x=>x.id===c.partnerId);return(
              <div key={c.id} style={{display:"flex",gap:10,padding:"12px 14px",background:C.surf,borderRadius:12,alignItems:"center",border:"1px solid "+C.border,boxShadow:C.cardShadow}}>
                <div style={{fontSize:20}}>✅</div><div style={{flex:1}}><div style={{fontWeight:600,fontSize:14,color:C.text}}>{c.tourist}</div><div style={{fontSize:12,color:C.muted}}>{c.date} · via {p?p.name:"?"}</div></div>
                <div style={{fontSize:12,color:C.green,fontWeight:700}}>+10 pts</div>
              </div>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminRanking({partners,checkins}) {
  const [period,setPeriod]=useState("month");
  const filtered=filterByPeriod(checkins,period);
  const periodLabel={week:"Esta Semana",month:"Este Mês",year:"Este Ano",all:"Todos os Tempos"}[period];
  const ranking=partners.map(p=>{const ci=filtered.filter(c=>c.partnerId===p.id&&c.status==="confirmed");const n=ci.length,po=calcPts(n),lv=getLevel(po);return{...p,total:n,points:po,level:lv};}).sort((a,b)=>b.points-a.points);
  return (
    <div>
      <div style={{fontWeight:700,fontSize:15,color:C.text,marginBottom:10}}>🏆 Ranking · <span style={{color:C.primary}}>{periodLabel}</span></div>
      <PeriodBar period={period} set={setPeriod}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:20}}>🤝</div><div style={{fontSize:20,fontWeight:900,color:C.primary}}>{ranking.filter(p=>p.total>0).length}</div><div style={{fontSize:11,color:C.muted,marginTop:1}}>Parceiros Ativos</div></Card>
        <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:20}}>✅</div><div style={{fontSize:20,fontWeight:900,color:C.green}}>{filtered.filter(c=>c.status==="confirmed").length}</div><div style={{fontSize:11,color:C.muted,marginTop:1}}>Check-ins no Período</div></Card>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {ranking.map((p,i)=>{
          const lv=getLevel(p.points),nxt=getNextLvl(p.points);
          const pct=nxt?Math.min(100,((p.points-lv.min)/(nxt.min-lv.min))*100):100;
          const borderCol=i===0?C.gold+"77":i===1?C.silver+"55":i===2?C.bronze+"55":C.border;
          return(
            <Card key={p.id} style={{padding:"12px 14px",opacity:p.total===0?0.45:1,border:"1.5px solid "+borderCol}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{fontWeight:900,fontSize:18,color:i<3?[C.gold,C.silver,C.bronze][i]:C.soft,width:28,textAlign:"center"}}>{i<3?["🥇","🥈","🥉"][i]:"#"+(i+1)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,fontSize:14,color:C.text}}>{p.name}</span>
                    <span style={{fontSize:10,background:lv.col+"18",color:lv.col,borderRadius:6,padding:"1px 6px",fontWeight:700,border:"1px solid "+lv.col+"44"}}>{lv.emoji} {lv.name}</span>
                  </div>
                  <div style={{fontSize:11,color:C.muted,marginTop:1}}>{PTYPES[p.type]&&PTYPES[p.type].icon} {p.total} check-ins</div>
                  {nxt&&p.total>0&&<div style={{background:C.surf3,borderRadius:999,height:4,overflow:"hidden",marginTop:5,border:"1px solid "+C.border}}><div style={{width:pct+"%",height:"100%",background:"linear-gradient(90deg,"+C.primaryDark+","+lv.col+")",borderRadius:999}}/></div>}
                </div>
                <div style={{textAlign:"right"}}><div style={{fontWeight:900,fontSize:18,color:lv.col}}>{p.points}</div><div style={{fontSize:10,color:C.muted}}>pts</div></div>
              </div>
            </Card>
          );
        })}
        {ranking.length===0&&<Card style={{textAlign:"center",padding:32,color:C.muted}}>Nenhum parceiro cadastrado.</Card>}
      </div>
    </div>
  );
}

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
function Leaderboard({allCheckins,partners,go}) {
  const [period,setPeriod]=useState("month");
  const filtered=filterByPeriod(allCheckins,period);
  const periodLabel={week:"Esta Semana",month:"Este Mês",year:"Este Ano",all:"Todos os Tempos"}[period];
  const ranking=partners.map(p=>{const ci=filtered.filter(c=>c.partnerId===p.id&&c.status==="confirmed");const n=ci.length,po=calcPts(n),lv=getLevel(po);return{...p,total:n,points:po,level:lv};}).sort((a,b)=>b.points-a.points);
  const top3=ranking.slice(0,3);
  const podiumOrder=[top3[1],top3[0],top3[2]].filter(Boolean);
  const podiumH=[top3[1]?100:0,top3[0]?140:0,top3[2]?80:0];
  const podiumGrad=["linear-gradient(180deg,#A0B0C0,#607080)","linear-gradient(180deg,"+C.gold+",#907000)","linear-gradient(180deg,"+C.bronze+",#6B3820)"];
  const podiumEmoji=["🥈","🥇","🥉"];
  return (
    <div style={{maxWidth:520,margin:"0 auto",paddingBottom:30,background:C.bg,minHeight:"100vh"}}>
      <div style={{background:C.surf,borderBottom:"1px solid "+C.border,padding:"12px 14px",marginBottom:20,boxShadow:"0 2px 8px rgba(192,30,30,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Btn onClick={()=>go("landing")} variant="ghost" style={{padding:"7px 12px",fontSize:12}}>←</Btn><Logo size={34}/>
        </div>
        <div style={{marginTop:14}}>
          <h2 style={{margin:"0 0 2px",fontSize:20,fontWeight:900,color:C.text}}>🏆 Ranking de Parceiros</h2>
          <div style={{color:C.muted,fontSize:12}}>Período: <span style={{color:C.primary,fontWeight:700}}>{periodLabel}</span></div>
        </div>
      </div>
      <div style={{padding:"0 14px"}}>
        <PeriodBar period={period} set={setPeriod}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
          <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:22}}>🤝</div><div style={{fontSize:22,fontWeight:900,color:C.primary}}>{ranking.filter(p=>p.total>0).length}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>Parceiros Ativos</div></Card>
          <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:22}}>✅</div><div style={{fontSize:22,fontWeight:900,color:C.green}}>{filtered.length}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>Check-ins no Período</div></Card>
        </div>
        {top3.length>=2&&top3[0].total>0&&(
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:10,marginBottom:28,height:200}}>
            {podiumOrder.map((p,pos)=>{if(!p)return null;const lv=getLevel(p.points);return(
              <div key={p.id} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
                <div style={{fontSize:11,color:lv.col,marginBottom:2,fontWeight:700}}>{lv.emoji}</div>
                <div style={{fontSize:13,fontWeight:800,color:C.text,textAlign:"center",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:90}}>{p.name.split(" ")[0]}</div>
                <div style={{fontSize:12,color:C.primary,fontWeight:700,marginBottom:6}}>{p.points}pts</div>
                <div style={{width:"100%",height:podiumH[pos],display:"flex",alignItems:"flex-start",justifyContent:"center",background:podiumGrad[pos],borderRadius:"10px 10px 0 0",paddingTop:10,fontSize:28,boxShadow:pos===1?"0 -4px 16px rgba(184,134,11,0.3)":"none"}}>{podiumEmoji[pos]}</div>
              </div>
            );})}
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {ranking.map((p,i)=>{
            const lv=getLevel(p.points),nxt=getNextLvl(p.points),eb=earnedBadges(p.total);
            const pct=nxt?Math.min(100,((p.points-lv.min)/(nxt.min-lv.min))*100):100;
            const borderCol=i===0?C.gold+"77":i===1?C.silver+"55":i===2?C.bronze+"55":C.border;
            return(
              <Card key={p.id} style={{padding:"14px 16px",opacity:p.total===0?0.5:1,border:"1.5px solid "+borderCol}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{fontWeight:900,fontSize:18,color:i<3?[C.gold,C.silver,C.bronze][i]:C.soft,width:30,textAlign:"center"}}>{i<3?["🥇","🥈","🥉"][i]:"#"+(i+1)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <span style={{fontWeight:700,fontSize:15,color:C.text}}>{p.name}</span>
                      <span style={{fontSize:10,background:lv.col+"18",color:lv.col,borderRadius:6,padding:"2px 7px",fontWeight:700,border:"1px solid "+lv.col+"44"}}>{lv.emoji} {lv.name}</span>
                    </div>
                    <div style={{fontSize:12,color:C.muted,marginTop:2}}>{PTYPES[p.type]&&PTYPES[p.type].icon} {PTYPES[p.type]&&PTYPES[p.type].label} · {p.total} check-ins</div>
                    {eb.length>0&&<div style={{display:"flex",gap:4,marginTop:4}}>{eb.slice(-4).map(b=><span key={b.id} title={b.name} style={{fontSize:15}}>{b.emoji}</span>)}</div>}
                  </div>
                  <div style={{textAlign:"right"}}><div style={{fontWeight:900,fontSize:20,color:lv.col}}>{p.points}</div><div style={{fontSize:11,color:C.muted}}>pontos</div></div>
                </div>
                {i<8&&nxt&&p.total>0&&(
                  <div style={{marginTop:10}}>
                    <div style={{background:C.surf3,borderRadius:999,height:5,overflow:"hidden",border:"1px solid "+C.border}}>
                      <div style={{width:pct+"%",height:"100%",background:"linear-gradient(90deg,"+C.primaryDark+","+lv.col+")",borderRadius:999,transition:"width .6s"}}/>
                    </div>
                    <div style={{fontSize:10,color:C.muted,marginTop:3,textAlign:"right"}}>→ {nxt.emoji} {nxt.name} ({nxt.min-p.points} pts)</div>
                  </div>
                )}
              </Card>
            );
          })}
          {ranking.length===0&&<Card style={{textAlign:"center",padding:32,color:C.muted}}>Nenhum parceiro cadastrado ainda.</Card>}
          {ranking.length>0&&ranking[0].total===0&&<div style={{textAlign:"center",padding:20,color:C.muted,fontSize:13}}>Nenhum check-in neste período. Tente "Tudo".</div>}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [view,setView]=useState("landing");
  const [partners,setPartners]=useState([]);
  const [checkins,setCheckins]=useState([]);
  const [bookings,setBookings]=useState([]);
  const [current,setCurrent]=useState(null);
  const [ready,setReady]=useState(false);
  const [toastMsg,setToastMsg]=useState(null);

  useEffect(()=>{
    // Verifica se há ?code= na URL para ir direto para tourist
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("code")) setView("tourist");
    } catch {}

    async function init(){
      try {
        const [p,c,b] = await Promise.all([
          sb.get("partners","select=*"),
          sb.get("checkins","select=*"),
          sb.get("bookings","select=*"),
        ]);
        setPartners((p||[]).map(toPartner));
        setCheckins((c||[]).map(toCheckin));
        setBookings((b||[]).map(toBooking));
      } catch(e) { console.error("Supabase error",e); }
      setReady(true);
    }
    init();
  },[]);

  const toast=(msg,type="ok")=>{setToastMsg({msg,type});setTimeout(()=>setToastMsg(null),3200);};

  const getStats=id=>{
    const ci=checkins.filter(c=>c.partnerId===id&&c.status==="confirmed");
    const bk=bookings.filter(b=>b.partnerId===id&&b.status==="pending");
    const n=ci.length,p=calcPts(n);
    return{total:n,points:p,level:getLevel(p),badges:earnedBadges(n),pending:bk.length};
  };
  const getRanking=()=>partners.map(p=>({...p,...getStats(p.id)})).sort((a,b)=>b.points-a.points);

  if(!ready) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:pageBg,flexDirection:"column",gap:16}}>
      <Logo size={56}/>
      <div style={{color:C.muted,fontSize:15}}>Carregando…</div>
      <div style={{width:120,height:3,background:C.surf3,borderRadius:999,overflow:"hidden"}}>
        <div style={{width:"60%",height:"100%",background:C.primary,borderRadius:999,animation:"load 1.2s ease infinite"}}/>
      </div>
    </div>
  );

  const go=v=>setView(v);
  const rk=getRanking();

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:C.bg,minHeight:"100vh",color:C.text}}>
      <style>{`*{box-sizing:border-box;margin:0}input,select{color-scheme:light}button:hover{filter:brightness(0.94)}@keyframes slideIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}@keyframes load{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#fff5f5}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}`}</style>
      {toastMsg&&<div style={{position:"fixed",top:16,right:16,zIndex:10000,background:toastMsg.type==="err"?C.red:"linear-gradient(135deg,"+C.primary+","+C.primaryDark+")",color:"#fff",padding:"13px 20px",borderRadius:12,boxShadow:"0 8px 28px rgba(0,0,0,.2)",fontWeight:700,fontSize:14,animation:"slideIn .25s ease",maxWidth:300}}>{toastMsg.msg}</div>}
      {view==="landing"    &&<Landing go={go}/>}
      {view==="login"      &&<PartnerLogin partners={partners} setCurrent={setCurrent} go={go} toast={toast}/>}
      {view==="register"   &&<PartnerRegister partners={partners} savePartners={setPartners} go={go} toast={toast}/>}
      {view==="dashboard"  &&current&&<Dashboard partner={current} stats={getStats(current.id)} ranking={rk} checkins={checkins.filter(c=>c.partnerId===current.id)} bookings={bookings.filter(b=>b.partnerId===current.id)} go={go}/>}
      {view==="tourist"    &&<TouristView partners={partners} bookings={bookings} setBookings={setBookings} go={go} toast={toast}/>}
      {view==="admin"      &&<AdminView partners={partners} setPartners={setPartners} checkins={checkins} setCheckins={setCheckins} bookings={bookings} setBookings={setBookings} go={go} toast={toast}/>}
      {view==="leaderboard"&&<Leaderboard allCheckins={checkins} partners={partners} go={go}/>}
    </div>
  );
}
