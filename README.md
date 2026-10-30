# 신학 mbti 2.0

한국어 React + TypeScript 탐구 웹앱. 기본 120문항, 선택 추가 12문항, 영역·세부 주제 이동, 로컬 저장, JSON 복구, 쟁점별 입장 지도, 주장별 관찰, 신조 조항 대조, 출처 확인, 별도 편집 검토 작업대를 제공합니다.

**실행 가능한 탐구 도구이며, 콘텐츠의 신학·측정학 검증이 완료된 검사는 아닙니다.** 주장당 한 문항인 시드의 한계를 그대로 반영하고, 검수되지 않은 전통 11개와 신학자 10명의 순위는 보류합니다. 정통성·구원·이단 확률을 계산하지 않습니다.

## 실행

이 결과물에는 빌드된 `dist/`도 포함되어 있습니다. 현재 Mac에서는 `실행.command`를 실행하면 설치된 Node 또는 Codex 번들 Node를 찾아 바로 시작합니다.

Node.js 20.19+ (권장 22 이상)와 npm이 필요합니다.

```sh
npm install
npm run dev
```

[로컬 앱](http://127.0.0.1:5173)에서 사용합니다. `dev`는 타입 검사와 빌드 후 로컬 Node 서버를 시작합니다. 소스 수정 후 서버를 다시 시작하면 변경이 반영됩니다. 중지는 `Ctrl+C`입니다. `PORT=5174 npm run dev`처럼 포트를 바꿀 수 있습니다.

이미 빌드했다면:

```sh
npm run build
npm start
```

정확한 의존성 버전을 고정했으며 `pnpm-lock.yaml`도 포함했습니다. pnpm 사용 시 `pnpm install --frozen-lockfile`로 같은 의존성 트리를 설치할 수 있습니다. 앱은 `127.0.0.1`에만 바인딩됩니다. 공개 배포는 수행하지 않았습니다.

## 검증

```sh
npm run check:data
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

설치된 Google Chrome이 있으면 이를 사용하며, 없으면 Playwright Chromium을 사용합니다. Safari 계열 WebKit까지 검사하려면 macOS/Linux에서:

```sh
npx playwright install webkit
INCLUDE_WEBKIT=1 npm run test:browser
```

실행 결과는 [검증 보고서](docs/TEST_RESULTS.md), `artifacts/browser-results.json`, `artifacts/playwright-report/index.html`에서 확인합니다. 실제 스크린샷은 `artifacts/screenshots/`와 `artifacts/browser-results/`에 있습니다. 자동 검증은 사람이 직접 수행하는 스크린리더 사용자 테스트나 전문 신학 검토를 대신하지 않습니다.

이 작업 환경에는 npm 실행 파일이 없어 최초 npm 명령은 실패했습니다. 동일 package.json 스크립트를 Node 24.19의 `node --run check:data`, `node --run test`로 실행했고 pnpm으로 의존성을 설치했습니다. 사용자의 npm 환경에서는 위 명령을 그대로 사용할 수 있습니다.

## 결과 읽기 (2026-10-29 개선)

결과 상단의 ‘현재 응답의 핵심’과 ‘핵심 쟁점 8가지’에서 은혜·성화·속죄·은사·방언·세례·성찬·천년왕국의 응답 방향을 확인합니다. ‘여섯 영역 전체 지도’를 펼치면 36개 쟁점의 108개 진술이 나타납니다. 동의·비동의·조건부·모름·미응답은 별도 표시하며 영역 전체를 평균 내지 않습니다. 각 줄에서 원문·실제 응답·참고 문헌을 확인하고 해당 질문으로 돌아갈 수 있습니다.

제목은 기존 진술의 검색·안내를 위한 편집 표제이며 원문이나 검토 상태를 대체하지 않습니다. 단일 문항 응답을 확정된 학파나 교단으로 판정하지 않습니다. 공식 조항을 다시 확인한 문헌 연결 4건은 `data/position_references.json`에 있으며, 원문 확인과 의미 연결의 전문가 승인을 구분합니다.

## 데이터·해석 경계

- `data/items.json`, `data/conditional_items.json`은 제공된 원본과 SHA-256이 같습니다. 원문, 선택지, 출처, review_status를 수정하지 않았습니다.
- 108개 프로필 문항 + 12개 핵심 문항을 영역 내에 분산합니다. 미응답으로도 이동할 수 있습니다.
- 3은 조건부·유보 응답의 관찰값 0입니다. unknown은 계산에서 제외합니다. skipped/null, n/a도 별도로 보존합니다.
- 기본 문항과 추가 문항은 독립 저장합니다. 추가 문항은 원본 single/multi 설정을 따르며, 정의되지 않은 점수·분기 트리거를 추측해 만들지 않았습니다.
- 전통 비교는 검증된 공통 주장, 최소 8개 관찰, 4영역, 60% 관찰률, 핵심 75% 응답과 독립 증거 요건을 확인합니다. 현재 시드는 승인되지 않아 전부 보류됩니다.
- 신조 대조는 조항이 확인된 범위에서만 후보를 표시합니다. 부분 근거나 상충된 응답, 미확인 출처는 유보합니다. 후보는 확정적 문헌 불일치나 사람에 대한 판정이 아닙니다.
- 18개 출처의 별도 감사와 12개 신조 조항 연결은 [출처 감사](docs/SOURCE_AUDIT.md) 및 `data/source_verification.json`에 있습니다. 원본의 link_checked 메타데이터보다 새 감사의 실제 확인 범위를 우선합니다.
- 후속 검수 쟁점은 [신학자 검토 목록](docs/THEOLOGICAL_REVIEW.md)에 기록했습니다.

## 개인정보·복구

응답은 브라우저 localStorage에 저장됩니다. 분석은 같은 컴퓨터의 Node 서버 메모리에서 수행되며 사용자 응답을 파일·데이터베이스·외부 서비스에 보내거나 보관하지 않습니다. 계정, 광고, 분석 추적, 외부 폰트가 없습니다.

`응답 관리`에서 JSON 저장·불러오기를 사용할 수 있습니다. 불러오기와 새 시작 전에 현재 응답을 별도 보관하며, 손상된 저장본은 덮어쓰지 않고 원본 다운로드를 제공합니다. 기존 `theology-mbti-blind-inline-*` 저장 키는 그대로 두고 검토할 수 있습니다. 옛 0–3 선택지 인덱스와 다른 데이터 버전의 응답은 새 주장에 이식하지 않습니다. 원본과 마이그레이션 표를 남기고 재응답을 받습니다.

브라우저 저장소는 브라우저 설정으로 지워질 수 있으므로 중요한 응답은 JSON으로 별도 보관하세요. 마스킹 요약에는 응답 수만 들어가며 개별 문항·교리·신조·전통 비교 내용은 빠집니다. JSON 복구 파일에는 민감한 신앙 정보가 들어갑니다.

## 편집과 구조

[편집 검토 작업대](http://127.0.0.1:5173/editor)는 질문 화면과 별도 경로이며, 원본과 메타데이터를 조회하고 수정 제안·근거·6종 태그·편향 점검을 별도 저장합니다. 제안은 문항 데이터에 자동 적용되지 않습니다.

- `src/App.tsx`, `src/style.css`: 소개·질문·저장 UI
- `src/Results.tsx`, `src/Sources.tsx`: 요청 시 별도 로드하는 결과·자료 화면
- `src/Editor.tsx`: 별도 로드되는 편집 검토 작업대
- `src/lib/assessment.mjs`: 순수 평가 함수와 자료 충분성 조건
- `src/lib/persistence.mjs`: 버전·복구·마이그레이션 형식
- `server/data.mjs`: 공개 문항 필드만 투영; 분석 메타데이터는 서버에 유지
- `server/positions.mjs`, `src/PositionMap.tsx`: 서버에서 구성하는 쟁점별 입장 지도와 결과 표시
- `server/report.mjs`: 출처 범위 확인과 결과 구성
- `server/index.mjs`: 로컬 API 및 빌드 파일 제공; `/data`, `/src`, `/server` 직접 접근 차단
- `scripts/validate-data.mjs`: 참조·구조 검증
- `tests/`: 원문 보존·계산·복구·실제 브라우저 수용 테스트

초기 요청은 `AGENTS.md`, `CODEX_TASK.md`와 `docs/01`–`11`에 보존되어 있습니다. 다운로드 원본과 프로젝트의 읽기 전용 `sources/`는 변경하지 않았습니다.
