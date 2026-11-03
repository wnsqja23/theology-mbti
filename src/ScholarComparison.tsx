export default function ScholarComparison({report}:any){
 const theologians=new Map(report.theologians.map((t:any)=>[t.id,t]));
 const compared=report.scholarComparison.filter((r:any)=>r.status==='partial_affinity').sort((a:any,b:any)=>b.matchingClaimIds.length-a.matchingClaimIds.length);
 const pending=report.theologians.filter((t:any)=>!t.can_auto_rank);
 return <section className="scholar-comparison" aria-labelledby="scholar-comparison-title">
  <p className="eyebrow">PRIMARY-TEXT SCHOLAR COMPARISON</p>
  <h2 id="scholar-comparison-title">원전으로 대조한 신학자 접점</h2>
  <p>각 인물의 확인된 원전 구절 3곳 이상만 현재 응답과 대조합니다. 인물 전체의 사상, 영향 관계 또는 개인의 정체성을 판정하지 않습니다.</p>
  {compared.length>0&&<div className="scholar-grid">{compared.map((result:any,index:number)=>{const scholar:any=theologians.get(result.theologianId);const sourceIds=[...new Set(result.evidence.map((e:any)=>e.source_id))];return <article className={index===0?'closest':''} key={result.theologianId}>
   <div className="comparison-card-top"><span>{index===0?'가장 많은 원전 접점':'부분적 원전 접점'}</span><b>{result.matchingClaimIds.length}/{result.evidence.length} 주장</b></div>
   <h3>{scholar.name_ko}</h3>
   <p>같은 방향 {result.matchingClaimIds.length}개 · 다른 방향 {result.contrastingClaimIds.length}개 · 유보 {result.neutralClaimIds.length}개</p>
   <div className="comparison-bar" aria-label={`${scholar.name_ko}, 같은 방향 ${result.matchingClaimIds.length}개`}><span style={{width:`${result.evidence.length?result.matchingClaimIds.length/result.evidence.length*100:0}%`}}/></div>
   <details><summary>대조한 원전 구절</summary>{result.evidence.map((e:any)=><p key={`${e.source_id}-${e.paragraph}`}><b>{e.paragraph}</b> · {e.relation==='same_direction'?'같은 방향':e.relation==='different_direction'?'다른 방향':'유보'}<br/><small>{report.items.find((item:any)=>item.claim_id===e.claim_id)?.statement}</small></p>)}</details>
   {sourceIds.map((id:any)=>{const source=report.sources.find((s:any)=>s.id===id);return source&&<a key={id} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>})}
  </article>})}</div>}
  <p className="comparison-caveat">접점 수는 확률이나 “그 신학자와 같다”는 점수가 아닙니다. 같은 사람의 저작에서도 주제와 시기에 따라 강조가 달라질 수 있습니다.</p>
  <details className="result-domain"><summary>나머지 신학자 원전 검토 현황</summary>{pending.map((t:any)=><p key={t.id}><b>{t.name_ko}</b> · 보류 — 다음 원전의 정확한 판본과 구절 3곳 이상이 필요합니다: {t.works_to_verify}</p>)}</details>
 </section>;
}
