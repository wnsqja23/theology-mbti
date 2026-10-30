import fs from 'node:fs';
const report=JSON.parse(fs.readFileSync('artifacts/browser-results.json','utf8'));
const rows=[],attachments=[];
function visit(suite){for(const spec of suite.specs||[])for(const test of spec.tests||[])for(const result of test.results||[])for(const attachment of result.attachments||[]){if(!attachment.name.includes('contrast')||!attachment.body)continue;const data=JSON.parse(Buffer.from(attachment.body,'base64').toString());attachments.push({browser:test.projectName,name:attachment.name,data});function extract(value){if(!value||typeof value!=='object')return;if(Array.isArray(value)){value.forEach(extract);return;}if(Array.isArray(value.rows))rows.push(...value.rows.map(row=>({...row,browser:test.projectName})));for(const [key,child]of Object.entries(value))if(key!=='rows')extract(child)}extract(data)}for(const child of suite.suites||[])visit(child)}
for(const suite of report.suites||[])visit(suite);
const summary={date:new Date(report.stats.startTime).toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'}),browserTests:report.stats,renderedTextChecks:rows.length,minimumContrast:Math.min(...rows.map(row=>row.ratio)),maximumTextLuminance:Math.max(...rows.map(row=>row.luminance)),browsers:[...new Set(rows.map(row=>row.browser))],allTextMeetsAA:rows.length>0&&rows.every(row=>row.ratio>=4.5&&row.luminance<.22)};
fs.writeFileSync('artifacts/verification-summary.json',JSON.stringify(summary,null,2)+'\n');
fs.writeFileSync('artifacts/contrast-measurements.json',JSON.stringify(attachments,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
// Stable, friendly screenshot names for handoff.
for(const dir of fs.readdirSync('artifacts/browser-results',{withFileTypes:true})){if(!dir.isDirectory())continue;for(const file of fs.readdirSync(`artifacts/browser-results/${dir.name}`)){if(!file.endsWith('.png')||!file.startsWith('questions-'))continue;const browser=dir.name.endsWith('-webkit')?'webkit':'chromium';fs.copyFileSync(`artifacts/browser-results/${dir.name}/${file}`,`artifacts/screenshots/${browser}-${file}`)}}
