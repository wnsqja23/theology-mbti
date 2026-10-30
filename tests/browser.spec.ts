import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const STORAGE_KEY = 'theology-mbti-2.responses.v2';
const CHOICES = [
  '전혀 동의하지 않는다',
  '동의하지 않는다',
  '유보 또는 조건부 동의',
  '동의한다',
  '매우 동의한다',
  '아직 배우지 않아 모르겠다',
];
const PRIVATE_FIELDS = [
  'stance_label', 'tradition_name', 'heretic', 'claim_id', 'source_ids',
  'creedal_claim', 'reverse', 'review_status', 'can_auto_rank',
];

type PublicItem = { id: string; statement: string; topic_id?: string };
type Snapshot = {
  schemaVersion: number;
  dataVersion: string;
  answers: Record<string, number | string | null>;
  conditionalAnswers: Record<string, string[] | string>;
  currentItemId: string | null;
  legacy_response?: unknown;
};

async function questions(page: Page): Promise<PublicItem[]> {
  const response = await page.request.get('/api/questions');
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.items;
}

async function begin(page: Page) {
  await page.goto('/');
  const start = page.getByRole('button', { name: '시작하기', exact: true });
  if (await start.isVisible()) await start.click();
  else await page.getByRole('button', { name: '질문', exact: true }).click();
  await expect(page.locator('#question-heading')).toBeVisible();
}

async function snapshot(page: Page): Promise<Snapshot | null> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), STORAGE_KEY);
}

async function openStorage(page: Page) {
  await page.getByRole('button', { name: '응답 관리', exact: true }).click();
}

async function importJson(page: Page, value: unknown, name = 'responses.json') {
  const input = page.locator('input[type=file]');
  await input.setInputFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)),
  });
}

/** Evaluate rendered text, including transparent backgrounds and nested labels. */
async function contrastReport(page: Page, allText=false) {
  return page.evaluate((allText) => {
    type Color = [number, number, number, number];
    const parse = (value: string): Color => {
      const nums = value.match(/[\d.]+/g)?.map(Number) || [];
      return [nums[0] || 0, nums[1] || 0, nums[2] || 0, nums[3] ?? 1];
    };
    const over = (top: Color, bottom: Color): Color => {
      const alpha = top[3] + bottom[3] * (1 - top[3]);
      return [
        (top[0] * top[3] + bottom[0] * bottom[3] * (1 - top[3])) / alpha,
        (top[1] * top[3] + bottom[1] * bottom[3] * (1 - top[3])) / alpha,
        (top[2] * top[3] + bottom[2] * bottom[3] * (1 - top[3])) / alpha,
        alpha,
      ];
    };
    const luminance = (color: Color) => {
      const linear = color.slice(0, 3).map(channel => {
        const s = channel / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const background = (element: Element): Color => {
      const ancestors: Element[] = [];
      for (let node: Element | null = element; node; node = node.parentElement) ancestors.unshift(node);
      return ancestors.reduce<Color>(
        (color, node) => over(parse(getComputedStyle(node).backgroundColor), color),
        [255, 255, 255, 1],
      );
    };
    const scopes = allText?[document.body]:[...document.querySelectorAll('#question-heading, label:has(input[type="radio"]), label:has(input[type="checkbox"])')];
    const rows: { text: string; color: string; background: string; ratio: number; luminance: number }[] = [];
    for (const scope of scopes) {
      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
      let text: Node | null;
      while ((text = walker.nextNode())) {
        const element = text.parentElement!;
        if (!text.textContent?.trim() || !element.getClientRects().length) continue;
        const style = getComputedStyle(element);
        const bg = background(element);
        const fg = over(parse(style.color), bg);
        const a = luminance(fg);
        const b = luminance(bg);
        rows.push({
          text: text.textContent.trim(),
          color: style.color,
          background: bg.join(','),
          ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
          luminance: a,
        });
      }
    }
    return { colorScheme: getComputedStyle(document.documentElement).colorScheme, rows };
  }, allText);
}

async function assertReadable(page: Page) {
  const report = await contrastReport(page);
  expect(report.colorScheme).toBe('light');
  expect(report.rows.length).toBeGreaterThanOrEqual(7);
  for (const row of report.rows) {
    expect(row.ratio, `${row.text}: ${row.color} on ${row.background}`).toBeGreaterThanOrEqual(4.5);
    expect(row.luminance, `밝은 글자가 사용됨: ${row.text}`).toBeLessThan(0.22);
  }
  return report;
}

async function assertNoHorizontalScroll(page: Page) {
  const widths = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport);
  const next = page.getByRole('button', { name: '다음 문항', exact: true });
  await expect(next).toBeEnabled();
  await next.scrollIntoViewIfNeeded();
  const rect = await next.boundingBox();
  expect(rect).not.toBeNull();
  expect(rect!.x).toBeGreaterThanOrEqual(0);
  expect(rect!.x + rect!.width).toBeLessThanOrEqual(widths.viewport);
}

test('blind question API, loaded scripts, and rendered DOM reveal no analysis metadata', async ({ page }) => {
  const loadedScripts: Promise<string>[] = [];
  page.on('response', response => {
    if (response.request().resourceType() === 'script') {
      loadedScripts.push(response.text().catch(() => ''));
    }
  });
  await begin(page);
  const response = await page.request.get('/api/questions');
  const raw = await response.text();
  const body = JSON.parse(raw);
  expect(body.items).toHaveLength(120);
  expect(new Set(body.items.map((item: PublicItem) => item.id)).size).toBe(120);
  const authored = JSON.parse(await readFile(new URL('../data/items.json', import.meta.url), 'utf8'));
  const sourceStatements = new Map(authored.map((item: PublicItem) => [item.id, item.statement]));
  for (const item of body.items as PublicItem[]) {
    expect(item.statement, `문항 ${item.id}의 원문이 변경되었습니다`).toBe(sourceStatements.get(item.id));
  }
  const authoredExtras = JSON.parse(await readFile(new URL('../data/conditional_items.json', import.meta.url), 'utf8'));
  expect(body.extras).toHaveLength(12);
  for (const extra of body.extras) {
    const source = authoredExtras.find((entry: { id: string }) => entry.id === extra.id);
    expect(extra.prompt).toBe(source.prompt);
    expect(extra.choices).toEqual(source.choices);
  }
  const dom = await page.locator('body').innerHTML();
  const code = (await Promise.all(loadedScripts)).join('\n');
  for (const field of PRIVATE_FIELDS) {
    expect(raw, `API includes ${field}`).not.toContain(`"${field}"`);
    expect(dom, `DOM includes ${field}`).not.toContain(field);
    expect(new RegExp(`\\b${field}\\b`).test(code), `Question scripts include metadata identifier ${field}`).toBe(false);
  }
  for (const name of ['아우구스티누스', '토마스 아퀴나스', '마르틴 루터', '장 칼뱅', '존 웨슬리']) {
    expect(raw).not.toContain(name);
    expect(dom).not.toContain(name);
    expect(code).not.toContain(name);
  }
  for (const path of ['/data/items.json', '/data/traditions.json', '/data/theologians.json']) {
    const privateResponse = await page.request.get(path);
    expect(privateResponse.status(), `${path} is publicly accessible`).toBeGreaterThanOrEqual(400);
  }
});

test('all 120 original statements can be traversed by keyboard, including the final result', async ({ page }, testInfo) => {
  await begin(page);
  const items = await questions(page);
  expect(items).toHaveLength(120);
  const reports = [];
  for (let index = 0; index < items.length; index++) {
    await expect(page.locator('#question-heading')).toHaveText(items[index].statement);
    for (const label of CHOICES) {
      await expect(page.getByRole('radio', { name: label, exact: true })).toBeVisible();
    }
    reports.push({ id: items[index].id, ...(await assertReadable(page)) });
    const selected = page.getByRole('radio', { name: CHOICES[index % CHOICES.length], exact: true });
    await selected.focus();
    await page.keyboard.press('Space');
    await expect(selected).toBeChecked();
    await assertReadable(page);
    if (index < items.length - 1) {
      await page.getByRole('button', { name: '다음 문항', exact: true }).focus();
      await page.keyboard.press('Enter');
    }
  }
  expect(Object.keys((await snapshot(page))!.answers)).toHaveLength(120);
  await testInfo.attach('all-120-contrast.json', {
    body: JSON.stringify(reports, null, 2),
    contentType: 'application/json',
  });
  await page.getByRole('button', { name: '결과', exact: true }).click();
  await expect(page.getByRole('heading', { name: '내 신학의 위치, 쟁점별로' })).toBeVisible();
  await expect(page.locator('.position-map > .position-grid > article')).toHaveCount(8);
  await expect(page.locator('.creed-row')).toHaveCount(12);
  await expect(page.locator('body')).not.toContainText(/당신은.{0,12}이단|이단 위험|구원 확률|정통성 점수/);
  await page.mouse.move(0,0); await page.evaluate(()=>scrollTo(0,0));
        await page.screenshot({ path: testInfo.outputPath('results-desktop.png'), fullPage: true });
});

for (const viewport of [{ width: 1440, height: 1000 }, { width: 375, height: 812 }, { width: 320, height: 740 }]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`${viewport.width}px OS ${colorScheme}`, () => {
      test.use({ viewport, colorScheme });
      test('light theme and dark text remain accessible before and after a selection', async ({ page }, testInfo) => {
        await begin(page);
        await assertNoHorizontalScroll(page);
        const unselected = await assertReadable(page);
        await page.mouse.move(0,0); await page.evaluate(()=>scrollTo(0,0));
        await page.screenshot({ path: testInfo.outputPath(`questions-${viewport.width}-${colorScheme}-unselected.png`), fullPage: true });
        await page.getByRole('radio', { name: '동의한다', exact: true }).check();
        await assertNoHorizontalScroll(page);
        const selected = await assertReadable(page);
        await page.mouse.move(0,0); await page.evaluate(()=>scrollTo(0,0));
        await page.screenshot({ path: testInfo.outputPath(`questions-${viewport.width}-${colorScheme}-selected.png`), fullPage: true });
        await testInfo.attach('contrast.json', {
          body: JSON.stringify({ unselected, selected }, null, 2),
          contentType: 'application/json',
        });
        await page.getByRole('button', { name: '다음 문항', exact: true }).click();
        await expect(page.getByRole('button', { name: '이전 문항', exact: true })).toBeEnabled();
      });
    });
  }
}

test('unknown and conditional agreement remain distinct after restart and answer changes', async ({ page }) => {
  await begin(page);
  const items = await questions(page);
  await page.getByRole('radio', { name: '아직 배우지 않아 모르겠다', exact: true }).check();
  await page.getByRole('button', { name: '다음 문항', exact: true }).click();
  await page.getByRole('radio', { name: '유보 또는 조건부 동의', exact: true }).check();
  await expect.poll(async () => (await snapshot(page))?.answers[items[0].id]).toBe('unknown');
  await expect.poll(async () => (await snapshot(page))?.answers[items[1].id]).toBe(3);
  await page.reload();
  await page.getByRole('button', { name: '질문', exact: true }).click();
  await expect(page.locator('#question-heading')).toHaveText(items[1].statement);
  await expect(page.getByRole('radio', { name: '유보 또는 조건부 동의', exact: true })).toBeChecked();
  await page.getByRole('button', { name: '이전 문항', exact: true }).click();
  await expect(page.getByRole('radio', { name: '아직 배우지 않아 모르겠다', exact: true })).toBeChecked();
  await page.getByRole('radio', { name: '매우 동의한다', exact: true }).check();
  await expect.poll(async () => (await snapshot(page))?.answers[items[0].id]).toBe(5);
  const select = page.getByRole('combobox', { name: '세부 주제 이동' });
  expect(await select.locator('option').count()).toBeGreaterThanOrEqual(36);
  await select.selectOption({ index: 10 });
  await expect(page.locator('#question-heading')).not.toHaveText(items[0].statement);
});

test('JSON export/import restores answers atomically; malformed import preserves current work', async ({ page }) => {
  await begin(page);
  const items = await questions(page);
  await page.getByRole('radio', { name: '매우 동의한다', exact: true }).check();
  await openStorage(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON 저장', exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const exported = JSON.parse(await readFile(path!, 'utf8'));
  expect(exported.schemaVersion).toBe(2);
  expect(exported.answers[items[0].id]).toBe(5);
  exported.answers[items[0].id] = 2;
  await importJson(page, exported);
  await page.getByRole('button',{name:'보관 후 불러오기',exact:true}).click();
  await expect.poll(async () => (await snapshot(page))?.answers[items[0].id]).toBe(2);
  const saved = await snapshot(page);
  await importJson(page, '{"schemaVersion":', 'malformed.json');
  await expect(page.getByRole('alert')).toBeVisible();
  expect(await snapshot(page)).toEqual(saved);
  await importJson(page, { ...exported, answers: { [items[0].id]: 77 } }, 'invalid-answer.json');
  await expect(page.getByRole('alert')).toBeVisible();
  expect(await snapshot(page)).toEqual(saved);
});

test('legacy 0–3 answer indices stay in a preview and never become new Likert answers', async ({ page }) => {
  await begin(page);
  await openStorage(page);
  const legacy = { answers: { foreknowledge_0: 0, foreknowledge_1: 3 }, version: 1 };
  await importJson(page, legacy, 'legacy-v1.json');
  await expect(page.getByText(/재응답 필요/).first()).toBeVisible();
  await page.getByRole('button',{name:'보관 후 불러오기',exact:true}).click();
  await expect.poll(async () => (await snapshot(page))?.legacy_response).toEqual(legacy);
  expect((await snapshot(page))?.answers).toEqual({});
  expect((await snapshot(page))?.legacy_response).toEqual(legacy);
});

test('optional questions preserve multi-select answers without changing source text', async ({ page }) => {
  await begin(page);
  await page.getByRole('button', { name: '결과', exact: true }).click();
  await page.getByRole('button', { name: '추가 질문', exact: true }).click();
  for(let i=0;i<4;i++)await page.getByRole('button',{name:'다음 추가 질문',exact:true}).click();
  const first = page.getByRole('checkbox', { name: '예수는 죄인이 받을 형벌을 대신 담당하셨다.', exact: true });
  const second = page.getByRole('checkbox', { name: '예수는 죄와 사망과 악의 권세를 이기셨다.', exact: true });
  await first.check();
  await second.check();
  await expect(first).toBeChecked();
  await expect(second).toBeChecked();
  await expect.poll(async () => (await snapshot(page))?.conditionalAnswers.F05).toEqual(['F05-1', 'F05-3']);
  await page.reload();
  await page.getByRole('button', { name: '결과', exact: true }).click();
  await page.getByRole('button', { name: '추가 질문', exact: true }).click();
  for(let i=0;i<4;i++)await page.getByRole('button',{name:'다음 추가 질문',exact:true}).click();
  await expect(first).toBeChecked();
  await expect(second).toBeChecked();
});

test('intro, sources, result provenance and isolated editor can be inspected',async({page},testInfo)=>{
 await page.goto('/');await expect(page.getByRole('button',{name:'시작하기',exact:true})).toBeVisible();
 await page.screenshot({path:`artifacts/screenshots/intro-${testInfo.project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'자료와 한계',exact:true}).click();
 await expect(page.getByRole('heading',{name:'출처 검토 기록'})).toBeVisible();
 await expect(page.locator('.source-card')).toHaveCount(18);
 await page.getByRole('button',{name:'결과',exact:true}).click();
 await expect(page.locator('.creed-row')).toHaveCount(12);
 await expect(page.locator('.comparison-grid article')).toHaveCount(11);
 await page.screenshot({path:`artifacts/screenshots/results-${testInfo.project.name}.png`,fullPage:true});
 await page.goto('/editor');await expect(page.getByRole('heading',{name:'원문을 보존하는 검토.'})).toBeVisible();
 await page.getByLabel('신학적·측정학적 검토 의견').fill('검토 테스트: 원문은 그대로 보존');
 await page.reload();await expect(page.getByLabel('신학적·측정학적 검토 의견')).toHaveValue('검토 테스트: 원문은 그대로 보존');
 const q=await page.request.get('/api/questions');expect((await q.json()).items[0].statement).toBe('하나님은 본질상 한 분이시면서 성부·성자·성령의 세 위격으로 영원히 존재하신다.');
 await page.screenshot({path:`artifacts/screenshots/editor-${testInfo.project.name}.png`,fullPage:true});
});

test('corrupt local data is preserved rather than silently overwritten',async({page})=>{
 await page.addInitScript(key=>localStorage.setItem(key,'{broken-original'),STORAGE_KEY);
 await begin(page);await page.getByRole('radio',{name:'매우 동의한다',exact:true}).check();
 expect(await page.evaluate(key=>localStorage.getItem(key),STORAGE_KEY)).toBe('{broken-original');
 await expect(page.getByRole('alert')).toContainText('자동 저장을 멈췄습니다');
 await openStorage(page);await expect(page.getByRole('button',{name:'복구 원본 저장'})).toBeVisible();
});

test('clearing optional answers remains importable and results stay usable',async({page})=>{
 await begin(page);await page.getByRole('button',{name:'결과',exact:true}).click();await page.getByRole('button',{name:'추가 질문',exact:true}).click();
 await page.getByRole('radio',{name:'하나의 신적 본질 안에 실제로 구별되는 성부·성자·성령이 계신다.',exact:true}).check();
 await page.getByRole('button',{name:'선택 지우기',exact:true}).click();
 await page.getByRole('button',{name:'결과로 돌아가기',exact:true}).click();await expect(page.locator('.creed-row')).toHaveCount(12);
 await expect(page.getByRole('alert')).toHaveCount(0);
});

test('API validates submissions and source gating without saving responses',async({request})=>{
 const bad=await request.post('/api/results',{data:{bad:true}});expect(bad.status()).toBe(400);
 const foreign=await request.post('/api/results',{headers:{Origin:'https://example.com'},data:{}});expect(foreign.status()).toBe(403);
 for(const path of ['/server/index.mjs','/src/lib/assessment.mjs','/data/source_verification.json'])expect((await request.get(path)).status()).toBe(404);
});


test('all visible introductory, question, result and source text meets AA contrast',async({page},testInfo)=>{
 const reports=[];
 await page.goto('/');await expect(page.getByRole('button',{name:'시작하기',exact:true})).toBeVisible();
 for(const view of ['intro','질문','결과','자료와 한계']){
  if(view!=='intro')await page.getByRole('button',{name:view,exact:true}).click();
  if(view==='결과')await expect(page.locator('.creed-row')).toHaveCount(12);
  if(view==='자료와 한계')await expect(page.locator('.source-card')).toHaveCount(18);
  const r=await contrastReport(page,true);reports.push({view,...r});
  for(const row of r.rows){expect(row.ratio,view+' '+row.text).toBeGreaterThanOrEqual(4.5);expect(row.luminance,view+' '+row.text).toBeLessThan(.22)}
 }
 await testInfo.attach('all-visible-text-contrast.json',{body:JSON.stringify(reports,null,2),contentType:'application/json'});
});

test('doctrinal positions show distinct answers, provenance, mobile layout and contrast',async({page},testInfo)=>{
 const now=new Date().toISOString();
 const answers={'H04-01':2,'H04-02':5,'H04-03':5,'H06-01':5,'H06-02':5,'C05-01':5,'C05-02':5,'C05-03':4,'P03-01':1,'P03-02':5,'P03-03':5,'P04-01':5,'P04-02':2,'P04-03':3,'E03-01':'unknown','E03-02':4,'E05-01':null,'E05-02':4};
 await page.addInitScript(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:STORAGE_KEY,value:{schemaVersion:2,dataVersion:'2.0.0-seed.1',algorithmVersion:'2.0.0-exploratory.1',answers,conditionalAnswers:{},confidences:{},currentItemId:'H04-01',createdAt:now,updatedAt:now}});
 await page.goto('/');await page.getByRole('button',{name:'결과',exact:true}).click();
 await expect(page.getByRole('heading',{name:'내 신학의 위치, 쟁점별로'})).toBeVisible();
 const focus=page.locator('.position-map > .position-grid');
 const gifts=focus.getByRole('article',{name:'특별한 은사의 지속',exact:true});
 await expect(gifts.locator('.position-state').nth(0)).toHaveText('동의 · 5/5');
 await expect(gifts.locator('.position-state').nth(1)).toHaveText('비동의 · 2/5');
 await expect(gifts.locator('.position-state').nth(2)).toHaveText('유보·조건부 · 3/5');
 const tongues=focus.getByRole('article',{name:'방언과 성령세례의 증거',exact:true});
 await expect(tongues.locator('.position-state').first()).toHaveText('비동의 · 1/5');
 await expect(tongues.getByRole('link',{name:'Article 8 ↗'})).toHaveAttribute('href','https://ag.org/Beliefs/Statement-of-Fundamental-truths');
 await tongues.getByText('문항·응답·출처 확인',{exact:true}).first().click();
 await expect(tongues.getByText('성령세례를 받은 사람에게는 첫 번째 외적 증거로 방언이 나타난다.',{exact:true})).toBeVisible();
 await expect(focus.getByRole('article',{name:'세례의 대상',exact:true}).locator('.position-state').first()).toHaveText('아직 모름');
 await expect(focus.getByRole('article',{name:'성찬의 임재와 의미',exact:true}).locator('.position-state').first()).toHaveText('미응답');
 await expect(page.locator('.position-overview')).toContainText('믿음에 반드시 이르는 효과적 부르심：비동의');
 await expect(page.locator('.position-overview')).toContainText('구원의 은혜에 대한 실제 거절 가능성：동의');
 for(const width of [1280,375]){
  await page.setViewportSize({width,height:900});
  const dims=await page.evaluate(()=>({w:innerWidth,doc:document.documentElement.scrollWidth}));expect(dims.doc).toBeLessThanOrEqual(dims.w);
  const report=await contrastReport(page,true);for(const row of report.rows)expect(row.ratio,row.text).toBeGreaterThanOrEqual(4.5);
  await page.screenshot({path:`artifacts/screenshots/position-map-${width}-${testInfo.project.name}.png`,fullPage:true});
  await page.screenshot({path:`artifacts/screenshots/position-overview-${width}-${testInfo.project.name}.png`});
 }
 await tongues.getByRole('button',{name:'이 응답 다시 보기',exact:true}).click();
 await expect(page.locator('#question-heading')).toHaveText('성령세례를 받은 사람에게는 첫 번째 외적 증거로 방언이 나타난다.');
 await expect(page.getByRole('radio',{name:'전혀 동의하지 않는다',exact:true})).toBeChecked();
});
