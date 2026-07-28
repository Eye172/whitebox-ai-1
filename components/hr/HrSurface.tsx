"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle, ArrowDownToLine, BarChart3, Check, ChevronRight, CircleGauge,
  Copy, FileCheck2, Filter, GitCompareArrows, Mail, Play, Search, Send,
  Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Users, X,
} from "lucide-react";
import { candidates, threshold, vacancies, vacancyV2Demo } from "@/lib/fixtures";
import { BLOCK_LIBRARY } from "@/lib/blocks";
import { effectiveWeights } from "@/lib/studio";
import { ConfidenceBadge, ScoreCell, StatusPill, TierBadge } from "@/components/ui/primitives";

const CARD = "rounded-xl border border-hairline bg-surface";
const BTN = "rounded-lg border border-hairline bg-surface2 px-3 py-2 text-[12px] text-mid hover:border-hairline-strong hover:text-hi";
const INPUT = "iris-focus rounded-lg border border-hairline bg-void2 px-3 py-2 text-[12px] text-hi";

function Header({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex items-end justify-between gap-5"><div><h1 className="font-display text-[27px]">{title}</h1><p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-mid">{text}</p></div>{action}</div>;
}

function Notice({ text, onClose }: { text: string; onClose: () => void }) {
  return <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-3 rounded-xl border border-pos/30 bg-surface2 p-4 text-[12px] text-hi shadow-2xl"><Check className="size-4 shrink-0 text-pos" /><span>{text}</span><button onClick={onClose}><X className="size-3.5 text-lo" /></button></div>;
}

function Bars({ values, color = "var(--iris-b)" }: { values: number[]; color?: string }) {
  const max = Math.max(...values);
  return <div className="flex h-24 items-end gap-1.5">{values.map((v, i) => <span key={i} className="flex-1 rounded-t opacity-80" style={{ height: `${(v / max) * 100}%`, background: color }} />)}</div>;
}

function VacanciesSurface() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const shown = vacancies.filter((v) => (status === "ALL" || v.status === status) && v.title.toLowerCase().includes(q.toLowerCase()));
  return <div className="p-8">
    <Header eyebrow="Portfolio" title="Vacancies" text="Find a role, review its candidates, or create a new vacancy." action={<Link href="/vacancies/new" className="rounded-lg bg-paper px-4 py-2.5 text-[12px] font-medium text-void">Create vacancy</Link>} />
    <div className="mb-4 flex gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3"><Search className="size-3.5 text-lo" /><input className="w-72 bg-transparent py-2 text-[12px] outline-none" placeholder="Search vacancies…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <label className="flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 text-[12px] text-mid">Status<select aria-label="Filter vacancies by status" value={status} onChange={(event) => setStatus(event.target.value)} className="bg-transparent py-2 text-hi outline-none"><option>ALL</option><option>LIVE</option><option>DRAFT</option><option>CLOSED</option></select></label>
    </div>
    <div className={`${CARD} overflow-hidden`}><table className="w-full text-left text-[12px]"><thead><tr className="border-b border-hairline">{["POSITION", "STATUS", "CANDIDATES", "NEEDS REVIEW", ""].map((h) => <th key={h} className="hud-label px-4 py-3 font-normal">{h}</th>)}</tr></thead><tbody>{shown.map((v) => <tr key={v.id} className="border-b border-hairline last:border-0"><td className="px-4 py-4"><div className="text-hi">{v.title}</div><div className="mt-1 font-mono text-[10px] text-lo">{v.code} · v{v.configVersion}</div></td><td className="px-4"><StatusPill label={v.status} /></td><td className="px-4 font-mono text-hi">{v.candidates}</td><td className="px-4 font-mono text-warn">{v.needReview || "—"}</td><td className="px-4 text-right"><Link href={`/vacancies/${v.id}/ranking`} className="inline-flex items-center gap-1 text-irisc">Open <ChevronRight className="size-3" /></Link></td></tr>)}</tbody></table>{shown.length === 0 && <div className="p-10 text-center text-[12px] text-lo">No vacancies match this view.</div>}</div>
  </div>;
}

function AnalyticsSurface({ vacancy = false }: { vacancy?: boolean }) {
  const [period, setPeriod] = useState("30D");
  const [notice, setNotice] = useState("");
  const [showSources, setShowSources] = useState(false);
  const multipliers: Record<string, number> = { "7D": .45, "30D": 1, "90D": 2.4 };
  const m = multipliers[period];
  return <div className="p-8">
    <Header eyebrow="Analytics" title={vacancy ? "Vacancy analytics" : "Analytics"} text="Track progress from application to hire." action={<button className={BTN} onClick={() => setNotice("Analytics CSV prepared locally.")}><ArrowDownToLine className="mr-2 inline size-3.5" />Export CSV</button>} />
    <div className="mb-4 flex items-center gap-2"><label className="flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 text-[12px] text-mid">Period<select aria-label="Analytics period" value={period} onChange={(event) => setPeriod(event.target.value)} className="bg-transparent py-2 text-hi outline-none"><option>7D</option><option>30D</option><option>90D</option></select></label><button onClick={() => setShowSources((value) => !value)} aria-expanded={showSources} className={BTN}>{showSources ? "Hide sources" : "Show source details"}</button></div>
    <div className="grid grid-cols-3 gap-3">{[["Applications", Math.round(1284*m)],["Completed",Math.round(618*m)],["Hired",Math.max(3,Math.round(18*m))]].map(([k,v]) => <div key={k} className={`${CARD} p-5`}><div className="text-[12px] text-mid">{k}</div><div className="mt-2 font-display text-[28px]">{v}</div></div>)}</div>
    <div className={`mt-4 grid gap-4 ${showSources ? "grid-cols-[1.2fr_.8fr]" : "grid-cols-1"}`}><div className={`${CARD} p-5`}><div className="flex justify-between"><div><div className="text-[13px] font-medium text-hi">Hiring funnel</div><div className="mt-1 text-[11px] text-mid">Application → interview → decision</div></div><span className="font-mono text-[10px] text-pos">48.1% completed</span></div><div className="mt-6"><Bars values={[100,82,71,58,48,19,8]} /></div><div className="mt-3 grid grid-cols-7 text-center font-mono text-[9px] text-lo">{["ENTRY","REG","FORM","INTERVIEW","SUBMIT","SHORTLIST","HIRE"].map(x=><span key={x}>{x}</span>)}</div></div>{showSources&&<div className={`${CARD} p-5`}><div className="text-[13px] font-medium text-hi">Source quality</div>{[["Referral",78,34],["LinkedIn",61,42],["University",55,18],["QR / poster",47,9]].map(([name,quality,volume])=><div key={name} className="mt-4"><div className="flex justify-between text-[11px]"><span>{name}</span><span className="font-mono text-mid">{quality} quality · {volume}% volume</span></div><div className="mt-1 h-1 rounded bg-void2"><div className="h-full rounded bg-pos" style={{width:`${quality}%`}} /></div></div>)}</div>}</div>
    {notice && <Notice text={notice} onClose={() => setNotice("")} />}
  </div>;
}

function BiasSurface() {
  const [stage, setStage] = useState("SHORTLIST");
  const [notice, setNotice] = useState("");
  return <div className="p-8"><Header eyebrow="Fairness" title="Fairness" text="Review group-level outcomes. These signals never change an individual score." action={<button className={BTN} onClick={() => setNotice("LL144-shaped audit dataset prepared for independent review.")}><FileCheck2 className="mr-2 inline size-3.5" />Export data</button>} />
    <div className="mb-4"><label className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 text-[12px] text-mid">Stage<select aria-label="Fairness stage" value={stage} onChange={(event)=>setStage(event.target.value)} className="bg-transparent py-2 text-hi outline-none"><option>SCREEN</option><option>INTERVIEW</option><option>SHORTLIST</option><option>INVITED</option></select></label></div>
    <div className="grid grid-cols-[1fr_320px] gap-4"><div className={`${CARD} overflow-hidden`}><div className="border-b border-hairline px-5 py-4"><div className="text-[13px] font-medium text-hi">Selection rate by group</div></div>{[["Group A",1,"Reference"],["Group B",.74,"Review"],["Group C",.88,"In range"],["Group D",.83,"In range"]].map(([name,ratio,state])=><div key={name} className="grid grid-cols-[120px_1fr_70px_90px] items-center gap-4 border-b border-hairline px-5 py-4 last:border-0"><span className="text-[12px] text-hi">{name}</span><div className="h-1.5 rounded bg-void2"><div className={`h-full rounded ${Number(ratio)<.8?"bg-neg":"bg-pos"}`} style={{width:`${Number(ratio)*100}%`}} /></div><span className="font-mono text-[12px]">{Number(ratio).toFixed(2)}</span><span className={`text-[10px] ${Number(ratio)<.8?"text-neg":"text-lo"}`}>{state}</span></div>)}</div><div className={`${CARD} p-5`}><AlertTriangle className="size-5 text-neg" /><div className="mt-4 text-[14px] text-hi">Review Group B</div><p className="mt-2 text-[11px] leading-relaxed text-mid">The shortlist ratio is below 0.80. A human should review the stage design and sample size.</p><button onClick={() => setNotice("Review task assigned to the vacancy Owner and Legal tray.")} className={`${BTN} mt-5 w-full`}>Assign review</button></div></div>
    {notice && <Notice text={notice} onClose={() => setNotice("")} />}
  </div>;
}

function CalibrationSurface() {
  const [mode, setMode] = useState(false);
  const [done, setDone] = useState(false);
  return <div className="p-8"><Header eyebrow="Review quality" title="Review quality" text="Keep human ratings consistent with short practice cases." action={<button onClick={()=>setMode(true)} className="rounded-lg bg-paper px-4 py-2.5 text-[12px] text-void"><Play className="mr-2 inline size-3.5" />Start practice</button>} />
    <div className="grid max-w-xl grid-cols-2 gap-3">{[["Reviewer agreement","82%"],["Within one rating","97%"]].map(([k,v])=><div key={k} className={`${CARD} p-5`}><div className="text-[12px] text-mid">{k}</div><div className="mt-2 font-display text-[26px]">{v}</div></div>)}</div>
    <div className={`${CARD} mt-4 overflow-hidden`}><div className="border-b border-hairline px-5 py-4"><div className="text-[13px] font-medium text-hi">Reviewer consistency</div></div>{[["a.rakhimova",.08,"On track"],["m.baker",-.14,"Review severity"],["d.chen",.04,"On track"],["s.lee",.23,"Review leniency"]].map(([name,delta,state])=><div key={name} className="grid grid-cols-[180px_1fr_80px_130px] items-center gap-4 border-b border-hairline px-5 py-4 last:border-0"><span className="text-[12px] text-hi">{name}</span><div className="relative h-1 rounded bg-void2"><span className="absolute left-1/2 top-[-3px] h-2 w-px bg-line-mid" /><span className="absolute top-[-3px] size-2 rounded-full bg-irisb" style={{left:`${50+Number(delta)*100}%`}} /></div><span className="font-mono text-[11px]">{Number(delta)>0?"+":""}{delta}</span><span className="text-[10px] text-mid">{state}</span></div>)}</div>
    {mode && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-8"><div className={`${CARD} w-full max-w-xl p-6`}><div className="hud-label">Practice case · 1 of 3</div><h2 className="mt-3 font-display text-[22px]">Decision-making under ambiguity</h2><p className="mt-3 text-[12px] leading-relaxed text-mid">“I delayed the rollout, ran a one-week shadow test, and defined the error budget that would reverse the call. False positives fell from 11% to 3%.”</p><div className="mt-5 grid grid-cols-5 gap-2">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>{setDone(true);setMode(false)}} className={`${BTN} py-3`}>{n}</button>)}</div><button onClick={()=>setMode(false)} className="mt-4 text-[11px] text-lo">Exit practice</button></div></div>}
    {done && <Notice text="Practice rating recorded. Anchor feedback unlocked." onClose={()=>setDone(false)} />}
  </div>;
}

function AuditSurface() {
  const [filter, setFilter] = useState("ALL");
  const [verified, setVerified] = useState(false);
  const [showHashes, setShowHashes] = useState(false);
  const rows = [
    ["09:42:11","a.rakhimova","PUBLISHED","vac-001 cv3","9b21…a7f0"],
    ["10:18:03","wbx-score-2.3","SCORED","CND-4A19","a7f0…3c9d"],
    ["11:06:22","m.baker","REVEALED","CND-4A19 PII","3c9d…81e4"],
    ["11:11:49","m.baker","APPROVED","CND-4A19","81e4…f614"],
    ["12:03:17","a.rakhimova","OVERRIDDEN","CND-5E28","f614…2ab8"],
  ];
  const shown = filter==="ALL"?rows:rows.filter(r=>r[2]===filter);
  return <div className="p-8"><Header eyebrow="Activity" title="Activity log" text="Review scoring, approvals, identity access and overrides." action={<button onClick={()=>setVerified(true)} className={BTN}><ShieldCheck className="mr-2 inline size-3.5" />Verify integrity</button>} />
    <div className="mb-4 flex gap-2"><label className="flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 text-[12px] text-mid">Action<select aria-label="Filter activity by action" value={filter} onChange={(event)=>setFilter(event.target.value)} className="bg-transparent py-2 text-hi outline-none"><option>ALL</option><option>SCORED</option><option>APPROVED</option><option>OVERRIDDEN</option><option>REVEALED</option></select></label><button onClick={()=>setShowHashes((value)=>!value)} aria-expanded={showHashes} className={BTN}>{showHashes?"Hide technical details":"Show technical details"}</button></div>
    <div className={`${CARD} overflow-hidden`}><table className="w-full text-left text-[11px]"><thead><tr className="border-b border-hairline">{["TIME","ACTOR","ACTION","TARGET"].map(h=><th key={h} className="hud-label px-4 py-3 font-normal">{h}</th>)}{showHashes&&<th className="hud-label px-4 py-3 font-normal">CHAIN HASH</th>}</tr></thead><tbody>{shown.map((r,i)=><tr key={i} className="border-b border-hairline last:border-0"><td className="px-4 py-4 font-mono text-lo">{r[0]}</td><td className="px-4 text-mid">{r[1]}</td><td className={`px-4 font-mono ${r[2]==="OVERRIDDEN"?"text-ember":"text-hi"}`}>{r[2]}</td><td className="px-4 text-mid">{r[3]}</td>{showHashes&&<td className="px-4 font-mono text-lo">{r[4]}</td>}</tr>)}</tbody></table></div>
    {verified && <Notice text="Chain verified: 5/5 entries link correctly; no mutation detected." onClose={()=>setVerified(false)} />}
  </div>;
}

function CompareSurface() {
  const [ids, setIds] = useState(["CND-4A19","CND-7C02"]);
  const pool = candidates.filter(c=>ids.includes(c.internalId));
  return <div className="p-8"><Header eyebrow="Comparison" title="Compare candidates" text="Compare scores and evidence side by side." action={<Link href="/vacancies/vac-001/ranking" className={BTN}>Back to candidates</Link>} />
    <div className="mb-4 flex flex-wrap items-center gap-2"><label className="flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 text-[12px] text-mid">Add candidate<select aria-label="Add candidate to comparison" value="" disabled={ids.length>=3} onChange={(event)=>{if(event.target.value)setIds((current)=>[...current,event.target.value])}} className="bg-transparent py-2 text-hi outline-none"><option value="">{ids.length>=3?"Limit reached":"Select"}</option>{candidates.filter(candidate=>!ids.includes(candidate.internalId)).map(candidate=><option key={candidate.internalId} value={candidate.internalId}>{candidate.internalId}</option>)}</select></label>{ids.map(id=><button key={id} disabled={ids.length===1} onClick={()=>setIds((current)=>current.filter(value=>value!==id))} className={`${BTN} disabled:cursor-not-allowed disabled:opacity-50`} aria-label={`Remove ${id} from comparison`}>{id} ×</button>)}</div>
    <div className="grid gap-4" style={{gridTemplateColumns:`repeat(${pool.length},minmax(0,1fr))`}}>{pool.map(c=><div key={c.internalId} className={`${CARD} p-5`}><div className="flex items-center justify-between"><div><div className="font-mono text-[15px]">{c.internalId}</div><div className="mt-1"><TierBadge tier={c.tier} /></div></div><ScoreCell score={c.overall} threshold={threshold} /></div><div className="mt-5 space-y-4">{c.competencies.map(k=><div key={k.id}><div className="flex justify-between text-[11px]"><span className="text-mid">{k.name}</span><span className="font-mono">{k.score}</span></div><div className="mt-1 h-1 rounded bg-void2"><div className="h-full rounded bg-irisb" style={{width:`${k.score}%`}} /></div></div>)}</div><div className="mt-5 border-t border-hairline pt-4 text-[11px] text-mid">{c.confidencePhrase}</div></div>)}</div>
  </div>;
}

function ConfigSurface() {
  const [tab, setTab] = useState("Criteria");
  const ew = effectiveWeights(vacancyV2Demo);
  return <div className="p-8"><Header eyebrow="Setup" title="Setup" text="This live version is locked. Create a draft to make changes." action={<Link href="/vacancies/new" className={BTN}><SlidersHorizontal className="mr-2 inline size-3.5" />Edit as new version</Link>} />
    <div className="mb-4 flex gap-2">{["Criteria","Pipeline","Scoring","Governance","Notices"].map(t=><button key={t} onClick={()=>setTab(t)} className={`${BTN} ${tab===t?"border-irisb/50 text-hi":""}`}>{t}</button>)}</div>
    {tab==="Criteria"&&<div className="grid grid-cols-2 gap-4">{vacancyV2Demo.categories.map(c=><div key={c.id} className={`${CARD} p-5`}><div className="flex justify-between"><span className="text-[13px] text-hi">{c.name}</span><span className="font-mono text-[11px]">{c.weight}%</span></div>{c.attributes.map(a=><div key={a.id} className="mt-3 text-[11px] text-mid">{a.focus?"◉ ":""}{a.name} · {a.kind} · {a.weight}%</div>)}</div>)}</div>}
    {tab==="Pipeline"&&<div className="space-y-3">{vacancyV2Demo.pipeline.map((b,i)=><div key={b.id} className={`${CARD} flex items-center gap-4 p-4`}><span className="font-mono text-[10px] text-lo">{String(i+1).padStart(2,"0")}</span><div className="flex-1"><div className="text-[13px] text-hi">{b.title}</div><div className="mt-1 text-[10px] text-mid">{BLOCK_LIBRARY[b.kind].methodName} · {b.estimatedMinutes} min</div></div><span className="rounded-full border border-hairline px-2 py-1 font-mono text-[9px] text-lo">TIER {b.integrityTier}</span></div>)}</div>}
    {tab==="Scoring"&&<div className={`${CARD} p-5`}><div className="hud-label">Effective composite</div>{ew.attributes.map(a=><div key={a.attributeId} className="mt-4"><div className="flex justify-between text-[11px]"><span>{a.name}</span><span className="font-mono">{a.pct}%</span></div><div className="mt-1 h-1 rounded bg-void2"><div className="h-full rounded bg-irisb" style={{width:`${a.pct*3}%`}} /></div></div>)}</div>}
    {tab==="Governance"&&<div className={`${CARD} p-5`}>{vacancyV2Demo.governance.roles.map(r=><div key={r.userId} className="flex justify-between border-b border-hairline py-3 text-[12px] last:border-0"><span>{r.name}</span><span className="font-mono text-lo">{r.role} · PII {r.piiReveal?"YES":"NO"}</span></div>)}</div>}
    {tab==="Notices"&&<div className={`${CARD} p-5`}><div className="hud-label">{vacancyV2Demo.experience.notices.jurisdictionProfile} · notice v{vacancyV2Demo.experience.notices.version}</div><p className="mt-4 max-w-3xl text-[12px] leading-relaxed text-mid">{vacancyV2Demo.experience.notices.aiDisclosure}</p></div>}
  </div>;
}

function InvitationsSurface() {
  const inviteMessage = "Hello {{first_name}},\n\nThank you for completing the process for {{role_title}}. We would like to invite you to the next stage.\n\nChoose a time: {{schedule_link}}\n\n{{company}}";
  const [action,setAction]=useState("invite"); const [audience,setAudience]=useState("Top 25"); const [subject,setSubject]=useState("Next step — {{role_title}} at {{company}}"); const [message,setMessage]=useState(inviteMessage); const [sent,setSent]=useState("");
  const changeAction=(next:string)=>{setAction(next);if(next==="invite"){setSubject("Next step — {{role_title}} at {{company}}");setMessage(inviteMessage)}else if(next==="reject"){setSubject("Update on your application for {{role_title}}");setMessage("Hello {{first_name}},\n\nThank you for your time and interest in {{role_title}}. After human review, we will not be moving forward with your application.\n\n{{company}}")}else{setSubject("An update on {{role_title}}");setMessage("Hello {{first_name}},\n\nYour application for {{role_title}} remains under review. We will share the next update soon.\n\n{{company}}")}};
  const ready=subject.trim().length>0&&message.trim().length>0;
  return <div className="p-8"><Header eyebrow="Messages" title="Messages" text="Prepare a message, then send it for human approval." />
    <div className="grid grid-cols-[1fr_310px] gap-4"><div className={`${CARD} space-y-5 p-5`}><div className="grid grid-cols-2 gap-4"><label><span className="text-[11px] text-mid">Action</span><select className={`${INPUT} mt-2 w-full`} value={action} onChange={e=>changeAction(e.target.value)}><option value="invite">Invite</option><option value="reject">Not moving forward</option><option value="hold">Keep under review</option></select></label><label><span className="text-[11px] text-mid">Audience</span><select className={`${INPUT} mt-2 w-full`} value={audience} onChange={e=>setAudience(e.target.value)}><option>Top 25</option><option>Above threshold</option><option>Top score band</option><option>Manual selection</option></select></label></div><label className="block"><span className="text-[11px] text-mid">Subject</span><input className={`${INPUT} mt-2 w-full`} value={subject} onChange={e=>setSubject(e.target.value)} /></label><label className="block"><span className="text-[11px] text-mid">Message</span><textarea className={`${INPUT} mt-2 min-h-44 w-full leading-relaxed`} value={message} onChange={e=>setMessage(e.target.value)} /></label><div className="flex gap-2"><button onClick={()=>setSent("Draft saved.")} className={BTN}>Save draft</button><button disabled={!ready} onClick={()=>setSent("Sent for approval. No message has been delivered yet.")} className="rounded-lg bg-paper px-4 py-2 text-[12px] text-void disabled:cursor-not-allowed disabled:opacity-30"><Send className="mr-2 inline size-3.5" />Request approval</button></div></div><aside className={`${CARD} h-fit p-5`}><div className="text-[13px] font-medium text-hi">Ready to review</div>{[["Audience",audience],["Message fields","Valid"],["Approval","Required"]].map(([k,v])=><div key={k} className="mt-4 flex justify-between text-[11px]"><span className="text-mid">{k}</span><span className="text-hi">{v}</span></div>)}<p className="mt-5 text-[10px] leading-relaxed text-lo">Nothing is sent until a named reviewer approves the batch.</p></aside></div>
    {sent&&<Notice text={sent} onClose={()=>setSent("")} />}
  </div>;
}

function SettingsSurface() {
  const [saved,setSaved]=useState(false); const [organization,setOrganization]=useState("Acme Org"); const [retention,setRetention]=useState("180"); const [tz,setTz]=useState("Asia/Almaty"); const valid=organization.trim().length>0&&Number(retention)>0;
  return <div className="p-8"><Header eyebrow="Settings" title="Settings" text="Defaults used when a new vacancy is created." /><div className="grid grid-cols-2 gap-4"><div className={`${CARD} space-y-5 p-5`}><div className="text-[13px] font-medium text-hi">Organization</div><label className="block text-[11px] text-mid">Organization name<input className={`${INPUT} mt-2 w-full`} value={organization} onChange={e=>setOrganization(e.target.value)} /></label><label className="block text-[11px] text-mid">Default timezone<select className={`${INPUT} mt-2 w-full`} value={tz} onChange={e=>setTz(e.target.value)}><option>Asia/Almaty</option><option>UTC</option><option>Europe/London</option></select></label><label className="block text-[11px] text-mid">Data retention (days)<input className={`${INPUT} mt-2 w-full`} min={1} value={retention} onChange={e=>setRetention(e.target.value)} type="number" /></label></div><div className={`${CARD} space-y-5 p-5`}><div className="text-[13px] font-medium text-hi">Review defaults</div>{["Transcript-only scoring","Blind review by default","Require candidate AI disclosure","Require human dispatch confirmation"].map(x=><label key={x} className="flex items-center gap-3 text-[12px] text-hi"><input type="checkbox" defaultChecked className="accent-white" />{x}</label>)}</div></div><button disabled={!valid} onClick={()=>setSaved(true)} className="mt-4 rounded-lg bg-paper px-4 py-2.5 text-[12px] text-void disabled:cursor-not-allowed disabled:opacity-30">Save settings</button>{saved&&<Notice text="Settings saved locally." onClose={()=>setSaved(false)} />}</div>;
}

export default function HrSurface({ path }: { path: string }) {
  let surface: React.ReactNode;
  if (path === "vacancies") surface = <VacanciesSurface />;
  else if (path === "analytics") surface = <AnalyticsSurface />;
  else if (path === "bias") surface = <BiasSurface />;
  else if (path === "calibration") surface = <CalibrationSurface />;
  else if (path === "audit") surface = <AuditSurface />;
  else if (path === "settings") surface = <SettingsSurface />;
  else if (path.endsWith("/compare")) surface = <CompareSurface />;
  else if (path.endsWith("/analytics")) surface = <AnalyticsSurface vacancy />;
  else if (path.endsWith("/config")) surface = <ConfigSurface />;
  else if (path.endsWith("/invitations")) surface = <InvitationsSurface />;
  else surface = <div className="grid-paper grid min-h-[70vh] place-items-center p-8"><div className={`${CARD} max-w-xl p-8 text-center`}><CircleGauge className="mx-auto size-8 text-irisb" /><h1 className="mt-4 font-display text-[24px]">Surface not configured</h1><p className="mt-2 text-[12px] text-mid">The route exists, but no product module is registered for “{path}”.</p><Link href="/dashboard" className={`${BTN} mt-5 inline-block`}>Return to dashboard</Link></div></div>;
  return <div className="contour-bg contour-bg-soft min-h-[calc(100vh-52px)]">{surface}</div>;
}
