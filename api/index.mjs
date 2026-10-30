import { items, topics, extras, sources, traditions, theologians, relations, audit, questions } from '../server/data.mjs';
import { buildReport } from '../server/report.mjs';
import { parseImport } from '../src/lib/persistence.mjs';

const json = (res, status, data) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
};

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  try {
    const pathname = new URL(req.url || '/', 'https://vercel.local').pathname;
    if (req.method === 'GET' && pathname.endsWith('/questions')) return json(res, 200, questions());
    if (req.method === 'GET' && pathname.endsWith('/sources')) return json(res, 200, { sources, audit: audit() });
    if (req.method === 'GET' && pathname.endsWith('/editor')) return json(res, 200, { items, extras, topics, sources, relations, audit: audit() });
    if (req.method === 'POST' && pathname.endsWith('/results')) {
      let body = '';
      for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 1_000_000) return json(res, 413, { error: '파일이 너무 큽니다.' }); }
      const parsed = parseImport(body, { items, conditionalItems: extras });
      if (!parsed.ok) return json(res, 400, { error: parsed.error });
      return json(res, 200, buildReport({ items, topics, sources, traditions, theologians, relations, verification: audit() }, parsed.snapshot));
    }
    return json(res, 404, { error: '찾을 수 없습니다.' });
  } catch { return json(res, 400, { error: '요청을 읽을 수 없습니다.' }); }
}
