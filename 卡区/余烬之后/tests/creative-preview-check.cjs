const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),http=require('node:http');
const {chromium}=require(process.env.DEATH_ADAPTATION_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'..'),version=require('../package.json').version,out=path.join(root,'build/verification',version);
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{const routes={'/cards':'卡片','/workshop':'工坊','/cover':'开局'};const name=routes[req.url];if(!name){res.writeHead(404);res.end();return;}res.setHeader('Content-Type','text/html;charset=utf-8');res.end(fs.readFileSync(path.join(root,'build',version,'预览',name+'.html')));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const width of [1280,390,320]){
   await page.setViewportSize({width,height:1000});await page.goto(base+'/cards');await page.locator('.inheritance').waitFor();
   for(const [tab,selector,file] of [['传承','.inheritance','inheritance'],['交锋','.battle-card','combat'],['检定','.scene-card.check','check'],['归泊','.scene-card.death','return'],['人物与物品','.portrait','dossiers'],['旅途','.scene-card.travel','travel'],['本质序列','.grade-showcase','grades']]){
   await page.getByRole('button',{name:tab,exact:true}).click();await page.locator(selector).first().waitFor();
   if(tab==='人物与物品'){
    const player=page.getByRole('heading',{name:'归来者',exact:true});await player.waitFor();
    assert.notEqual(await player.evaluate(node=>getComputedStyle(node).color),'rgba(0, 0, 0, 0)');
    assert.equal(await player.locator('xpath=ancestor::details').getAttribute('data-grade'),null);
    await player.click();
    const card=await player.locator('xpath=ancestor::details').innerText();
    for(const label of ['生命','能量','攻击','防御'])assert.match(card,new RegExp(label));
   }
   if(tab==='本质序列'){
     assert(await page.locator('.grade-showcase .dossier h3').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).color==='rgba(0, 0, 0, 0)')));
     assert.equal(new Set(await page.locator('.grade-showcase .grade-badge').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).backgroundImage))).size,8);
     assert(await page.locator('.grade-showcase>section').evaluateAll(nodes=>nodes.every(n=>n.querySelector('.inheritance .metrics strong').textContent===n.querySelector('.inheritance').dataset.grade)));
     assert.equal(new Set(await page.locator('.grade-showcase .inheritance').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).backgroundImage))).size,8);
     assert.equal(new Set(await page.locator('.grade-showcase .relic').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).backgroundImage))).size,8);
     await page.emulateMedia({reducedMotion:'reduce'});assert(await page.locator('.grade-badge').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).animationName==='none')));await page.emulateMedia({reducedMotion:'no-preference'});
    }
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+tab+' '+width);
    await page.screenshot({path:path.join(out,file+'-'+width+'.png'),fullPage:true});
   }
  }
  await page.goto(base+'/workshop');
  assert.equal(await page.locator('.preferences[open]').count(),0);
  await page.getByRole('button',{name:'载入示例草稿',exact:true}).click();
  await page.locator('.manuscript section').first().waitFor();assert.equal(await page.locator('.manuscript section').count(),10);
  assert.match(await page.locator('.manuscript').innerText(),/实际四十六岁/);
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'下载设定 .md',exact:true}).click();
  const download=await downloaded;await download.saveAs(path.join(out,'人物导出.md'));const text=fs.readFileSync(path.join(out,'人物导出.md'),'utf8');assert(text.includes('# 基本信息'));assert(text.includes('语言与互动'));
  await page.locator('.preferences>summary').click();await page.locator('.option-group>summary').filter({hasText:'身份与外貌'}).click();
  await page.getByLabel('性别',{exact:true}).selectOption('非二元');await page.getByLabel('种族',{exact:true}).selectOption('人造生命');
  await page.screenshot({path:path.join(out,'workshop-options-320.png'),fullPage:true});
  await page.getByRole('button',{name:'生成位面',exact:true}).click();await page.locator('.option-group>summary').filter({hasText:'世界轮廓'}).click();
  await page.getByLabel('位面类型',{exact:true}).selectOption('西方奇幻');await page.getByLabel('世界规模',{exact:true}).selectOption('多大陆与海洋');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.getByRole('button',{name:'载入示例草稿',exact:true}).click();assert.equal(await page.locator('.manuscript section').count(),10);assert.match(await page.locator('.manuscript').innerText(),/地理与生态/);
  await page.locator('.preferences>summary').click();await page.setViewportSize({width:1100,height:1000});
  await page.screenshot({path:path.join(out,'world-manuscript.png'),fullPage:true});
  await page.reload();await page.locator('.shelf>summary').click();assert.match(await page.locator('.shelf').innerText(),/闻潮/);assert.match(await page.locator('.shelf').innerText(),/琉潮群岛/);
  await page.goto(base+'/cover');await page.getByRole('button',{name:'设定工坊',exact:true}).click();await page.locator('.workshop').waitFor();assert.equal(await page.getByRole('button',{name:'保存到世界书',exact:true}).count(),0);
  await page.getByRole('button',{name:'载入示例草稿',exact:true}).click();assert.equal(await page.locator('.manuscript section').count(),10);
  await page.getByRole('button',{name:'← 返回封面',exact:true}).click();await page.getByRole('button',{name:'开始旅途',exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('Creative UI passed: six card scenes at 1280/390/320; zero-input creation; grouped choices; complete manuscripts; download; retained drafts; pre-opening workshop.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
