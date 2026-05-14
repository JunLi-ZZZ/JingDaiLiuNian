<template>
  <div class="status-bar" :class="`theme-${theme}`">
    <div class="master-bar" @click="showAll = !showAll">
      <span class="brand">◈ 镜待流年</span>
      <span class="master-info">{{ timeText }}</span>
      <span class="master-arrow">{{ showAll ? '▾' : '▸' }}</span>
    </div>

    <div v-if="showAll" class="main-body">
      <div class="settings-bar"><button class="gear-btn" @click="showThemes = !showThemes">⚙ 主题</button></div>
      <div v-if="showThemes" class="theme-picker">
        <button v-for="t in themes" :key="t.id" class="theme-dot" :class="{ active: theme === t.id }"
          :style="{ background: t.color }" :title="t.name" @click="theme = t.id"></button>
      </div>
      <div class="time-bar"><i class="fa-solid fa-clock"></i> {{ timeText }}</div>
      <div class="world-loc">🌍 {{ locationFull }}</div>

      <!-- 主角 -->
      <div class="block" :class="{ open: showProtagonist }">
        <div class="block-head" @click="showProtagonist = !showProtagonist">
          <span class="block-title">{{ userName }}</span>
          <span class="block-arrow">{{ showProtagonist ? '▾' : '▸' }}</span>
        </div>
        <div v-if="showProtagonist" class="block-body">
          <div class="stat-row-inline">
            <span class="stat-item">💰 财富 <b>{{ data.主角.财富 }}</b></span>
            <span class="stat-item">⭐ 境界 <b>{{ data.主角.境界 || '凡人' }}</b></span>
          </div>

          <div class="sub-block" :class="{ open: showProtagBasic }">
            <div class="sub-head" @click="showProtagBasic = !showProtagBasic"><span>📋 基本信息</span><span class="block-arrow small">{{ showProtagBasic ? '▾' : '▸' }}</span></div>
            <div v-if="showProtagBasic" class="sub-body">
              <div class="info-card">
              <div class="info-grid">
                <span class="info-cell">性别 <b>{{ data.主角.性别 || '待设定' }}</b></span>
                <span class="info-cell">年龄 <b>{{ data.主角.年龄 || '待设定' }}</b></span>
                <span class="info-cell">种族 <b>{{ data.主角.种族 || '待设定' }}</b></span>
              </div>
              <div class="info-line"><span class="info-label">喜好</span>：<span class="info-value">{{ data.主角.喜好 || '待设定' }}</span></div>
              <div class="info-line"><span class="info-label">厌恶</span>：<span class="info-value">{{ data.主角.厌恶 || '待设定' }}</span></div>
              <div class="info-line"><span class="info-label">外貌</span>：<span class="info-value">{{ data.主角.外貌特征 || '待设定' }}</span></div>
              <div class="info-line"><span class="info-label">体型</span>：<span class="info-value">{{ data.主角.基础体型 || '待设定' }}</span></div>
              <div class="info-line"><span class="info-label">天赋</span>：<span class="info-value">{{ data.主角.天赋能力 || '待设定' }}</span></div>
              </div>
            </div>
          </div>

          <div class="sub-block" :class="{ open: showClothing }">
            <div class="sub-head" @click="showClothing = !showClothing"><span>👕 服装</span><span class="block-arrow small">{{ showClothing ? '▾' : '▸' }}</span></div>
            <div v-if="showClothing" class="sub-body">
              <div class="cloth-list">
                <div v-for="item in protagClothing" :key="item.key">
                  <div class="cloth-row" @click="toggleClothDetail(item.key)">
                    <span class="cloth-key">{{ item.key }}</span>
                    <span class="cloth-val" :class="{ dim: !isSet(item.名称) }">{{ isSet(item.名称) ? item.名称 : '—' }}</span>
                    <span v-if="isSet(item.状态)" class="cloth-status">{{ item.状态 }}</span>
                  </div>
                  <div v-if="clothDetail.has(item.key) && isSet(item.描述)" class="cloth-detail">{{ item.描述 }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="sub-block" :class="{ open: showItems }">
            <div class="sub-head" @click="showItems = !showItems"><span>📦 随身物品</span><span class="block-arrow small">{{ showItems ? '▾' : '▸' }}</span></div>
            <div v-if="showItems" class="sub-body">
              <div v-if="itemEntries.length === 0" class="empty-hint">暂无</div>
              <div v-for="[name, item] in itemEntries" :key="name">
                <div class="item-card" :class="{ 'mirror-item': name === '母镜', 'mirror-open': name === '母镜' && mirrorOpen }" @click="name === '母镜' ? mirrorOpen = !mirrorOpen : null">
                  <span class="item-name">{{ name }}</span>
                  <span class="item-desc">{{ item.描述 }}</span>
                  <span v-if="item.数量" class="item-qty">×{{ item.数量 }}</span>
                  <span v-if="name === '母镜'" class="mirror-toggle">{{ mirrorOpen ? '▾' : '▸' }}</span>
                </div>
                <div v-if="name === '母镜' && mirrorOpen" class="mirror-panel" :class="mirrorDir === 'toMe' ? 'theme-red' : 'theme-teal'">
                  <div class="mirror-frame">
                    <div class="frame-ring"></div><div class="frame-inset"></div>
                    <div class="mirror-surface">
                      <div class="mirror-mist mist-1"></div><div class="mirror-mist mist-2"></div>
                      <div class="panel-title">镜 渡</div>
                      <div class="panel-sub">{{ mirrorDir === 'toMe' ? '唤至此岸' : '渡往彼岸' }}</div>
                      <div class="direction-toggle">
                        <button class="toggle-btn" :class="{ active: mirrorDir === 'toMe' }" @click="mirrorDir = 'toMe'">召唤来此</button>
                        <div class="toggle-track" @click="mirrorDir = mirrorDir === 'toMe' ? 'toWorld' : 'toMe'"><div class="toggle-thumb" :class="mirrorDir"></div></div>
                        <button class="toggle-btn" :class="{ active: mirrorDir === 'toWorld' }" @click="mirrorDir = 'toWorld'">前往彼方</button>
                      </div>
                      <button class="btn-random" @click="mxRandom()"><span class="btn-icon">✦</span>随机镜渡</button>
                      <div class="custom-section">
                        <button class="btn-custom-toggle" @click="mxCustom = !mxCustom"><span class="btn-icon">{{ mxCustom ? '▾' : '▸' }}</span>自定义镜渡</button>
                        <div v-if="mxCustom" class="custom-form">
                          <div class="form-section" @click="mxOpen.basic = !mxOpen.basic"><span class="mx-arrow" :class="{ open: mxOpen.basic }">▸</span> 基本设定</div>
                          <div v-if="mxOpen.basic" class="section-body">
                            <div class="form-row"><label>外貌风格</label><select v-model="mxForm.style"><option value="">✨ 随机</option><option>古风</option><option>现代</option><option>异域</option><option>科幻</option><option>哥特</option><option>奇幻</option><option>战损</option><option value="自定义">自定义 ▼</option></select></div>
                            <div v-if="mxForm.style==='自定义'" class="form-row"><input v-model="mxForm.styleCustom" placeholder="填写自定义风格…" /></div>
                            <div class="form-row"><label>性格特质</label><div class="tag-pool"><span v-for="t in pickedTraits" :key="'s_'+t" class="tag picked" @click="mxToggleTag(mxForm.traits,t)">{{ t }}</span><span v-for="t in mxTraits" :key="'t_'+t" v-show="!mxForm.traits.includes(t)" class="tag" @click="mxToggleTag(mxForm.traits,t)">{{ t }}</span><span class="tag tag-custom"><input v-model="mxForm.traitInput" placeholder="自定义+" @keyup.enter="mxForm.traitInput=mxAddCustom(mxForm.traits,mxForm.traitInput)" /><button class="tag-custom-btn" @click="mxForm.traitInput=mxAddCustom(mxForm.traits,mxForm.traitInput)">+</button></span></div></div>
                            <div class="form-row"><label>体态身材</label><select v-model="mxForm.bodyType"><option value="">✨ 随机</option><option>纤细</option><option>匀称</option><option>丰满</option><option>娇小</option><option>高挑</option><option>健美</option><option>丰腴</option><option value="自定义">自定义 ▼</option></select></div>
                            <div v-if="mxForm.bodyType==='自定义'" class="form-row"><input v-model="mxForm.bodyTypeCustom" placeholder="填写自定义体态…" /></div>
                            <div class="form-row"><label>种族</label><select v-model="mxForm.race"><option value="">✨ 随机</option><option>人类</option><option>妖族</option><option>仙族</option><option>魔族</option><option>精灵</option><option>龙族</option><option>天使</option><option>恶魔</option><option>亡灵</option><option>吸血鬼</option><option value="自定义">自定义 ▼</option></select></div>
                            <div v-if="mxForm.race==='自定义'" class="form-row"><input v-model="mxForm.raceCustom" placeholder="填写自定义种族…" /></div>
                            <div class="form-row"><label>年龄感</label><select v-model="mxForm.age"><option value="">✨ 随机</option><option>少女</option><option>御姐</option><option>成熟</option><option>不老</option><option>幼态</option><option value="自定义">自定义 ▼</option></select></div>
                            <div v-if="mxForm.age==='自定义'" class="form-row"><input v-model="mxForm.ageCustom" placeholder="填写自定义年龄感…" /></div>
                          </div>
                          <div class="form-section" @click="mxOpen.world = !mxOpen.world"><span class="mx-arrow" :class="{ open: mxOpen.world }">▸</span> 世界与能力</div>
                          <div v-if="mxOpen.world" class="section-body">
                            <div class="form-row"><label>来源世界</label><select v-model="mxForm.origin"><option value="">✨ 随机</option><option>主世界</option><option>妖灵位面</option><option>仙道位面</option><option>古代位面</option><option>异世界</option><option>深渊</option><option>同人位面</option><option>幽冥位面</option><option>虚数位面</option><option value="自定义">自定义 ▼</option></select></div>
                            <div v-if="mxForm.origin==='自定义'" class="form-row"><input v-model="mxForm.originCustom" placeholder="填写自定义位面…" /></div>
                            <div class="form-row"><label>天赋能力</label><div class="tag-pool"><span v-for="t in pickedAbilities" :key="'a_'+t" class="tag picked" @click="mxToggleTag(mxForm.abilities,t)">{{ t }}</span><span v-for="t in mxAbilities" :key="'ab_'+t" v-show="!mxForm.abilities.includes(t)" class="tag" @click="mxToggleTag(mxForm.abilities,t)">{{ t }}</span><span class="tag tag-custom"><input v-model="mxForm.abilityInput" placeholder="自定义+" @keyup.enter="mxForm.abilityInput=mxAddCustom(mxForm.abilities,mxForm.abilityInput)" /><button class="tag-custom-btn" @click="mxForm.abilityInput=mxAddCustom(mxForm.abilities,mxForm.abilityInput)">+</button></span></div></div>
                            <div class="form-row"><label>身份地位</label><select v-model="mxForm.role"><option value="">✨ 随机</option><option v-for="t in mxRoles" :key="'r_'+t" :value="t">{{ t }}</option><option value="自定义">自定义 ▼</option></select></div>
                            <div v-if="mxForm.role==='自定义'" class="form-row"><input v-model="mxForm.roleCustom" placeholder="填写自定义身份…" /></div>
                          </div>
                          <div class="form-section" @click="mxOpen.deep = !mxOpen.deep"><span class="mx-arrow" :class="{ open: mxOpen.deep }">▸</span> 深层设定</div>
                          <div v-if="mxOpen.deep" class="section-body">
                            <div class="form-row"><label>同人作品 <span class="mx-mode-toggle" @click="mxFandomMode=!mxFandomMode">{{ mxFandomMode ? '⟲ 简单' : '⟳ 魔改' }}</span></label>
                              <div v-if="!mxFandomMode" class="mx-fandom-simple">
                                <select v-model="mxForm.fandom"><option value="">✨ 原创（不指定）</option><option v-for="t in mxFandoms" :key="'f_'+t" :value="t">{{ t }}</option><option value="自定义">自定义 ▼</option></select>
                                <div v-if="mxForm.fandom==='自定义'"><input v-model="mxForm.fandomCustom" placeholder="填写作品名…" /></div>
                              </div>
                              <div v-if="mxFandomMode" class="mx-fandom-ext">
                                <select v-model="mxForm.fandomType"><option value="">魔改向</option><option>原作向</option><option>魔改向</option><option>反转向</option><option>纯净向</option><option>融合向</option><option value="自定义">自定义 ▼</option></select>
                                <div v-if="mxForm.fandomType==='自定义'" class="form-row"><input v-model="mxForm.fandomTypeCustom" placeholder="填写类型…" /></div>
                                <select v-model="mxForm.fandom"><option value="">✨ 选择作品</option><option v-for="t in mxFandoms" :key="'fe_'+t" :value="t">{{ t }}</option><option value="自定义">自定义 ▼</option></select>
                                <div v-if="mxForm.fandom==='自定义'" class="form-row"><input v-model="mxForm.fandomCustom" placeholder="填写作品名…" /></div>
                                <input v-model="mxForm.fandomDesc" placeholder="描述魔改细节，如：性转吉尔伽美什…" />
                              </div>
                            </div>
                            <div class="form-row"><label>核心特质</label><select v-model="mxForm.coreTrait"><option value="">✨ 随机</option><option v-for="t in mxCoreTraits" :key="'ct_'+t" :value="t">{{ t }}</option><option value="自定义">自定义 ▼</option></select></div>
                            <div v-if="mxForm.coreTrait==='自定义'" class="form-row"><input v-model="mxForm.coreTraitCustom" placeholder="如：被神遗弃的最后使徒…" /></div>
                            <div class="form-row"><label>初见态度</label><select v-model="mxForm.attitude"><option value="">✨ 随机</option><option v-for="t in mxAttitudes" :key="'at_'+t" :value="t">{{ t }}</option><option value="自定义">自定义 ▼</option></select></div>
                            <div v-if="mxForm.attitude==='自定义'" class="form-row"><input v-model="mxForm.attitudeCustom" placeholder="填写自定义态度…" /></div>
                            <div class="form-row"><label>相识状态</label><select v-model="mxForm.acquaintance"><option value="">✨ 随机</option><option v-for="t in mxAcquaintances" :key="'aq_'+t" :value="t">{{ t }}</option><option value="自定义">自定义 ▼</option></select></div>
                            <div v-if="mxForm.acquaintance==='自定义'" class="form-row"><input v-model="mxForm.acquaintanceCustom" placeholder="填写自定义相识状态…" /></div>
                            <div class="form-row"><label>特殊标记</label><select v-model="mxForm.specialMark"><option value="">无</option><option v-for="t in mxMarks" :key="'mk_'+t" :value="t">{{ t }}</option><option value="自定义">自定义 ▼</option></select></div>
                            <div v-if="mxForm.specialMark==='自定义'" class="form-row"><input v-model="mxForm.specialMarkCustom" placeholder="填写自定义标记…" /></div>
                            <div class="form-row"><label>其他补充</label><textarea v-model="mxForm.other" placeholder="自由填写未列出的信息，如特定设定、限制条件、参考角色等…" class="mx-other-input"></textarea></div>
                          </div>
                          <div v-if="mxGenerating" class="mx-gen-status"><span class="gen-spinner"></span>正在生成详细人设…</div>
                          <div v-if="mxGenError" class="mx-gen-status error">{{ mxGenError }}</div>
                          <div v-if="mxGenResult" class="mx-gen-result">
                            <div class="gen-result-label">世界书档案</div>
                            <textarea v-model="mxGenArchive" class="gen-result-text" placeholder="(未解析到档案内容)"></textarea>
                            <div class="gen-result-actions">
                              <button v-if="!mxSavedToWB" class="btn-gen-save" @click="mxSaveGenResult()">保存到世界书</button>
                              <span v-else class="gen-saved-hint">已保存 ✓</span>
                              <button class="btn-gen-inject" @click="mxInjectArchive()">注入聊天</button>
                              <button class="btn-gen-retry" @click="mxGenerateDetail()">重新生成</button>
                            </div>
                          </div>
                          <div class="mx-gen-row">
                            <label class="mx-save-toggle" @click.stop>
                              <input type="checkbox" v-model="mxIncludeChat" />
                              <span class="toggle-label">附带聊天记录</span>
                            </label>
                          </div>
                          <div class="btn-row">
                            <button class="btn-send" @click="mxCustomSummon()">开启镜渡</button>
                            <button class="btn-gen" :disabled="mxGenerating" @click="mxGenerateDetail()">{{ mxGenerating ? '生成中…' : '生成详细人设' }}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="sub-block" :class="{ open: showRelations }">
            <div class="sub-head" @click="showRelations = !showRelations"><span>👥 人际关系</span><span class="block-arrow small">{{ showRelations ? '▾' : '▸' }}</span></div>
            <div v-if="showRelations" class="sub-body">
              <div v-if="relationEntries.length === 0" class="empty-hint">暂无</div>
              <div v-for="[name, desc] in relationEntries" :key="name" class="item-card"><span class="item-name">{{ name }}</span><span class="item-desc">{{ desc }}</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 角色名录 -->
      <div class="block" :class="{ open: showChars }">
        <div class="block-head" @click="showChars = !showChars">
          <span class="block-title">角色名录</span>
          <span class="block-sub">{{ allChars.length }}人</span>
          <span class="block-arrow">{{ showChars ? '▾' : '▸' }}</span>
        </div>
        <div v-if="showChars" class="block-body">
          <div v-if="allChars.length === 0" class="empty-hint">暂无角色</div>
          <div v-for="char in allChars" :key="char._key" class="char-entry">
            <div class="char-row" @click="toggleChar(char._key)">
              <span class="char-name">{{ char.name }}</span>
              <span class="char-hearts">{{ loveIcon(char.好感度) }}</span>
              <span class="char-presence" :class="presence(char)">{{ presenceText(char) }}</span>
              <span class="block-arrow small">{{ expandedChars.has(char._key) ? '▾' : '▸' }}</span>
            </div>
            <div v-if="expandedChars.has(char._key)" class="char-detail">
              <div class="stat-row-inline">
                <span class="stat-item">❤️ 好感 <b>{{ char.好感度 }}</b></span>
                <span class="stat-item">💰 财富 <b>{{ char.财富 }}</b></span>
                <span class="stat-item">⭐ 境界 <b>{{ char.境界 || '凡人' }}</b></span>
              </div>

              <div class="sub-block" :class="{ open: sub(char._key+'-basic') }">
                <div class="sub-head" @click="toggleSub(char._key+'-basic')"><span>📋 基本信息</span><span class="block-arrow small">{{ sub(char._key+'-basic') ? '▾' : '▸' }}</span></div>
                <div v-if="sub(char._key+'-basic')" class="sub-body">
                  <div class="info-card">
                  <div class="info-grid">
                    <span class="info-cell">性别 <b>{{ char.性别 || '待设定' }}</b></span>
                    <span class="info-cell">年龄 <b>{{ char.年龄 || '待设定' }}</b></span>
                    <span class="info-cell">种族 <b>{{ char.种族 || '待设定' }}</b></span>
                    <span class="info-cell">来源 <b>{{ char.来源世界 || '待设定' }}</b></span>
                  </div>
                  <div class="info-line"><span class="info-label">喜好</span>：<span class="info-value">{{ char.喜好 || '待设定' }}</span></div>
                  <div class="info-line"><span class="info-label">厌恶</span>：<span class="info-value">{{ char.厌恶 || '待设定' }}</span></div>
                  <div class="info-line"><span class="info-label">外貌</span>：<span class="info-value">{{ char.外貌特征 || '待设定' }}</span></div>
                  <div class="info-line"><span class="info-label">体型</span>：<span class="info-value">{{ char.基础体型 || '待设定' }}</span></div>
                  <div class="info-line"><span class="info-label">天赋</span>：<span class="info-value">{{ char.天赋能力 || '待设定' }}</span></div>
                  </div>
                </div>
              </div>

              <div class="sub-block" :class="{ open: sub(char._key+'-cloth') }">
                <div class="sub-head" @click="toggleSub(char._key+'-cloth')"><span>👕 服装</span><span class="block-arrow small">{{ sub(char._key+'-cloth') ? '▾' : '▸' }}</span></div>
                <div v-if="sub(char._key+'-cloth')" class="sub-body">
                  <div class="cloth-list">
                    <div v-for="ci in getCharClothing(char)" :key="ci.key">
                      <div class="cloth-row" @click="toggleClothDetail(char._key+'-'+ci.key)">
                        <span class="cloth-key">{{ ci.key }}</span>
                        <span class="cloth-val" :class="{ dim: !isSet(ci.名称) }">{{ isSet(ci.名称) ? ci.名称 : '—' }}</span>
                        <span v-if="isSet(ci.状态)" class="cloth-status">{{ ci.状态 }}</span>
                      </div>
                      <div v-if="clothDetail.has(char._key+'-'+ci.key) && isSet(ci.描述)" class="cloth-detail">{{ ci.描述 }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="sub-block" :class="{ open: sub(char._key+'-items') }">
                <div class="sub-head" @click="toggleSub(char._key+'-items')"><span>📦 随身物品</span><span class="block-arrow small">{{ sub(char._key+'-items') ? '▾' : '▸' }}</span></div>
                <div v-if="sub(char._key+'-items')" class="sub-body">
                  <div v-if="getCharItems(char).length === 0" class="empty-hint">暂无</div>
                  <div v-for="[name, item] in getCharItems(char)" :key="name" class="item-card"><span class="item-name">{{ name }}</span><span class="item-desc">{{ item.描述 }}</span><span v-if="item.数量" class="item-qty">×{{ item.数量 }}</span></div>
                </div>
              </div>
              <div class="sub-block" :class="{ open: sub(char._key+'-rel') }">
                <div class="sub-head" @click="toggleSub(char._key+'-rel')"><span>👥 人际关系</span><span class="block-arrow small">{{ sub(char._key+'-rel') ? '▾' : '▸' }}</span></div>
                <div v-if="sub(char._key+'-rel')" class="sub-body">
                  <div v-if="getCharRelations(char).length === 0" class="empty-hint">暂无</div>
                  <div v-for="[name, desc] in getCharRelations(char)" :key="name" class="item-card"><span class="item-name">{{ name }}</span><span class="item-desc">{{ desc }}</span></div>
                </div>
              </div>
              <div v-if="char.nsfw档案" class="sub-block" :class="{ open: sub(char._key+'-nsfw') }">
                <div class="sub-head" @click="toggleSub(char._key+'-nsfw')"><span>🔞 NSFW 档案</span><span class="block-arrow small">{{ sub(char._key+'-nsfw') ? '▾' : '▸' }}</span></div>
                <div v-if="sub(char._key+'-nsfw')" class="sub-body">
                  <div class="nsfw-grid">
                    <span class="nsfw-cell">初次 <b>{{ char.nsfw档案.初次存在与否 ? '存在' : '不存在' }}</b></span>
                    <span class="nsfw-cell">性对象 <b>{{ char.nsfw档案.性对象 || '无' }}</b></span>
                    <span class="nsfw-cell">怀孕 <b>{{ char.nsfw档案.是否怀孕 ? '是' : '否' }}</b></span>
                    <span class="nsfw-cell">子嗣 <b>{{ char.nsfw档案.子嗣列表 || '无' }}</b></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useDataStore } from './store';

const store = useDataStore();
const data = computed(() => store.data);

const showAll = ref(false);
const showProtagonist = ref(false);
const showProtagBasic = ref(false);
const showClothing = ref(false);
const showItems = ref(false);
const showRelations = ref(false);
const showChars = ref(false);
const showThemes = ref(false);
const theme = ref((typeof localStorage !== 'undefined' && localStorage.getItem('jdnl_theme')) || 'cream');
watch(theme, v => { if (typeof localStorage !== 'undefined') localStorage.setItem('jdnl_theme', v); injectVarStyle(); }, { immediate: true });
function injectVarStyle() {
  const doc = (window as any).parent?.document;
  if (!doc) return;
  let el = doc.getElementById('jdnl-var-style');
  if (!el) { el = doc.createElement('style'); el.id = 'jdnl-var-style'; doc.head.appendChild(el); }
  const t = theme.value;
  const dark = t !== 'cream';
  const accent = { cream: '#8b7355', purple: '#9b7ec4', gold: '#c9a96e', teal: '#5ea0a7', rose: '#c47b8b' }[t] || '#8b7355';
  const accentDim = { cream: 'rgba(139,115,85,0.12)', purple: 'rgba(155,126,196,0.15)', gold: 'rgba(201,169,110,0.15)', teal: 'rgba(94,160,167,0.15)', rose: 'rgba(196,123,139,0.15)' }[t] || 'rgba(139,115,85,0.12)';
  el.textContent = [
    '.var-update-box { margin:6px 0; border-radius:10px; padding:10px 14px; font-family:"DouyinSans",var(--font-main,sans-serif); font-size:11px; line-height:1.7; transition:all 0.3s; }',
    dark
      ? `.var-update-box { background:#1e1c17; border:1px solid rgba(255,255,255,0.06); color:#d4cee0; } .var-update-box summary { color:${accent}; font-family:"寒蝉全圆体",var(--font-main,sans-serif); font-size:11px; letter-spacing:1px; cursor:pointer; } .var-update-box details { color:#867e95; }`
      : `.var-update-box { background:rgba(139,115,85,0.03); border:1px solid ${accentDim}; color:#4a4035; } .var-update-box summary { color:${accent}; font-family:"寒蝉全圆体",var(--font-main,sans-serif); font-size:11px; letter-spacing:1px; cursor:pointer; } .var-update-box details { color:#8a7e6e; }`,
  ].join('\n');
}
const mirrorOpen = ref(false);
const mirrorDir = ref<'toMe' | 'toWorld'>('toMe');
const mxCustom = ref(false);
const mxTraits = ['傲娇','温柔','冷淡','活泼','腹黑','天然','病娇','慵懒','忠犬','高冷','毒舌','元气','邪魅','偏执','纯真','三无','冒失','小恶魔'];
const mxAbilities = ['剑术','魔法','神术','体术','幻术','锻造','医术','毒术','暗杀','读心','预知','不死','控火','御水','时空','魅惑','兽化','机关术'];
const mxRoles = ['剑圣','魔女','公主','圣女','骑士','精灵王','龙神','堕天使','死神','妖王','贤者','佣兵王','刺客','流浪武士','星界旅者'];
const mxCoreTraits = ['背负灭族之仇的末裔','流浪千年的观测者','被诅咒的不死者','失忆的前任神祇','逃出实验室的造物','隐居市井的古神'];
const mxAttitudes = ['冷漠','好奇','敌意','友善','崇拜','试探','困惑','漠然','警惕','亲近'];
const mxFandoms = ['哥布林杀手','原神','Fate','东方Project','明日方舟','崩坏星穹铁道','蔚蓝档案','葬送的芙莉莲','鬼灭之刃','咒术回战'];
const mxMarks = ['左眼封印','说话带古语腔','随身携带骨灰盒','异色瞳','身上有纹身','戴着面纱','半透明身体'];
const mxAcquaintances = ['未相识','已相识（主世界）','已相识（其他位面）','前世相识','梦中相识','宿命相连'];
const mxFandomMode = ref(false);
const mxIncludeChat = ref(false);
const mxGenerating = ref(false);
const mxGenResult = ref('');
const mxGenArchive = ref('');
const mxGenError = ref('');
const mxSavedToWB = ref(false);
const mxOpen = reactive({ basic: false, world: false, deep: false });
const mxForm = reactive({
  style: '', styleCustom: '', traits: [] as string[], traitInput: '',
  bodyType: '', bodyTypeCustom: '', race: '', raceCustom: '', age: '', ageCustom: '',
  origin: '', originCustom: '', role: '', roleCustom: '', fandom: '',
  abilities: [] as string[], abilityInput: '', coreTrait: '', coreTraitCustom: '', attitude: '', attitudeCustom: '', specialMark: '', specialMarkCustom: '', fandomCustom: '', fandomType: '', fandomTypeCustom: '', fandomDesc: '',
  acquaintance: '', acquaintanceCustom: '',
  other: ''
});
const pickedTraits = computed(() => mxForm.traits);
const pickedAbilities = computed(() => mxForm.abilities);
function mxToggleTag(arr: string[], t: string) { const i = arr.indexOf(t); if (i >= 0) arr.splice(i, 1); else arr.push(t); }
function mxAddCustom(arr: string[], v: string): string { const s = v.trim(); if (s && !arr.includes(s)) arr.push(s); return ''; }
function mxSend(msg: string) { const $p = (window as any).parent?.$; if (!$p) return; $p('#send_textarea').val(msg).trigger('input'); setTimeout(() => $p('#send_but').trigger('click'), 50); mirrorOpen.value = false; mxCustom.value = false; }
function mxRandom() { mxSend(mirrorDir.value === 'toMe' ? '使用母镜随机召唤一位红颜来到身边' : '使用母镜前往一位随机红颜所在的世界'); }
function mxCustomSummon() {
  const d = mxForm;
  const dir = mirrorDir.value === 'toMe' ? '使用母镜召唤一位红颜来到身边' : '使用母镜前往一位红颜所在的世界';
  const v = (s: string, c: string) => (s === '自定义' || !s) ? (c || '随机') : s;
  const obj: Record<string, any> = {
    外貌风格: v(d.style, d.styleCustom),
    性格特质: d.traits.length ? d.traits : ['随机'],
    体态身材: v(d.bodyType, d.bodyTypeCustom),
    种族: v(d.race, d.raceCustom),
    年龄感: v(d.age, d.ageCustom) || '随机',
    来源世界: v(d.origin, d.originCustom),
    天赋能力: d.abilities.length ? d.abilities : ['随机'],
    身份地位: v(d.role, d.roleCustom),
    同人: mxFandomMode.value
      ? { 类型: (d.fandomType === '自定义' ? d.fandomTypeCustom : d.fandomType) || '魔改向', 作品: v(d.fandom, d.fandomCustom) || '随机', 描述: d.fandomDesc || '无' }
      : (v(d.fandom, d.fandomCustom) || '原创'),
    核心特质: v(d.coreTrait, d.coreTraitCustom),
    初见态度: v(d.attitude, d.attitudeCustom),
    相识状态: v(d.acquaintance, d.acquaintanceCustom),
    特殊标记: d.specialMark === '自定义' ? (d.specialMarkCustom || '无') : (d.specialMark || '无'),
    其他补充: d.other || '无',
  };
  mxSend(dir + '\n' + JSON.stringify(obj, null, '  '));
}
const mxGenTemplate = `你正在通过母镜感知一位红颜的存在。镜中波纹荡漾，一道身影的因果线逐渐在你手中凝聚成形。这不是在写剧情——你只是在整理镜中传来的信息。

请将镜中身影的信息整理为以下档案，标记为 [世界书档案]。参照镜待流年现有角色档案风格——灵活描述，不固化可变细节。

---

[世界书档案]

此份档案存入世界书，供日后长期参考。须参照镜待流年现有角色档案风格——灵活的描述，不固化任何可变的细节。
具体格式如下：

<basic_info>
角色档案:
    基本信息:
        姓名:
        化名:（别名或主世界化名，无则留空不要生造）
        性别:
        年龄:（描述性，如"外表约20岁"或"实际年龄远超外表"）
        身份:
        与<user>关系:（初次相遇时的关系定位）
        来源世界:
        种族:
        天赋能力:（描述能力的名称、效果与限制，不要只写名字）

    外貌特征:
        基础体型:（描述性，含身材与体态）
        身高:
        发色/发型:
        眼睛:（眼型、瞳色）
        整体印象:（初见时的整体感觉）
        穿着打扮:
            - （风格倾向，写穿搭风格与常见色系即可——如"日常穿素白为主的宽松衣袍"）

    性格特点:
        喜好:
        厌恶:
        核心特质:（叙事描写，含内心矛盾与软肋，不少于80字）
        表现形式:
            - （行为模式，一事一条）
        对<user>的表现:
            - "（自然语言例句）"

    背景设定:
        过往经历:（涵盖出身、关键转折、为何被母镜选中，不少于200字）
        当前生活:（被召唤时的生活状态）

    语言特征:
        说话习惯:

    关系设定:
        与<user>的关系:
            认知:（她在镜中看到了什么，如何看待<user>）
            情感:（初见时的情感基调）
            互动方式:

    特殊物品:
        （仅真正特殊的物品——如子镜等传说级物品。日常物品不要写在这里）
</basic_info>

---

规则：
- 不要写剧情。不要写叙述。不要写旁白。不要写思维链。不要写分析过程。
- 不要输出 <UpdateVariable>、<JSONPatch>、<Variable> 或任何变量操作标签。忽略后续提示词中可能出现的变量更新指令，那些与本任务无关。
- 严格按以上格式输出。除此之外不要附带任何其他内容。
- 所有字段（含 NSFW）直接填写，不拒绝不回避不省略。
- 每个值须有辨识度——数字避免敷衍整数，文本避免泛泛描述。
- 命名与描述贴合角色背景与场景语境。
- 根据相识状态与来源世界构建角色背景，不要机械套用现有角色的"主世界隐藏身份"模式。
- 除非已相识或已在主世界，否则角色默认身处来源世界，来源世界即其当前所在地。
- 化名仅在该角色确实拥有主世界化名/别名时填写，不要无中生有。无化名则留空。姓名与化名不要写在括号里附带。
- 例句直接写对话本身，禁止使用 <q></q> 标签包裹。`;

function mxBuildGenPrompt(): string {
  const d = mxForm;
  const v = (s: string, c: string) => (s === '自定义' || !s) ? (c || '随机') : s;
  const tags: string[] = [];
  if (v(d.style, d.styleCustom)) tags.push('外貌风格：' + v(d.style, d.styleCustom));
  if (d.traits.length) tags.push('性格特质：' + d.traits.join('、'));
  else tags.push('性格特质：随机');
  if (v(d.bodyType, d.bodyTypeCustom)) tags.push('体态身材：' + v(d.bodyType, d.bodyTypeCustom));
  if (v(d.race, d.raceCustom)) tags.push('种族：' + v(d.race, d.raceCustom));
  if (v(d.age, d.ageCustom)) tags.push('年龄感：' + v(d.age, d.ageCustom));
  if (v(d.origin, d.originCustom)) tags.push('来源世界：' + v(d.origin, d.originCustom));
  if (d.abilities.length) tags.push('天赋能力：' + d.abilities.join('、'));
  else tags.push('天赋能力：随机');
  if (v(d.role, d.roleCustom)) tags.push('身份地位：' + v(d.role, d.roleCustom));
  if (v(d.coreTrait, d.coreTraitCustom)) tags.push('核心特质：' + v(d.coreTrait, d.coreTraitCustom));
  if (v(d.attitude, d.attitudeCustom)) tags.push('初见态度：' + v(d.attitude, d.attitudeCustom));
  if (v(d.acquaintance, d.acquaintanceCustom)) tags.push('相识状态：' + v(d.acquaintance, d.acquaintanceCustom));
  const mark = d.specialMark === '自定义' ? (d.specialMarkCustom || '无') : (d.specialMark || '无');
  if (mark !== '无') tags.push('特殊标记：' + mark);
  if (d.other.trim()) tags.push('其他补充：' + d.other.trim());
  if (mxFandomMode.value) {
    const ftype = d.fandomType === '自定义' ? (d.fandomTypeCustom || '魔改向') : (d.fandomType || '魔改向');
    tags.push('同人类型：' + ftype);
    if (v(d.fandom, d.fandomCustom)) tags.push('同人作品：' + v(d.fandom, d.fandomCustom));
    if (d.fandomDesc) tags.push('魔改描述：' + d.fandomDesc);
  } else if (v(d.fandom, d.fandomCustom) && v(d.fandom, d.fandomCustom) !== '原创') {
    tags.push('同人作品：' + v(d.fandom, d.fandomCustom));
  }
  const tagBlock = tags.map(t => '- ' + t).join('\n');
  return `使用母镜生成一位详细红颜人设。\n\n=== 已选标签 ===\n${tagBlock}\n\n${mxGenTemplate}`;
}

async function mxGenerateDetail() {
  mxGenError.value = '';
  mxGenResult.value = '';
  mxGenArchive.value = '';
  mxSavedToWB.value = false;
  mxGenerating.value = true;
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) { mxGenError.value = '未检测到酒馆助手，请确认已安装 Tavern Helper 扩展。'; return; }
    const prompt = mxBuildGenPrompt();
    const ordered: any[] = [
      { role: 'system', content: prompt },
      'persona_description',
      'char_description',
      'world_info_before',
      'world_info_after',
    ];
    if (mxIncludeChat.value) ordered.push('chat_history');
    ordered.push('user_input');
    const result = await TH.generateRaw({
      user_input: '（请按上述模板输出 [世界书档案] 。）',
      should_silence: true,
      max_chat_history: mxIncludeChat.value ? 6 : undefined,
      ordered_prompts: ordered,
    });
    const text = typeof result === 'string' ? result : (result.content || JSON.stringify(result));
    mxGenResult.value = text;
    const archMatch = text.match(/\[世界书档案\]\s*([\s\S]*)/);
    if (archMatch) mxGenArchive.value = archMatch[1].trim();
    else mxGenArchive.value = text;
  } catch (e: any) {
    mxGenError.value = e?.message || String(e);
  } finally {
    mxGenerating.value = false;
  }
}

async function mxSaveGenResult() {
  if (!mxGenArchive.value) return;
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) { mxGenError.value = '未检测到酒馆助手。'; return; }
    const nameMatch = mxGenArchive.value.match(/姓名[：:][^\S\n]*(\S+)/);
    let charName = nameMatch ? nameMatch[1].replace(/[（(].*$/, '') : '新红颜';
    const aliasMatch = mxGenArchive.value.match(/化名[：:][^\S\n]*(\S[^\n]*\S|\S)/);
    const alias = aliasMatch ? aliasMatch[1].replace(/[（(].*$/, '').trim() : '';
    const keys = [charName];
    if (alias) keys.push(alias);
    let wbName: string = TH.getCharLorebooks()?.primary;
    if (!wbName) {
      wbName = '镜待流年';
      await TH.createLorebook(wbName);
      await TH.setCurrentCharLorebooks({ primary: wbName });
    }
    const existing = await TH.getLorebookEntries(wbName);
    const genOrders = existing.map((e: any) => e.order ?? 0).filter((o: number) => o >= 1000 && o < 10000);
    const nextOrder = genOrders.length ? Math.max(...genOrders) + 5 : 1000;
    await TH.createLorebookEntries(wbName, [{
      comment: `镜渡生成 - ${charName}`,
      enabled: true,
      type: 'selective',
      keys,
      position: 'before_character_definition',
      order: nextOrder,
      probability: 100,
      exclude_recursion: true,
      prevent_recursion: true,
      content: mxGenArchive.value,
    }]);
    mxSavedToWB.value = true;
  } catch (e: any) {
    mxGenError.value = '保存失败：' + (e?.message || String(e));
  }
}
function mxInjectArchive() {
  if (!mxGenArchive.value) return;
  const dir = mirrorDir.value === 'toMe'
    ? '使用母镜召唤一位红颜来到身边。以下是镜中传来的信息：\n\n'
    : '使用母镜前往一位红颜所在的世界。以下是镜中传来的信息：\n\n';
  mxSend(dir + mxGenArchive.value);
}
const expandedChars = ref(new Set<string>());
const expandedSubs = ref(new Set<string>());
const clothDetail = ref(new Set<string>());
function toggleClothDetail(k: string) { const s = new Set(clothDetail.value); s.has(k) ? s.delete(k) : s.add(k); clothDetail.value = s; }

const themes = [
  { id: 'cream', name: '米白', color: '#d4c8b6' },
  { id: 'purple', name: '墨紫', color: '#7b5ea7' },
  { id: 'gold', name: '暖金', color: '#c9a96e' },
  { id: 'teal', name: '青黛', color: '#5ea0a7' },
  { id: 'rose', name: '绯红', color: '#c47b8b' },
] as const;

const userName = computed(() => {
  try { return (window as any).parent?.SillyTavern?.getContext?.()?.name1 || '{{user}}'; }
  catch { return '{{user}}'; }
});
const timeText = computed(() => isSet(data.value.世界.当前时间) ? data.value.世界.当前时间 : '序章');
const locationFull = computed(() => {
  const loc = data.value.世界.当前地点;
  const parts = [loc.位面, loc.大陆, loc.城市, loc.区域, loc.具体位置].filter(v => v && v !== '待设定');
  return parts.length > 0 ? parts.join(' · ') : '';
});

function isSet(v: unknown): boolean { return !!v && v !== '待设定' && v !== '待設定'; }
function loveIcon(val: number): string {
  if (val >= 100) return '💖';
  if (val >= 80) return '❤️❤️❤️❤️❤️';
  if (val >= 60) return '❤️❤️❤️❤️';
  if (val >= 40) return '❤️❤️❤️';
  if (val >= 20) return '❤️❤️';
  if (val >= 1) return '❤️';
  return '🤍';
}
function toggleChar(k: string) { const s = new Set(expandedChars.value); s.has(k) ? s.delete(k) : s.add(k); expandedChars.value = s; }
function sub(k: string) { return expandedSubs.value.has(k); }
function toggleSub(k: string) { const s = new Set(expandedSubs.value); s.has(k) ? s.delete(k) : s.add(k); expandedSubs.value = s; }

const protagClothing = computed(() => {
  const c: Record<string, { 名称?: string; 描述?: string; 状态?: string }> = data.value.主角.服装 || {};
  return ['上衣','内衣','下装','内裤','袜子','鞋子'].filter(k => c[k] !== undefined).map(k => ({ key: k, 名称: c[k]?.名称 || '', 描述: c[k]?.描述 || '', 状态: c[k]?.状态 || '' }));
});
const itemEntries = computed(() => Object.entries(data.value.主角.随身物品 || {}) as [string, { 描述?: string; 数量?: number }][]);
const relationEntries = computed(() => Object.entries(data.value.主角.人际关系 || {}) as [string, string][]);

type CharInfo = {
  性别?: string; 年龄?: number; 种族?: string; 来源世界?: string;
  喜好?: string; 厌恶?: string; 外貌特征?: string; 基础体型?: string; 天赋能力?: string;
  好感度?: number; 财富?: number; 境界?: string; 所在位置?: string;
  服装?: Record<string, { 名称?: string; 描述?: string; 状态?: string }>; 随身物品?: Record<string, { 描述?: string; 数量?: number }>;
  人际关系?: Record<string, string>;
  nsfw档案?: { 初次存在与否?: boolean; 性对象?: string; 是否怀孕?: boolean; 子嗣列表?: string };
};
interface NearbyChar {
  _key: string; name: string;
  性别?: string; 年龄?: number; 种族?: string; 来源世界?: string;
  喜好?: string; 厌恶?: string; 外貌特征?: string; 基础体型?: string; 天赋能力?: string;
  好感度: number; 财富?: number; 境界?: string; 所在位置?: string;
  服装?: Record<string, { 名称?: string; 描述?: string; 状态?: string }>; 随身物品?: Record<string, { 描述?: string; 数量?: number }>;
  人际关系?: Record<string, string>;
  nsfw档案?: { 初次存在与否?: boolean; 性对象?: string; 是否怀孕?: boolean; 子嗣列表?: string };
}

function presOrder(p: string): number { return p === 'present' ? 0 : p === 'nearby' ? 1 : 2; }

const allChars = computed<NearbyChar[]>(() => {
  const chars: NearbyChar[] = [];
  const rec = (data.value as any).角色名录 || {};
  for (const [name, info] of Object.entries(rec as Record<string, CharInfo | undefined>)) {
    if (info) chars.push({ _key: name, name, 好感度: info.好感度 ?? 0, ...info });
  }
  chars.sort((a, b) => {
    const pa = presOrder(presence(a));
    const pb = presOrder(presence(b));
    if (pa !== pb) return pa - pb;
    return b.好感度 - a.好感度;
  });
  return chars;
});

function presence(char: NearbyChar): string {
  const here = data.value.世界.当前地点.具体位置;
  const charLoc: string = char.所在位置 || '';
  if (!isSet(here) || !isSet(charLoc)) return 'absent';
  if (charLoc === here || charLoc.includes(here) || here.includes(charLoc)) return 'present';
  if (isSet(data.value.世界.当前地点.城市) && charLoc.includes(data.value.世界.当前地点.城市)) return 'nearby';
  return 'absent';
}
function presenceText(char: NearbyChar): string {
  const c = presence(char); return c === 'present' ? '在场' : c === 'nearby' ? '附近' : '不在';
}
function getCharClothing(char: NearbyChar): { key: string; 名称: string; 描述: string; 状态: string }[] {
  const c: Record<string, { 名称?: string; 描述?: string; 状态?: string }> = char.服装 || {};
  return ['上衣','内衣','下装','内裤','袜子','鞋子'].filter(k => c[k] !== undefined).map(k => ({ key: k, 名称: c[k]?.名称 || '', 描述: c[k]?.描述 || '', 状态: c[k]?.状态 || '' }));
}
function getCharItems(char: NearbyChar): [string, { 描述?: string; 数量?: number }][] { return Object.entries(char.随身物品 || {}); }
function getCharRelations(char: NearbyChar): [string, string][] { return Object.entries(char.人际关系 || {}); }
</script>

<style lang="scss" scoped>
@import url("https://fontsapi.zeoseven.com/3/main/result.css");
@import url("https://fontsapi.zeoseven.com/84/main/result.css");
.status-bar {
  --t-bg: #faf7f0; --t-surface: #f5f0e8; --t-surface-open: #ede6d8; --t-surface-deep: #e8e0d0;
  --t-border: rgba(0,0,0,0.08); --t-accent: #8b7355; --t-accent-dim: rgba(139,115,85,0.15);
  --t-gold: #a08060; --t-text: #4a4035; --t-muted: #8a7e6e; --t-dim: #b8a898;
  --t-stripe: rgba(139,115,85,0.25); --t-mist: rgba(139,115,85,0.03);
  --t-radius: 10px; --t-radius-sm: 6px;
  --g-nav: linear-gradient(135deg, #d4d4dc, #b0b4bc, #8a8e98, #686c78);
  --g-loc: linear-gradient(135deg, #a0cce8, #78b0d4, #5a90b8, #3a6e98, #285880);
  --g-label: linear-gradient(135deg, #e8d8b0, #d4c490, #b8a470, #a08858, #8a7048);
  --g-sec: linear-gradient(135deg, #e8d0a8, #d4ba90, #b89868, #a07850, #886838);
  --g-sub: linear-gradient(135deg, #98d8d8, #6ebebe, #4a9e9e, #307878, #206060);
  --g-desc: linear-gradient(135deg, #e0e0e6, #c0c4cc, #989ca8, #707480, #585c68);
  --g-val: linear-gradient(135deg, #b8d8f0, #88bce0, #5a90c0, #3a68a0, #285080);
  --g-keep: inherit;
  width: 100%; max-width: 420px; margin: 0 auto;
  background: var(--t-bg); color: var(--t-text);
  font-family: var(--font-main); font-size: 12px; line-height: 1.6;
  user-select: none; border-radius: var(--t-radius); overflow: hidden;

  &.theme-purple {
    --t-bg:#1e1a24; --t-surface:#252131; --t-surface-open:#2d2838; --t-surface-deep:#1f1c26;
    --t-border:rgba(255,255,255,0.06); --t-accent:#9b7ec4; --t-accent-dim:rgba(155,126,196,0.25);
    --t-gold:#b8a0d4; --t-text:#d4cee0; --t-muted:#867e95; --t-dim:#5c5668;
    --t-stripe:rgba(155,126,196,0.3); --t-mist:rgba(155,126,196,0.02);
  }
  &.theme-gold {
    --t-accent:#c9a96e; --t-accent-dim:rgba(201,169,110,0.25); --t-gold:#d4b878;
    --t-surface:#25221c; --t-surface-open:#2d2922; --t-bg:#1e1c17; --t-surface-deep:#1d1b16;
    --t-border:rgba(255,255,255,0.06); --t-text:#d4cee0; --t-muted:#867e95; --t-dim:#5c5668;
    --t-stripe:rgba(201,169,110,0.3); --t-mist:rgba(201,169,110,0.02);
  }
  &.theme-teal {
    --t-accent:#5ea0a7; --t-accent-dim:rgba(94,160,167,0.25); --t-gold:#6eb8bf;
    --t-surface:#1c2325; --t-surface-open:#222b2d; --t-bg:#171e20; --t-surface-deep:#161d1e;
    --t-border:rgba(255,255,255,0.06); --t-text:#d4cee0; --t-muted:#867e95; --t-dim:#5c5668;
    --t-stripe:rgba(94,160,167,0.3); --t-mist:rgba(94,160,167,0.02);
  }
  &.theme-rose {
    --t-accent:#c47b8b; --t-accent-dim:rgba(196,123,139,0.25); --t-gold:#d08b99;
    --t-surface:#251c1f; --t-surface-open:#2d2225; --t-bg:#1e181a; --t-surface-deep:#1c1719;
    --t-border:rgba(255,255,255,0.06); --t-text:#d4cee0; --t-muted:#867e95; --t-dim:#5c5668;
    --t-stripe:rgba(196,123,139,0.3); --t-mist:rgba(196,123,139,0.02);
  }
}
.master-bar { display:flex; align-items:center; gap:8px; padding:8px 12px; cursor:pointer; background:var(--t-surface); position:relative; overflow:hidden;
  &::after { content:''; position:absolute; top:-50%; right:-20%; width:160px; height:120px; border-radius:50%; background:var(--t-accent); opacity:0.03; filter:blur(30px); pointer-events:none; }
  &:hover { background:var(--t-surface-open); } }
.master-info { font-family: '寒蝉全圆体', var(--font-main); flex:1; font-size:10px; color:var(--t-gold); letter-spacing:0.5px; position:relative; z-index:1; }
.master-arrow { font-size:10px; color:var(--t-dim); position:relative; z-index:1; }
.brand { font-family: '寒蝉全圆体', var(--font-main); font-size:10px; letter-spacing:2px; color:var(--t-accent); font-weight:600; position:relative; z-index:1; }
.main-body { border-top:1px solid var(--t-border); position:relative; }
.main-body::before { content:''; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(ellipse at 50% 0%, var(--t-mist) 0%, transparent 70%),
             radial-gradient(ellipse at 85% 100%, var(--t-mist) 0%, transparent 50%);
  z-index:0; }
.settings-bar { display:flex; justify-content:flex-end; padding:4px 12px; background:var(--t-surface); border-bottom:1px solid var(--t-border); }
.gear-btn { background:none; border:none; color:var(--t-muted); cursor:pointer; font-size:10px; padding:2px 6px; border-radius:var(--t-radius-sm); letter-spacing:0.5px;
  &:hover { color:var(--t-accent); background:var(--t-accent-dim); } }
.theme-picker { display:flex; gap:8px; padding:5px 12px; background:var(--t-surface); border-bottom:1px solid var(--t-border); }
.theme-dot { width:18px; height:18px; border-radius:50%; border:2px solid transparent; cursor:pointer; transition:all 0.2s;
  &.active { border-color:var(--t-text); transform:scale(1.2); } &:hover { transform:scale(1.15); } }
.time-bar { font-family: '寒蝉全圆体', var(--font-main); padding:10px 14px 2px; font-size:14px; font-weight:700; color:var(--t-gold); letter-spacing:1px; background:var(--t-bg); }
.world-loc { font-family: 'DouyinSans', var(--font-main); padding:2px 14px 6px; font-size:10px; color:var(--t-muted); background:var(--t-bg); }

.stat-row-inline { display:flex; flex-wrap:wrap; gap:10px; padding:4px 0 6px; }
.stat-item { font-family: '寒蝉全圆体', var(--font-main); font-size:10px; color:var(--t-dim); letter-spacing:1px; b { font-family: 'DouyinSans', var(--font-main); font-size:12px; color:var(--t-text); } }

.block { margin:0 8px 6px; border-radius:var(--t-radius); background:var(--t-surface); box-shadow:0 0 0 1px var(--t-border); overflow:hidden; position:relative; z-index:1;
  &.open { background:var(--t-surface-open); } }
.block-head { display:flex; align-items:center; gap:6px; padding:8px 12px; cursor:pointer; border-left:2px solid var(--t-stripe); transition:all 0.15s;
  &:hover { background:rgba(0,0,0,0.04); border-left-color:var(--t-accent); } }
.block-title { font-family: '寒蝉全圆体', var(--font-main); font-weight:600; font-size:12px; color:var(--t-accent); letter-spacing:0.5px; }
.block-sub { font-family: '寒蝉全圆体', var(--font-main); font-size:10px; color:var(--t-muted); flex:1; text-align:right; margin-right:4px; }
.block-arrow { font-size:9px; color:var(--t-dim); margin-left:auto; &.small { font-size:8px; } }
.block-body { padding:0 12px 10px; position:relative; z-index:1; }

.sub-block { margin-top:5px; border-radius:var(--t-radius-sm); background:var(--t-surface-deep); box-shadow:0 0 0 1px var(--t-border); overflow:hidden; position:relative; z-index:1;
  &.open { background:var(--t-surface); } }
.sub-head { display:flex; align-items:center; justify-content:space-between; padding:6px 10px; cursor:pointer; font-size:11px; color:var(--t-muted); border-left:2px solid var(--t-stripe); transition:all 0.15s; font-family: '寒蝉全圆体', var(--font-main); letter-spacing:1px;
  &:hover { background:rgba(0,0,0,0.05); color:var(--t-text); border-left-color:var(--t-accent); } }
.sub-body { padding:6px 10px 8px; }

.cloth-list { display:flex; flex-direction:column; gap:3px; }
.cloth-row { display:flex; align-items:center; gap:8px; padding:4px 8px; background:var(--t-bg); box-shadow:0 0 0 1px var(--t-border); border-radius:var(--t-radius-sm); cursor:pointer; transition:background 0.15s;
  &:hover { background:var(--t-surface-deep); } }
.cloth-key { font-family: '寒蝉全圆体', var(--font-main); font-size:10px; color:var(--t-dim); letter-spacing:0.5px; min-width:28px; }
.cloth-val { font-family: 'DouyinSans', var(--font-main); font-size:11px; color:var(--t-text); flex:1; &.dim { color:var(--t-dim); } }
.cloth-status { font-family: '寒蝉全圆体', var(--font-main); font-size:8px; color:var(--t-accent); background:var(--t-accent-dim); padding:1px 8px; border-radius:9999px; font-weight:500; letter-spacing:0.5px; }
.cloth-detail { font-family: 'DouyinSans', var(--font-main); font-size:10px; color:var(--t-muted); padding:2px 8px 4px 36px; line-height:1.5; }

.info-grid { display:flex; flex-wrap:wrap; column-gap:10px; row-gap:2px; padding:2px 0; }
.info-cell { font-family: '寒蝉全圆体', var(--font-main); font-size:10px; color:var(--t-dim); letter-spacing:0.5px; b { font-family: 'DouyinSans', var(--font-main); color:var(--t-text); font-weight:600; font-size:12px; } }

.item-card { display:flex; align-items:center; gap:6px; padding:4px 6px; border-radius:var(--t-radius-sm); background:var(--t-bg); border:1px solid var(--t-border); margin-bottom:3px; }
.item-name { font-family: 'DouyinSans', var(--font-main); font-size:11px; font-weight:600; color:var(--t-accent); white-space:nowrap; }
.item-desc { font-family: 'DouyinSans', var(--font-main); font-size:10px; color:var(--t-muted); flex:1; }
.item-qty { font-family: '寒蝉全圆体', var(--font-main); font-size:10px; color:var(--t-gold); font-weight:600; }

.char-entry { margin-top:4px; }
.char-row { display:flex; align-items:center; gap:6px; padding:6px 8px; cursor:pointer; border-radius:var(--t-radius-sm); background:var(--t-surface); border:1px solid var(--t-border);
  &:hover { background:var(--t-surface-open); } }
.char-name { font-family: 'DouyinSans', var(--font-main); font-weight:600; font-size:12px; color:var(--t-accent); }
.char-hearts { color:#e07080; font-size:12px; min-width:36px; }
.char-presence { font-family: '寒蝉全圆体', var(--font-main); font-size:8px; margin-left:auto; padding:1px 8px; border-radius:9999px; font-weight:500; letter-spacing:0.5px;
  &.present { color:#4a7a4a; background:rgba(100,160,100,0.12); }
  &.nearby { color:#8a6a20; background:rgba(200,160,60,0.12); }
  &.absent { color:var(--t-dim); background:rgba(128,128,128,0.08); } }
.char-row .block-arrow { margin-left:4px; }
.char-detail { padding:8px 4px 4px; }

.info-line { font-size:11px; color:var(--t-muted); padding:2px 0; line-height:1.5; }
.info-label { font-family: '寒蝉全圆体', var(--font-main); color:var(--t-dim); font-size:10px; letter-spacing:0.5px; }
.info-value { font-family: 'DouyinSans', var(--font-main); font-size:11px; color:var(--t-text); }
.empty-hint { font-family: '寒蝉全圆体', var(--font-main); text-align:center; font-size:10px; color:var(--t-dim); padding:6px 0; letter-spacing:1px; }
.info-card { background:var(--t-bg); border:1px solid var(--t-border); border-radius:var(--t-radius-sm); padding:6px 8px; }
.nsfw-grid { display:flex; flex-wrap:wrap; column-gap:10px; row-gap:2px; background:var(--t-bg); border:1px solid var(--t-border); border-radius:var(--t-radius-sm); padding:6px 8px; }
.nsfw-cell { font-family: '寒蝉全圆体', var(--font-main); font-size:10px; color:var(--t-dim); letter-spacing:0.5px; b { font-family: 'DouyinSans', var(--font-main); color:var(--t-text); font-weight:600; font-size:12px; } }

/* 镜渡面板 */
.mirror-item { cursor:pointer; &:hover { border-color: var(--t-accent); } }
.mirror-item .item-name { background:linear-gradient(135deg, #6b4a28, #8b5a30, #7a5030, #6b4a28); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; font-weight:700; }
.mirror-item.mirror-open { background: var(--t-accent-dim); border-color: var(--t-accent); }
.mirror-toggle { font-size:8px; background:linear-gradient(135deg, #6b4a28, #8b5a30); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; margin-left:4px; }
.mirror-panel {
  --m-accent: #c9a96e; --m-accent-dim: rgba(201,169,110,0.2); --m-glow: rgba(201,169,110,0.1);
  --m-surface: linear-gradient(165deg, #f5ede0 0%, #ede4d4 40%, #f0e8d8 100%);
  --m-text: #4a4035; --m-muted: #8a7e6e; --m-dim: #b8a898;
  --m-rose: #c47b8b; --m-rose-dim: rgba(196,123,139,0.2);
  --m-teal: #5ea0a7; --m-teal-dim: rgba(94,160,167,0.18);
  padding:4px 0 6px;
  &.theme-red { --m-accent: var(--m-rose); --m-accent-dim: var(--m-rose-dim); --m-surface: linear-gradient(165deg, #251c1f 0%, #2d2025 50%, #221a1e 100%); --m-text: #e0d0d8; --m-muted: #b098a0; --m-dim: #786068; }
  &.theme-teal { --m-accent: var(--m-teal); --m-accent-dim: var(--m-teal-dim); --m-surface: linear-gradient(165deg, #1c2325 0%, #20282d 50%, #1a2123 100%); --m-text: #d0dce0; --m-muted: #98a8b0; --m-dim: #607078; }
}
.mirror-frame {
  position:relative; border-radius:12px; padding:4px;
  background:linear-gradient(145deg,#8b7355,#6b5a48 25%,#c9a96e 50%,#6b5a48 75%,#8b7355);
  box-shadow:0 0 24px rgba(201,169,110,0.15);
}
.frame-ring,.frame-inset { position:absolute; border-radius:10px; border:1px solid rgba(201,169,110,0.25); pointer-events:none; }
.frame-ring { inset:4px; }
.frame-inset { inset:8px; border-color:rgba(201,169,110,0.1); }
.mirror-surface {
  position:relative; z-index:1; border-radius:9px; padding:14px 12px 10px;
  background:var(--m-surface); overflow:hidden;
  &::before {
    content:''; position:absolute; top:-50%; left:-50%; width:200%; height:200%; z-index:0; pointer-events:none;
    background:radial-gradient(circle at center, rgba(201,169,110,0.08) 0%, transparent 40%);
    animation: mirrorGlow 3s ease-in-out infinite;
  }
}
@keyframes mirrorGlow {
  0%,100% { transform:scale(1); opacity:0.6; }
  50% { transform:scale(1.15); opacity:1; }
}
.mirror-mist { position:absolute; border-radius:50%; filter:blur(35px); pointer-events:none; }
.mist-1 { width:120px; height:70px; background:#c9a96e; opacity:0.08; top:-20px; right:-25px; }
.mist-2 { width:90px; height:60px; background:#8b7355; opacity:0.06; bottom:5px; left:-15px; }
.panel-title { font-family: '寒蝉全圆体', var(--font-main); text-align:center; font-size:18px; font-weight:700; letter-spacing:6px; position:relative; z-index:1;
  background:linear-gradient(135deg, #6b4a28 0%, #8b5a30 40%, #6b4a28 60%, #8b5a30 100%);
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.panel-sub { font-family: '寒蝉全圆体', var(--font-main); text-align:center; font-size:9px; color:var(--m-accent); letter-spacing:2px; margin-bottom:8px; position:relative; z-index:1; }
.direction-toggle { display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:8px; position:relative; z-index:1; }
.toggle-btn { background:none; border:none; font-family: '寒蝉全圆体', var(--font-main); font-size:9px; color:var(--m-muted); cursor:pointer; letter-spacing:1px; padding:3px 8px; border-radius:6px; transition:all 0.2s;
  &.active { color:#fff; background:var(--m-accent); font-weight:600; } }
.toggle-track { width:30px; height:16px; background:rgba(139,115,85,0.12); border-radius:8px; cursor:pointer; position:relative; }
.toggle-thumb { width:12px; height:12px; border-radius:50%; background:var(--m-accent); position:absolute; top:2px; left:2px; transition:left 0.25s;
  &.toWorld { left:16px; } }
.btn-random { display:flex; align-items:center; justify-content:center; gap:6px; width:100%; padding:10px 0; margin-bottom:6px; background:var(--m-accent-dim); border:1px solid var(--m-accent); border-radius:8px; cursor:pointer; position:relative; z-index:1; color:var(--m-accent); font-family: '寒蝉全圆体', var(--font-main); font-size:12px; font-weight:600; letter-spacing:3px; transition:all 0.2s;
  &:hover { background:var(--m-accent); color:#fff; } }
.btn-icon { font-size:10px; }
.btn-custom-toggle { display:flex; align-items:center; gap:6px; width:100%; padding:7px 0; background:none; border:1px dashed var(--m-accent-dim); border-radius:8px; cursor:pointer; color:var(--m-accent); font-family: '寒蝉全圆体', var(--font-main); font-size:10px; letter-spacing:2px; transition:all 0.2s; position:relative; z-index:1;
  &:hover { border-color:var(--m-accent); border-style:solid; } }
.custom-form { display:flex; flex-direction:column; gap:5px; margin-top:6px; padding:10px; background:rgba(139,115,85,0.04); border:1px solid rgba(139,115,85,0.1); border-radius:8px; }
.form-section { padding:6px 8px; background:rgba(139,115,85,0.06); border-radius:6px; cursor:pointer; font-family: '寒蝉全圆体', var(--font-main); font-size:10px; color:var(--m-muted); letter-spacing:1px; transition:background 0.15s; user-select:none;
  &:hover { background:rgba(139,115,85,0.12); } }
.mx-arrow { display:inline-block; transition:transform 0.2s; font-size:10px; margin-right:2px; &.open { transform:rotate(90deg); } }
.section-body { display:flex; flex-direction:column; gap:5px; padding-top:4px; }
.mx-mode-toggle { font-size:8px; color:var(--m-accent); cursor:pointer; background:var(--m-accent-dim); padding:1px 6px; border-radius:8px; margin-left:4px; transition:all 0.15s; &:hover { background:var(--m-accent); color:#fff; } }
.mx-fandom-simple { display:flex; flex-direction:column; gap:5px; }
.mx-fandom-simple select,.mx-fandom-simple input { padding:5px 8px; border-radius:6px; border:1px solid rgba(139,115,85,0.15); background:rgba(255,255,255,0.6); color:#4a4035; font-family:'DouyinSans',var(--font-main); font-size:10px; outline:none;
  &:focus { border-color:var(--m-accent); } }
.mx-fandom-ext { display:flex; flex-direction:column; gap:4px; padding:6px; background:rgba(139,115,85,0.04); border:1px solid rgba(139,115,85,0.1); border-radius:6px; }
.mx-fandom-ext select,.mx-fandom-ext input { padding:5px 8px; border-radius:6px; border:1px solid rgba(139,115,85,0.15); background:rgba(255,255,255,0.6); color:var(--m-text); font-family:'DouyinSans',var(--font-main); font-size:10px; outline:none;
  &:focus { border-color:var(--m-accent); } }
.tag-custom { border-style:dashed!important; display:inline-flex; align-items:center; }
.tag-custom { display:inline-flex; align-items:center; gap:1px; }
.tag-custom input { width:54px; height:16px; line-height:16px; border:none; background:transparent; font-family:inherit; font-size:9px; color:var(--m-muted); outline:none; text-align:center; padding:0; &::placeholder { color:var(--m-dim); } }
.tag-custom-btn { width:16px; height:16px; border:none; border-radius:50%; background:var(--m-accent-dim); color:var(--m-accent); font-size:10px; line-height:16px; cursor:pointer; padding:0; display:inline-flex; align-items:center; justify-content:center; transition:all 0.12s;
  &:hover { background:var(--m-accent); color:#fff; } }
.form-row { display:flex; flex-direction:column; gap:3px;
  label { font-family: '寒蝉全圆体', var(--font-main); font-size:9px; color:var(--m-muted); letter-spacing:1px; }
  select,input { padding:5px 8px; border-radius:6px; border:1px solid rgba(139,115,85,0.15); background:rgba(255,255,255,0.6); color:#4a4035; font-family: 'DouyinSans', var(--font-main); font-size:10px; outline:none;
    &:focus { border-color:var(--m-accent); } } }
.tag-pool { display:flex; flex-wrap:wrap; gap:4px; }
.tag { padding:2px 8px; border-radius:10px; border:1px solid rgba(139,115,85,0.15); font-family: 'DouyinSans', var(--font-main); font-size:9px; color:var(--m-muted); cursor:pointer; transition:all 0.12s;
  &:hover { border-color:var(--m-accent); color:var(--m-accent); }
  &.picked { background:var(--m-accent-dim); border-color:var(--m-accent); color:var(--m-accent); font-weight:600; } }
.btn-send { flex:1; padding:8px 0; background:var(--m-accent); border:none; border-radius:8px; cursor:pointer; color:#fff; font-family: '寒蝉全圆体', var(--font-main); font-size:12px; font-weight:700; letter-spacing:2px; transition:opacity 0.2s;
  &:hover { opacity:0.85; } }
.btn-gen { flex:1.3; padding:8px 0; background:var(--m-accent-dim); border:1px solid var(--m-accent); border-radius:8px; cursor:pointer; color:var(--m-accent); font-family: '寒蝉全圆体', var(--font-main); font-size:10px; font-weight:600; letter-spacing:1px; transition:all 0.2s;
  &:hover:not(:disabled) { background:var(--m-accent); color:#fff; }
  &:disabled { opacity:0.5; cursor:not-allowed; } }
.mx-other-input { padding:5px 8px; border-radius:6px; border:1px solid rgba(139,115,85,0.15); background:rgba(255,255,255,0.6); color:#4a4035; font-family: 'DouyinSans', var(--font-main); font-size:10px; outline:none; resize:vertical; min-height:50px;
  &:focus { border-color:var(--m-accent); }
  &::placeholder { color:var(--m-dim); } }
.mx-gen-row { display:flex; align-items:center; justify-content:flex-end; padding:2px 0; }
.mx-save-toggle { display:inline-flex; align-items:center; gap:4px; cursor:pointer; user-select:none;
  input[type="checkbox"] { accent-color:var(--m-accent); width:12px; height:12px; cursor:pointer; }
  .toggle-label { font-family: '寒蝉全圆体', var(--font-main); font-size:8px; color:var(--m-muted); letter-spacing:1px; transition:color 0.15s; }
  &:hover .toggle-label { color:var(--m-accent); } }
.btn-row { display:flex; gap:6px; margin-top:4px; }
.mx-gen-status { text-align:center; padding:8px; font-family: '寒蝉全圆体', var(--font-main); font-size:10px; color:var(--m-muted); letter-spacing:1px;
  &.error { color:var(--m-rose); } }
.gen-spinner { display:inline-block; width:12px; height:12px; border:2px solid var(--m-accent-dim); border-top-color:var(--m-accent); border-radius:50%; animation:spin 0.8s linear infinite; margin-right:6px; vertical-align:middle; }
@keyframes spin { to { transform:rotate(360deg); } }
.mx-gen-result { margin-top:6px; padding:0; background:rgba(139,115,85,0.06); border:1px solid rgba(139,115,85,0.12); border-radius:8px; overflow:hidden; }
.gen-result-label { font-family: '寒蝉全圆体', var(--font-main); font-size:9px; color:var(--m-accent); letter-spacing:2px; padding:6px 8px; border-bottom:1px solid rgba(139,115,85,0.1); }
.gen-result-text { display:block; width:100%; min-height:180px; max-height:300px; overflow-y:auto; white-space:pre-wrap; font-family: 'DouyinSans', var(--font-main); font-size:10px; color:var(--m-text); line-height:1.7; padding:8px; background:rgba(255,255,255,0.3); border:1px solid rgba(139,115,85,0.12); border-radius:6px; resize:vertical; outline:none;
  &:focus { border-color:var(--m-accent); } }
.gen-result-actions { display:flex; gap:6px; margin-top:6px; padding:0 4px 4px; align-items:center; }
.btn-gen-save { padding:5px 12px; background:var(--m-accent); border:none; border-radius:6px; cursor:pointer; color:#fff; font-family: '寒蝉全圆体', var(--font-main); font-size:9px; letter-spacing:1px; transition:opacity 0.15s;
  &:hover { opacity:0.85; } }
.btn-gen-inject { padding:5px 12px; background:none; border:1px solid var(--m-accent); border-radius:6px; cursor:pointer; color:var(--m-accent); font-family: '寒蝉全圆体', var(--font-main); font-size:9px; letter-spacing:1px; transition:all 0.15s;
  &:hover { background:var(--m-accent); color:#fff; } }
.btn-gen-retry { padding:5px 12px; background:none; border:1px solid var(--m-accent-dim); border-radius:6px; cursor:pointer; color:var(--m-muted); font-family: '寒蝉全圆体', var(--font-main); font-size:9px; letter-spacing:1px; transition:all 0.15s;
  &:hover { border-color:var(--m-accent); color:var(--m-accent); } }
.gen-saved-hint { font-family: '寒蝉全圆体', var(--font-main); font-size:9px; color:var(--m-accent); letter-spacing:1px; }
</style>
