const reasonLabels:Record<string,string>={
  unverified_primary_sources_or_clauses:'공식 문서의 조항 검증이 부족합니다.',
  fewer_than_two_verified_profiles:'같은 문항으로 비교할 수 있는 전통이 둘 이상 필요합니다.',
  fewer_than_eight_observed_common_claims:'응답한 공통 비교 문항이 8개 미만입니다.',
  fewer_than_four_domains:'응답한 공통 비교 영역이 4개 미만입니다.',
  coverage_below_60_percent:'공통 비교 문항의 응답률이 60% 미만입니다.',
  creedal_coverage_below_75_percent:'공교회 핵심 문항 응답률이 75% 미만입니다.',
};

export default function TraditionComparison({report}:any){
 const comparison=report.comparison;
 const traditions=new Map(report.traditions.map((t:any)=>[t.id,t]));
 const verified=comparison.results.filter((r:any)=>r.status==='exploratory');
 const sourceFor=(tradition:any)=>report.sources.find((s:any)=>s.id===tradition.primary_source_id);
 return <section className="verified-comparison" aria-labelledby="verified-comparison-title">
  <p className="eyebrow">DOCUMENT-CHECKED COMPARISON</p>
  <h2 id="verified-comparison-title">공식 문헌으로 대조한 전통 친연성</h2>
  {comparison.status==='withheld'?<div className="comparison-withheld"><b>아직 비교 조건이 부족합니다.</b><ul>{comparison.reasons.map((r:string)=><li key={r}>{reasonLabels[r]||r}</li>)}</ul></div>:<>
   <p>같은 {comparison.commonClaimIds.length}개 주장과 {comparison.domainCount}개 영역을 기준으로 비교했습니다. 숫자는 확률이 아니라 문헌상 입장과 같은 방향으로 답한 주장 수입니다.</p>
   <div className="verified-comparison-grid">{verified.sort((a:any,b:any)=>b.matchingClaimIds.length-a.matchingClaimIds.length).map((result:any,index:number)=>{const tradition:any=traditions.get(result.traditionId);const source=sourceFor(tradition);return <article className={index===0?'closest':''} key={result.traditionId}>
    <div className="comparison-card-top"><span>{index===0?'가장 많은 접점':'비교 전통'}</span><b>{result.matchingClaimIds.length}/{result.used} 주장</b></div>
    <h3>{tradition.name}</h3>
    <p>같은 방향 {result.matchingClaimIds.length}개 · 다른 방향 {result.contrastingClaimIds.length}개 · 유보 {result.neutralClaimIds.length}개</p>
    <div className="comparison-bar" aria-label={`${tradition.name}, 같은 방향 ${result.matchingClaimIds.length}개`}><span style={{width:`${result.used?result.matchingClaimIds.length/result.used*100:0}%`}}/></div>
    {source&&<a href={source.url} target="_blank" rel="noreferrer">{source.title} 원문 ↗</a>}
   </article>})}</div>
   <p className="comparison-caveat">이 결과는 단일 문항 관찰을 공식 문헌의 확인된 조항과 대조한 탐색적 친연성입니다. “당신은 그 전통이다”라는 소속 판정이 아니며, 상위 두 전통의 차이가 작으면 복합적 프로필로 읽어야 합니다.</p>
  </>}
  <details className="result-domain"><summary>아직 조항 검토 중인 전통</summary>{report.traditions.filter((t:any)=>t.status!=='approved_clause_level').map((t:any)=><p key={t.id}><b>{t.name}</b> · 보류 — 공식 원문 조항별 연결을 계속 검토 중입니다.</p>)}</details>
 </section>;
}
