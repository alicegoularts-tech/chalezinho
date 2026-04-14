import { useState, useEffect } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SB_URL = "https://ekodvpaibodkthxwtxrc.supabase.co/rest/v1";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrb2R2cGFpYm9ka3RoeHd0eHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzAwNTEsImV4cCI6MjA5MTQwNjA1MX0.rJfjqFewBDPQ7O5bTwuRuVW-cYjXQO6aMUn8oDw_L3E";
const APP_URL = "https://chalezinho-n7i4.vercel.app";
const RESEND_KEY = "re_G2jsGaSY_5Lizo7g9BoE7Z8Uupi1nDVam";
const FROM = "Chalezinho <no-reply@chalezinho.com>";
const ADMIN_PW_KEY = "cz_admin_pw";
const PHOTOS = [1,2,3,4,5].map(n=>`https://cdn.jsdelivr.net/gh/alicegoularts-tech/chalezinho_fotos@main/${String(n).padStart(2,'0')}.jpg`);

// ─── BRAND ────────────────────────────────────────────────────────────────────
const C = {
  bg:"#FFF8F8",surf:"#FFFFFF",surf2:"#FFF0F0",surf3:"#FFE4E4",
  border:"#F0C0C0",primary:"#C01E1E",primaryDark:"#8B1010",
  glow:"rgba(192,30,30,0.15)",green:"#2E7D32",red:"#C62828",
  text:"#1A0505",muted:"#8B4444",soft:"#C49090",
  gold:"#B8860B",silver:"#6B7F8F",bronze:"#8B5530",
  cardShadow:"0 2px 12px rgba(192,30,30,0.08)",
};
const pageBg = "linear-gradient(160deg,#fff5f5 0%,#fff 55%,#fff8f0 100%)";

const LEVELS = [
  {name:"Iniciante",min:0,   emoji:"🌱",col:"#7B6060"},
  {name:"Bronze",   min:100, emoji:"🥉",col:"#8B5530"},
  {name:"Prata",    min:250, emoji:"🥈",col:"#5A6B7A"},
  {name:"Ouro",     min:500, emoji:"🥇",col:"#B8860B"},
  {name:"Diamante", min:1000,emoji:"💎",col:"#1565C0"},
  {name:"Lenda",    min:2000,emoji:"👑",col:"#6A0DAD"},
];
const COMM_RATES = {Ouro:2,Diamante:5,Lenda:10};
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
  salon:    {label:"Salão de Beleza",    icon:"💇"},
  store:    {label:"Loja",              icon:"🛍️"},
  park:     {label:"Parque",            icon:"🌳"},
  other:    {label:"Outro",             icon:"🤝"},
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2,9);
const getLevel = p => [...LEVELS].reverse().find(l=>p>=l.min)||LEVELS[0];
const getNextLvl = p => LEVELS.find(l=>l.min>p);
const earnedBadges = n => BADGES.filter(b=>n>=b.req);
const getAdminPw = () => { try{return localStorage.getItem(ADMIN_PW_KEY)||"admin123";}catch{return "admin123";} };
const saveAdminPw = p => { try{localStorage.setItem(ADMIN_PW_KEY,p);}catch{} };

const HDR = {"apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY,"Content-Type":"application/json","Prefer":"return=representation"};
const sb = {
  get: async(t,q="")=>{ const r=await fetch(`${SB_URL}/${t}?${q}`,{headers:HDR}); return r.json(); },
  post: async(t,b)=>{ const r=await fetch(`${SB_URL}/${t}`,{method:"POST",headers:HDR,body:JSON.stringify(b)}); return r.json(); },
  patch: async(t,m,b)=>{ const r=await fetch(`${SB_URL}/${t}?${m}`,{method:"PATCH",headers:HDR,body:JSON.stringify(b)}); return r.json(); },
};

const toPartner = r => ({id:r.id,name:r.name,type:r.type,email:r.email,pw:r.pw,code:r.code,status:r.status||"approved",cpf:r.cpf,birthDate:r.birth_date,address:r.address,phone:r.phone,customType:r.custom_type,rejectionReason:r.rejection_reason});
const toCheckin = r => ({id:r.id,partnerId:r.partner_id,tourist:r.tourist,date:r.date,status:r.status,guestsPresent:r.guests_present||1});
const toBooking = r => ({id:r.id,partnerId:r.partner_id,tourist:r.tourist,email:r.email,date:r.date,guests:r.guests,status:r.status});
const toComm = r => ({id:r.id,partnerId:r.partner_id,checkinId:r.checkin_id,guestsPresent:r.guests_present,levelName:r.level_name,rate:r.rate,totalAmount:r.total_amount,date:r.date,paid:r.paid});

const calcPts = checkins => checkins.reduce((s,c)=>s+(c.guestsPresent||1),0);

const filterByDateRange = (items,from,to) => {
  if(!from&&!to) return items;
  return items.filter(item=>{
    const d=item.date;
    if(from&&d<from) return false;
    if(to&&d>to) return false;
    return true;
  });
};

const sendEmail = async(to,subject,html) => {
  try {
    await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{"Authorization":"Bearer "+RESEND_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({from:FROM,to:[to],subject,html})
    });
  } catch(e){console.error("email err",e);}
};

const getNotifEmails = async() => {
  try {
    const r = await sb.get("app_config","key=eq.notif_emails");
    if(r&&r[0]) return r[0].value.split(",").map(e=>e.trim()).filter(Boolean);
  } catch{}
  return ["tavares@chalezinho.com"];
};

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({size=48}) {
  const h=size,w=size*3.4;
  const [ok,setOk]=useState(true);
  if(!ok) return (
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
  return <img src="https://lh3.googleusercontent.com/d/1pthcir9ziPtKRkihiuE2868qimCIBRrg" alt="Chalezinho" style={{height:h,width:w,objectFit:"contain"}} onError={()=>setOk(false)}/>;
}

// ─── QR CODE REAL ─────────────────────────────────────────────────────────────
function QRCode({code,size=160}) {
  const link=`${APP_URL}?code=${code}`;
  const src=`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(link)}&bgcolor=ffffff&color=8B1010&margin=8&format=png`;
  return (
    <div style={{background:"#fff",padding:10,borderRadius:14,display:"inline-block",boxShadow:"0 4px 20px rgba(192,30,30,0.15)",border:"2px solid "+C.border}}>
      <img src={src} width={size} height={size} alt="QR Code" style={{display:"block",borderRadius:6}}/>
    </div>
  );
}

// ─── CAROUSEL ─────────────────────────────────────────────────────────────────
function Carousel() {
  const [idx,setIdx]=useState(0);
  useEffect(()=>{ const t=setInterval(()=>setIdx(i=>(i+1)%PHOTOS.length),3500); return()=>clearInterval(t); },[]);
  return (
    <div style={{position:"relative",width:"100%",height:220,overflow:"hidden",borderRadius:"0 0 20px 20px",flexShrink:0}}>
      {PHOTOS.map((p,i)=>(
        <img key={i} src={p} alt="" style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",objectFit:"cover",opacity:i===idx?1:0,transition:"opacity .7s ease"}}/>
      ))}
      <div style={{position:"absolute",bottom:10,left:0,right:0,display:"flex",justifyContent:"center",gap:6}}>
        {PHOTOS.map((_,i)=><div key={i} onClick={()=>setIdx(i)} style={{width:i===idx?18:6,height:6,borderRadius:3,background:i===idx?"#fff":"rgba(255,255,255,.5)",transition:"all .3s",cursor:"pointer"}}/>)}
      </div>
    </div>
  );
}

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Card({children,style}){return <div style={{background:C.surf,borderRadius:16,padding:18,border:"1px solid "+C.border,boxShadow:C.cardShadow,...style}}>{children}</div>;}
function Btn({children,onClick,variant="primary",disabled,style}){
  const v={
    primary:{background:disabled?"#ccc":"linear-gradient(135deg,"+C.primary+","+C.primaryDark+")",color:"#fff",fontWeight:700,boxShadow:disabled?"none":"0 4px 14px "+C.glow},
    ghost:{background:"transparent",color:C.primary,border:"1.5px solid "+C.primary},
    success:{background:"linear-gradient(135deg,#2E7D32,#1B5E20)",color:"#fff",fontWeight:700},
    dark:{background:C.surf2,color:C.text,border:"1px solid "+C.border},
    danger:{background:"linear-gradient(135deg,#C62828,#8B0000)",color:"#fff",fontWeight:700},
  };
  return <button onClick={disabled?undefined:onClick} disabled={disabled} style={{border:"none",cursor:disabled?"not-allowed":"pointer",borderRadius:10,padding:"10px 18px",fontSize:14,transition:"all .2s",fontFamily:"inherit",...v[variant],...style}}>{children}</button>;
}
function Input({label,...p}){
  return (
    <div style={{marginBottom:12}}>
      {label&&<div style={{color:C.muted,fontSize:11,fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:0.7}}>{label}</div>}
      <input style={{width:"100%",background:C.surf2,border:"1.5px solid "+C.border,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}} {...p}
        onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
    </div>
  );
}
function Sel({label,children,...p}){
  return (
    <div style={{marginBottom:12}}>
      {label&&<div style={{color:C.muted,fontSize:11,fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:0.7}}>{label}</div>}
      <select style={{width:"100%",background:C.surf2,border:"1.5px solid "+C.border,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}} {...p}>{children}</select>
    </div>
  );
}
function Divider(){return <div style={{height:1,background:"linear-gradient(90deg,transparent,"+C.border+",transparent)",margin:"14px 0"}}/>;}
function BadgeChip({b,earned}){
  return (
    <div title={b.name+" ("+b.req+" clientes)"} style={{display:"flex",flexDirection:"column",alignItems:"center",opacity:earned?1:0.25,filter:earned?"none":"grayscale(1)",transition:"all .3s",minWidth:54}}>
      <div style={{fontSize:28,background:earned?C.surf2:"#f5f5f5",borderRadius:12,padding:"6px 10px",border:"1px solid "+(earned?C.primary+"55":C.border)}}>{b.emoji}</div>
      <div style={{fontSize:10,color:earned?C.primary:C.soft,marginTop:3,textAlign:"center",fontWeight:600,lineHeight:1.2}}>{b.name}</div>
    </div>
  );
}

function TabBar({tabs,active,set}){
  return (
    <div style={{display:"flex",gap:4,marginBottom:14,background:C.surf2,borderRadius:12,padding:4,border:"1px solid "+C.border,overflowX:"auto"}}>
      {tabs.map(([t,l])=>(
        <button key={t} onClick={()=>set(t)} style={{flex:"0 0 auto",border:"none",cursor:"pointer",borderRadius:9,padding:"8px 10px",fontSize:11,fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap",background:active===t?"linear-gradient(135deg,"+C.primary+","+C.primaryDark+")":"transparent",color:active===t?"#fff":C.muted,transition:"all .2s"}}>{l}</button>
      ))}
    </div>
  );
}

// ─── LANDING ──────────────────────────────────────────────────────────────────
function Landing({go}){
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,background:pageBg}}>
      <div style={{position:"fixed",top:0,left:0,right:0,height:4,background:"linear-gradient(90deg,transparent,"+C.primary+",transparent)"}}/>
      <div style={{textAlign:"center",maxWidth:380,width:"100%"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:32}}><Logo size={56}/></div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Btn onClick={()=>go("loginChoice")} style={{width:"100%",padding:"16px",fontSize:17,borderRadius:14}}>Entrar</Btn>
          <Btn onClick={()=>go("register")} variant="ghost" style={{width:"100%",padding:"15px",fontSize:17,borderRadius:14}}>Cadastre-se</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN CHOICE ─────────────────────────────────────────────────────────────
function LoginChoice({go}){
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:pageBg}}>
      <Card style={{width:"100%",maxWidth:360}}>
        <Btn onClick={()=>go("landing")} variant="ghost" style={{marginBottom:16,padding:"6px 12px",fontSize:12}}>← Voltar</Btn>
        <div style={{textAlign:"center",marginBottom:20}}><Logo size={42}/></div>
        <Divider/>
        <h2 style={{color:C.primary,margin:"0 0 20px",fontSize:20,textAlign:"center"}}>Como deseja entrar?</h2>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Btn onClick={()=>go("login")} style={{width:"100%",padding:"14px",fontSize:15}}>🤝 Acesso do Parceiro</Btn>
          <Btn onClick={()=>go("admin")} variant="dark" style={{width:"100%",padding:"14px",fontSize:15}}>🔐 Acesso do Restaurante</Btn>
        </div>
      </Card>
    </div>
  );
}

// ─── PARTNER LOGIN ────────────────────────────────────────────────────────────
function PartnerLogin({partners,setCurrent,go,toast}){
  const [email,setEmail]=useState("");const [pw,setPw]=useState("");
  const login=()=>{
    const p=partners.find(x=>x.email===email&&x.pw===pw);
    if(!p) return toast("Email ou senha incorretos ❌","err");
    if(p.status==="pending") return toast("Sua solicitação ainda está em análise. Aguarde a aprovação do restaurante.","err");
    if(p.status==="rejected") return toast("Solicitação rejeitada. Motivo: "+(p.rejectionReason||"não informado"),"err");
    setCurrent(p); go("dashboard");
  };
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:pageBg}}>
      <Card style={{width:"100%",maxWidth:360}}>
        <Btn onClick={()=>go("loginChoice")} variant="ghost" style={{marginBottom:16,padding:"6px 12px",fontSize:12}}>← Voltar</Btn>
        <div style={{textAlign:"center",marginBottom:16}}><Logo size={42}/></div>
        <Divider/>
        <h2 style={{color:C.primary,margin:"0 0 18px",fontSize:20,textAlign:"center"}}>🤝 Login do Parceiro</h2>
        <Input label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"/>
        <Input label="Senha" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••" onKeyDown={e=>e.key==="Enter"&&login()}/>
        <Btn onClick={login} style={{width:"100%",padding:"12px",fontSize:15,marginTop:4}}>Entrar</Btn>
        <p style={{textAlign:"center",marginTop:14,color:C.muted,fontSize:13}}>Ainda não tem conta? <span onClick={()=>go("register")} style={{color:C.primary,cursor:"pointer",fontWeight:700}}>Cadastre-se</span></p>
      </Card>
    </div>
  );
}

// ─── PARTNER REGISTER ─────────────────────────────────────────────────────────
function PartnerRegister({partners,setPartners,go,toast}){
  const [f,setF]=useState({name:"",type:"guide",email:"",pw:"",cpf:"",birthDate:"",address:"",phone:"",customType:""});
  const [loading,setLoading]=useState(false);
  const reg=async()=>{
    if(!f.name||!f.email||!f.pw||!f.cpf||!f.birthDate||!f.address||!f.phone) return toast("Preencha todos os campos obrigatórios","err");
    if(f.type==="other"&&!f.customType) return toast("Descreva o tipo de parceiro","err");
    if(partners.find(p=>p.email===f.email)) return toast("Email já cadastrado","err");
    setLoading(true);
    const base=f.name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g,"").slice(0,6);
    const newP={id:uid(),name:f.name,type:f.type,email:f.email,pw:f.pw,code:base+uid().slice(0,3).toUpperCase(),status:"pending",cpf:f.cpf,birth_date:f.birthDate,address:f.address,phone:f.phone,custom_type:f.customType};
    await sb.post("partners",newP);
    setPartners(prev=>[...prev,toPartner(newP)]);
    // Email para o restaurante
    const emails=await getNotifEmails();
    for(const em of emails){
      await sendEmail(em,"Nova solicitação de parceiro – "+f.name,`<h2>Nova solicitação de cadastro</h2><p><b>Nome:</b> ${f.name}<br/><b>Tipo:</b> ${PTYPES[f.type]?.label}${f.customType?" ("+f.customType+")":""}<br/><b>Email:</b> ${f.email}<br/><b>Telefone:</b> ${f.phone}<br/><b>CPF:</b> ${f.cpf}</p><p>Acesse o painel do restaurante para aprovar ou rejeitar.</p>`);
    }
    setLoading(false);
    toast("Solicitação enviada! Aguarde a aprovação do restaurante 🎉");
    go("landing");
  };
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:pageBg}}>
      <Card style={{width:"100%",maxWidth:420}}>
        <Btn onClick={()=>go("landing")} variant="ghost" style={{marginBottom:16,padding:"6px 12px",fontSize:12}}>← Voltar</Btn>
        <div style={{textAlign:"center",marginBottom:16}}><Logo size={38}/></div>
        <Divider/>
        <h2 style={{color:C.primary,margin:"0 0 18px",fontSize:20,textAlign:"center"}}>✨ Solicitação de Cadastro</h2>
        <p style={{fontSize:12,color:C.muted,marginBottom:16,textAlign:"center"}}>Preencha os dados abaixo. Sua conta será ativada após aprovação do restaurante.</p>
        <Input label="Nome completo / Empresa *" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Seu nome ou empresa"/>
        <Sel label="Tipo de Parceiro *" value={f.type} onChange={e=>setF({...f,type:e.target.value})}>
          {Object.entries(PTYPES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
        </Sel>
        {f.type==="other"&&<Input label="Descreva o tipo *" value={f.customType} onChange={e=>setF({...f,customType:e.target.value})} placeholder="Ex: Agência de turismo"/>}
        <Input label="CPF *" value={f.cpf} onChange={e=>setF({...f,cpf:e.target.value})} placeholder="000.000.000-00"/>
        <Input label="Data de nascimento *" type="date" value={f.birthDate} onChange={e=>setF({...f,birthDate:e.target.value})}/>
        <Input label="Telefone / WhatsApp *" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} placeholder="(00) 00000-0000"/>
        <Input label="Endereço *" value={f.address} onChange={e=>setF({...f,address:e.target.value})} placeholder="Rua, número, bairro, cidade"/>
        <Divider/>
        <Input label="Email de acesso *" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="seu@email.com"/>
        <Input label="Senha *" type="password" value={f.pw} onChange={e=>setF({...f,pw:e.target.value})} placeholder="Escolha uma senha"/>
        <Btn onClick={reg} style={{width:"100%",padding:"12px",fontSize:15,marginTop:4}} disabled={loading}>{loading?"Enviando...":"Enviar Solicitação"}</Btn>
      </Card>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({partner,allCheckins,bookings,partners,go}){
  const [tab,setTab]=useState("home");
  const myCheckins=allCheckins.filter(c=>c.partnerId===partner.id&&c.status==="confirmed");
  const myBookings=bookings.filter(b=>b.partnerId===partner.id&&b.status==="pending");
  const points=calcPts(myCheckins);
  const total=myCheckins.length;
  const level=getLevel(points);
  const nextLvl=getNextLvl(points);
  const rk=[...partners].map(p=>{const ci=allCheckins.filter(c=>c.partnerId===p.id&&c.status==="confirmed");return{...p,points:calcPts(ci),total:ci.length};}).sort((a,b)=>b.points-a.points);
  const rank=rk.findIndex(p=>p.id===partner.id)+1;
  const pt=PTYPES[partner.type]||PTYPES.other;
  const pct=nextLvl?Math.min(100,((points-level.min)/(nextLvl.min-level.min))*100):100;
  const commRate=COMM_RATES[level.name]||0;

  return (
    <div style={{maxWidth:480,margin:"0 auto",paddingBottom:80,background:C.bg,minHeight:"100vh"}}>
      <div style={{background:"linear-gradient(135deg,"+C.surf+","+C.surf2+")",borderBottom:"1px solid "+C.border,padding:"12px 14px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,"+C.primary+","+C.primaryDark+")",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{pt.icon}</div>
            <div><div style={{fontSize:11,color:C.muted}}>{pt.label}</div><div style={{fontWeight:800,fontSize:16,color:C.text}}>{partner.name}</div></div>
          </div>
          <Btn onClick={()=>go("landing")} variant="ghost" style={{padding:"6px 12px",fontSize:12}}>Sair</Btn>
        </div>
      </div>

      <div style={{padding:"14px 14px 0"}}>
        {/* Level card */}
        <Card style={{marginBottom:14,border:"1.5px solid "+level.col+"44"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <div style={{fontSize:34}}>{level.emoji}</div>
              <div style={{fontWeight:800,fontSize:20,color:level.col}}>{level.name}</div>
              <div style={{color:C.muted,fontSize:13,marginTop:2}}>{points} pontos acumulados</div>
            </div>
            <div style={{textAlign:"center",background:"#fff",borderRadius:14,padding:"10px 16px",border:"1.5px solid "+C.border}}>
              <div style={{fontSize:30,fontWeight:900,color:C.primary,lineHeight:1}}>#{rank||"—"}</div>
              <div style={{color:C.muted,fontSize:11}}>no ranking</div>
            </div>
          </div>
          {commRate>0&&<div style={{background:C.surf2,borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:13,color:C.green,fontWeight:700}}>💰 Você ganha R$ {commRate},00 por pessoa presente!</div>}
          {nextLvl?(
            <>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:6}}>
                <span>Próximo: {nextLvl.emoji} {nextLvl.name}</span>
                <span style={{color:level.col,fontWeight:700}}>{nextLvl.min-points} pts faltam</span>
              </div>
              <div style={{background:C.surf3,borderRadius:999,height:8,overflow:"hidden"}}>
                <div style={{width:pct+"%",height:"100%",background:"linear-gradient(90deg,"+C.primaryDark+","+level.col+")",borderRadius:999,transition:"width .6s"}}/>
              </div>
            </>
          ):<div style={{fontSize:13,color:level.col,fontWeight:700,textAlign:"center"}}>🏆 Nível máximo atingido!</div>}
        </Card>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
          {[{e:"✅",v:total,l:"Check-ins",c:C.green},{e:"⏳",v:myBookings.length,l:"Pendentes",c:C.gold},{e:"⭐",v:points,l:"Pontos",c:C.primary}].map(s=>(
            <Card key={s.l} style={{textAlign:"center",padding:12}}>
              <div style={{fontSize:20}}>{s.e}</div>
              <div style={{fontSize:22,fontWeight:900,color:s.c}}>{s.v}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{s.l}</div>
            </Card>
          ))}
        </div>

        <TabBar tabs={[["home","🏠 Início"],["qr","📲 QR Code"],["benefits","🎁 Benefícios"],["hist","📋 Histórico"],["rules","📋 Regras"]]} active={tab} set={setTab}/>

        {tab==="home"&&(
          <>
            <Card style={{marginBottom:14}}>
              <div style={{fontWeight:700,marginBottom:14,fontSize:15}}>🏅 Conquistas</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{BADGES.map(b=><BadgeChip key={b.id} b={b} earned={points>=b.req}/>)}</div>
            </Card>
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:15}}>🏆 Top Ranking</div>
              </div>
              {rk.slice(0,3).map((p,i)=>{
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
              {rk.length===0&&<div style={{color:C.muted,textAlign:"center",padding:16,fontSize:13}}>Nenhum dado ainda.</div>}
            </Card>
          </>
        )}

        {tab==="qr"&&(
          <Card style={{textAlign:"center"}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:20}}>📲 Seu QR Code & Código</div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18}}>
              <QRCode code={partner.code} size={180}/>
              <div>
                <div style={{color:C.muted,fontSize:12,marginBottom:8}}>Código de Indicação</div>
                <div style={{background:C.surf2,border:"2px dashed "+C.primary,borderRadius:14,padding:"14px 28px",fontSize:26,fontWeight:900,letterSpacing:6,color:C.primary}}>{partner.code}</div>
              </div>
              <div style={{background:C.surf2,borderRadius:10,padding:"10px 14px",fontSize:12,color:C.primary,wordBreak:"break-all",fontWeight:600,border:"1px solid "+C.border}}>
                🔗 {APP_URL}?code={partner.code}
              </div>
              <div style={{background:C.surf2,borderRadius:10,padding:"12px 16px",fontSize:13,color:C.muted,maxWidth:280,lineHeight:1.7,borderLeft:"3px solid "+C.primary}}>
                💡 Compartilhe o QR Code ou o link para que o cliente faça a reserva com desconto e você ganhe pontos!
              </div>
            </div>
          </Card>
        )}

        {tab==="benefits"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Card>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>💰 Comissionamento por Nível</div>
              {[{l:"Ouro",e:"🥇",r:2},{l:"Diamante",e:"💎",r:5},{l:"Lenda",e:"👑",r:10}].map(b=>(
                <div key={b.l} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid "+C.border}}>
                  <div style={{fontSize:24}}>{b.e}</div>
                  <div style={{flex:1}}><div style={{fontWeight:700}}>{b.l}</div><div style={{fontSize:12,color:C.muted}}>500+ / 1.000+ / 2.000+ pontos</div></div>
                  <div style={{fontWeight:900,color:C.green,fontSize:18}}>R$ {b.r},00<span style={{fontSize:11,fontWeight:400,color:C.muted}}>/pessoa</span></div>
                </div>
              ))}
              <div style={{fontSize:12,color:C.muted,marginTop:10,lineHeight:1.6}}>Antes do nível Ouro, você compete pelo ranking mensal com prêmios exclusivos.</div>
            </Card>
            <Card>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>🏆 Premiação Mensal do Ranking</div>
              {[{pos:"🥇 1º lugar",prize:"Rodízio premium para 2 com bebida"},{pos:"🥈 2º lugar",prize:"Rodízio premium para 2 sem bebida"},{pos:"🥉 3º lugar",prize:"Rodízio tradicional para 2"}].map(p=>(
                <div key={p.pos} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid "+C.border}}>
                  <div style={{fontWeight:700,fontSize:14,width:90}}>{p.pos}</div>
                  <div style={{flex:1,fontSize:14,color:C.text}}>{p.prize}</div>
                </div>
              ))}
              <div style={{fontSize:12,color:C.muted,marginTop:10,background:C.surf2,borderRadius:8,padding:10}}>⚠️ Mínimo de 30 pessoas presentes para estar elegível à premiação do ranking.</div>
            </Card>
          </div>
        )}

        {tab==="hist"&&(
          <Card>
            <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>📋 Histórico de Indicações</div>
            {myCheckins.length===0&&myBookings.length===0
              ?<div style={{color:C.muted,textAlign:"center",padding:32}}>Nenhuma indicação ainda.</div>
              :[...myCheckins.map(c=>({...c,kind:"ci"})),...myBookings.map(b=>({...b,kind:"bk"}))]
                  .sort((a,b)=>a.date<b.date?1:-1)
                  .map(item=>(
                    <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:C.surf2,borderRadius:10,marginBottom:7,border:"1px solid "+C.border}}>
                      <div style={{fontSize:20}}>{item.kind==="ci"?"✅":"⏳"}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:14}}>{item.tourist}</div>
                        <div style={{fontSize:12,color:C.muted}}>{item.date}{item.kind==="ci"?" · "+item.guestsPresent+" pessoa(s)":""}</div>
                      </div>
                      <div style={{fontSize:12,fontWeight:700,color:item.kind==="ci"?C.green:C.soft}}>
                        {item.kind==="ci"?"+"+item.guestsPresent+" pts":"Pendente"}
                      </div>
                    </div>
                  ))
            }
          </Card>
        )}

        {tab==="rules"&&<Rules/>}
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
function TouristView({partners,bookings,setBookings,go,toast}){
  const [step,setStep]=useState("code");
  const [code,setCode]=useState("");
  const [partner,setPartner]=useState(null);
  const [f,setF]=useState({name:"",email:"",date:"",guests:2});
  const [loading,setLoading]=useState(false);

  useEffect(()=>{ try{ const p=new URLSearchParams(window.location.search); const c=p.get("code"); if(c) setCode(c.toUpperCase()); }catch{} },[]);

  const checkCode=()=>{
    const p=partners.find(x=>x.code.toUpperCase()===code.toUpperCase().trim()&&x.status==="approved");
    if(p){setPartner(p);setStep("form");}
    else toast("Código inválido ❌","err");
  };

  const book=async()=>{
    if(!f.name||!f.date) return toast("Preencha todos os campos","err");
    setLoading(true);
    const nb={id:uid(),partner_id:partner.id,tourist:f.name,email:f.email,date:f.date,guests:f.guests,status:"pending"};
    await sb.post("bookings",nb);
    setBookings(prev=>[...prev,toBooking(nb)]);
    // Email restaurante
    const emails=await getNotifEmails();
    for(const em of emails){
      await sendEmail(em,"Nova reserva – "+f.name,`<h2>Nova reserva recebida</h2><p><b>Cliente:</b> ${f.name}<br/><b>Data:</b> ${f.date}<br/><b>Pessoas:</b> ${f.guests}<br/><b>Indicado por:</b> ${partner.name} (${partner.code})</p>`);
    }
    setLoading(false);
    setStep("done");
  };

  if(step==="done") return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:pageBg}}>
      <Card style={{maxWidth:360,textAlign:"center"}}>
        <div style={{fontSize:64,marginBottom:10}}>🎉</div>
        <h2 style={{color:C.green,margin:"0 0 8px"}}>Reserva Enviada!</h2>
        <p style={{color:C.muted,lineHeight:1.7,marginBottom:18}}>Ao chegar no Chalezinho, informe que foi indicado por <strong style={{color:C.primary}}>{partner?.name}</strong> e aproveite seu desconto!</p>
        <div style={{background:C.surf2,borderRadius:12,padding:14,marginBottom:18,fontSize:14,lineHeight:2,textAlign:"left",border:"1px solid "+C.border}}>
          <div>👤 {f.name}</div><div>📅 {f.date}</div><div>👥 {f.guests} pessoa(s)</div><div>🤝 via {partner?.name}</div>
        </div>
        <Btn onClick={()=>{setStep("code");setCode("");setPartner(null);setF({name:"",email:"",date:"",guests:2});}} style={{width:"100%",marginBottom:8}}>Nova Reserva</Btn>
        <Btn onClick={()=>go("landing")} variant="ghost" style={{width:"100%"}}>Voltar</Btn>
      </Card>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:pageBg}}>
      {/* Carrossel */}
      <Carousel/>

      {/* Desconto destaque */}
      <div style={{background:"linear-gradient(135deg,"+C.primary+","+C.primaryDark+")",color:"#fff",textAlign:"center",padding:"16px 20px"}}>
        <div style={{fontSize:26,fontWeight:900,letterSpacing:0.5}}>🎉 10% de desconto na sua conta!</div>
        <div style={{fontSize:12,opacity:0.85,marginTop:4}}>Não cumulativo com outros benefícios ou promoções</div>
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 16px"}}>
        <Card style={{width:"100%",maxWidth:380}}>
          <div style={{textAlign:"center",marginBottom:18}}>
            <Logo size={38}/>
            <div style={{color:C.muted,fontSize:13,marginTop:10}}>
              {step==="code"?"Digite o código do seu parceiro":"Indicado por "+(partner?.name)}
            </div>
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
                <div style={{fontSize:24}}>{PTYPES[partner.type]?.icon}</div>
                <div><div style={{fontSize:11,color:C.muted}}>Indicado por</div><div style={{color:C.primary,fontWeight:700}}>{partner.name}</div></div>
              </div>
              <Input label="Seu Nome *" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Nome completo"/>
              <Input label="Email (opcional)" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="seu@email.com"/>
              <Input label="Data da Visita *" type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/>
              <div style={{marginBottom:12}}>
                <div style={{color:C.muted,fontSize:11,fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:0.7}}>Número de Pessoas</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {[1,2,3,4,5,6,7,8].map(n=>(
                    <button key={n} onClick={()=>setF({...f,guests:n})} style={{border:f.guests===n?"none":"1.5px solid "+C.border,cursor:"pointer",width:42,height:42,borderRadius:9,fontWeight:700,fontSize:15,fontFamily:"inherit",background:f.guests===n?"linear-gradient(135deg,"+C.primary+","+C.primaryDark+")":C.surf,color:f.guests===n?"#fff":C.muted}}>{n}</button>
                  ))}
                </div>
              </div>
              <Btn onClick={book} variant="success" style={{width:"100%",padding:"14px",fontSize:15,marginTop:4}} disabled={loading}>{loading?"Enviando...":"✅ Confirmar Reserva"}</Btn>
              <Btn onClick={()=>setStep("code")} variant="ghost" style={{width:"100%",marginTop:8}}>← Trocar Código</Btn>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────
function AdminView({partners,setPartners,checkins,setCheckins,bookings,setBookings,go,toast}){
  const [authed,setAuthed]=useState(false);
  const [pw,setPw]=useState("");
  const [tab,setTab]=useState("pending");
  const [mPartner,setMPartner]=useState("");const [mName,setMName]=useState("");const [mGuests,setMGuests]=useState(1);
  const [loading,setLoading]=useState(false);
  const [np,setNp]=useState({name:"",type:"guide",email:"",pw:"",code:"",customType:""});
  const [notifEmails,setNotifEmails]=useState("tavares@chalezinho.com");
  const [cpw,setCpw]=useState({cur:"",novo:"",conf:""});
  const [showCpw,setShowCpw]=useState(false);
  const [rejectId,setRejectId]=useState(null);const [rejectReason,setRejectReason]=useState("");

  const pending=bookings.filter(b=>b.status==="pending");
  const pendingPartners=partners.filter(p=>p.status==="pending");
  const approvedPartners=partners.filter(p=>p.status==="approved");

  useEffect(()=>{
    sb.get("app_config","key=eq.notif_emails").then(r=>{ if(r&&r[0]) setNotifEmails(r[0].value); });
  },[]);

  const getPartnerCheckins=(pid)=>checkins.filter(c=>c.partnerId===pid&&c.status==="confirmed");
  const getPartnerPts=(pid)=>calcPts(getPartnerCheckins(pid));
  const getPartnerLevel=(pid)=>getLevel(getPartnerPts(pid));

  const confirm=async(b,guestsPresent)=>{
    const nc={id:uid(),partner_id:b.partnerId,tourist:b.tourist,date:new Date().toISOString().split("T")[0],status:"confirmed",guests_present:guestsPresent};
    await sb.post("checkins",nc);
    await sb.patch("bookings","id=eq."+b.id,{status:"confirmed"});
    const newCi=toCheckin(nc);
    setCheckins(prev=>[...prev,newCi]);
    setBookings(prev=>prev.map(x=>x.id===b.id?{...x,status:"confirmed"}:x));
    // Comissão
    const lv=getPartnerLevel(b.partnerId);
    const rate=COMM_RATES[lv.name]||0;
    if(rate>0){
      const comm={id:uid(),partner_id:b.partnerId,checkin_id:nc.id,guests_present:guestsPresent,level_name:lv.name,rate,total_amount:rate*guestsPresent,date:nc.date,paid:false};
      await sb.post("commissions",comm);
    }
    // Email parceiro
    const p=partners.find(x=>x.id===b.partnerId);
    if(p?.email){
      await sendEmail(p.email,"✅ Check-in confirmado – "+b.tourist,`<h2>Check-in confirmado!</h2><p>O cliente <b>${b.tourist}</b> compareceu ao Chalezinho.<br/><b>Pessoas presentes:</b> ${guestsPresent}<br/><b>Pontos ganhos:</b> +${guestsPresent}${rate>0?"<br/><b>Comissão:</b> R$ "+(rate*guestsPresent).toFixed(2):""}</p>`);
    }
    toast("✅ Check-in de "+b.tourist+" confirmado!");
  };

  const manual=async()=>{
    if(!mPartner||!mName) return toast("Preencha todos os campos","err");
    setLoading(true);
    const nc={id:uid(),partner_id:mPartner,tourist:mName,date:new Date().toISOString().split("T")[0],status:"confirmed",guests_present:mGuests};
    await sb.post("checkins",nc);
    const newCi=toCheckin(nc);
    setCheckins(prev=>[...prev,newCi]);
    const lv=getPartnerLevel(mPartner);
    const rate=COMM_RATES[lv.name]||0;
    if(rate>0){
      const comm={id:uid(),partner_id:mPartner,checkin_id:nc.id,guests_present:mGuests,level_name:lv.name,rate,total_amount:rate*mGuests,date:nc.date,paid:false};
      await sb.post("commissions",comm);
    }
    const p=partners.find(x=>x.id===mPartner);
    if(p?.email){
      await sendEmail(p.email,"✅ Check-in registrado",`<h2>Check-in registrado!</h2><p>Presença de <b>${mName}</b> confirmada.<br/><b>Pessoas:</b> ${mGuests}<br/><b>Pontos:</b> +${mGuests}${rate>0?"<br/><b>Comissão:</b> R$ "+(rate*mGuests).toFixed(2):""}</p>`);
    }
    setLoading(false); toast("✅ Check-in registrado!"); setMName(""); setMPartner(""); setMGuests(1);
  };

  const createPartner=async()=>{
    if(!np.name||!np.email||!np.pw) return toast("Preencha os campos obrigatórios","err");
    if(np.type==="other"&&!np.customType) return toast("Descreva o tipo de parceiro","err");
    if(partners.find(p=>p.email===np.email)) return toast("Email já cadastrado","err");
    setLoading(true);
    const base=np.name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g,"").slice(0,6);
    const code=np.code.trim()||base+uid().slice(0,3).toUpperCase();
    const newP={id:uid(),name:np.name,type:np.type,email:np.email,pw:np.pw,code,status:"approved",custom_type:np.customType};
    await sb.post("partners",newP);
    setPartners(prev=>[...prev,toPartner(newP)]);
    setLoading(false); toast("✅ Parceiro "+np.name+" criado!"); setNp({name:"",type:"guide",email:"",pw:"",code:"",customType:""});
  };

  const approvePartner=async(p)=>{
    await sb.patch("partners","id=eq."+p.id,{status:"approved"});
    setPartners(prev=>prev.map(x=>x.id===p.id?{...x,status:"approved"}:x));
    await sendEmail(p.email,"🎉 Cadastro aprovado – Chalezinho",`<h2>Parabéns, ${p.name}!</h2><p>Seu cadastro foi aprovado no Programa de Parceiros do Chalezinho.<br/><b>Seu código:</b> ${p.code}<br/>Acesse o app e comece a indicar clientes!</p><p><a href="${APP_URL}">Acessar o app</a></p>`);
    toast("✅ "+p.name+" aprovado!");
  };

  const rejectPartner=async(p,reason)=>{
    await sb.patch("partners","id=eq."+p.id,{status:"rejected",rejection_reason:reason});
    setPartners(prev=>prev.map(x=>x.id===p.id?{...x,status:"rejected",rejectionReason:reason}:x));
    await sendEmail(p.email,"Cadastro não aprovado – Chalezinho",`<h2>Olá, ${p.name}</h2><p>Infelizmente sua solicitação não foi aprovada neste momento.</p><p><b>Motivo:</b> ${reason}</p><p>Em caso de dúvidas, entre em contato com o restaurante.</p>`);
    setRejectId(null); setRejectReason(""); toast("Solicitação de "+p.name+" rejeitada.");
  };

  const saveConfig=async()=>{
    await sb.patch("app_config","key=eq.notif_emails",{value:notifEmails});
    toast("✅ Configurações salvas!");
  };

  const handleChangePw=()=>{
    if(cpw.cur!==getAdminPw()) return toast("Senha atual incorreta","err");
    if(cpw.novo.length<4) return toast("Nova senha deve ter ao menos 4 caracteres","err");
    if(cpw.novo!==cpw.conf) return toast("Senhas não coincidem","err");
    saveAdminPw(cpw.novo); setCpw({cur:"",novo:"",conf:""}); setShowCpw(false); toast("✅ Senha alterada!");
  };

  if(!authed) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:pageBg}}>
      <Card style={{maxWidth:340,width:"100%"}}>
        <Btn onClick={()=>go("loginChoice")} variant="ghost" style={{marginBottom:14,padding:"6px 12px",fontSize:12}}>← Voltar</Btn>
        <div style={{textAlign:"center",marginBottom:16}}><Logo size={40}/></div>
        <Divider/>
        <h2 style={{color:C.primary,margin:"0 0 18px",fontSize:20,textAlign:"center"}}>🔐 Painel do Restaurante</h2>
        <Input label="Senha" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Senha do restaurante" onKeyDown={e=>e.key==="Enter"&&(pw===getAdminPw()?setAuthed(true):toast("Senha incorreta","err"))}/>
        <Btn onClick={()=>pw===getAdminPw()?setAuthed(true):toast("Senha incorreta","err")} style={{width:"100%",padding:"12px"}}>Entrar</Btn>
      </Card>
    </div>
  );

  return (
    <div style={{maxWidth:640,margin:"0 auto",paddingBottom:30,background:C.bg,minHeight:"100vh"}}>
      <div style={{background:C.surf,borderBottom:"1px solid "+C.border,padding:"12px 14px",marginBottom:18,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 8px rgba(192,30,30,0.07)"}}>
        <Logo size={32}/>
        <Btn onClick={()=>go("landing")} variant="ghost" style={{padding:"6px 12px",fontSize:12}}>Sair</Btn>
      </div>
      <div style={{padding:"0 14px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
          {[{e:"⏳",v:pending.length,l:"Reservas",c:C.gold},{e:"✅",v:checkins.length,l:"Check-ins",c:C.green},{e:"🤝",v:approvedPartners.length,l:"Parceiros",c:C.primary}].map(s=>(
            <Card key={s.l} style={{textAlign:"center",padding:12}}><div style={{fontSize:20}}>{s.e}</div><div style={{fontSize:22,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{s.l}</div></Card>
          ))}
        </div>

        <TabBar tabs={[["pending","⏳ Reservas("+pending.length+")"],["manual","✅ Check-in"],["requests","👤 Solicitações("+pendingPartners.length+")"],["parceiros","🤝 Parceiros"],["novo","➕ Novo"],["comissoes","💰 Comissões"],["ranking","🏆 Ranking"],["hist","📋 Histórico"],["rules","📋 Regras"],["config","⚙️ Config"]]} active={tab} set={setTab}/>

        {tab==="pending"&&(
          pending.length===0?<Card style={{textAlign:"center",padding:32,color:C.muted}}>Nenhuma reserva pendente 🎉</Card>:
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {pending.map(b=>{
              const p=partners.find(x=>x.id===b.partnerId);
              return <PendingCard key={b.id} b={b} p={p} onConfirm={confirm}/>;
            })}
          </div>
        )}

        {tab==="manual"&&(
          <Card>
            <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>✅ Registrar Presença Manual</div>
            <Sel label="Parceiro Indicador" value={mPartner} onChange={e=>setMPartner(e.target.value)}>
              <option value="">Selecione…</option>
              {approvedPartners.map(p=><option key={p.id} value={p.id}>{PTYPES[p.type]?.icon} {p.name}</option>)}
            </Sel>
            <Input label="Nome do Cliente" value={mName} onChange={e=>setMName(e.target.value)} placeholder="Nome completo"/>
            <div style={{marginBottom:12}}>
              <div style={{color:C.muted,fontSize:11,fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:0.7}}>Pessoas Presentes</div>
              <input type="number" min="1" value={mGuests} onChange={e=>setMGuests(parseInt(e.target.value)||1)} style={{width:"100%",background:C.surf2,border:"1.5px solid "+C.border,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
            </div>
            <Btn onClick={manual} variant="success" style={{width:"100%",padding:"12px"}} disabled={loading}>{loading?"Salvando...":"Registrar Presença"}</Btn>
          </Card>
        )}

        {tab==="requests"&&(
          <div>
            {pendingPartners.length===0&&<Card style={{textAlign:"center",padding:32,color:C.muted}}>Nenhuma solicitação pendente 🎉</Card>}
            {pendingPartners.map(p=>(
              <Card key={p.id} style={{marginBottom:10}}>
                <div style={{fontWeight:700,fontSize:16,color:C.text,marginBottom:4}}>{p.name}</div>
                <div style={{fontSize:13,color:C.muted,lineHeight:1.8}}>
                  <div>📱 {PTYPES[p.type]?.label}{p.customType?" – "+p.customType:""}</div>
                  <div>📧 {p.email}</div>
                  <div>📞 {p.phone}</div>
                  <div>🪪 CPF: {p.cpf}</div>
                  <div>🎂 {p.birthDate}</div>
                  <div>📍 {p.address}</div>
                </div>
                {rejectId===p.id?(
                  <div style={{marginTop:12}}>
                    <Input label="Motivo da rejeição" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Informe o motivo"/>
                    <div style={{display:"flex",gap:8}}>
                      <Btn onClick={()=>rejectPartner(p,rejectReason)} variant="danger" style={{flex:1,padding:"10px"}}>Confirmar Rejeição</Btn>
                      <Btn onClick={()=>{setRejectId(null);setRejectReason("");}} variant="ghost" style={{flex:1,padding:"10px"}}>Cancelar</Btn>
                    </div>
                  </div>
                ):(
                  <div style={{display:"flex",gap:8,marginTop:12}}>
                    <Btn onClick={()=>approvePartner(p)} variant="success" style={{flex:1,padding:"10px"}}>✅ Aprovar</Btn>
                    <Btn onClick={()=>setRejectId(p.id)} variant="danger" style={{flex:1,padding:"10px"}}>❌ Rejeitar</Btn>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {tab==="parceiros"&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {approvedPartners.map(p=>{
              const lv=getPartnerLevel(p.id); const pts=getPartnerPts(p.id);
              return (
                <Card key={p.id} style={{padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{fontSize:24}}>{PTYPES[p.type]?.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:14}}>{p.name}</div>
                      <div style={{fontSize:12,color:C.muted}}>{p.email} · {p.phone}</div>
                      <div style={{fontSize:12,color:C.muted}}>Código: <b style={{color:C.primary}}>{p.code}</b> · {lv.emoji} {lv.name} · {pts} pts</div>
                    </div>
                  </div>
                </Card>
              );
            })}
            {approvedPartners.length===0&&<Card style={{textAlign:"center",padding:32,color:C.muted}}>Nenhum parceiro aprovado.</Card>}
          </div>
        )}

        {tab==="novo"&&(
          <Card>
            <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>➕ Criar Novo Parceiro</div>
            <Input label="Nome / Empresa *" value={np.name} onChange={e=>setNp({...np,name:e.target.value})} placeholder="Nome do parceiro"/>
            <Sel label="Tipo *" value={np.type} onChange={e=>setNp({...np,type:e.target.value})}>
              {Object.entries(PTYPES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
            </Sel>
            {np.type==="other"&&<Input label="Descreva o tipo *" value={np.customType} onChange={e=>setNp({...np,customType:e.target.value})} placeholder="Ex: Agência"/>}
            <Input label="Email *" type="email" value={np.email} onChange={e=>setNp({...np,email:e.target.value})} placeholder="email@parceiro.com"/>
            <Input label="Senha *" value={np.pw} onChange={e=>setNp({...np,pw:e.target.value})} placeholder="Senha de acesso"/>
            <Input label="Código personalizado (opcional)" value={np.code} onChange={e=>setNp({...np,code:e.target.value.toUpperCase()})} placeholder="Gerado automaticamente se vazio"/>
            <Btn onClick={createPartner} style={{width:"100%",padding:"12px"}} disabled={loading}>{loading?"Salvando...":"✅ Criar Parceiro"}</Btn>
          </Card>
        )}

        {tab==="comissoes"&&<CommissionsTab partners={partners} checkins={checkins} toast={toast}/>}
        {tab==="ranking"&&<AdminRanking partners={partners} checkins={checkins}/>}

        {tab==="hist"&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {checkins.length===0&&<Card style={{textAlign:"center",padding:32,color:C.muted}}>Nenhum check-in ainda.</Card>}
            {[...checkins].reverse().map(c=>{
              const p=partners.find(x=>x.id===c.partnerId);
              return (
                <div key={c.id} style={{display:"flex",gap:10,padding:"12px 14px",background:C.surf,borderRadius:12,alignItems:"center",border:"1px solid "+C.border}}>
                  <div style={{fontSize:20}}>✅</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:14}}>{c.tourist}</div>
                    <div style={{fontSize:12,color:C.muted}}>{c.date} · via {p?.name||"?"} · {c.guestsPresent} pessoa(s)</div>
                  </div>
                  <div style={{fontSize:12,color:C.green,fontWeight:700}}>+{c.guestsPresent} pts</div>
                </div>
              );
            })}
          </div>
        )}

        {tab==="rules"&&<Rules/>}

        {tab==="config"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Card>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>📧 E-mails de Notificação</div>
              <div style={{fontSize:13,color:C.muted,marginBottom:8}}>Separe múltiplos e-mails por vírgula</div>
              <Input label="E-mails do restaurante" value={notifEmails} onChange={e=>setNotifEmails(e.target.value)} placeholder="email1@ex.com, email2@ex.com"/>
              <Btn onClick={saveConfig} style={{width:"100%",padding:"10px"}}>💾 Salvar</Btn>
            </Card>
            <Card>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>🔑 Alterar Senha do Painel</div>
              <Input label="Senha atual" type="password" value={cpw.cur} onChange={e=>setCpw({...cpw,cur:e.target.value})} placeholder="••••••"/>
              <Input label="Nova senha" type="password" value={cpw.novo} onChange={e=>setCpw({...cpw,novo:e.target.value})} placeholder="••••••"/>
              <Input label="Confirmar nova senha" type="password" value={cpw.conf} onChange={e=>setCpw({...cpw,conf:e.target.value})} placeholder="••••••"/>
              <Btn onClick={handleChangePw} style={{width:"100%",padding:"10px"}}>Alterar Senha</Btn>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PENDING CARD (reserva com campo de pessoas) ──────────────────────────────
function PendingCard({b,p,onConfirm}){
  const [g,setG]=useState(b.guests||1);
  return (
    <Card>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:16}}>👤 {b.tourist}</div>
          <div style={{fontSize:13,color:C.muted,marginTop:2}}>📅 {b.date} · Reserva: {b.guests} pessoa(s)</div>
          <div style={{fontSize:13,color:C.primary,marginTop:2}}>🤝 via {p?.name||"?"}</div>
          <div style={{marginTop:10}}>
            <div style={{color:C.muted,fontSize:11,fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:0.7}}>Pessoas que compareceram</div>
            <input type="number" min="1" value={g} onChange={e=>setG(parseInt(e.target.value)||1)} style={{width:80,background:C.surf2,border:"1.5px solid "+C.border,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:16,fontWeight:700,outline:"none",textAlign:"center",fontFamily:"inherit"}}/>
          </div>
        </div>
        <Btn onClick={()=>onConfirm(b,g)} variant="success" style={{padding:"10px 14px",fontSize:13,marginTop:20}}>✅ Check-in</Btn>
      </div>
    </Card>
  );
}

// ─── COMMISSIONS TAB ──────────────────────────────────────────────────────────
function CommissionsTab({partners,checkins,toast}){
  const [comms,setComms]=useState([]);
  const [from,setFrom]=useState("");const [to,setTo]=useState("");
  useEffect(()=>{ sb.get("commissions","select=*&order=date.desc").then(r=>setComms((r||[]).map(toComm))); },[]);
  const filtered=filterByDateRange(comms,from,to);
  const total=filtered.reduce((s,c)=>s+c.totalAmount,0);
  const unpaid=filtered.filter(c=>!c.paid).reduce((s,c)=>s+c.totalAmount,0);

  const togglePaid=async(c)=>{
    await sb.patch("commissions","id=eq."+c.id,{paid:!c.paid});
    setComms(prev=>prev.map(x=>x.id===c.id?{...x,paid:!x.paid}:x));
    toast(c.paid?"Marcado como pendente":"✅ Marcado como pago");
  };

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:11,color:C.muted}}>Total no período</div><div style={{fontSize:22,fontWeight:900,color:C.green}}>R$ {total.toFixed(2)}</div></Card>
        <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:11,color:C.muted}}>A pagar</div><div style={{fontSize:22,fontWeight:900,color:C.red}}>R$ {unpaid.toFixed(2)}</div></Card>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <div style={{flex:1}}><div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:4}}>DE</div><input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{width:"100%",background:C.surf2,border:"1.5px solid "+C.border,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/></div>
        <div style={{flex:1}}><div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:4}}>ATÉ</div><input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{width:"100%",background:C.surf2,border:"1.5px solid "+C.border,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/></div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.map(c=>{
          const p=partners.find(x=>x.id===c.partnerId);
          return (
            <Card key={c.id} style={{padding:"12px 14px",opacity:c.paid?0.6:1}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{p?.name||"?"}</div>
                  <div style={{fontSize:12,color:C.muted}}>{c.date} · {c.guestsPresent} pessoa(s) · {c.levelName} · R$ {c.rate}/pessoa</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:900,fontSize:16,color:c.paid?C.green:C.red}}>R$ {c.totalAmount.toFixed(2)}</div>
                  <button onClick={()=>togglePaid(c)} style={{fontSize:11,border:"none",cursor:"pointer",background:"none",color:C.primary,fontFamily:"inherit",textDecoration:"underline"}}>{c.paid?"✅ Pago":"Marcar pago"}</button>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length===0&&<Card style={{textAlign:"center",padding:32,color:C.muted}}>Nenhuma comissão no período.</Card>}
      </div>
    </div>
  );
}

// ─── ADMIN RANKING ────────────────────────────────────────────────────────────
function AdminRanking({partners,checkins}){
  const [from,setFrom]=useState("");const [to,setTo]=useState("");
  const filtered=filterByDateRange(checkins.filter(c=>c.status==="confirmed"),from,to);
  const ranking=partners.filter(p=>p.status==="approved").map(p=>{
    const ci=filtered.filter(c=>c.partnerId===p.id);
    const pts=calcPts(ci);
    return{...p,total:ci.length,points:pts,totalGuests:ci.reduce((s,c)=>s+(c.guestsPresent||1),0),eligible:ci.reduce((s,c)=>s+(c.guestsPresent||1),0)>=30};
  }).sort((a,b)=>b.points-a.points);
  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <div style={{flex:1}}><div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:4}}>DE</div><input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{width:"100%",background:C.surf2,border:"1.5px solid "+C.border,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/></div>
        <div style={{flex:1}}><div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:4}}>ATÉ</div><input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{width:"100%",background:C.surf2,border:"1.5px solid "+C.border,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/></div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {ranking.map((p,i)=>{
          const lv=getLevel(p.points);
          return (
            <Card key={p.id} style={{padding:"12px 14px",opacity:p.points===0?0.4:1}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{fontWeight:900,fontSize:18,color:i<3?[C.gold,C.silver,C.bronze][i]:C.soft,width:28,textAlign:"center"}}>{i<3?["🥇","🥈","🥉"][i]:"#"+(i+1)}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{p.name} {p.eligible?<span style={{fontSize:10,background:C.green+"22",color:C.green,borderRadius:4,padding:"1px 5px",border:"1px solid "+C.green+"44"}}>Elegível</span>:<span style={{fontSize:10,background:C.red+"22",color:C.red,borderRadius:4,padding:"1px 5px"}}>{p.totalGuests}/30 pax</span>}</div>
                  <div style={{fontSize:12,color:C.muted}}>{lv.emoji} {lv.name} · {p.totalGuests} pessoas</div>
                </div>
                <div style={{fontWeight:900,fontSize:18,color:lv.col}}>{p.points} pts</div>
              </div>
            </Card>
          );
        })}
        {ranking.length===0&&<Card style={{textAlign:"center",padding:32,color:C.muted}}>Nenhum parceiro.</Card>}
      </div>
    </div>
  );
}

// ─── LEADERBOARD (público, com filtro de datas) ───────────────────────────────
function Leaderboard({allCheckins,partners,go}){
  const [from,setFrom]=useState("");const [to,setTo]=useState("");
  const approved=partners.filter(p=>p.status==="approved");
  const filtered=filterByDateRange(allCheckins.filter(c=>c.status==="confirmed"),from,to);
  const ranking=approved.map(p=>{
    const ci=filtered.filter(c=>c.partnerId===p.id);
    const pts=calcPts(ci);
    const totalGuests=ci.reduce((s,c)=>s+(c.guestsPresent||1),0);
    return{...p,total:ci.length,points:pts,totalGuests,eligible:totalGuests>=30,level:getLevel(pts)};
  }).sort((a,b)=>b.points-a.points);
  const top3=ranking.slice(0,3);
  const podiumOrder=[top3[1],top3[0],top3[2]].filter(Boolean);
  const podiumH=[top3[1]?100:0,top3[0]?140:0,top3[2]?80:0];
  const podiumGrad=["linear-gradient(180deg,#A0B0C0,#607080)","linear-gradient(180deg,"+C.gold+",#907000)","linear-gradient(180deg,"+C.bronze+",#6B3820)"];

  return (
    <div style={{maxWidth:520,margin:"0 auto",paddingBottom:30,background:C.bg,minHeight:"100vh"}}>
      <div style={{background:C.surf,borderBottom:"1px solid "+C.border,padding:"12px 14px",marginBottom:20,boxShadow:"0 2px 8px rgba(192,30,30,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Btn onClick={()=>go("dashboard")} variant="ghost" style={{padding:"7px 12px",fontSize:12}}>←</Btn>
          <Logo size={32}/>
        </div>
        <div style={{marginTop:12}}>
          <h2 style={{margin:"0 0 2px",fontSize:20,fontWeight:900}}>🏆 Ranking de Parceiros</h2>
        </div>
      </div>
      <div style={{padding:"0 14px"}}>
        {/* Filtro de datas */}
        <Card style={{marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:10,color:C.text}}>📅 Filtrar período</div>
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1}}><div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:4}}>DE</div><input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{width:"100%",background:C.surf2,border:"1.5px solid "+C.border,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/></div>
            <div style={{flex:1}}><div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:4}}>ATÉ</div><input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{width:"100%",background:C.surf2,border:"1.5px solid "+C.border,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/></div>
            {(from||to)&&<button onClick={()=>{setFrom("");setTo("");}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:12,fontFamily:"inherit",marginTop:16}}>limpar</button>}
          </div>
        </Card>

        {/* Prêmios */}
        <Card style={{marginBottom:20,background:"linear-gradient(135deg,"+C.surf2+",#fff)",border:"1.5px solid "+C.gold+"55"}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>🏆 Premiação Mensal</div>
          {[{pos:"🥇 1º",prize:"Rodízio premium para 2 com bebida"},{pos:"🥈 2º",prize:"Rodízio premium para 2 sem bebida"},{pos:"🥉 3º",prize:"Rodízio tradicional para 2"}].map(p=>(
            <div key={p.pos} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid "+C.border}}>
              <div style={{fontWeight:700,fontSize:13,width:40}}>{p.pos}</div>
              <div style={{flex:1,fontSize:13}}>{p.prize}</div>
            </div>
          ))}
          <div style={{fontSize:11,color:C.muted,marginTop:10,lineHeight:1.5}}>⚠️ Mínimo de 30 pessoas presentes para estar elegível à premiação do ranking.</div>
        </Card>

        {/* Pódio */}
        {top3.length>=2&&top3[0].points>0&&(
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:10,marginBottom:28,height:200}}>
            {podiumOrder.map((p,pos)=>{
              if(!p) return null;
              const lv=getLevel(p.points);
              return (
                <div key={p.id} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:2}}>{p.eligible?"✅ Elegível":"⚠️ "+p.totalGuests+"/30"}</div>
                  <div style={{fontSize:13,fontWeight:800,color:C.text,textAlign:"center",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:90}}>{p.name.split(" ")[0]}</div>
                  <div style={{fontSize:12,color:C.primary,fontWeight:700,marginBottom:6}}>{p.points}pts</div>
                  <div style={{width:"100%",height:podiumH[pos],display:"flex",alignItems:"flex-start",justifyContent:"center",background:podiumGrad[pos],borderRadius:"10px 10px 0 0",paddingTop:10,fontSize:26}}>{["🥈","🥇","🥉"][pos]}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Lista */}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {ranking.map((p,i)=>{
            const lv=getLevel(p.points);const nxt=getNextLvl(p.points);const eb=earnedBadges(p.points);
            const pct=nxt?Math.min(100,((p.points-lv.min)/(nxt.min-lv.min))*100):100;
            const borderCol=i===0?C.gold+"77":i===1?C.silver+"55":i===2?C.bronze+"55":C.border;
            return (
              <Card key={p.id} style={{padding:"14px 16px",opacity:p.points===0?0.5:1,border:"1.5px solid "+borderCol}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{fontWeight:900,fontSize:18,color:i<3?[C.gold,C.silver,C.bronze][i]:C.soft,width:30,textAlign:"center"}}>{i<3?["🥇","🥈","🥉"][i]:"#"+(i+1)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <span style={{fontWeight:700,fontSize:15}}>{p.name}</span>
                      <span style={{fontSize:10,background:lv.col+"18",color:lv.col,borderRadius:6,padding:"2px 7px",fontWeight:700,border:"1px solid "+lv.col+"44"}}>{lv.emoji} {lv.name}</span>
                      {p.eligible&&<span style={{fontSize:10,background:C.green+"18",color:C.green,borderRadius:6,padding:"2px 6px",border:"1px solid "+C.green+"44"}}>Elegível</span>}
                    </div>
                    <div style={{fontSize:12,color:C.muted,marginTop:2}}>{PTYPES[p.type]?.icon} {p.totalGuests} pessoas presentes</div>
                    {eb.length>0&&<div style={{display:"flex",gap:4,marginTop:4}}>{eb.slice(-4).map(b=><span key={b.id} title={b.name} style={{fontSize:14}}>{b.emoji}</span>)}</div>}
                  </div>
                  <div style={{textAlign:"right"}}><div style={{fontWeight:900,fontSize:20,color:lv.col}}>{p.points}</div><div style={{fontSize:11,color:C.muted}}>pontos</div></div>
                </div>
                {i<8&&nxt&&p.points>0&&(
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
          {ranking.length>0&&ranking[0].points===0&&!from&&!to&&<div style={{textAlign:"center",padding:16,color:C.muted,fontSize:13}}>Nenhum check-in ainda. Compartilhe seu código!</div>}
        </div>
      </div>
    </div>
  );
}

// ─── RULES PAGE ───────────────────────────────────────────────────────────────
function Rules(){
  return (
    <Card>
      <div style={{fontWeight:700,fontSize:16,marginBottom:16,color:C.primary}}>📋 Regras do Programa de Parceiros</div>
      <div style={{fontSize:12,color:C.red,background:C.surf2,borderRadius:8,padding:"8px 12px",marginBottom:16,fontWeight:600}}>⚠️ O sistema está em teste e pode sofrer ajustes nos próximos meses.</div>
      {[
        {t:"📊 Pontuação",c:"Cada cliente que comparece ao restaurante vale 1 ponto. A pontuação é registrada no momento do check-in pelo restaurante, com o número exato de pessoas presentes."},
        {t:"🏅 Níveis",c:"Os níveis são calculados com base no total acumulado de pontos (clientes presentes em todos os períodos):\n🌱 Iniciante: 0 pts\n🥉 Bronze: 100 pts\n🥈 Prata: 250 pts\n🥇 Ouro: 500 pts\n💎 Diamante: 1.000 pts\n👑 Lenda: 2.000 pts"},
        {t:"💰 Comissionamento (a partir do Ouro)",c:"Parceiros a partir do nível Ouro recebem comissão por cada pessoa presente:\n🥇 Ouro: R$ 2,00 por pessoa\n💎 Diamante: R$ 5,00 por pessoa\n👑 Lenda: R$ 10,00 por pessoa\nO pagamento será combinado diretamente com o restaurante."},
        {t:"🏆 Premiação Mensal do Ranking",c:"O ranking é apurado mensalmente. Os 3 primeiros colocados ganham:\n🥇 1º lugar: Rodízio premium para 2 com bebida\n🥈 2º lugar: Rodízio premium para 2 sem bebida\n🥉 3º lugar: Rodízio tradicional para 2\n\nRequisito mínimo: 30 pessoas presentes no período para ser elegível à premiação, mesmo estando no top 3."},
        {t:"📅 Apuração do Ranking",c:"O ranking pode ser filtrado por período (data início e data fim). A pontuação acumulada para evolução nos níveis não é zerada com a virada do período — apenas os pontos do período filtrado contam para o ranking e premiação mensal."},
        {t:"✅ Check-in",c:"A presença dos clientes é confirmada pela equipe do restaurante no momento da visita. Apenas clientes efetivamente presentes geram pontos. O parceiro receberá um e-mail de confirmação a cada check-in registrado."},
        {t:"🎁 Desconto para o Cliente",c:"Clientes indicados por parceiros recebem 10% de desconto na conta. Não cumulativo com outros benefícios ou promoções."},
      ].map(r=>(
        <div key={r.t} style={{marginBottom:16,paddingBottom:16,borderBottom:"1px solid "+C.border}}>
          <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:6}}>{r.t}</div>
          <div style={{fontSize:13,color:C.muted,lineHeight:1.7,whiteSpace:"pre-line"}}>{r.c}</div>
        </div>
      ))}
    </Card>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App(){
  const [view,setView]=useState("landing");
  const [partners,setPartners]=useState([]);
  const [checkins,setCheckins]=useState([]);
  const [bookings,setBookings]=useState([]);
  const [current,setCurrent]=useState(null);
  const [ready,setReady]=useState(false);
  const [toastMsg,setToastMsg]=useState(null);

  useEffect(()=>{
    try{ const p=new URLSearchParams(window.location.search); if(p.get("code")) setView("tourist"); }catch{}
    async function init(){
      try{
        const [p,c,b]=await Promise.all([
          sb.get("partners","select=*"),
          sb.get("checkins","select=*"),
          sb.get("bookings","select=*"),
        ]);
        setPartners((p||[]).map(toPartner));
        setCheckins((c||[]).map(toCheckin));
        setBookings((b||[]).map(toBooking));
      }catch(e){console.error("Supabase error",e);}
      setReady(true);
    }
    init();
  },[]);

  const toast=(msg,type="ok")=>{ setToastMsg({msg,type}); setTimeout(()=>setToastMsg(null),4000); };
  const go=v=>setView(v);

  if(!ready) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:pageBg,flexDirection:"column",gap:16}}>
      <Logo size={56}/>
      <div style={{color:C.muted,fontSize:15}}>Carregando…</div>
      <div style={{width:120,height:3,background:C.surf3,borderRadius:999,overflow:"hidden"}}><div style={{width:"60%",height:"100%",background:C.primary,borderRadius:999,animation:"load 1.2s ease infinite"}}/></div>
    </div>
  );

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:C.bg,minHeight:"100vh",color:C.text}}>
      <style>{`*{box-sizing:border-box;margin:0}input,select{color-scheme:light}button:hover{filter:brightness(0.94)}@keyframes slideIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}@keyframes load{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#fff5f5}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}`}</style>
      {toastMsg&&<div style={{position:"fixed",top:16,right:16,zIndex:10000,background:toastMsg.type==="err"?C.red:"linear-gradient(135deg,"+C.primary+","+C.primaryDark+")",color:"#fff",padding:"13px 20px",borderRadius:12,boxShadow:"0 8px 28px rgba(0,0,0,.2)",fontWeight:700,fontSize:14,animation:"slideIn .25s ease",maxWidth:320}}>{toastMsg.msg}</div>}
      {view==="landing"     &&<Landing go={go}/>}
      {view==="loginChoice" &&<LoginChoice go={go}/>}
      {view==="login"       &&<PartnerLogin partners={partners} setCurrent={setCurrent} go={go} toast={toast}/>}
      {view==="register"    &&<PartnerRegister partners={partners} setPartners={setPartners} go={go} toast={toast}/>}
      {view==="dashboard"   &&current&&<Dashboard partner={current} allCheckins={checkins} bookings={bookings} partners={partners} go={go}/>}
      {view==="tourist"     &&<TouristView partners={partners} bookings={bookings} setBookings={setBookings} go={go} toast={toast}/>}
      {view==="admin"       &&<AdminView partners={partners} setPartners={setPartners} checkins={checkins} setCheckins={setCheckins} bookings={bookings} setBookings={setBookings} go={go} toast={toast}/>}
      {view==="leaderboard" &&<Leaderboard allCheckins={checkins} partners={partners} go={go}/>}
    </div>
  );
}
