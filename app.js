
const DEFAULTS={rentalLtv:75,fixFlipLtv:80,rentalDscr:1.20,minCredit:650};
const LOANS=[
{id:'A',product:'Rental',entity:'Maple Grove Holdings LLC',ltv:72,dscr:1.28,credit:[712,698],history:'Eight completed rental acquisitions over six years',closed:true},
{id:'B',product:'Fix-and-flip',entity:'Redstone Ventures LLC',ltv:78,dscr:null,credit:[648],history:'No prior projects; full gut renovation',closed:false},
{id:'C',product:'Rental',entity:'The Harrington Family Trust',ltv:68,dscr:1.15,credit:[754],history:'Twelve prior rental properties held long term',closed:true}
];
const DOCS={
A:[
['Operating Agreement','Ownership','Two members hold 60% / 40%; the entity is Maple Grove Holdings LLC.','Case-supplied ownership fact'],
['Appraisal','Valuation','Supports 72% LTV for the rental product.','Case-supplied LTV fact'],
['Credit Reports','Credit','Both guarantors are identified; scores are 712 and 698.','Case-supplied credit facts'],
['Sponsor History','Experience','Eight completed rental acquisitions over six years.','Case-supplied experience fact'],
['Insurance Certificate','Insurance','Coverage is on file and runs through the loan term.','Case-supplied insurance fact'],
['Closing / Recording','Deed of trust','Loan closed four days ago; recording is pending with the county.','Case-supplied recording fact'],
['Note + Closing Docs','Name consistency','Entity name matches across note, closing documents and operating agreement.','Case-supplied name-consistency fact']
],
B:[
['Entity Formation','Borrower','Redstone Ventures LLC is a single-member entity.','Case-supplied borrower fact'],
['Appraisal','Valuation','Supports 78% LTV for the fix-and-flip product.','Case-supplied LTV fact'],
['Credit Report','Credit','Sole member score is 648; an exception request is awaiting decision.','Case-supplied credit/exception fact'],
['Sponsor History','Experience','No prior projects; scope of work is a full gut renovation.','Case-supplied experience fact'],
['Insurance','Insurance','Nothing is on file.','Case-supplied insurance fact'],
['Closing Package','Closing status','No closing documents because the loan has not closed.','Case-supplied closing fact']
],
C:[
['Trust Document','Borrower','Legal entity is The Harrington Family Trust; one trustee is on the loan.','Case-supplied trust fact'],
['Appraisal','Valuation','Supports 68% LTV for the rental product.','Case-supplied LTV fact'],
['Rent Roll / DSCR','Coverage','DSCR is 1.15.','Case-supplied DSCR fact'],
['Credit Report','Credit','Trustee guarantor score is 754.','Case-supplied credit fact'],
['Sponsor History','Experience','Twelve prior rental properties held long term.','Case-supplied experience fact'],
['Insurance Certificate','Insurance','Coverage is on file but expires two months before loan maturity.','Case-supplied insurance fact'],
['Trustee Certification','Trustee','Required certification is not on file.','Case-supplied trustee-document fact'],
['Recorded Deed','Deed of trust','Recorded deed of trust is received and on file.','Case-supplied deed fact'],
['Note + Trust Document','Name consistency','The note names Harrington Family Trust; the operating trust document uses the fuller legal name.','Case-supplied name-consistency fact']
]};
let policy=loadPolicy();
let role='station1';

function loadPolicy(){
  try{const s=JSON.parse(localStorage.getItem('converge-demo-policy')||'null'); if(s)return Object.assign({},DEFAULTS,s);}catch(e){}
  return Object.assign({},DEFAULTS);
}
function persist(){localStorage.setItem('converge-demo-policy',JSON.stringify(policy));}
function getLoan(id){return LOANS.find(function(x){return x.id===id;});}
function isRental(L){return L.product==='Rental';}
function ltvLimit(L){return isRental(L)?Number(policy.rentalLtv):Number(policy.fixFlipLtv);}
function creditOk(L){return L.credit.every(function(v){return v>=Number(policy.minCredit);});}
function uw(L){
  var ltv=L.ltv<=ltvLimit(L)?'ready':'issue';
  var ds=L.dscr===null?'na':(L.dscr>=Number(policy.rentalDscr)?'ready':'issue');
  var cr=creditOk(L)?'ready':(L.id==='B'?'waiting':'issue');
  var exp=L.id==='B'?'issue':'ready';
  return [
    ['LTV within product limits',ltv,L.ltv+'% versus configured '+ltvLimit(L)+'% limit.','LTV','Case-supplied LTV fact'],
    ['Rental DSCR is sufficient',ds,L.dscr===null?'Not applicable: the case says the fix-and-flip property has no rental income.':L.dscr+' versus configured '+Number(policy.rentalDscr).toFixed(2)+' minimum.','DSCR','Case-supplied DSCR fact'],
    ['All required guarantors identified','ready',L.id==='A'?'Both members are on the loan.':L.id==='B'?'The sole member is the guarantor.':'One trustee is on the loan.','Guarantors','Case-supplied guarantor facts'],
    ['Sponsor experience is adequate for scope',exp,L.id==='B'?'The case gives no prior projects against a full gut renovation. This is treated as a review or exception path, not as a hard lender policy rule.':'The supplied sponsor history supports the proposed rental scope.','Experience','Case-supplied experience fact'],
    ['Guarantor credit meets minimum / exception',cr,creditOk(L)?'All supplied scores meet the configured '+Number(policy.minCredit)+' minimum.':L.id==='B'?'648 is below the configured '+Number(policy.minCredit)+' minimum; the case says an exception request is awaiting decision.':'At least one supplied score is below the configured '+Number(policy.minCredit)+' minimum; no exception status is supplied.','Credit','Case-supplied credit/exception']
  ];
}
function closing(L){
  var open=uw(L).some(function(x){return x[1]==='issue'||x[1]==='waiting';});
  if(L.id==='A')return [
    ['Insurance is on file and in force through loan term','ready','Coverage is on file and runs through the loan term.','Insurance','Case-supplied insurance fact'],
    ['Trustee certification on file when applicable','na','Not applicable because the borrowing entity is an LLC.','Trust structure','Case-supplied borrower fact'],
    ['All underwriting exceptions approved',open?'waiting':'ready',open?'Station 1 still has an open item.':'No open underwriting exception is reflected in this demo.','Upstream state','Derived from Station 1 evaluation'],
    ['Recorded deed of trust received','waiting','Not yet received; recording is pending with the county.','Deed','Case-supplied recording fact'],
    ['Entity name matches note and operating agreement','ready','Names match across the supplied closing facts.','Name consistency','Case-supplied name-consistency fact']
  ];
  if(L.id==='B')return [
    ['Insurance is on file and in force through loan term','waiting','Nothing is on file.','Insurance','Case-supplied insurance fact'],
    ['Trustee certification on file when applicable','na','Not applicable because the borrowing entity is an LLC.','Trust structure','Case-supplied borrower fact'],
    ['All underwriting exceptions approved','waiting','Station 1 has open underwriting items, so Closing is waiting on upstream resolution.','Upstream state','Derived from Station 1 evaluation'],
    ['Recorded deed of trust received','na','Not applicable because the loan has not closed.','Deed','Case-supplied closing fact'],
    ['Entity name matches note and operating agreement','waiting','No closing documents yet, so this cannot be verified.','Name consistency','Case-supplied closing fact']
  ];
  return [
    ['Insurance is on file and in force through loan term','issue','Coverage expires two months before loan maturity.','Insurance','Case-supplied insurance fact'],
    ['Trustee certification on file when applicable','issue','Required certification is not on file.','Trustee certification','Case-supplied trustee-document fact'],
    ['All underwriting exceptions approved',open?'waiting':'ready',open?'Station 1 still has an open DSCR item; downstream exception approval is not confirmed.':'No open underwriting exception is reflected in this demo.','Upstream state','Derived from Station 1 evaluation'],
    ['Recorded deed of trust received','ready','Recorded deed has been received and is on file.','Deed','Case-supplied deed fact'],
    ['Entity name matches note and operating agreement','issue','The note and trust document use different legal-name strings; human review is needed.','Name consistency','Case-supplied name-consistency fact']
  ];
}
function stats(items){var r={ready:0,issue:0,waiting:0,na:0,total:items.length};items.forEach(function(x){r[x[1]]++;});return r;}
function pill(s){var c=s==='ready'?'pass':s==='issue'?'issue':s==='waiting'?'wait':'na';var t=s==='ready'?'Ready':s==='issue'?'Needs action':s==='waiting'?'Waiting':'N/A';return '<span class="status '+c+'"><i></i>'+t+'</span>';}
function top(title,label){
 return '<header class="topbar"><a class="brand" href="#login"><div class="mark">C</div><div><b>Converge</b><small>Credit intelligence · Loan review</small></div></a><div class="rolebar"><span class="badge '+(title==='Closing'?'teal':'')+'">'+label+'</span>'+title+'</div><div class="user"><div class="avatar">'+(title==='Closing'?'CL':'UW')+'</div><div class="ucopy"><b style="font-size:12px">'+(title==='Closing'?'Closer':'Underwriter')+'</b><small>Demo lender workspace</small></div><a class="settingslink" href="#settings">Policy settings</a><a class="textlink" href="#login">Switch role</a></div></header>';
}
function policyBar(){return '<div class="policybar"><div><b>Demo policy thresholds</b><div class="policyvalues">Rental LTV ≤ '+policy.rentalLtv+'% · Fix-and-flip LTV ≤ '+policy.fixFlipLtv+'% · Rental DSCR ≥ '+Number(policy.rentalDscr).toFixed(2)+' · Min guarantor credit ≥ '+policy.minCredit+'</div></div><a class="secondary" href="#settings">Edit policy</a></div>';}
function login(){
  document.getElementById('app').innerHTML='<div class="login"><main class="loginmain"><div class="eyebrow">CONVERGE · LOAN REVIEW WORKSPACE</div><h1>Choose your review station</h1><p class="loginlead">Demo access for the lender review workflow. Each role can view the other station while only editing its own checklist.</p><div class="roles"><a class="rolecard" href="#station1"><span class="badge tag">Station 1</span><div class="icon">✓</div><h2>Underwriting</h2><p>Evaluate leverage, DSCR, guarantors, sponsor experience and credit.</p><div class="perm"><span>Can act on</span><span>Underwriting</span></div><div class="perm"><span>Other station</span><span>Read-only</span></div></a><a class="rolecard" href="#station2"><span class="badge tag teal">Station 2</span><div class="icon tealicon">▣</div><h2>Closing</h2><p>Review insurance, trust documentation, exceptions, deed recording and naming.</p><div class="perm"><span>Can act on</span><span>Closing</span></div><div class="perm"><span>Other station</span><span>Read-only</span></div></a></div><div class="banner"><b>Demo note.</b> No password is required. Production authentication and role authorization would be enforced by an identity provider and backend.</div></main></div>';
}
function queue(){
 var title=role==='station1'?'Underwriting':'Closing', label=role==='station1'?'Station 1':'Station 2';
 var cards=LOANS.map(function(L){
   var a1=stats(uw(L)),a2=stats(closing(L));
   var s1=a1.issue?'issue':a1.waiting?'waiting':'ready',s2=a2.issue?'issue':a2.waiting?'waiting':'ready';
   var next=L.id==='A'?'Closing is waiting for the recorded deed of trust.':L.id==='B'?'Resolve the open underwriting items before Closing can proceed.':'Resolve the DSCR review path, then clear the closing conditions.';
   return '<a class="card" href="#loan/'+L.id+'"><div class="row"><span class="id">LOAN '+L.id+'</span><span class="chip">'+L.product+'</span></div><h2>'+L.entity+'</h2><div class="facts"><div class="fact"><span>LTV</span><b>'+L.ltv+'%</b></div><div class="fact"><span>DSCR</span><b>'+(L.dscr===null?'N/A':L.dscr)+'</b></div><div class="fact"><span>Credit</span><b>'+L.credit.join(' / ')+'</b></div></div><div class="stage"><div class="stage-title"><strong>Loan stage</strong><span>Cross-station view</span></div><div class="station-row"><div class="station-left"><span class="station-num">1</span><span>Underwriting</span></div>'+pill(s1)+'</div><div class="station-row"><div class="station-left"><span class="station-num">2</span><span>Closing</span></div>'+pill(s2)+'</div><div class="next-step"><b>Next:</b> '+next+'</div></div><div style="margin-top:16px;font-size:11px;font-weight:900;color:#485bc8;display:flex;justify-content:space-between"><span>View loan review</span><span>→</span></div></a>';
 }).join('');
 document.getElementById('app').innerHTML=top(title,label)+'<main><div class="heading"><div><div class="eyebrow">'+label.toUpperCase()+' · '+title.toUpperCase()+'</div><h1>Loan review queue</h1><p class="lede">'+(role==='station1'?'Review leverage, coverage, guarantors, sponsor experience and guarantor credit.':'Review insurance, trust documentation, exceptions, deed recording and entity naming.')+' The other station is visible read-only.</p></div><div class="count"><span>Loans in view</span><b>3</b></div></div>'+policyBar()+'<div class="grid">'+cards+'</div><div class="banner"><b>Role permissions active.</b> You can update only '+title.toLowerCase()+'; the other station remains read-only.</div></main>';
}
function docsHtml(L){return '<div class="docs">'+DOCS[L.id].map(function(d){return '<div class="doc"><div class="docicon">▤</div><div><strong>'+d[0]+'</strong><p><b>'+d[1]+':</b> '+d[2]+'</p><span class="source">'+d[3]+'</span></div><span class="fetched">Case fact</span></div>';}).join('')+'</div>';}
function check(items,title,editable,locked){
 return '<section class="section"><div class="sectionhead"><div><span class="badge '+(title==='Closing'?'teal':'')+'">'+(title==='Underwriting'?'Station 1':'Station 2')+'</span><h2>'+title+' checklist</h2><p>'+(title==='Underwriting'?'Leverage, coverage, guarantors, experience and guarantor credit.':'Insurance, trust documentation, exceptions, deed and name consistency.')+'</p>'+(locked?'<div class="lock">🔒 Locked until Station 1 is complete</div>':'')+'</div></div>'+items.map(function(x){var act=editable&&x[1]!=='ready'&&x[1]!=='na'&&!locked?'<a class="btn '+(x[1]==='issue'?'secondary':'primary')+'" href="#action/'+title+'/'+encodeURIComponent(x[0])+'">Review finding</a>':editable&&locked&&x[1]!=='ready'&&x[1]!=='na'?'<span class="readonly">Locked by upstream underwriting</span>':editable?'<span class="readonly">Ready — no action needed</span>':'<span class="readonly">Read-only · owned by '+title+'</span>';return '<div class="item"><div class="itemicon">'+(x[1]==='ready'?'✓':x[1]==='issue'?'!':x[1]==='waiting'?'…':'–')+'</div><div><div class="row"><h3>'+x[0]+'</h3>'+pill(x[1])+'</div><p><b>'+x[2]+'</b></p><p><span class="source">Value: '+x[3]+' · Source: '+x[4]+'</span></p><div class="actions">'+act+'</div></div></div>';}).join('')+'</section>';
}
function detail(L){
 var s1=uw(L),s2=closing(L),own=role==='station1'?s1:s2,other=role==='station1'?s2:s1,ownTitle=role==='station1'?'Underwriting':'Closing',otherTitle=role==='station1'?'Closing':'Underwriting',st=stats(own),overall=st.issue?'issue':st.waiting?'waiting':'ready';
 document.getElementById('app').innerHTML=top(ownTitle,role==='station1'?'Station 1':'Station 2')+'<main><a class="back" href="#'+role+'">← Back to loan queue</a><div class="hero"><div><div class="eyebrow">LOAN '+L.id+' · '+L.product.toUpperCase()+'</div><h1>'+L.entity+'</h1><div class="sub">Borrowing entity <b>'+L.entity+'</b> · '+(L.closed?'Closed':'Not closed')+'</div></div><div class="heroRight"><div class="eyebrow">YOUR STATION</div>'+pill(overall)+'<div class="sub" style="margin-top:5px">Action only: '+ownTitle+'</div></div></div><div class="metrics"><div class="metric"><span>Loan-to-value</span><b>'+L.ltv+'%</b><small>'+L.product+' · configured limit '+ltvLimit(L)+'%</small></div><div class="metric"><span>Debt service coverage</span><b>'+ (L.dscr===null?'N/A':L.dscr)+'</b><small>'+ (L.dscr===null?'Not applicable':'configured minimum '+Number(policy.rentalDscr).toFixed(2))+'</small></div><div class="metric"><span>Guarantor credit</span><b>'+L.credit.join(' / ')+'</b><small>configured minimum '+policy.minCredit+'</small></div><div class="metric"><span>Sponsor history</span><b>'+ (L.id==='A'?'8 acquisitions':L.id==='B'?'0 prior projects':'12 rentals')+'</b><small>Case-supplied fact</small></div></div>'+policyBar()+'<section class="section"><div class="sectionhead"><div><div class="eyebrow">SOURCE-LINKED VIEW</div><h2>Documents & extracted insights</h2><p>The case supplies facts rather than real file contents; source types below map to those facts.</p></div></div>'+docsHtml(L)+'</section><div class="twocol">'+check(own,ownTitle,true,role==='station2'&&isBlockedByUpstream(L))+check(other,otherTitle,false,false)+'</div><div class="notice"><b>Station handoff:</b> each station can act only on its own checklist. Policy settings affect evaluation rules, not source facts.</div></main>';
}
function isBlockedByUpstream(L){var s=stats(uw(L));return s.issue+s.waiting>0;}
function settingsPage(){
 var title=role==='station1'?'Underwriting':'Closing',label=role==='station1'?'Station 1':'Station 2';
 document.getElementById('app').innerHTML=top(title,label)+'<main><a class="back" href="#'+role+'">← Back to loan queue</a><div class="eyebrow">DEMO POLICY CONFIGURATION</div><h1 style="font-size:34px;letter-spacing:-.035em;margin:8px 0 0">Policy settings</h1><p class="lede">The case study does not specify numeric policy thresholds. These four values are explicit prototype assumptions. Edit them and the loan evaluations recalculate.</p><div class="formcard"><div class="formgrid"><div class="field"><label>Rental maximum LTV</label><small>Upper bound used for rental underwriting.</small><div class="unit"><input id="rentalLtv" type="number" min="0" max="100" step="1" value="'+policy.rentalLtv+'"><span>%</span></div></div><div class="field"><label>Fix-and-flip maximum LTV</label><small>Upper bound used for fix-and-flip underwriting.</small><div class="unit"><input id="fixFlipLtv" type="number" min="0" max="100" step="1" value="'+policy.fixFlipLtv+'"><span>%</span></div></div><div class="field"><label>Rental minimum DSCR</label><small>Applied only when the product is rental and DSCR is supplied.</small><div class="unit"><input id="rentalDscr" type="number" min="0" max="10" step="0.01" value="'+Number(policy.rentalDscr).toFixed(2)+'"><span>x</span></div></div><div class="field"><label>Minimum guarantor credit</label><small>Applied to each supplied guarantor score.</small><div class="unit"><input id="minCredit" type="number" min="300" max="850" step="1" value="'+policy.minCredit+'"><span>score</span></div></div></div><div class="settingnote"><b>Why this matters:</b> the case says the lender revises checklists roughly every quarter and wants to avoid waiting on engineering. In production, these would be versioned policy rules with permissions, effective dates and an audit trail. This prototype stores them locally in the browser.</div><div class="actions"><button class="primary" id="savePolicy">Save & recalculate</button><button class="secondary" id="resetPolicy">Reset to demo defaults</button></div></div></main>';
 document.getElementById('savePolicy').onclick=function(){var n={rentalLtv:Number(document.getElementById('rentalLtv').value),fixFlipLtv:Number(document.getElementById('fixFlipLtv').value),rentalDscr:Number(document.getElementById('rentalDscr').value),minCredit:Number(document.getElementById('minCredit').value)};if(!Object.values(n).every(Number.isFinite)||Object.values(n).some(function(v){return v<0;})){alert('Please enter valid non-negative numbers.');return;}policy=n;persist();location.hash=role;};
 document.getElementById('resetPolicy').onclick=function(){policy=Object.assign({},DEFAULTS);persist();settingsPage();};
}
function actionPage(){
 var p=location.hash.slice(1).split('/'), title=p[1]||'Review finding',name=decodeURIComponent(p[2]||'Finding');
 document.getElementById('app').innerHTML=top(role==='station1'?'Underwriting':'Closing',role==='station1'?'Station 1':'Station 2')+'<main><a class="back" href="#'+role+'">← Back</a><section class="section"><div class="sectionhead"><div><div class="eyebrow">REVIEW FINDING</div><h2>'+name+'</h2><p>Record a reviewer disposition here. The demo does not fabricate evidence or automatically turn review into a pass.</p></div><span class="status wait"><i></i>Open</span></div><div class="notice"><b>Production behavior:</b> an override or exception would capture rationale, reviewer identity and timestamp in the audit trail.</div></section></main>';
}
function render(){
 var r=location.hash.replace('#','');
 if(!r||r==='login'){login();return;}
 if(r==='station1'){role='station1';queue();return;}
 if(r==='station2'){role='station2';queue();return;}
 if(r==='settings'){settingsPage();return;}
 if(r.startsWith('loan/')){var id=r.split('/')[1],L=getLoan(id);if(L){detail(L);}else login();return;}
 if(r.startsWith('action/')){actionPage();return;}
 login();
}
window.addEventListener('hashchange',render);
render();
