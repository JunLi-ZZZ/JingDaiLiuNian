const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.DEATH_ADAPTATION_PLAYWRIGHT||'playwright');
const {loadTs}=require('../tools/runtime.cjs'),{createOpening}=require('./numerical-fixture.cjs');
const root=path.resolve(__dirname,'..'),version=process.env.EMBERS_CHECK_VERSION||require('../package.json').version;
const s=createOpening({mode:'默认'},'archive-ui');
s.stat_data._实体.wolf={...JSON.parse(JSON.stringify(s.stat_data._实体.player)),名称:'灰狼',类别:'生物'};
s.stat_data.叙事.人物档案.passerby=loadTs(path.join(root,'src/schema.ts')).CharacterDossierSchema.parse({名称:'过路客',在场:true,位面ID:'main',身份:'赶路人'});
const record={类别:'地点',对象ID:'harbor',标题:'潮镜',内容:'庭中的镜面可映出通路。',来源:'现场观察',可信度:'观察',知情者ID:{player:true}};
(async()=>{
 const server=http.createServer((req,res)=>{const file=req.url==='/status'?'界面/状态栏/index.html':req.url==='/body'?'界面/正文/index.html':'';if(!file){res.writeHead(404);res.end();return;}res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(path.join(root,'build',version,file),'utf8').replace('<body>',req.url==='/body'?'<body data-kind="note" data-id="harbor_mirror">':'<body>'));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 const out=path.join(root,'build/verification',version);fs.mkdirSync(out,{recursive:true});
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(8000);
  await page.addInitScript(({s,record})=>{
   const clone=x=>JSON.parse(JSON.stringify(x));window.messages=[{message_id:0,message:'封面',data:clone(s)},{message_id:1,message:'镜面映出了通往远方的道路。<EmbersCard type="note" id="harbor_mirror"/><EmbersPanel/>',data:clone(s)}];
   window.chat='archive-chat';window.writes=0;window.waitGlobalInitialized=async()=>{};
   window.toastr={info(){},success(){},error(e){window.lastError=e;}};
   window.getCurrentMessageId=()=>1;window.getLastMessageId=()=>window.messages.length-1;
   window.SillyTavern={getCurrentChatId:()=>window.chat};
   window.getChatMessages=(id,options)=>{const m=window.messages[id];return m?[options?.include_swipes?{...m,swipe_id:0,swipes:[m.message]}:clone(m)]:[];};
   window.getVariables=opts=>clone(window.messages[opts?.message_id??1].data);
   window.Mvu={getMvuData:window.getVariables,replaceMvuData:async(data,opts)=>{window.messages[opts.message_id].data=clone(data);window.writes++;}};
   window.setChatMessages=async changes=>{for(const c of changes)Object.assign(window.messages[c.message_id],clone(c));window.writes++;};
   window.generateRaw=async opts=>{window.request=opts;if(window.fail)throw Error('模拟连接失败');if(window.pending)await new Promise(r=>window.resolveGenerate=r);return JSON.stringify({record});};
   window.stopGenerationById=id=>window.stopped=id;
  },{s,record});
  const base='http://127.0.0.1:'+server.address().port;
  const button=name=>page.getByRole('button',{name,exact:true});
  const open=async()=>{await page.goto(base+'/status');await page.locator('.panel-toggle').click();};
  await open();await button('前往补全档案').click();
  await button('见闻 · harbor_mirror').click();
  await page.evaluate(()=>window.fail=true);await button('让 AI 补全这一项').click();await page.getByText('模拟连接失败',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.writes),0);
  await page.evaluate(()=>window.fail=false);await button('让 AI 补全这一项').click();await page.locator('.missing-archives article').waitFor();assert.equal(await page.evaluate(()=>window.writes),0);
  const requested=JSON.parse(await page.evaluate(()=>window.request.ordered_prompts[1].content));assert.equal(requested.目标.id,'harbor_mirror');assert(!requested.字段.properties.本轮时间);
  for(const width of [1000,390,320]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(out,'archive-recovery-'+width+'.png'),fullPage:true});}
  await button('确认保存这项档案').click();await page.waitForFunction(()=>!!window.messages[1].data.stat_data.叙事.见闻.harbor_mirror);
  assert.equal(await page.evaluate(()=>window.messages[1].data.stat_data._时空.起源时刻秒),0);assert.equal(await page.evaluate(()=>window.writes),1);
  assert(await page.evaluate(()=>window.messages[1].data.embers_local_archive.changes.some(c=>c.path.join('/')==='叙事/见闻/harbor_mirror')));
  await button('人物').click();assert(!await page.locator('.characters').getByText('灰狼',{exact:true}).count());assert.equal(await page.locator('.characters').getByText('过路客',{exact:true}).count(),1);
  await page.locator('.characters summary').click();await button('移除档案').click();await button('取消').click();assert.equal(await page.evaluate(()=>window.writes),1);
  await button('移除档案').click();await button('确认移除').click();await page.waitForFunction(()=>window.messages[1].data.stat_data._档案整理['character:passerby']);
  assert.equal(await page.locator('.characters').getByText('过路客',{exact:true}).count(),0);
  await button('整理').click();await page.getByLabel('档案范围').selectOption('已移除');await page.locator('.archive-manager summary').click();await button('恢复档案').click();await button('确认恢复').click();await page.waitForFunction(()=>window.messages[1].data.stat_data._档案整理['character:passerby']===false);
  await button('生物').click();await page.locator('.characters summary').filter({hasText:'灰狼'}).click();await button('编辑实体分类').click();await page.getByLabel('实体名称',{exact:true}).fill('林地来客');await page.getByLabel('类别',{exact:true}).selectOption('人物');await button('保存实体分类').click();await page.waitForFunction(()=>window.messages[1].data.stat_data._实体.wolf.类别==='人物');
  await button('人物').click();assert.equal(await page.locator('.characters').getByText('林地来客',{exact:true}).count(),1);
  // Cancel, stale preview, and a chat switch must not write.
  await open();await button('前往补全档案').click();await button('见闻 · harbor_mirror').click();await page.evaluate(()=>window.pending=true);await button('让 AI 补全这一项').click();await button('停止补全').click();await page.evaluate(()=>window.resolveGenerate());assert.equal(await page.locator('.missing-archives article').count(),0);assert.equal(await page.evaluate(()=>window.writes),0);
  await page.evaluate(()=>window.pending=false);await button('让 AI 补全这一项').click();await page.locator('.missing-archives article').waitFor();await page.evaluate(()=>window.messages[1].data.stat_data.叙事.天气='雨');await button('确认保存这项档案').click();assert.equal(await page.evaluate(()=>window.writes),0);
  await open();await button('前往补全档案').click();await button('见闻 · harbor_mirror').click();await button('让 AI 补全这一项').click();await page.locator('.missing-archives article').waitFor();await page.evaluate(()=>window.chat='another-chat');await button('确认保存这项档案').click();assert.equal(await page.evaluate(()=>window.writes),0);
  await page.goto(base+'/body');await page.locator('.card-pending').waitFor();
  await page.evaluate(record=>window.messages[1].data.stat_data.叙事.见闻.harbor_mirror=record,record);
  await page.locator('.dossier').waitFor();assert.match(await page.locator('.dossier').innerText(),/潮镜/);
  await page.evaluate(()=>window.messages[1].data.stat_data._档案整理['note:harbor_mirror']=true);
  await page.locator('.card-pending').getByText('资料已移除',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);console.log('Archive UI: missing reference repair/preview/cancel/stale/chat pin, people-creature separation, remove/restore/classification, 1000/390/320 passed.');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
