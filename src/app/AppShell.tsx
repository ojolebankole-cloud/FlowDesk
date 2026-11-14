import {useEffect,useMemo,useState,FormEvent} from 'react';
import type {ReactNode} from 'react';
import {NavLink,useLocation,useNavigate} from 'react-router-dom';
import {Activity,LayoutDashboard,Home,FolderKanban,CheckSquare,Users,Receipt,ChartNoAxesCombined,CalendarDays,Sparkles,Settings,Bell,Search,Plus,Menu,X,Sun,Moon,ArrowUpRight,MoreHorizontal,Trash2,Check,Clock3,Send,BrainCircuit,PanelLeftClose,LogOut,FileText,Wallet,Target,ChevronDown} from 'lucide-react';
import {Area,AreaChart,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis,Bar,BarChart} from 'recharts';
import {readScopedStore,writeScopedStore,money} from '../lib';
import { AuthProvider, useAuth } from './AppProviders';
import { authService } from '../services/auth';
import { workspaceService, Workspace } from '../services/workspaces';
import { profileService } from '../services/profile';
import { AuthPage } from '../features/auth/AuthPage';
import { RoutesView, RecordModal } from '../features/workspace/WorkspaceViews';
import type { Dataset, RecordItem } from '../features/workspace/types';

const empty:Record<Dataset,RecordItem[]>={projects:[],tasks:[],customers:[],invoices:[],events:[]};
const uid=()=>crypto.randomUUID();
const dateLabel=()=>new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(new Date());
const nav=[['Home','/',Home],['Dashboard','/dashboard',LayoutDashboard],['Projects','/projects',FolderKanban],['Tasks','/tasks',CheckSquare],['Customers','/customers',Users],['Invoices','/invoices',Receipt],['Billing','/billing',Wallet],['Analytics','/analytics',ChartNoAxesCombined],['Calendar','/calendar',CalendarDays],['Notifications','/notifications',Bell],['Files','/files',FileText],['AI Assistant','/ai',Sparkles]] as const;
function App(){ return <AuthProvider><AppShell/></AuthProvider>; }
function AppShell(){
 const {user,loading:authLoading,setUser}=useAuth();
 const [boot,setBoot]=useState(true);
 const [dark,setDark]=useState(false);
 const [data,setData]=useState<Record<Dataset,RecordItem[]>>(empty);
 const [workspace,setWorkspace]=useState('My workspace');
 const [workspaceId,setWorkspaceId]=useState('');
 const [workspaces,setWorkspaces]=useState<Workspace[]>([]);
 const [workspaceLoading,setWorkspaceLoading]=useState(false);
 const [owner,setOwner]=useState('');
 const [loadedScope,setLoadedScope]=useState('');
 const [mobile,setMobile]=useState(false);
 const [query,setQuery]=useState('');
 const [modal,setModal]=useState<Dataset|null>(null);
 const [notice,setNotice]=useState('');
 const location=useLocation();
 const navigate=useNavigate();
 const [acceptingInvitation,setAcceptingInvitation]=useState(false);
 const [workspaceDialog,setWorkspaceDialog]=useState(false),[workspaceName,setWorkspaceName]=useState(''),[invitationToken,setInvitationToken]=useState(''),[workspaceActionBusy,setWorkspaceActionBusy]=useState(false),[workspaceActionError,setWorkspaceActionError]=useState('');
 useEffect(()=>{let alive=true;if(!user){setWorkspaceId('');setWorkspaces([]);return;}setWorkspaceId('');setWorkspaceLoading(true);workspaceService.list().then(r=>{if(!alive)return;setWorkspaces(r.workspaces);const remembered=readScopedStore(user.id,'active-workspace-id','');const selected=r.workspaces.find(w=>w.id===remembered)||r.workspaces[0];if(selected){setWorkspaceId(selected.id);setWorkspace(selected.name);writeScopedStore(user.id,'active-workspace-id',selected.id);}else{setWorkspaceId('');setWorkspace('No workspace');}}).catch(e=>{console.error('Workspace loading failed',e);if(alive)setNotice('Could not load workspaces from the server. Check the API connection.');}).finally(()=>{if(alive)setWorkspaceLoading(false)});profileService.get().then(r=>{if(alive)setOwner(r.user.name)}).catch(()=>{});return()=>{alive=false}},[user?.id]);
 const scope=user&&workspaceId?`${user.id}:${workspaceId}`:'';
 useEffect(()=>{if(!user||!workspaceId)return;setLoadedScope('');setData({projects:[],tasks:[],customers:[],invoices:[],events:[]});setDark(readScopedStore(user.id,'dark',false));setLoadedScope(scope)},[user?.id,workspaceId]);
 useEffect(()=>{if(user&&loadedScope===scope&&scope){document.documentElement.dataset.theme=dark?'dark':'light';writeScopedStore(user.id,'dark',dark)}},[dark,user?.id,loadedScope,scope]);
 useEffect(()=>{if(!user||location.pathname!=='/accept-invitation'||acceptingInvitation)return;const token=new URLSearchParams(location.search).get('token');if(!token){setNotice('Invitation token is missing.');navigate('/');return;}setAcceptingInvitation(true);workspaceService.accept(token).then(async result=>{const list=await workspaceService.list();setWorkspaces(list.workspaces);const joined=list.workspaces.find(w=>w.id===result.workspaceId);if(joined){setWorkspaceId(joined.id);setWorkspace(joined.name);writeScopedStore(user.id,'active-workspace-id',joined.id);}setNotice('Workspace invitation accepted.');navigate('/');}).catch(e=>{setNotice(e instanceof Error?e.message:'Invitation could not be accepted.');navigate('/');}).finally(()=>setAcceptingInvitation(false));},[user?.id,location.pathname,location.search,acceptingInvitation]);
 useEffect(()=>{if(boot){const t=setTimeout(()=>{setBoot(false);sessionStorage.setItem('flowdesk-booted','1')},1800);return()=>clearTimeout(t)}},[boot]);
 useEffect(()=>{setMobile(false);setQuery('')},[location.pathname]);
 const switchWorkspace=(selected:Workspace)=>{setWorkspaceId(selected.id);setWorkspace(selected.name);if(user)writeScopedStore(user.id,'active-workspace-id',selected.id);setWorkspaceDialog(false);};
 const createWorkspace=async()=>{if(!workspaceName.trim())return;setWorkspaceActionBusy(true);setWorkspaceActionError('');try{await workspaceService.create({name:workspaceName.trim()});const list=await workspaceService.list();setWorkspaces(list.workspaces);const created=list.workspaces.find(w=>w.name===workspaceName.trim())||list.workspaces[list.workspaces.length-1];if(created)switchWorkspace(created);setWorkspaceName('');}catch(e){setWorkspaceActionError(e instanceof Error?e.message:'Workspace could not be created.')}finally{setWorkspaceActionBusy(false)}};
 const acceptWorkspaceInvite=async()=>{if(!invitationToken.trim())return;setWorkspaceActionBusy(true);setWorkspaceActionError('');try{const result=await workspaceService.accept(invitationToken.trim());const list=await workspaceService.list();setWorkspaces(list.workspaces);const joined=list.workspaces.find(w=>w.id===result.workspaceId);if(joined)switchWorkspace(joined);setInvitationToken('');}catch(e){setWorkspaceActionError(e instanceof Error?e.message:'Invitation could not be accepted.')}finally{setWorkspaceActionBusy(false)}};
 const save=(kind:Dataset,items:RecordItem[])=>{setData(prev=>({...prev,[kind]:items}))};
 const add=(kind:Dataset,item:Omit<RecordItem,'id'|'createdAt'>)=>{save(kind,[{...item,id:uid(),createdAt:new Date().toISOString()},...data[kind]]);setModal(null);setNotice('This action is not connected to a server-backed workflow yet.');setTimeout(()=>setNotice(''),2600)};
 const remove=(kind:Dataset,id:string)=>save(kind,data[kind].filter(x=>x.id!==id));
 const updateStatus=(kind:Dataset,id:string,status:string)=>save(kind,data[kind].map(x=>x.id===id?{...x,status}:x));
 if(boot)return <div className="splash"><div className="splash-orbit"><div className="splash-logo"><Activity size={48} strokeWidth={2.4}/></div></div><div className="splash-name">FlowDesk<span>.</span></div><div className="splash-tagline">Work clearly. Move confidently.</div><div className="splash-line"><i/></div><small>YOUR WORKSPACE, IN FLOW</small></div>;
 if(authLoading)return <div className="splash"><div className="splash-name">FlowDesk<span>.</span></div><div className="splash-tagline">Restoring your secure session…</div></div>;
 if(!user)return <AuthPage onSuccess={setUser}/>;
 if(acceptingInvitation||workspaceLoading||!workspaceId||loadedScope!==scope)return <div className="route-loading">{workspaceLoading?'Loading your workspaces…':'Create or join a workspace to continue.'}</div>;
 return <div className="app-frame">
  <aside className={`sidebar ${mobile?'open':''}`}><div className="brand-row"><div className="brand"><span className="brand-icon"><Activity size={18}/></span><b>flowdesk<span>.</span></b></div><button className="mobile-x icon" onClick={()=>setMobile(false)}><X/></button></div>
   <button className="workspace-picker" onClick={()=>{setWorkspaceActionError('');setWorkspaceDialog(true)}}><span className="workspace-glyph">{workspace.slice(0,1).toUpperCase()}</span><span><b>{workspace}</b><small>{workspaces.find(w=>w.id===workspaceId)?.role||'Workspace'} · {workspaces.length} available</small></span><ChevronDown size={15}/></button>
   <div className="nav-caption">WORKSPACE</div><nav className="nav-list">{nav.map(([label,path,Icon])=><NavLink key={path} to={path} end={path==='/'} className={({isActive})=>'nav-item '+(isActive?'active':'')}><Icon size={17}/><span>{label}</span></NavLink>)}</nav>
   {['ADMIN','SUPER_ADMIN','SUPPORT'].includes(user.platformRole||'')&&<NavLink to="/admin" className={({isActive})=>'nav-item '+(isActive?'active':'')}><Activity size={17}/><span>Administration</span></NavLink>}<div className="nav-caption pref-caption">PREFERENCES</div><NavLink to="/settings" className={({isActive})=>'nav-item '+(isActive?'active':'')}><Settings size={17}/><span>Settings</span></NavLink>
   <div className="sidebar-bottom"><div className="local-note"><span className="local-dot"/><span><b>Workspace</b><small>Identity and membership are server-managed.</small></span></div><div className="profile-row"><span className="profile-avatar">{(owner||'Y').slice(0,1).toUpperCase()}</span><span className="profile-copy"><b>{owner||'Workspace owner'}</b><small>{owner?'Profile set':'Set your profile in Settings'}</small></span><button className="icon" title="Settings" onClick={()=>location.pathname!='/settings'&&(window.location.href='/settings')}><MoreHorizontal size={17}/></button></div></div>
  </aside>
  {mobile&&<button className="scrim" onClick={()=>setMobile(false)} aria-label="Close navigation"/>}
  <main className="main-area"><header className="topbar"><button className="mobile-menu icon" onClick={()=>setMobile(true)}><Menu/></button><div className="breadcrumb">Workspace <span>/</span> <b>{nav.find(n=>n[1]===location.pathname)?.[0]||'Settings'}</b></div><div className="top-actions"><label className="search"><Search size={15}/><input placeholder="Search this page..." value={query} onChange={e=>setQuery(e.target.value)}/><kbd>/</kbd></label><button className="icon theme-btn" onClick={()=>setDark(!dark)} title="Toggle theme">{dark?<Sun size={17}/>:<Moon size={17}/>}</button><button className="icon" onClick={()=>setNotice('You are all caught up.')} title="Notifications"><Bell size={17}/></button><span className="top-avatar">{(owner||'Y').slice(0,1).toUpperCase()}</span></div></header>
   <div className="page-scroll"><div key={location.pathname} className="route-scene"><RoutesView storageScope={scope} workspaceId={workspaceId} workspaceRole={workspaces.find(w=>w.id===workspaceId)?.role||'VIEWER'} data={data} query={query} onAdd={setModal} onRemove={remove} onStatus={updateStatus} owner={owner||user.name||user.email} setOwner={v=>{setOwner(v);writeScopedStore(user.id,'owner',v)}} workspace={workspace} setWorkspace={v=>{setWorkspace(v);writeScopedStore(user.id,'workspace',v)}} setNotice={setNotice} setDark={setDark} onLogout={async()=>{try{await authService.logout()}finally{setUser(null)}}} platformRole={user.platformRole}/></div></div>
  </main>
  {workspaceDialog&&<div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setWorkspaceDialog(false)}}><section className="record-modal" role="dialog" aria-modal="true" aria-labelledby="workspace-dialog-title"><div className="modal-head"><div><div className="eyebrow">WORKSPACE MANAGEMENT</div><h2 id="workspace-dialog-title">Switch workspace</h2></div><button className="icon" onClick={()=>setWorkspaceDialog(false)} aria-label="Close"><X/></button></div><div className="workspace-options">{workspaces.map(w=><button key={w.id} className={`list-row ${w.id===workspaceId?'selected':''}`} onClick={()=>switchWorkspace(w)}><span className="workspace-glyph">{w.name.slice(0,1).toUpperCase()}</span><span className="row-main"><b>{w.name}</b><small>{w.role} · {w.memberCount} members · {w.projectCount} projects</small></span>{w.id===workspaceId&&<Check size={16}/>}</button>)}</div><h3>Create workspace</h3><form className="form-row" onSubmit={e=>{e.preventDefault();void createWorkspace()}}><input aria-label="New workspace name" minLength={2} maxLength={80} required value={workspaceName} onChange={e=>setWorkspaceName(e.target.value)} placeholder="Workspace name"/><button className="btn primary" disabled={workspaceActionBusy||!workspaceName.trim()}>Create</button></form><h3>Accept invitation</h3><form className="form-row" onSubmit={e=>{e.preventDefault();void acceptWorkspaceInvite()}}><input aria-label="Invitation token" value={invitationToken} onChange={e=>setInvitationToken(e.target.value)} placeholder="Paste invitation token"/><button className="btn secondary" disabled={workspaceActionBusy||!invitationToken.trim()}>Accept</button></form>{workspaceActionError&&<div className="error-note">{workspaceActionError}</div>}</section></div>}
  {modal&&<RecordModal kind={modal} onClose={()=>setModal(null)} onSave={item=>add(modal,item)}/>}
  {notice&&<div className="toast"><Check size={15}/>{notice}<button onClick={()=>setNotice('')}><X size={14}/></button></div>}
 </div>
}
export default App;
