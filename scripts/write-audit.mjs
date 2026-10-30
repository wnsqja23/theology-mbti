// Reproducible transcription of the source inspection dated 2026-10-20.
// This file does not fetch sources or imply a fresh verification when rerun.
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=n=>JSON.parse(fs.readFileSync(`data/${n}.json`,'utf8'));
const original=read('sources'),items=read('items');
const byId=Object.fromEntries(original.map(s=>[s.id,s]));
const lima='https://www.oikoumene.org/resources/documents/the-eucharistic-liturgy-of-lima';
const order='https://www.oikoumene.org/resources/documents/order-of-worship';
const clause=(paragraph,ids=[],relation='context',caveat='문서 확인이며 문항·전통 매핑의 전문 검수 승인은 아님.')=>({paragraph,item_ids:ids,claim_ids:ids.map(id=>items.find(i=>i.id===id)?.claim_id).filter(Boolean),relation,caveat});
const entry=(id,status,clauses,caveat,url)=>({source_id:id,status,url:byId[id].url,verified_url:url||byId[id].url,issuing_body:byId[id].issuer,title:byId[id].title,edition_listed:byId[id].edition,verified_at:'2026-10-20',reviewer:'AI-assisted documentary audit; no human expert sign-off',primary_or_secondary:byId[id].type==='teaching'?'official_teaching':byId[id].type==='assessment_standard'?'assessment_guidance':'primary_text_or_official_reproduction',clauses,caveat});
const sources=[
entry('NICENE381','verified_clause',[clause('Lima §15 — Son',['K03','K05'],'supports'),clause('Lima §15 — Spirit',['K04'],'supports'),clause('Lima §15 — death, resurrection, return',['K08','K10'],'supports'),clause('Lima §15 — resurrection of the dead',['K11'],'supports'),clause('Order of Worship IV — church',['K12'],'supports')],'2025 문서 소개와 별도 WCC 공식 예전의 신조 재현을 대조했다. Lima 웹판 교회 문장에 one이 빠져 K12는 Order of Worship IV로 확인한다. 381 원어 비평판 검증과 다르다.',lima),
entry('CHALCEDON451','verified_clause',[clause('CCC §467',['K06','K07','C03-01'],'supports')],'공식 가톨릭 교리서에 인용된 451 정의이다. 후대 교리서 해설과 정의 자체를 구분한다. C02-01의 의지 관련 언어는 추가 조항 검토가 필요하다.'),
entry('CCC_TRINITY','verified_clause',[clause('CCC §§253–255',['K01','K02','G01-01'],'supports'),clause('CCC §254',['G01-02'],'opposes'),clause('CCC §253',['G01-03'],'opposes')],'삼위의 일체성과 실제 구별을 설명하는 가톨릭 공식 해설이다. 381 신조의 직접 문구와 동일시하지 않는다.'),
entry('WCF','verified_clause',[clause('Chapter 3 §1',['G05-03'],'supports'),clause('Chapter 28 §4',['E03-01'],'supports'),clause('Chapter 28 §§5–6',['E04-01'],'context','세례와 구원을 기계적으로 동일시하지 않는 문맥을 함께 읽는다.')],'WTS가 제공하는 신앙고백 원문이다. 특정 현대 교단의 채택 범위와 수정판까지 입증하지 않으며 기존 9개 stance는 승인하지 않았다.'),
entry('METHODIST_ART','verified_clause',[clause('Article II',['C01-01','C02-01'],'context'),clause('Article III',['K09','C06-01'],'supports','몸의 부활은 명시되지만 이 조항은 감리교 문서이며 381 신조 문장 자체가 아니다.')],'공식 UMC 종교조항에서 신성과 인성 및 몸의 부활을 확인했다. 다른 감리교·한국 교단의 공식 입장 전체로 확대하지 않는다.'),
entry('NAZ_ART','verified_clause',[clause('Christian Holiness and Entire Sanctification, §10 and §10.1',['H06-01'],'supports'),clause('§10.1',['H06-02'],'partial','계속 성장한다는 내용과 평생 죄와의 싸움이라는 문항 전체는 동치가 아니다.')],'온전한 사랑과 지속적인 성장은 함께 제시된다. 2023이라는 시드 판본과 현재 웹 본문 판본의 일치 및 한국 성결교 공식 문서 여부는 별도 검토 대상이다.'),
entry('BAPTIST_BFM','verified_clause',[clause('Article VII',['E03-02','E03-03'],'supports'),clause('Article VI',[],'context')],'현재 BF&M 2000 페이지는 제 VI조가 2023-06-14 개정되었다고 표시한다. 시드의 2000 판본 표기만으로 원형과 동일하다고 가정하지 않는다.'),
entry('AG_SFT','verified_clause',[clause('Article 7',['P02-02'],'supports'),clause('Article 8',['P03-01'],'supports')],'중생 이후의 구별된 경험과 방언 최초 증거를 별개 조항으로 확인했다. 최초 증거와 은사로서 방언의 용도 구분을 보존한다.'),
entry('OCA_TRINITY','verified_document',[],'해당 URL은 삼위일체 장의 도입이다. 연결된 성찬·교회론·신적 고난 등의 구체 주장 근거로 사용하기에는 조항 확인이 부족하다.'),
entry('OCA_THEOSIS','verified_clause',[clause('The Holy Trinity in Christian Life — final two paragraphs',['H01-03','H06-03'],'supports')],'은혜로 신적 생명에 참여하는 설명은 확인했다. 이 페이지가 H02의 원죄 모델 또는 C05의 각 속죄 모델을 입증하지는 않는다.'),
entry('LUTHER_BOC','verified_document',[],'원문 모음의 목차 접근만 확인했다. 개별 신앙고백·조항 및 제공 사이트의 출판 권위는 추가 검수해야 한다.'),
entry('APA_STANDARDS','verified_document',[],'2014 Standards와 개정 작업을 안내하는 공식 소개를 확인했다. 이 앱의 타당도·신뢰도가 검증되었다는 근거가 아니다.'),
entry('ITC_TECH','verified_document',[],'원래 page/16 본문은 추출되지 않았다. 공식 2025-07 v1.1 PDF의 표지·서문·판본을 확인했으며 개별 수용 기준 인증은 수행하지 않았다.','https://www.intestcom.org/upload/media-library/tba-guidelines-ver-11-july-2025-1754044782Z3vV9.pdf'),
entry('ITC_USE','verified_document',[],'원래 page/15 본문은 추출되지 않았다. 공식 Guidelines on Test Use v1.2 PDF를 대체 자료로 확인했다.','https://www.intestcom.org/files/guideline_test_use.pdf'),
entry('ANGLICAN_39','unresolved',[],'직접 접근에서 오류가 발생했다. 이 실행에서는 조항 검증 완료로 처리하지 않는다.'),
entry('CCC_EUCHARIST','verified_clause',[clause('Compendium §283 (references CCC §§1376–1377)',['E05-01'],'supports')],'요약 교리서 283의 실체변화 설명을 확인했다. 참조된 CCC 1376–1377의 본문을 별도로 확인한 것으로 표시하지 않는다.'),
entry('CCC_BAPTISM','verified_clause',[clause('CCC §1250',['E03-01'],'supports')],'유아세례 조항을 확인했다. 이 확인은 모든 세례 질문이나 가톨릭 전통 매핑 전체의 승인이 아니다.'),
entry('OCA_EUCHARIST','verified_document',[],'공식 Holy Eucharist 본문 접근은 확인했다. 서방의 실체변화/상징 분류에 직접 환원하는 조항 매핑은 보류한다.')
];
const ce=(item_id,source_id,paragraph,explanation,options={})=>({item_id,source_id,paragraph,url:byId[source_id].url,status:'verified_clause',supports_full_statement:true,explanation,historical_nuance:'문서 대조이며 개인의 신앙·정체성에 대한 판정이 아니다.',...options});
const creedal_evidence=[
ce('K01','CCC_TRINITY','§§253–255','한 신성과 위격의 실제 구별을 설명한다.',{historical_nuance:'니케아 전통을 설명하는 후대 가톨릭 해설이다. 381 신조의 직접 문구와 구별한다.'}),
ce('K02','CCC_TRINITY','§253','세 신이 아닌 하나님의 일체성을 설명한다.'),
ce('K03','NICENE381','Lima §15 — Son','성자의 영원성·비피조성을 고백한다.',{url:lima}),
ce('K04','NICENE381','Lima §15 — Holy Spirit','성령의 주되심과 공동 경배를 고백한다.',{url:lima}),
ce('K05','NICENE381','Lima §15 — Son','성자의 참된 신성과 성부와의 동일 본질을 고백한다.',{url:lima}),
ce('K06','CHALCEDON451','CCC §467','그리스도의 온전한 인간 본성을 고백한다.',{historical_nuance:'칼케돈 정의 인용의 문맥을 유지한다. C02-01의 이성과 의지 전체를 이 조항 하나로 검증했다고 주장하지 않는다.'}),
ce('K07','CHALCEDON451','CCC §467','한 위격 안의 완전한 신성과 인성을 고백한다.',{historical_nuance:'오리엔트 정교회의 미아피시스 언어를 단순히 인성 부정으로 간주하지 않는다. 공동 성명과 역사적 수용 차이의 전문가 검토가 필요하다.'}),
ce('K08','NICENE381','Lima §15 — passion and resurrection','죽음과 부활을 함께 고백한다.',{url:lima,historical_nuance:'C06-01은 부활만 지지하는 부분 근거여서 K08 전체의 독립 교차확인으로 쓰지 않는다.'}),
ce('K09','NICENE381','Lima §15 — resurrection','부활 고백을 확인했다. 이 문장에는 몸이라는 표현이 직접 나오지 않는다.',{url:lima,supports_full_statement:false,historical_nuance:'몸의 부활 해석은 UMC 종교조항 III에서 명시적으로 확인된다. 해당 교단 문서와 381 신조 원문을 구별하며 신조 전체 문항 대조는 유보한다.',supplemental_sources:[{source_id:'METHODIST_ART',paragraph:'Article III',url:byId.METHODIST_ART.url}]}),
ce('K10','NICENE381','Lima §15 — return in glory','영광 가운데의 재림을 고백한다.',{url:lima}),
ce('K11','NICENE381','Lima §15 — resurrection of the dead','죽은 이들의 부활에 대한 소망을 고백한다.',{url:lima}),
ce('K12','NICENE381','Order of Worship IV — Confession of Faith','교회의 네 표지를 함께 고백한다.',{url:order,historical_nuance:'Lima 웹판에서는 one이 누락되어 완전한 네 표지가 있는 WCC 별도 예전으로 대조했다. 구성요소 문항만으로 전체 고백을 교차확인하지 않는다.'})
];
const hashes=Object.fromEntries(['items','conditional_items'].map(n=>[`${n}.json`,crypto.createHash('sha256').update(fs.readFileSync(`data/${n}.json`)).digest('hex')]));
const result={version:'1.0',verified_at:'2026-10-20',methodology:'공식 웹 문서·공식 재현 원전의 본문 및 식별 조항을 사람이 읽을 수 있는 웹 도구로 확인. AI 보조 문헌 감사이며 신학 전문가 승인·측정학 검증 아님. 시드 파일은 변경하지 않음.',sources,creedal_evidence,seed_sha256:hashes,findings:['108개 프로필 claim은 각각 단일 문항이다.','11개 전통 모두 비승인, 10명 신학자 모두 원전 검수 대기이다.','모든 claim_links는 provisional_semantic_link 상태이다.','분기 질문은 semantic trigger 조건이 없어 점수에 합산하지 않고 선택 탐구로만 제공한다.','창조 고백은 설계 설명에 있으나 실제 K01–K12에는 독립 창조 문항이 없다. 문항 추가는 편집 승인 필요.']};
fs.writeFileSync('data/source_verification.json',JSON.stringify(result,null,2)+'\n');
