import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {items,topics,extras,sources,traditions,theologians,relations,audit,questions,root} from './data.mjs';
import {buildReport} from './report.mjs';
import {parseImport} from '../src/lib/persistence.mjs';
const port=Number(process.env.PORT||5173);
const send=(res,code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'");
 try{
  const url=new URL(req.url,`http://127.0.0.1:${port}`);
  if(req.method==='GET'&&url.pathname==='/api/questions')return send(res,200,questions());
  if(req.method==='GET'&&url.pathname==='/api/sources')return send(res,200,{sources,audit:audit()});
  if(req.method==='GET'&&url.pathname==='/api/editor')return send(res,200,{items,extras,topics,sources,relations,audit:audit()});
  if(req.method==='POST'&&url.pathname==='/api/results'){
   if(req.headers.origin&&!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(req.headers.origin))return send(res,403,{error:'허용되지 않은 요청입니다.'});
   let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>1_000_000)return send(res,413,{error:'파일이 너무 큽니다.'})}
   const parsed=parseImport(body,{items,conditionalItems:extras});
   if(!parsed.ok)return send(res,400,{error:parsed.error});
   return send(res,200,buildReport({items,topics,sources,traditions,theologians,relations,verification:audit()},parsed.snapshot));
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,{error:'허용되지 않은 요청입니다.'});
  if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/data/')||url.pathname.startsWith('/src/')||url.pathname.startsWith('/server/'))return send(res,404,{error:'찾을 수 없습니다.'});
  const dist=path.join(root,'dist');
  let file=url.pathname.startsWith('/assets/')?path.resolve(dist,'.'+decodeURIComponent(url.pathname)):path.join(dist,'index.html');
  if(!file.startsWith(dist+path.sep)||!fs.existsSync(file))return send(res,404,{error:'먼저 npm run build를 실행해 주세요.'});
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
 }catch{send(res,400,{error:'요청을 읽을 수 없습니다. 응답은 변경되지 않았습니다.'});}
});
server.listen(port,'127.0.0.1',()=>console.log(`신학 mbti — http://127.0.0.1:${port}`));
