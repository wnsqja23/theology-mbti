const stateLabels:Record<string,string>={agree:'동의',disagree:'비동의',conditional:'유보·조건부',unknown:'아직 모름',not_applicable:'해당 없음',unanswered:'미응답'};
const degreeLabels=['전혀 동의하지 않는다','동의하지 않는다','유보 또는 조건부 동의','동의한다','매우 동의한다'];
export default function PositionMap({map,sources,domains,move,catalog}:any){
 if(!map)return null;
 const hasAnswers=map.topics.some((t:any)=>t.entries.some((e:any)=>e.answer!==null));
 const entry=(e:any)=><div key={e.itemId} className={'position-entry '+e.state}>
  <div className="position-label"><b>{e.label}</b><span className={'position-state '+e.state}>{stateLabels[e.state]}{e.answer!==null?` · ${e.answer}/5`:''}</span></div>
  <div className="position-scale" role="img" aria-label={`${e.label}: ${e.answer?degreeLabels[e.answer-1]:stateLabels[e.state]}`}>
   {[1,2,3,4,5].map(n=><span key={n} className={e.answer===n?'selected':''}>{e.answer===n?'●':'·'}</span>)}
  </div>
  {e.reference&&<div className="position-reference"><b>{e.reference.title}</b><p>{e.answer===null?'대조할 응답 없음':e.state==='conditional'?'이 진술에 유보·조건부 응답':e.state==='agree'?'관련 문항에 동의한 응답':'관련 문항에 비동의한 응답'} · <a href={e.reference.url} target="_blank" rel="noreferrer">{e.reference.paragraph} ↗</a></p><details><summary>문헌 연결의 범위</summary><p>{e.reference.scope}</p><p>공식 본문 확인: {e.reference.checkedAt} · 의미 연결의 전문가 검토 대기 · 전통 전체의 친연성 등급은 계산하지 않습니다.</p></details></div>}
  <details><summary>문항·응답·출처 확인</summary><p>{e.statement}</p><p>내 응답: {e.answer?degreeLabels[e.answer-1]:stateLabels[e.state]} · 단일 문항 응답</p><p>제목은 원문을 찾기 위한 안내입니다. 한 문항으로 지속적인 관점이나 소속 전통을 확정하지 않습니다.</p>{e.sourceIds.map((id:string)=>{const s=sources.find((s:any)=>s.id===id);return s&&<a key={id} className="source-link" href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a>})}<p>참고 문헌 연결 · 문항 의미의 전문가 검토 대기</p><button onClick={()=>move(catalog.items.findIndex((x:any)=>x.id===e.itemId))}>이 응답 다시 보기</button></details>
 </div>;
 const topic=(t:any)=><article className="position-topic" key={t.id} aria-label={t.name}><p className="eyebrow">{t.domain}</p><h3>{t.name}</h3>{t.entries.map(entry)}</article>;
 return <section className="position-map" aria-labelledby="position-title"><h2 id="position-title">내 신학의 위치, 쟁점별로</h2>
 <p className="position-intro">{hasAnswers?'서로 다른 입장을 함께 지지할 수 있습니다. 아래에는 지금 답한 방향을 그대로 펼쳐 놓았습니다.':'아직 위치를 표시할 응답이 없습니다. 질문에 답하면 쟁점별 입장이 여기에 나타납니다.'}</p>
 {map.highlights.length>0&&<div className="position-overview"><b>현재 응답의 핵심</b><ul>{map.focusIds.map((id:string)=>{const t=map.topics.find((t:any)=>t.id===id);const hs=t.entries;return hs.some((h:any)=>h.state!=='unanswered')&&<li key={id}><span>{t.name}</span><strong>{hs.map((h:any)=>`${h.label}：${stateLabels[h.state]}`).join(' / ')}</strong></li>})}</ul></div>}
 <p className="position-note">동의 강도는 1–5점의 실제 응답입니다. ‘유보·조건부’, ‘아직 모름’, ‘미응답’을 구분합니다. 각 입장은 단일 문항 기록이며, 전통과의 친연성은 문헌과 추가 근거가 확보된 범위에서 해석해야 합니다.</p>
 {map.affinities?.length>0&&<section className="affinity-section" aria-labelledby="affinity-title"><h2 id="affinity-title">응답 패턴으로 본 신학적 친연성</h2><p className="position-intro">아래 표현은 응답한 쟁점의 언어와 비교 전통 사이의 접점입니다. ‘당신은 그 교단/신학자다’라는 판정이나 전체 사상의 일치율이 아닙니다.</p><div className="affinity-grid">{map.affinities.map((a:any)=><article className="affinity-card" key={a.label}><span className="affinity-kind">{a.kind}</span><h3>{a.label}</h3><p>{a.reason}</p><div>{a.itemIds.map((id:string)=><button key={id} onClick={()=>move(catalog.items.findIndex((x:any)=>x.id===id))}>{id} 응답 보기</button>)}</div></article>)}</div>{map.theologians?.length>0&&<><h3>신학자 언어와의 접점 후보</h3><div className="affinity-grid">{map.theologians.map((t:any)=><article className="affinity-card theologian" key={t.name}><span className="affinity-kind">신학자 비교 후보</span><h3>{t.name}</h3><p>{t.label}. 원전 전체 사상과의 동일성을 뜻하지 않습니다.</p>{t.itemIds.map((id:string)=><button key={id} onClick={()=>move(catalog.items.findIndex((x:any)=>x.id===id))}>{id} 근거 보기</button>)}</article>)}</div></>}</section>}
 <h3>핵심 쟁점 8가지</h3><div className="position-grid">{map.focusIds.map((id:string)=>map.topics.find((t:any)=>t.id===id)).filter(Boolean).map(topic)}</div>
 <h3>여섯 영역 전체 지도</h3><div className="position-domains">{domains.map((d:string)=><details key={d}><summary>{d} · 6개 쟁점 펼치기</summary><div className="position-grid">{map.topics.filter((t:any)=>t.domain===d).map(topic)}</div></details>)}</div>
 <details className="position-limits"><summary>교단·신학자와의 관계는 어떻게 읽나요?</summary><p>예를 들어 온전한 사랑과 평생의 성화를 함께 긍정할 수 있고, 은사의 지속을 인정하면서 방언의 최초 증거성에는 반대할 수 있습니다. 이런 쟁점을 따로 읽어야 자신의 위치가 드러납니다.</p><p>현재 자료는 각 주장을 한 문항으로 묻습니다. 교단·신학자 전체의 친연성 순위는 검증된 조항과 독립적인 추가 응답이 부족하여 판정 유보입니다. 아래 ‘전통과 신학자 비교’에서 문헌 검토 상태를 확인할 수 있습니다.</p></details>
 </section>;
}
