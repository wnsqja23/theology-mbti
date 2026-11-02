type Props={topics:any[];focusIds:string[]};
export default function TheologyRadar({topics,focusIds}:Props){
 const cards=focusIds.map(id=>topics.find(t=>t.id===id)).filter(Boolean);
 const values=cards.map(t=>{const a=t.entries.filter((e:any)=>e.answer!==null).map((e:any)=>e.answer);return a.length?a.reduce((x:number,y:number)=>x+y,0)/a.length:3});
 const cx=150,cy=150,r=103,n=cards.length;
 const point=(i:number,rad:number)=>{const angle=(-Math.PI/2)+(i*2*Math.PI/n);return [cx+Math.cos(angle)*rad,cy+Math.sin(angle)*rad]};
 const poly=(rad:number)=>cards.map((_,i)=>point(i,rad).join(',')).join(' ');
 const data=values.map((v,i)=>point(i,r*(v/5))).map(p=>p.join(',')).join(' ');
 return <section className="radar-card" aria-labelledby="radar-title"><div className="radar-copy"><p className="eyebrow">POSITION MAP</p><h2 id="radar-title">여러 쟁점에서 본 나의 위치</h2><p>핵심 8개 지표의 평균 응답을 한눈에 보여 줍니다. 바깥쪽일수록 해당 진술에 더 동의한 방향입니다.</p><div className="radar-legend"><span><i className="legend-dot agree"/>동의 방향</span><span><i className="legend-dot neutral"/>유보·미응답</span></div></div><div className="radar-visual"><svg viewBox="0 0 300 300" role="img" aria-label="핵심 신학 쟁점의 평균 응답 레이더 차트"><polygon points={poly(r)} className="radar-grid"/><polygon points={poly(r*.75)} className="radar-grid"/><polygon points={poly(r*.5)} className="radar-grid"/><polygon points={poly(r*.25)} className="radar-grid"/>{cards.map((_:any,i:number)=>{const p=point(i,r);return <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} className="radar-axis"/>})}<polygon points={data} className="radar-area"/>{cards.map((t:any,i:number)=>{const p=point(i,r+20);return <text key={t.id} x={p[0]} y={p[1]} className="radar-label" textAnchor="middle">{t.name.replace(/^(.*?)(의|과|및|·).*$/,'$1')}</text>})}</svg></div></section>
}
