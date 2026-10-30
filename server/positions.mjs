import fs from 'node:fs';
const references=JSON.parse(fs.readFileSync(new URL('../data/position_references.json',import.meta.url),'utf8'));
// Editorial index of the existing statements; never a replacement for their wording.
// These headings describe the scope of a response, not a person's school or identity.
const headings = {
 G01:['한 본질·세 위격','한 위격의 세 이름이라는 이해','서로 다른 세 신이라는 이해'],
 G02:['성자의 영원성과 비피조성','성자가 최초 피조물이라는 이해','성부와 성자의 동일한 신성'],
 G03:['성령의 신적 위격','성령을 비인격적 능력으로 이해','성령에 대한 공동 경배'],
 G04:['하나님의 본질적 불변성','하나님의 실제 고통 경험','하나님이 새로운 사실을 배울 가능성'],
 G05:['모든 사건에 미치는 섭리','달리 선택할 수 있는 인간의 자유','모든 사건의 작정과 인간 책임의 양립'],
 G06:['미래 자유 선택에 대한 확실한 예지','가능한 상황의 선택에 대한 지식','자유로운 미래의 열림'],
 H01:['모든 인간의 형상과 존엄','하나님의 형상의 관계적 소명','하나님의 생명에 참여하는 소명'],
 H02:['아담과 연결된 원죄의 죄책','개인 선택 이전의 죄로 기운 본성','조상의 죄책과 죽음·부패의 구별'],
 H03:['선행 은총 없는 믿음의 시작','믿음에 앞서는 은혜의 필요','죄가 구원 응답 능력에 미친 영향'],
 H04:['믿음에 반드시 이르는 효과적 부르심','믿음의 응답을 가능케 하는 선행 은혜','구원의 은혜에 대한 실제 거절 가능성'],
 H05:['그리스도의 의를 믿음으로 받는 칭의','칭의와 내적 변화의 불가분성','구원 공로보다 믿음의 열매로서의 행위'],
 H06:['현세의 온전한 사랑과 정결','평생 지속되는 회개와 성화','하나님과의 연합·신적 생명 참여'],
 C01:['성자의 완전한 신성','예수를 높임 받은 피조물로 이해','예수의 신성을 상징으로만 이해'],
 C02:['이성과 의지를 포함한 온전한 인성','인간 외양만 취했다는 이해','죄 없는 실제 연약함과 고난'],
 C03:['한 위격 안의 혼합·분리 없는 두 본성','성육신한 말씀의 분리 불가능한 통일성','독립된 두 인격이라는 이해'],
 C04:['역사적 동정녀 탄생','동정녀 탄생의 역사적 사실성 불필요','역사 안의 실제 성육신'],
 C05:['형벌대속의 본질적 의미','죄·죽음·악에 대한 그리스도의 승리','사랑의 계시와 인간의 변화'],
 C06:['실제 몸의 부활','부활을 제자들의 경험으로만 이해','부활을 희망의 상징으로만 환원하는 데 반대'],
 P01:['성령의 인격적 인도','성령의 별개 위격 부정','인격성과 거룩하게 하시는 능력'],
 P02:['모든 중생한 신자의 성령 받음','중생 이후 능력을 위한 구별된 성령세례','반복되는 특별한 성령 충만'],
 P03:['방언의 성령세례 최초 외적 증거성','방언 은사의 모든 신자에 대한 비필수성','방언 없이도 가능한 성령 충만'],
 P04:['오늘날 예언·치유·방언 은사의 가능성','일부 특별한 은사의 오늘날 비지속','특별한 은사의 적극적 추구·사용'],
 P05:['개인적 말씀 주장의 성경적 검증','현대 예언의 성경 수정·대체 가능성','영적 경험에 대한 공동체 분별'],
 P06:['사랑과 거룩한 인격의 변화','복음 증거의 담대함과 능력','불의·분열의 치유와 화해'],
 E01:['주교직 연속성의 중요성','사도적 가르침의 보존','교회의 가시적 일치'],
 E02:['주교·감독의 결정 권위','대표 장로들의 공동 치리','지역 교인들의 최종 결정'],
 E03:['유아세례의 허용','신앙고백자에게만 베푸는 세례','침수 방식의 필수성'],
 E04:['은총의 수단으로서의 세례','은총 전달 없는 공적 표지로만 보는 세례','그리스도와의 연합·공동체 소속의 세례'],
 E05:['성찬 요소의 실체변화','기억 이상의 참된 임재','특별한 실제 임재가 필수 아닌 상징적 기념'],
 E06:['말씀과 성례의 교회 표지','상호 책임과 자발적 제자도','정의·화해의 사회적 책임'],
 Z01:['실제 인격적·가시적 재림','미래 사건 아닌 희망의 상징으로 보는 재림','재림 날짜의 확정적 계산'],
 Z02:['마지막 날 몸의 부활','창조 세계의 새로워짐','몸의 부활 없이 영혼 불멸만으로 충분'],
 Z03:['천 년을 현재 교회 시대의 통치로 이해','재림 이후 미래 천년왕국','복음의 역사적 확장 이후 재림'],
 Z04:['큰 환난 이전의 비밀 휴거','환난 이후 그리스도를 맞는 교회','휴거를 별도 은밀한 사건으로 구분하지 않음'],
 Z05:['영원한 의식적 형벌','최후 심판 이후 악인의 소멸','종국의 모든 사람의 실제 구원'],
 Z06:['그리스도 안에서 한 백성으로 성취','민족 이스라엘의 특별한 미래 계획','이스라엘·교회의 시대별 경륜 구별'],
};
const focusIds=['H04','H06','C05','P04','P03','E03','E05','Z03'];
const answered=(answers,id)=>Number.isInteger(answers[id])&&answers[id]>=1&&answers[id]<=5;
const agrees=(answers,id)=>answered(answers,id)&&answers[id]>=4;
const disagrees=(answers,id)=>answered(answers,id)&&answers[id]<=2;
function buildAffinity(answers){
 const affinities=[];
 const add=(label,kind,reason,ids)=>affinities.push({label,kind,reason,itemIds:ids});
 if(agrees(answers,'H06-01')&&agrees(answers,'H06-02')) add('웨슬리안 성결주의적 성화 강조','신학적 경향','현세의 온전한 사랑과 평생 이어지는 성화를 함께 긍정한 응답','H06-01,H06-02'.split(','));
 if(agrees(answers,'H04-02')&&agrees(answers,'H04-03')&&disagrees(answers,'H04-01')) add('알미니안·웨슬리안적 은혜 응답 강조','신학적 경향','선행 은혜와 은혜에 대한 인간의 응답 가능성을 긍정하고, 효과적 부르심의 필연성에는 동의하지 않은 응답','H04-01,H04-02,H04-03'.split(','));
 if(agrees(answers,'H04-01')&&agrees(answers,'H04-02')&&disagrees(answers,'H04-03')) add('개혁파적 효과적 은혜 언어와 접점','신학적 경향','효과적으로 이끄는 은혜와 선행 은혜를 긍정하고 은혜의 거절 가능성에는 비동의한 응답','H04-01,H04-02,H04-03'.split(','));
 if(agrees(answers,'P04-01')&&disagrees(answers,'P04-02')) { add('은사 지속론적 성령론과 접점','신학적 경향','오늘날 특별한 은사의 가능성을 긍정하고 은사의 비지속 진술에 비동의한 응답','P04-01,P04-02'.split(',')); add('하나님의 성회·은사 지속 전통과 접점 후보','교단 전통 후보','은사의 지속 가능성을 인정하는 미국 하나님의 성회 공식 진술과 접점이 있지만, 교단 소속이나 전체 교리 일치를 뜻하지 않는다','P04-01,P04-02'.split(',')); }
 if(disagrees(answers,'P03-01')&&agrees(answers,'P03-02')&&agrees(answers,'P03-03')) add('방언 최초 증거론에는 비동의하는 성령론','신학적 경향','방언을 성령세례의 최초 외적 증거로 보지 않으면서도 은사와 성령 충만의 가능성을 긍정한 응답','P03-01,P03-02,P03-03'.split(','));
 if(agrees(answers,'E03-01')&&!agrees(answers,'E03-02')) { add('유아세례를 긍정하는 교회론','교단 전통 후보','영아에게도 세례를 베풀 수 있다는 진술에 동의하고 신앙고백자에게만 베푼다는 진술에는 동의하지 않은 응답','E03-01,E03-02'.split(',')); add('개혁파·감리교·성공회 계열의 유아세례 전통과 접점 후보','교단 전통 후보','유아세례를 긍정하는 여러 공교회 전통과의 접점 후보이며, 이 문항만으로 교단을 결정하지 않는다','E03-01'.split(',')); }
 if(agrees(answers,'E03-02')&&!agrees(answers,'E03-01')) { add('신앙고백자 세례를 강조하는 교회론','교단 전통 후보','신앙고백자에게 세례를 베푼다는 진술에 동의하고 유아세례 허용에는 동의하지 않은 응답','E03-01,E03-02'.split(',')); add('침례교적 신앙고백자 세례 전통과 접점 후보','교단 전통 후보','신앙고백자의 침례를 강조하는 침례교 공식 문서와 접점 후보이며, 교단 소속이나 전체 교리 일치를 뜻하지 않는다','E03-02'.split(',')); }
 if(agrees(answers,'E05-02')&&disagrees(answers,'E05-03')) { add('성찬의 실제적 임재를 강조하는 성찬론','교단 전통 후보','성찬을 단순한 기억 이상으로 이해하고 상징적 기념만으로 보는 진술에는 비동의한 응답','E05-02,E05-03'.split(',')); add('개혁파·감리교·정교회 성찬 언어와 부분적 접점 후보','교단 전통 후보','실제적 임재를 말하는 전통들과 접점이 있으나 성찬론 전체를 판정하지 않는다','E05-02,E05-03'.split(',')); }
 if(agrees(answers,'Z03-02')&&disagrees(answers,'Z03-01')) add('전천년적 종말론과 접점','신학적 경향','재림 이후 미래 천년왕국에 동의하고 천년을 현재 교회 시대의 상징으로 보는 진술에는 비동의한 응답','Z03-01,Z03-02'.split(','));
 const theologians=[];
 if(agrees(answers,'H06-01')&&agrees(answers,'H06-02')) theologians.push({name:'존 웨슬리',label:'성결·온전한 사랑의 언어와 접점 후보',itemIds:['H06-01','H06-02']});
 if(agrees(answers,'H04-01')&&disagrees(answers,'H04-03')) theologians.push({name:'존 칼뱅',label:'효과적 은혜의 언어와 접점 후보',itemIds:['H04-01','H04-03']});
 return {affinities,theologians};
}
export function buildPositionMap(items, topics, answers) {
 const topicCards=topics.map(topic=>({id:topic.id,domain:topic.domain,name:topic.name,
  entries:items.filter(item=>item.section==='profile'&&item.topic_id===topic.id).map(item=>{
   const answer=answers[item.id];
   const valid=Number.isInteger(answer)&&answer>=1&&answer<=5;
   return {itemId:item.id,label:headings[topic.id]?.[Number(item.id.split('-')[1])-1]||item.statement,statement:item.statement,
    answer:valid?answer:null,state:valid?(answer>=4?'agree':answer<=2?'disagree':'conditional'):
     answer==='unknown'?'unknown':answer==='n/a'?'not_applicable':'unanswered',
    sourceIds:item.source_ids,reviewStatus:item.review_status,evidence:'single_item',reference:references.find(r=>r.itemId===item.id)||null};
  })}));
 const focus=focusIds.map(id=>topicCards.find(t=>t.id===id)).filter(Boolean);
 const highlights=focus.flatMap(t=>t.entries.filter(e=>['agree','disagree'].includes(e.state)).map(e=>({topic:t.name,itemId:e.itemId,label:e.label,state:e.state,answer:e.answer})));
 return {version:'statement-map-1',basis:'현재 응답에 따른 쟁점별 위치 · 단일 문항 기록',topics:topicCards,focusIds,highlights,...buildAffinity(answers)};
}
