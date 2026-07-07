<template>
  <div class="mirror-panel" :class="mirrorDir === 'toMe' ? 'theme-red' : 'theme-teal'">
    <div class="mirror-frame">
      <div class="frame-ring"></div>
      <div class="frame-inset"></div>
      <div class="mirror-surface">
        <div class="panel-title">镜 渡</div>

        <div class="mirror-tabs">
          <button :class="{ active: activeTab === 'lady' }" @click="switchTab('lady')">镜渡红颜</button>
          <button :class="{ active: activeTab === 'plane' }" @click="switchTab('plane')">镜渡位面</button>
          <button :class="{ active: activeTab === 'npc' }" @click="switchTab('npc')">镜渡众生</button>
        </div>

        <!-- Tab-specific header -->
        <div class="panel-sub">{{ tabLabel }}</div>
        <div v-if="activeTab !== 'plane'" class="direction-toggle">
          <button class="toggle-btn" :class="{ active: mirrorDir === 'toMe' }" @click="mirrorDir = 'toMe'">
            召唤来此
          </button>
          <div class="toggle-track" @click="mirrorDir = mirrorDir === 'toMe' ? 'toWorld' : 'toMe'">
            <div class="toggle-thumb" :class="mirrorDir"></div>
          </div>
          <button class="toggle-btn" :class="{ active: mirrorDir === 'toWorld' }" @click="mirrorDir = 'toWorld'">
            前往彼方
          </button>
        </div>
        <!-- Plane form (always visible, different from lady/npc form) -->
        <div v-if="activeTab === 'plane'" class="custom-section">
          <div class="form-section" @click="plOpen.basic = !plOpen.basic">
            <span class="mx-arrow" :class="{ open: plOpen.basic }">▸</span> 位面设定
          </div>
          <div v-if="plOpen.basic" class="section-body">
            <div class="form-row">
              <label>位面名称</label><input v-model="plForm.name" placeholder="为空则随机生成…" />
            </div>
            <div class="form-row">
              <label>位面类型</label
              ><select v-model="plForm.type">
                <option value="">✨ 随机</option>
                <option value="自定义">自定义 ▼</option>
                <option>仙道</option>
                <option>洪荒</option>
                <option>西幻</option>
                <option>古风</option>
                <option>现代都市</option>
                <option>异世界</option>
                <option>深渊魔界</option>
                <option>妖灵</option>
                <option>幽冥</option>
                <option>科幻</option>
                <option>武侠</option>
                <option>神话</option>
                <option>末日废土</option>
                <option>赛博朋克</option>
                <option>蒸汽朋克</option>
                <option>克苏鲁</option>
                <option>魔法学院</option>
              </select>
            </div>
            <div v-if="plForm.type === '自定义'" class="form-row">
              <input v-model="plForm.typeCustom" placeholder="填写自定义类型…" />
            </div>
            <div class="form-row">
              <label>技术等级</label
              ><select v-model="plForm.techLevel">
                <option value="">随机</option>
                <option value="自定义">自定义 ▼</option>
                <option>原始（石器时代）</option>
                <option>古代（青铜/铁器）</option>
                <option>中古（冷兵器巅峰）</option>
                <option>近代（蒸汽/火药）</option>
                <option>现代（电力/信息）</option>
                <option>近未来（AI/义体）</option>
                <option>远未来（星际航行）</option>
                <option>超科技（超越理解）</option>
                <option>混合（不同区域差异极大）</option>
              </select>
            </div>
            <div v-if="plForm.techLevel === '自定义'" class="form-row">
              <input v-model="plForm.techLevelCustom" placeholder="填写自定义技术等级…" />
            </div>
            <div class="form-row">
              <label>魔法/灵力等级</label
              ><select v-model="plForm.magicLevel">
                <option value="">随机</option>
                <option value="自定义">自定义 ▼</option>
                <option>无（纯科技世界）</option>
                <option>低魔（罕见/微弱）</option>
                <option>中魔（常见但不主导）</option>
                <option>高魔（魔法即日常）</option>
                <option>超魔（魔力浸染一切）</option>
                <option>混合（因地而异）</option>
              </select>
            </div>
            <div v-if="plForm.magicLevel === '自定义'" class="form-row">
              <input v-model="plForm.magicLevelCustom" placeholder="填写自定义魔法等级…" />
            </div>
            <div class="form-row">
              <label>世界规模</label
              ><select v-model="plForm.worldScale">
                <option value="">随机</option>
                <option value="自定义">自定义 ▼</option>
                <option>单一大陆</option>
                <option>多大陆/海洋为主</option>
                <option>多位面/多维度</option>
                <option>星球级</option>
                <option>星系级</option>
                <option>单一城市/封闭空间</option>
              </select>
            </div>
            <div v-if="plForm.worldScale === '自定义'" class="form-row">
              <input v-model="plForm.worldScaleCustom" placeholder="填写自定义规模…" />
            </div>
            <div class="form-row">
              <label>智慧种族</label>
              <div class="tag-pool">
                <span
                  v-for="t in pickedPlRaces"
                  :key="'pr_' + t"
                  class="tag picked"
                  @click="mxToggleTag(plForm.races, t)"
                  >{{ t }}</span
                >
                <span
                  v-for="t in plRaces"
                  v-show="!plForm.races.includes(t)"
                  :key="'pra_' + t"
                  class="tag"
                  @click="mxToggleTag(plForm.races, t)"
                  >{{ t }}</span
                >
                <span class="tag tag-custom"
                  ><input
                    v-model="plForm.raceInput"
                    placeholder="自定义+"
                    @keyup.enter="plForm.raceInput = mxAddCustom(plForm.races, plForm.raceInput)"
                  /><button
                    class="tag-custom-btn"
                    @click="plForm.raceInput = mxAddCustom(plForm.races, plForm.raceInput)"
                  >
                    +
                  </button></span
                >
              </div>
            </div>
            <div class="form-row">
              <label>核心特质</label
              ><select v-model="plForm.planeTrait">
                <option value="">无</option><option value="自定义">自定义 ▼</option>
                <option>全女世界</option><option>熟女世界</option><option>萝莉世界</option>
                <option>兽娘世界</option><option>魔物娘世界</option><option>人外世界</option>
                <option>无魔世界</option><option>高魔世界</option><option>修仙世界</option>
                <option>武侠世界</option><option>战争世界</option><option>和平世界</option>
                <option>母系社会</option><option>女尊世界</option><option>ABO世界</option>
              </select>
            </div>
            <div v-if="plForm.planeTrait === '自定义'" class="form-row">
              <input v-model="plForm.planeTraitCustom" placeholder="填写自定义特质…" />
            </div>
            <div class="form-row">
              <label>历史阶段</label
              ><select v-model="plForm.historyPhase">
                <option value="">随机</option>
                <option value="自定义">自定义 ▼</option>
                <option>创世初期</option>
                <option>上古时代</option>
                <option>黄金时代（巅峰）</option>
                <option>动荡时期</option>
                <option>衰落时期</option>
                <option>变革前夕</option>
                <option>战后重建</option>
                <option>末世边缘</option>
              </select>
            </div>
            <div v-if="plForm.historyPhase === '自定义'" class="form-row">
              <input v-model="plForm.historyPhaseCustom" placeholder="填写自定义历史阶段…" />
            </div>
            <div class="form-row">
              <label>核心特征</label
              ><textarea
                v-model="plForm.coreFeature"
                placeholder="描述位面的核心特征、独特规则、历史背景…"
                class="mx-other-input"
              ></textarea>
            </div>
            <div class="form-row">
              <label>关联角色（可选）</label
              ><input v-model="plForm.linkedChars" placeholder="关联已有角色的姓名，逗号分隔…" />
            </div>
            <div class="form-row">
              <label
                >同人作品
                <span class="mx-mode-toggle" @click="plFandomMode = !plFandomMode">{{
                  plFandomMode ? '⟲ 简单' : '⟳ 魔改'
                }}</span></label
              >
              <div v-if="!plFandomMode" class="mx-fandom-simple">
                <select v-model="plForm.fandom">
                  <option value="">原创</option>
                  <option value="自定义">自定义 ▼</option>
                  <option v-for="t in mxFandoms" :key="'pf_' + t" :value="t">{{ t }}</option>
                </select>
                <div v-if="plForm.fandom === '自定义'">
                  <input v-model="plForm.fandomCustom" placeholder="填写作品名…" />
                </div>
              </div>
              <div v-if="plFandomMode" class="mx-fandom-ext">
                <select v-model="plForm.fandomType">
                  <option value="">魔改向</option>
                  <option value="自定义">自定义 ▼</option>
                  <option>原作向</option>
                  <option>魔改向</option>
                  <option>反转向</option>
                </select>
                <div v-if="plForm.fandomType === '自定义'" class="form-row">
                  <input v-model="plForm.fandomTypeCustom" placeholder="填写类型…" />
                </div>
                <select v-model="plForm.fandom">
                  <option value="">选择作品</option>
                  <option value="自定义">自定义 ▼</option>
                  <option v-for="t in mxFandoms" :key="'pfe_' + t" :value="t">{{ t }}</option>
                </select>
                <div v-if="plForm.fandom === '自定义'" class="form-row">
                  <input v-model="plForm.fandomCustom" placeholder="填写作品名…" />
                </div>
                <input v-model="plForm.fandomDesc" placeholder="描述魔改细节…" />
              </div>
            </div>
          </div>
          <div v-if="plGenerating" class="mx-gen-status"><span class="gen-spinner"></span>正在生成位面…</div>
          <div v-if="plGenError" class="mx-gen-status error">{{ plGenError }}</div>
          <div v-if="plGenResult" class="mx-gen-result">
            <div class="gen-result-label">位面档案</div>
            <textarea v-model="plGenArchive" class="gen-result-text" placeholder="(未解析到档案内容)"></textarea>
            <div class="gen-result-actions">
              <button v-if="!plSaved" class="btn-gen-save" @click="plSaveGenResult()">保存到世界书/位面列表</button>
              <span v-else class="gen-saved-hint">已保存 ✓</span>
              <button class="btn-gen-inject" @click="plInjectArchive()">注入聊天</button>
              <button class="btn-gen-retry" @click="plGenerate()">重新生成</button>
            </div>
          </div>
          <div class="btn-row">
            <button class="btn-gen" :disabled="plGenerating" @click="plGenerate()">
              {{ plGenerating ? '生成中…' : '生成位面' }}
            </button>
          </div>
        </div>

        <!-- Shared custom form (lady + npc) -->
        <div v-if="activeTab !== 'plane'" class="custom-section">
          <div class="custom-form">
            <div class="form-section" @click="mxOpen.basic = !mxOpen.basic">
              <span class="mx-arrow" :class="{ open: mxOpen.basic }">▸</span> 基本设定
            </div>
            <div v-if="mxOpen.basic" class="section-body">
              <div class="form-row">
                <label>外貌风格</label
                ><select v-model="mxForm.style">
                  <option value="">✨ 随机</option>
                  <option value="自定义">自定义 ▼</option>
                  <option>古风</option>
                  <option>现代</option>
                  <option>异域</option>
                  <option>科幻</option>
                  <option>哥特</option>
                  <option>奇幻</option>
                  <option>战损</option>
                  <option>仙侠</option>
                  <option>汉服</option>
                  <option>赛博朋克</option>
                  <option>蒸汽朋克</option>
                  <option>和风</option>
                </select>
              </div>
              <div v-if="mxForm.style === '自定义'" class="form-row">
                <input v-model="mxForm.styleCustom" placeholder="填写自定义风格…" />
              </div>
              <div class="form-row">
                <label>性格特质</label>
                <div class="tag-pool">
                  <span
                    v-for="t in pickedTraits"
                    :key="'s_' + t"
                    class="tag picked"
                    @click="mxToggleTag(mxForm.traits, t)"
                    >{{ t }}</span
                  >
                  <span
                    v-for="t in mxTraits"
                    v-show="!mxForm.traits.includes(t)"
                    :key="'t_' + t"
                    class="tag"
                    @click="mxToggleTag(mxForm.traits, t)"
                    >{{ t }}</span
                  >
                  <span class="tag tag-custom"
                    ><input
                      v-model="mxForm.traitInput"
                      placeholder="自定义+"
                      @keyup.enter="mxForm.traitInput = mxAddCustom(mxForm.traits, mxForm.traitInput)"
                    /><button
                      class="tag-custom-btn"
                      @click="mxForm.traitInput = mxAddCustom(mxForm.traits, mxForm.traitInput)"
                    >
                      +
                    </button></span
                  >
                </div>
              </div>
              <div class="form-row">
                <label>体态身材</label
                ><select v-model="mxForm.bodyType">
                  <option value="">✨ 随机</option>
                  <option value="自定义">自定义 ▼</option>
                  <option>纤细</option>
                  <option>匀称</option>
                  <option>丰满</option>
                  <option>娇小</option>
                  <option>高挑</option>
                  <option>健美</option>
                  <option>丰腴</option>
                  <option>肉感</option>
                  <option>娇憨</option>
                  <option>结实</option>
                  <option>骨感</option>
                </select>
              </div>
              <div v-if="mxForm.bodyType === '自定义'" class="form-row">
                <input v-model="mxForm.bodyTypeCustom" placeholder="填写自定义体态…" />
              </div>
              <div class="form-row">
                <label>种族</label
                ><select v-model="mxForm.race">
                  <option value="">✨ 随机</option>
                  <option value="自定义">自定义 ▼</option>
                  <option>人类</option>
                  <option>妖族</option>
                  <option>仙族</option>
                  <option>魔族</option>
                  <option>精灵</option>
                  <option>龙族</option>
                  <option>天使</option>
                  <option>恶魔</option>
                  <option>亡灵</option>
                  <option>吸血鬼</option>
                  <option>魅魔</option>
                  <option>兽人</option>
                  <option>妖精</option>
                  <option>神族</option>
                  <option>狐妖</option>
                  <option>猫娘</option>
                  <option>人鱼</option>
                </select>
              </div>
              <div v-if="mxForm.race === '自定义'" class="form-row">
                <input v-model="mxForm.raceCustom" placeholder="填写自定义种族…" />
              </div>
              <div class="form-row">
                <label>年龄感</label
                ><select v-model="mxForm.age">
                  <option value="">✨ 随机</option>
                  <option value="自定义">自定义 ▼</option>
                  <option>少女</option>
                  <option>御姐</option>
                  <option>成熟</option>
                  <option>不老</option>
                  <option>幼态</option>
                  <option>熟女</option>
                  <option>人妻</option>
                </select>
              </div>
              <div v-if="mxForm.age === '自定义'" class="form-row">
                <input v-model="mxForm.ageCustom" placeholder="填写自定义年龄感…" />
              </div>
              <div class="form-row">
                <label>性别</label
                ><select v-model="mxForm.gender">
                  <option value="">随机</option>
                  <option>男</option>
                  <option>女</option>
                  <option>其他</option>
                </select>
              </div>
            </div>
            <div class="form-section" @click="mxOpen.world = !mxOpen.world">
              <span class="mx-arrow" :class="{ open: mxOpen.world }">▸</span> 世界与能力
            </div>
            <div v-if="mxOpen.world" class="section-body">
              <div class="form-row">
                <label>来源世界</label
                ><select v-model="mxForm.origin">
                  <option value="">✨ 随机</option>
                  <option value="自定义">自定义 ▼</option>
                  <option>主世界</option>
                  <option>妖灵位面</option>
                  <option>仙道位面</option>
                  <option>古代位面</option>
                  <option>异世界</option>
                  <option>西幻位面</option>
                  <option>洪荒位面</option>
                  <option>深渊魔界</option>
                  <option>同人位面</option>
                  <option>幽冥位面</option>
                  <option>虚数位面</option>
                </select>
              </div>
              <div v-if="mxForm.origin === '自定义'" class="form-row">
                <input v-model="mxForm.originCustom" placeholder="填写自定义位面…" />
              </div>
              <div class="form-row">
                <label>天赋能力</label>
                <div class="tag-pool">
                  <span
                    v-for="t in pickedAbilities"
                    :key="'a_' + t"
                    class="tag picked"
                    @click="mxToggleTag(mxForm.abilities, t)"
                    >{{ t }}</span
                  >
                  <span
                    v-for="t in mxAbilities"
                    v-show="!mxForm.abilities.includes(t)"
                    :key="'ab_' + t"
                    class="tag"
                    @click="mxToggleTag(mxForm.abilities, t)"
                    >{{ t }}</span
                  >
                  <span class="tag tag-custom"
                    ><input
                      v-model="mxForm.abilityInput"
                      placeholder="自定义+"
                      @keyup.enter="mxForm.abilityInput = mxAddCustom(mxForm.abilities, mxForm.abilityInput)"
                    /><button
                      class="tag-custom-btn"
                      @click="mxForm.abilityInput = mxAddCustom(mxForm.abilities, mxForm.abilityInput)"
                    >
                      +
                    </button></span
                  >
                </div>
              </div>
              <div class="form-row">
                <label>身份地位</label
                ><select v-model="mxForm.role">
                  <option value="">✨ 随机</option>
                  <option value="自定义">自定义 ▼</option>
                  <option v-for="t in mxRoles" :key="'r_' + t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div v-if="mxForm.role === '自定义'" class="form-row">
                <input v-model="mxForm.roleCustom" placeholder="填写自定义身份…" />
              </div>
            </div>
            <div class="form-section" @click="mxOpen.deep = !mxOpen.deep">
              <span class="mx-arrow" :class="{ open: mxOpen.deep }">▸</span> 深层设定
            </div>
            <div v-if="mxOpen.deep" class="section-body">
              <div class="form-row">
                <label
                  >同人作品
                  <span class="mx-mode-toggle" @click="mxFandomMode = !mxFandomMode">{{
                    mxFandomMode ? '⟲ 简单' : '⟳ 魔改'
                  }}</span></label
                >
                <div v-if="!mxFandomMode" class="mx-fandom-simple">
                  <select v-model="mxForm.fandom">
                    <option value="">✨ 原创（不指定）</option>
                    <option value="自定义">自定义 ▼</option>
                    <option v-for="t in mxFandoms" :key="'f_' + t" :value="t">{{ t }}</option>
                  </select>
                  <div v-if="mxForm.fandom === '自定义'">
                    <input v-model="mxForm.fandomCustom" placeholder="填写作品名…" />
                  </div>
                </div>
                <div v-if="mxFandomMode" class="mx-fandom-ext">
                  <select v-model="mxForm.fandomType">
                    <option value="">魔改向</option>
                    <option value="自定义">自定义 ▼</option>
                    <option>原作向</option>
                    <option>魔改向</option>
                    <option>反转向</option>
                    <option>纯净向</option>
                    <option>融合向</option>
                  </select>
                  <div v-if="mxForm.fandomType === '自定义'" class="form-row">
                    <input v-model="mxForm.fandomTypeCustom" placeholder="填写类型…" />
                  </div>
                  <select v-model="mxForm.fandom">
                    <option value="">✨ 选择作品</option>
                    <option value="自定义">自定义 ▼</option>
                    <option v-for="t in mxFandoms" :key="'fe_' + t" :value="t">{{ t }}</option>
                  </select>
                  <div v-if="mxForm.fandom === '自定义'" class="form-row">
                    <input v-model="mxForm.fandomCustom" placeholder="填写作品名…" />
                  </div>
                  <input v-model="mxForm.fandomDesc" placeholder="描述魔改细节，如：性转吉尔伽美什…" />
                </div>
              </div>
              <div class="form-row">
                <label>核心特质</label
                ><select v-model="mxForm.coreTrait">
                  <option value="">✨ 随机</option>
                  <option value="自定义">自定义 ▼</option>
                  <option v-for="t in mxCoreTraits" :key="'ct_' + t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div v-if="mxForm.coreTrait === '自定义'" class="form-row">
                <input v-model="mxForm.coreTraitCustom" placeholder="如：被神遗弃的最后使徒…" />
              </div>
              <div class="form-row">
                <label>初见态度</label
                ><select v-model="mxForm.attitude">
                  <option value="">✨ 随机</option>
                  <option value="自定义">自定义 ▼</option>
                  <option v-for="t in mxAttitudes" :key="'at_' + t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div v-if="mxForm.attitude === '自定义'" class="form-row">
                <input v-model="mxForm.attitudeCustom" placeholder="填写自定义态度…" />
              </div>
              <div class="form-row">
                <label>相识状态</label
                ><select v-model="mxForm.acquaintance">
                  <option value="">✨ 随机</option>
                  <option value="自定义">自定义 ▼</option>
                  <option v-for="t in mxAcquaintances" :key="'aq_' + t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div v-if="mxForm.acquaintance === '自定义'" class="form-row">
                <input v-model="mxForm.acquaintanceCustom" placeholder="填写自定义相识状态…" />
              </div>
              <div class="form-row">
                <label>特殊标记</label
                ><select v-model="mxForm.specialMark">
                  <option value="">无</option>
                  <option value="自定义">自定义 ▼</option>
                  <option v-for="t in mxMarks" :key="'mk_' + t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div v-if="mxForm.specialMark === '自定义'" class="form-row">
                <input v-model="mxForm.specialMarkCustom" placeholder="填写自定义标记…" />
              </div>
              <div class="form-row">
                <label>其他补充</label
                ><textarea v-model="mxForm.other" placeholder="自由填写未列出的信息…" class="mx-other-input"></textarea>
              </div>
            </div>
            <div v-if="mxGenerating" class="mx-gen-status"><span class="gen-spinner"></span>正在生成详细人设…</div>
            <div v-if="mxGenError" class="mx-gen-status error">{{ mxGenError }}</div>
            <div v-if="mxGenResult" class="mx-gen-result">
              <div class="gen-result-label">世界书档案</div>
              <textarea v-model="mxGenArchive" class="gen-result-text" placeholder="(未解析到档案内容)"></textarea>
              <div class="gen-result-actions">
                <button v-if="!mxSaved" class="btn-gen-save" @click="mxSaveGenResult()">保存到世界书/角色列表</button>
                <span v-else class="gen-saved-hint">已保存 ✓</span>
                <button class="btn-gen-inject" @click="mxInjectArchive()">注入聊天</button>
                <button class="btn-gen-retry" @click="mxDoGenerate()">重新生成</button>
              </div>
            </div>
            <div class="mx-gen-row">
              <label class="mx-save-toggle" @click.stop
                ><input v-model="mxIncludeChat" type="checkbox" /><span class="toggle-label">附带聊天记录</span></label
              >
            </div>
            <div class="btn-row">
              <button class="btn-gen" :disabled="mxGenerating" @click="mxDoGenerate()">
                {{ mxGenerating ? '生成中…' : '生成详细人设' }}
              </button>
            </div>
          </div>
        </div>

        <button class="mirror-close-btn" @click="$emit('close')">✕</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

defineEmits<{ close: [] }>();

const activeTab = ref<'lady' | 'plane' | 'npc'>('lady');
const mirrorDir = ref<'toMe' | 'toWorld'>('toMe');
const mxCustom = ref(false);
const mxFandomMode = ref(false);
const mxIncludeChat = ref(false);
const mxGenerating = ref(false);
const mxGenResult = ref('');
const mxGenArchive = ref('');
const mxGenError = ref('');
const mxSaved = ref(false);
const mxOpen = reactive({ basic: false, world: false, deep: false });

const tabLabel = computed(() => {
  if (activeTab.value === 'plane') return '构筑一方世界';
  if (activeTab.value === 'npc') return '众生皆在镜中';
  return mirrorDir.value === 'toMe' ? '唤至此岸' : '渡往彼岸';
});

const mxForm = reactive({
  style: '',
  styleCustom: '',
  traits: [] as string[],
  traitInput: '',
  bodyType: '',
  bodyTypeCustom: '',
  race: '',
  raceCustom: '',
  age: '',
  ageCustom: '',
  gender: '',
  origin: '',
  originCustom: '',
  role: '',
  roleCustom: '',
  fandom: '',
  fandomCustom: '',
  fandomType: '',
  fandomTypeCustom: '',
  fandomDesc: '',
  abilities: [] as string[],
  abilityInput: '',
  coreTrait: '',
  coreTraitCustom: '',
  attitude: '',
  attitudeCustom: '',
  specialMark: '',
  specialMarkCustom: '',
  acquaintance: '',
  acquaintanceCustom: '',
  other: '',
});

const mxTraits = [
  '温柔',
  '冷傲',
  '活泼',
  '沉稳',
  '腹黑',
  '天真',
  '毒舌',
  '慵懒',
  '天然呆',
  '病娇',
  '傲娇',
  '三无',
  '元气',
  '中二',
  '反叛',
  '乐子人',
  '社恐',
  '抖S',
  '冒失',
  '豪爽',
  '阴沉',
  '不羁',
  '大和抚子',
  '骑士道',
  '电波',
  '狂气',
  '自卑',
  '贤惠',
  '占有欲强',
  '天然黑',
];
const mxAbilities = [
  '剑术',
  '弓术',
  '枪术',
  '医术',
  '占卜',
  '炼丹',
  '符箓',
  '阵法',
  '隐匿',
  '瞬移',
  '变身',
  '读心',
  '时间回溯',
  '重力',
  '元素操控',
  '暗影',
  '圣光',
  '火焰',
  '水流',
  '时空',
  '魅惑',
  '兽化',
  '机关术',
  '言灵',
  '死灵术',
  '炼金术',
  '结界术',
  '召唤术',
  '傀儡术',
  '狂化',
  '引力',
  '冰雪',
  '雷电',
  '植物操控',
  '不死',
  '永生',
];
const mxRoles = [
  '剑圣',
  '魔女',
  '公主',
  '圣女',
  '骑士',
  '精灵王',
  '龙神',
  '堕天使',
  '死神',
  '妖王',
  '贤者',
  '佣兵王',
  '刺客',
  '流浪武士',
  '星界旅者',
  '女王',
  '修女',
  '舞姬',
  '女仆',
  '猎魔人',
  '吸血鬼领主',
  '占星师',
  '退魔师',
  '巫女',
  '机关师',
  '武神',
  '酒馆老板',
];
const mxCoreTraits = [
  '嗜睡体质',
  '凤凰血脉',
  '禁欲',
  '病弱',
  '天生剑骨',
  '龙族血统',
  '月圆变身',
  '灵力暴走',
  '预知梦',
  '不老体质',
  '通灵体质',
  '魅魔血脉',
  '天使血脉',
  '元素亲和',
  '泌乳体质',
  '易感体质',
];
const mxAttitudes = [
  '冷漠',
  '好奇',
  '敌意',
  '友善',
  '崇拜',
  '试探',
  '困惑',
  '漠然',
  '警惕',
  '亲近',
  '敬畏',
  '怜悯',
  '戏谑',
  '羞怯',
];
const mxFandoms = [
  '哥布林杀手',
  '原神',
  'Fate',
  '东方Project',
  '明日方舟',
  '崩坏星穹铁道',
  '蔚蓝档案',
  '葬送的芙莉莲',
  '鬼灭之刃',
  '咒术回战',
  '艾尔登法环',
  '赛马娘',
  '碧蓝航线',
  '崩坏3',
  '少女前线',
  '公主连结',
  '无职转生',
  'Re:从零开始的异世界生活',
];
const mxMarks = [
  '左眼封印',
  '说话带古语腔',
  '异色瞳',
  '身上有纹身',
  '戴着面纱',
  '半透明身体',
  '嘴角泪痣',
  '唇边美人痣',
  '虎牙',
  '腰窝',
  '蝴蝶骨',
  '背部天生羽翼',
  '发尾异色',
  '掌心旧疤',
  '脐钉',
  '舌钉',
];
const mxAcquaintances = [
  '未相识',
  '已相识（主世界）',
  '已相识（其他位面）',
  '前世相识',
  '梦中相识',
  '宿命相连',
  '笔友/网友',
  '旧日同窗',
  '救命恩人',
  '宿敌',
];

const pickedTraits = computed(() => mxForm.traits);
const pickedAbilities = computed(() => mxForm.abilities);

function mxToggleTag(arr: string[], t: string) {
  const i = arr.indexOf(t);
  if (i >= 0) arr.splice(i, 1);
  else arr.push(t);
}
function mxAddCustom(arr: string[], v: string): string {
  const s = v.trim();
  if (s && !arr.includes(s)) arr.push(s);
  return '';
}

function switchTab(tab: 'lady' | 'plane' | 'npc') {
  activeTab.value = tab;
  mxGenError.value = '';
  plGenError.value = '';
}

// ---- mxSend (append to existing input) ----
function mxSend(msg: string) {
  const $p = (window as any).parent?.$;
  if (!$p) return;
  const current = String($p('#send_textarea').val() || '');
  $p('#send_textarea')
    .val(current ? current + '\n\n' + msg : msg)
    .trigger('input');
  setTimeout(() => $p('#send_but').trigger('click'), 50);
  mxCustom.value = false;
}

// ---- dispatch functions ----
function mxRandom() {
  if (activeTab.value === 'npc') {
    mxSend(mirrorDir.value === 'toMe' ? '使用母镜随机召唤一人来到身边' : '使用母镜前往一位随机人物所在的世界');
  } else {
    mxSend(mirrorDir.value === 'toMe' ? '使用母镜随机召唤一位红颜来到身边' : '使用母镜前往一位随机红颜所在的世界');
  }
}

function mxCustomSummon() {
  const d = mxForm;
  const v = (s: string, c: string) => (s === '自定义' || !s ? c || '随机' : s);
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
      ? {
          类型: (d.fandomType === '自定义' ? d.fandomTypeCustom : d.fandomType) || '魔改向',
          作品: v(d.fandom, d.fandomCustom) || '随机',
          描述: d.fandomDesc || '无',
        }
      : v(d.fandom, d.fandomCustom) || '原创',
    核心特质: v(d.coreTrait, d.coreTraitCustom),
    初见态度: v(d.attitude, d.attitudeCustom),
    相识状态: v(d.acquaintance, d.acquaintanceCustom),
    特殊标记: d.specialMark === '自定义' ? d.specialMarkCustom || '无' : d.specialMark || '无',
    其他补充: d.other || '无',
  };
  const isNPC = activeTab.value === 'npc';
  const dir =
    mirrorDir.value === 'toMe'
      ? isNPC
        ? '使用母镜召唤一人来到身边'
        : '使用母镜召唤一位红颜来到身边'
      : isNPC
        ? '使用母镜前往一人所在的世界'
        : '使用母镜前往一位红颜所在的世界';
  mxSend(dir + '\n' + JSON.stringify(obj, null, '  '));
}

function mxInjectArchive() {
  if (!mxGenArchive.value) return;
  const isNPC = activeTab.value === 'npc';
  const subject = isNPC ? '一人' : '一位红颜';
  const dir =
    mirrorDir.value === 'toMe'
      ? `使用母镜召唤${subject}来到身边。以下是镜中传来的信息：\n\n`
      : `使用母镜前往${subject}所在的世界。以下是镜中传来的信息：\n\n`;
  mxSend(dir + mxGenArchive.value);
}

// ---- templates ----
const ladyTemplate = `你正在通过母镜感知一位红颜的存在。镜中波纹荡漾，一道身影的因果线逐渐在你手中凝聚成形。这不是在写剧情——你只是在整理镜中传来的信息。

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
        来源世界:（填写具体位面名称，不要填大类别名）
        种族:
        天赋能力:（描述能力的名称、效果与限制，不要只写名字）

    外貌特征:
        基础体型:（描述性，含身材与体态）
        特征:（角色不可变的生理标记，不含服装/饰品/可卸物。无则留空）
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

    语言特征:
        说话习惯:

    关系设定:
        与<user>的关系:
            认知:（她在镜中看到了什么，如何看待<user>）
            情感:（初见时的情感基调）
            互动方式:

    特殊物品:
        （仅真正特殊的物品——如子镜等传说级物品。日常物品不要写在这里）

    私密特征:
        胸型: [诗名]
            - （贴合角色体型与气质的描述，含形状、大小、色泽、触感，不可使用"一线天""馒头"等通用模板词）
        户型: [诗名]
            - （贴合角色身份与种族特质的描述，含形态、紧致度、特殊体感，不可使用"一线天""馒头"等通用模板词）

    兴趣爱好:
        [爱好名]:
            动机:
              - （这件爱好的情感来源，对角色个人的意义）
            表现:
              - （做这件事的具体方式与细节）
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

const npcTemplate = `你正在通过母镜感知一道身影的存在。镜中波纹荡漾，一条因果线逐渐在你手中凝聚成形。这不是在写剧情——你只是在整理镜中传来的信息。

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
        与<user>关系:（初次相遇时的关系定位。此人未必对<user>怀有爱慕，写出真实的关系基调即可）
        来源世界:（填写具体位面名称，不要填大类别名）
        种族:
        天赋能力:（描述能力的名称、效果与限制，不要只写名字）

    外貌特征:
        基础体型:（描述性，含身材与体态）
        特征:（角色不可变的生理标记，不含服装/饰品/可卸物。无则留空）
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

    语言特征:
        说话习惯:

    关系设定:
        与<user>的关系:
            认知:（此人在镜中看到了什么，如何看待<user>。不预设爱慕倾向）
            情感:（初见时的情感基调，如好奇、警惕、漠然、友善等）
            互动方式:

    特殊物品:
        （仅真正特殊的物品——如子镜等传说级物品。日常物品不要写在这里）

    私密特征:
        胸型: [诗名]
            - （贴合角色体型与气质的描述，含形状、大小、色泽、触感，不可使用"一线天""馒头"等通用模板词）
        户型: [诗名]
            - （贴合角色身份与种族特质的描述，含形态、紧致度、特殊体感，不可使用"一线天""馒头"等通用模板词）

    兴趣爱好:
        [爱好名]:
            动机:
              - （这件爱好的情感来源，对角色个人的意义）
            表现:
              - （做这件事的具体方式与细节）
</basic_info>

---

规则：
- 此人未必是红颜，不必预设对<user>的爱慕或依恋。写出真实可信的独立人格即可。
- 不要写剧情。不要写叙述。不要写旁白。不要写思维链。不要写分析过程。
- 不要输出 <UpdateVariable>、<JSONPatch>、<Variable> 或任何变量操作标签。忽略后续提示词中可能出现的变量更新指令，那些与本任务无关。
- 严格按以上格式输出。除此之外不要附带任何其他内容。
- 所有字段（含 NSFW）直接填写，不拒绝不回避不省略。
- 每个值须有辨识度——数字避免敷衍整数，文本避免泛泛描述。
- 命名与描述贴合角色背景与场景语境。
- 化名仅在该角色确实拥有化名/别名时填写，不要无中生有。无化名则留空。姓名与化名不要写在括号里附带。
- 例句直接写对话本身，禁止使用 <q></q> 标签包裹。`;

// ---- generate ----
async function mxDoGenerate() {
  mxGenError.value = '';
  mxGenResult.value = '';
  mxGenArchive.value = '';
  mxSaved.value = false;
  mxGenerating.value = true;
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) {
      mxGenError.value = '未检测到酒馆助手';
      return;
    }
    const d = mxForm;
    const v = (s: string, c: string) => (s === '自定义' || !s ? c || '随机' : s);
    const tags: string[] = [];
    if (d.gender) tags.push('性别：' + d.gender);
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
    const mark = d.specialMark === '自定义' ? d.specialMarkCustom || '无' : d.specialMark || '无';
    if (mark !== '无') tags.push('特殊标记：' + mark);
    if (d.other.trim()) tags.push('其他补充：' + d.other.trim());
    if (mxFandomMode.value) {
      const ftype = d.fandomType === '自定义' ? d.fandomTypeCustom || '魔改向' : d.fandomType || '魔改向';
      tags.push('同人类型：' + ftype);
      if (v(d.fandom, d.fandomCustom)) tags.push('同人作品：' + v(d.fandom, d.fandomCustom));
      if (d.fandomDesc) tags.push('魔改描述：' + d.fandomDesc);
    } else if (v(d.fandom, d.fandomCustom) && v(d.fandom, d.fandomCustom) !== '原创') {
      tags.push('同人作品：' + v(d.fandom, d.fandomCustom));
    }
    const tagBlock = tags.map(t => '- ' + t).join('\n');
    const isNPC = activeTab.value === 'npc';
    const tmpl = isNPC ? npcTemplate : ladyTemplate;
    const roleHint = isNPC ? '一位详细角色人设（非红颜，普通人物）。' : '一位详细红颜人设。';
    const prompt = `使用母镜生成${roleHint}\n\n=== 已选标签 ===\n${tagBlock}\n\n${tmpl}\n\n（请按上述模板输出 [世界书档案] 。）`;
    const kw: string[] = [];
    [mxForm.race, mxForm.origin, mxForm.role, mxForm.coreTrait].forEach(f => {
      const val = typeof f === 'string' ? f : '';
      if (val && val !== '自定义') kw.push(val);
    });
    if (mxForm.raceCustom && mxForm.race === '自定义') kw.push(mxForm.raceCustom);
    if (mxForm.originCustom && mxForm.origin === '自定义') kw.push(mxForm.originCustom);
    if (mxForm.roleCustom && mxForm.role === '自定义') kw.push(mxForm.roleCustom);
    if (mxForm.coreTraitCustom && mxForm.coreTrait === '自定义') kw.push(mxForm.coreTraitCustom);
    if (mxForm.fandom && mxForm.fandom !== '原创' && mxForm.fandom !== '自定义') kw.push(mxForm.fandom);
    if (mxForm.fandom === '自定义' && mxForm.fandomCustom) kw.push(mxForm.fandomCustom);
    if (mxForm.other.trim())
      mxForm.other
        .trim()
        .split(/[,，、\s]+/)
        .filter((w: string) => w.length >= 2)
        .forEach((w: string) => kw.push(w));
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
      user_input: `本次为镜渡生成角色档案，勿编剧情。以下为部分已选标签，供扫描关键词激活世界书用：${kw.join('，')}`,
      should_silence: true,
      max_chat_history: mxIncludeChat.value ? 6 : undefined,
      ordered_prompts: ordered,
    });
    const text = typeof result === 'string' ? result : result.content || JSON.stringify(result);
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
    if (!TH) {
      mxGenError.value = '未检测到酒馆助手';
      return;
    }
    const nameMatch = mxGenArchive.value.match(/姓名[：:][^\S\n]*(\S+)/);
    const charName = nameMatch ? nameMatch[1].replace(/[（(].*$/, '') : activeTab.value === 'npc' ? '新人物' : '新红颜';
    const aliasMatch = mxGenArchive.value.match(/化名[：:][^\S\n]*(\S[^\n]*\S|\S)/);
    const alias = aliasMatch ? aliasMatch[1].replace(/[（(].*$/, '').trim() : '';
    const keys = [charName];
    if (alias) keys.push(alias);
    let wbName: string = TH.getCharLorebooks()?.primary;
    if (!wbName) {
      wbName = '镜待流年v120';
      await TH.createLorebook(wbName);
      await TH.setCurrentCharLorebooks({ primary: wbName });
    }
    const existing = await TH.getLorebookEntries(wbName);
    const genOrders = existing.map((e: any) => e.order ?? 0).filter((o: number) => o >= 6000 && o < 9000);
    const nextOrder = genOrders.length ? Math.max(...genOrders) + 5 : 6000;
    await TH.createLorebookEntries(wbName, [
      {
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
      },
    ]);
    const idMatch = mxGenArchive.value.match(/身份[：:][^\S\n]*(\S[^\n]*)/);
    const charId = idMatch ? idMatch[1].trim() : '未知';
    const target = existing.find((e: any) => e.comment === '生成角色列表');
    if (target) {
      await TH.setLorebookEntries(wbName, [
        { uid: target.uid, content: (target.content || '') + '\n  - ' + charName + ':\n      身份: ' + charId },
      ]);
    }
    mxSaved.value = true;
  } catch (e: any) {
    mxGenError.value = '保存失败：' + (e?.message || String(e));
  }
}

// ---- plane ----
const plOpen = reactive({ basic: true });
const plGenerating = ref(false);
const plGenResult = ref('');
const plGenArchive = ref('');
const plGenError = ref('');
const plSaved = ref(false);
const plFandomMode = ref(false);
const plForm = reactive({
  name: '',
  type: '',
  typeCustom: '',
  techLevel: '',
  techLevelCustom: '',
  magicLevel: '',
  magicLevelCustom: '',
  worldScale: '',
  worldScaleCustom: '',
  races: [] as string[],
  raceInput: '',
  planeTrait: '',
  planeTraitCustom: '',
  historyPhase: '',
  historyPhaseCustom: '',
  coreFeature: '',
  linkedChars: '',
  fandom: '',
  fandomCustom: '',
  fandomType: '',
  fandomTypeCustom: '',
  fandomDesc: '',
});
const plRaces = [
  '人类',
  '精灵',
  '矮人',
  '兽人',
  '龙族',
  '魔族',
  '仙族',
  '妖族',
  '亡灵',
  '天使',
  '恶魔',
  '人鱼',
  '妖精',
  '神族',
  '吸血鬼',
  '魅魔',
  '猫娘',
  '机关人',
  '元素生物',
  '虫族',
];
const pickedPlRaces = computed(() => plForm.races);

const plTemplate = `你正在通过母镜感知一方世界的轮廓。镜中波纹荡漾，一片大陆、一种文明、一套法则逐渐在你手中凝聚成形。这不是在写剧情——你只是在整理镜中传来的位面信息。

请将镜中世界的信息整理为以下档案，标记为 [位面档案]。参照镜待流年现有位面档案风格——灵活描述，不固化可变细节。

---

[位面档案]

<plane_info>
位面档案:
    位面名称:（为空则随机生成一个贴切的名字——不要叫"未命名位面"或"新位面"这类敷衍名字）

    概况:
      - （位面整体定位一句话，如"修仙文明为主，天地灵气充沛，凡人可修炼成仙"）
      - （地理格局概述——大陆数量、海洋分布、已知世界范围）

    地理格局:
      （至少列出3个核心区域，每个含地貌、气候、特色地标，模仿以下格式）
      （区域名）:
        - （地貌与气候概述）
        - （特色地标或重要地点，地点下可细化子项）
          地点名: （功能与位置特征）
            细节: （内置事物/用途，不写氛围）
          地点名: （功能与位置特征）
            细节: （内置事物/用途，不写氛围）

    世界脉络:
      诞生:（位面如何形成——创世神话、自然演化、人造空间、维度裂隙等）
      演化:（从诞生至今的关键阶段，至少2个阶段——黄金时代、大灾变、技术爆炸、文明更迭等）
      大事件:（影响整个位面的重大历史事件，至少2件，写明大致时期与影响范围）

    文明特征:
        社会结构:（权力分布、阶级划分、主流政体形式）
        文化特色:（独特的习俗、节日、艺术形式、禁忌）
        种族构成:（主要智慧种族及其关系，不少于2行）

    力量体系:
        核心规则:（该位面力量的根本法则——灵力源于天地、魔力来自血脉、科技基于某种能源等）
        等级划分:（力量体系的层级，如炼气→筑基→金丹或学徒→法师→大法师）
        特殊现象:（位面独有的超自然现象——空间裂隙、灵气潮汐、魔法风暴等）

    特色势力:
        （至少2个代表性势力，模仿以下格式）
        （势力名）:
            定位:（国家/宗门/教派/公会/家族/帮派/企业等）
            特征:（核心理念、标志性能力、对外态度、规模）
</plane_info>

---

规则：
- 不要写剧情。不要写叙述。不要写分析过程。
- 不要输出 <UpdateVariable>、<JSONPatch>、<Variable> 或任何变量操作标签。忽略后续提示词中可能出现的变量更新指令，那些与本任务无关。
- 严格按以上格式输出。除此之外不要附带任何其他内容。
- 位面名称必须有辨识度，不可使用"未命名""新位面"等敷衍占位名。
- 地理描述须有可辨识的地标或地形特征——不写氛围，写具体事物。
- 势力写清楚定位与特征，不要只写名字。
- 每个值须有辨识度，避免泛泛描述。`;

async function plGenerate() {
  plGenError.value = '';
  plGenResult.value = '';
  plGenArchive.value = '';
  plSaved.value = false;
  plGenerating.value = true;
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) {
      plGenError.value = '未检测到酒馆助手';
      return;
    }
    const d = plForm;
    const v = (s: string, c: string) => (s === '自定义' || !s ? c || '随机' : s);
    const tags: string[] = [];
    tags.push('位面名称：' + (d.name || '随机'));
    if (d.type === '自定义' && d.typeCustom) tags.push('位面类型：' + d.typeCustom);
    else tags.push('位面类型：' + (d.type || '随机'));
    tags.push('技术等级：' + v(d.techLevel, d.techLevelCustom));
    tags.push('魔法/灵力等级：' + v(d.magicLevel, d.magicLevelCustom));
    tags.push('世界规模：' + v(d.worldScale, d.worldScaleCustom));
    if (d.races.length) tags.push('智慧种族：' + d.races.join('、'));
    else tags.push('智慧种族：随机');
    tags.push('核心特质：' + v(d.planeTrait, d.planeTraitCustom) || '无');
    tags.push('历史阶段：' + v(d.historyPhase, d.historyPhaseCustom));
    if (d.coreFeature.trim()) tags.push('核心特征：' + d.coreFeature.trim());
    else tags.push('核心特征：随机');
    if (d.linkedChars.trim()) tags.push('关联角色：' + d.linkedChars.trim());
    else tags.push('关联角色：无');
    if (plFandomMode.value) {
      const ftype = d.fandomType === '自定义' ? d.fandomTypeCustom || '魔改向' : d.fandomType || '魔改向';
      tags.push('同人类型：' + ftype);
      if (v(d.fandom, d.fandomCustom)) tags.push('同人作品：' + v(d.fandom, d.fandomCustom));
      if (d.fandomDesc) tags.push('魔改描述：' + d.fandomDesc);
    } else if (v(d.fandom, d.fandomCustom) && v(d.fandom, d.fandomCustom) !== '原创') {
      tags.push('同人作品：' + v(d.fandom, d.fandomCustom));
    }
    const isFandom = plFandomMode.value || (d.fandom && d.fandom !== '原创');
    const fandomHint = isFandom ? '（含同人设定，贴合原作世界观或魔改方向）' : '';
    const prompt = `使用母镜生成一个位面设定。${fandomHint}\n\n=== 已选标签 ===\n${tags.map(t => '- ' + t).join('\n')}\n\n${plTemplate}\n\n（请按上述模板输出 [位面档案] 。）`;
    // kw 全量：位面名称 + 关联角色 + 核心特征 + 同人作品
    const kw: string[] = [];
    if (d.name) kw.push(d.name);
    if (d.linkedChars.trim())
      d.linkedChars.split(/[,，]/).forEach(c => {
        const n = c.trim();
        if (n) kw.push(n);
      });
    if (d.coreFeature.trim()) {
      d.coreFeature
        .trim()
        .split(/[,，、\s]+/)
        .filter((w: string) => w.length >= 2)
        .forEach((w: string) => kw.push(w));
    }
    if (d.fandom && d.fandom !== '原创' && d.fandom !== '自定义') kw.push(d.fandom);
    if (d.fandom === '自定义' && d.fandomCustom) kw.push(d.fandomCustom);
    const ordered: any[] = [
      { role: 'system', content: prompt },
      'persona_description',
      'char_description',
      'world_info_before',
      'world_info_after',
      'user_input',
    ];
    const result = await TH.generateRaw({
      user_input: `本次为镜渡生成位面档案，勿编剧情。以下为部分已选标签，供扫描关键词激活世界书用：${kw.join('，')}`,
      should_silence: true,
      ordered_prompts: ordered,
    });
    const text = typeof result === 'string' ? result : result.content || JSON.stringify(result);
    plGenResult.value = text;
    const archMatch = text.match(/\[位面档案\]\s*([\s\S]*)/);
    if (archMatch) plGenArchive.value = archMatch[1].trim();
    else plGenArchive.value = text;
  } catch (e: any) {
    plGenError.value = e?.message || String(e);
  } finally {
    plGenerating.value = false;
  }
}

async function plSaveGenResult() {
  if (!plGenArchive.value) return;
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) {
      plGenError.value = '未检测到酒馆助手';
      return;
    }
    const nameMatch = plGenArchive.value.match(/位面名称[：:][^\S\n]*(\S[^\n]*)/);
    const planeName = nameMatch ? nameMatch[1].trim() : '新位面';
    let wbName: string = TH.getCharLorebooks()?.primary;
    if (!wbName) {
      wbName = '镜待流年v120';
      await TH.createLorebook(wbName);
      await TH.setCurrentCharLorebooks({ primary: wbName });
    }
    const existing = await TH.getLorebookEntries(wbName);
    const genOrders = existing.map((e: any) => e.order ?? 0).filter((o: number) => o >= 1000 && o < 4000);
    const nextOrder = genOrders.length ? Math.max(...genOrders) + 5 : 1000;
    await TH.createLorebookEntries(wbName, [
      {
        name: planeName,
        comment: `镜渡生成 - 位面:${planeName}`,
        enabled: false,
        type: 'selective',
        keys: [planeName],
        position: 'before_character_definition',
        order: nextOrder,
        probability: 100,
        exclude_recursion: true,
        prevent_recursion: true,
        content: plGenArchive.value,
      },
    ]);
    const overviewMatch = plGenArchive.value.match(/概况:\s*\n\s*- (.+)/);
    const planeDesc = overviewMatch ? overviewMatch[1].trim() : '未知';
    const listTarget = existing.find((e: any) => e.comment === '生成位面列表');
    if (listTarget) {
      await TH.setLorebookEntries(wbName, [
        { uid: listTarget.uid, content: (listTarget.content || '') + '\n  - ' + planeName + ':\n      ' + planeDesc },
      ]);
    } else {
      await TH.createLorebookEntries(wbName, [
        {
          comment: '生成位面列表',
          enabled: true,
          type: 'selective',
          keys: ['生成位面列表'],
          position: 'before_character_definition',
          order: 999,
          probability: 100,
          exclude_recursion: true,
          prevent_recursion: true,
          content: '生成位面列表:\n  - ' + planeName + ':\n      ' + planeDesc,
        },
      ]);
    }
    // 追加 const + if 到 EJS 位面控制器
    const ejsTarget = existing.find((e: any) => {
      const n = e.display_name || e.name || e.comment || '';
      return n.includes('EJS') && n.includes('生成位面');
    });
    if (ejsTarget) {
      const safeVar = 'mentioned_' + planeName.replace(/[^a-zA-Z一-鿿]/g, '');
      const keywords = [planeName];
      if (plForm.linkedChars.trim()) {
        plForm.linkedChars.split(/[,，]/).forEach(c => {
          const n = c.trim();
          if (n && !keywords.includes(n)) keywords.push(n);
        });
      }
      if (plForm.coreFeature.trim()) {
        const featKw = plForm.coreFeature
          .trim()
          .split(/[,，、\s]+/)
          .filter((w: string) => w.length >= 2 && !keywords.includes(w));
        featKw.forEach((w: string) => keywords.push(w));
      }
      const kStr = keywords
        .filter(Boolean)
        .map(k => `'${k}'`)
        .join(', ');
      const newBlock = `const ${safeVar} = matchChatMessages([${kStr}]);
if (plane.includes('${planeName}') || ${safeVar}) {
  print(await getwi('${planeName}'));
}`;
      let ejContent = ejsTarget.content;
      ejContent = ejContent.replace(/%>\s*$/, '');
      ejContent += '\n' + newBlock + '\n%>';
      await TH.setLorebookEntries(wbName, [{ uid: ejsTarget.uid, content: ejContent }]);
    }
    plSaved.value = true;
  } catch (e: any) {
    plGenError.value = '保存失败：' + (e?.message || String(e));
  }
}

function plInjectArchive() {
  if (!plGenArchive.value) return;
  mxSend('使用母镜前往一个位面。以下是镜中传来的位面信息：\n\n' + plGenArchive.value);
}
</script>

<style lang="scss">
.mirror-panel {
  --m-accent: #c9a96e;
  --m-accent-dim: rgba(201, 169, 110, 0.2);
  --m-glow: rgba(201, 169, 110, 0.1);
  --m-surface: #f5ede0;
  --m-text: #4a4035;
  --m-muted: #8a7e6e;
  --m-dim: #b8a898;
  --m-rose: #c47b8b;
  --m-rose-dim: rgba(196, 123, 139, 0.2);
  --m-teal: #5ea0a7;
  --m-teal-dim: rgba(94, 160, 167, 0.18);
  padding: 4px 0 6px;
  &.theme-red {
    --m-accent: var(--m-rose);
    --m-accent-dim: var(--m-rose-dim);
    --m-surface: #251c1f;
    --m-text: #e0d0d8;
    --m-muted: #b098a0;
    --m-dim: #786068;
  }
  &.theme-teal {
    --m-accent: var(--m-teal);
    --m-accent-dim: var(--m-teal-dim);
    --m-surface: #1c2325;
    --m-text: #d0dce0;
    --m-muted: #98a8b0;
    --m-dim: #607078;
  }
}
.mirror-frame {
  position: relative;
  border-radius: 12px;
  padding: 4px;
  background: linear-gradient(145deg, #8b7355, #6b5a48 25%, #c9a96e 50%, #6b5a48 75%, #8b7355);
  box-shadow: 0 0 24px rgba(201, 169, 110, 0.15);
}
.frame-ring,
.frame-inset {
  position: absolute;
  border-radius: 10px;
  border: 1px solid rgba(201, 169, 110, 0.25);
  pointer-events: none;
}
.frame-ring {
  inset: 4px;
}
.frame-inset {
  inset: 8px;
  border-color: rgba(201, 169, 110, 0.1);
}
.mirror-surface {
  position: relative;
  z-index: 1;
  border-radius: 9px;
  padding: 14px 12px 10px;
  background: var(--m-surface);
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image:
      repeating-linear-gradient(45deg, transparent, transparent 2px, var(--m-accent) 2px, var(--m-accent) 3px),
      repeating-linear-gradient(-45deg, transparent, transparent 2px, var(--m-accent) 2px, var(--m-accent) 3px);
    opacity: 0.04;
  }
}
.panel-title {
  font-family: '寒蝉全圆体', var(--font-main);
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 6px;
  position: relative;
  z-index: 1;
  background: linear-gradient(135deg, #6b4a28 0%, #8b5a30 40%, #6b4a28 60%, #8b5a30 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.panel-sub {
  font-family: '寒蝉全圆体', var(--font-main);
  text-align: center;
  font-size: 9px;
  color: var(--m-accent);
  letter-spacing: 2px;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}
.mirror-tabs {
  display: flex;
  justify-content: center;
  gap: 0;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
  button {
    font-family: '寒蝉全圆体', var(--font-main);
    font-size: 10px;
    padding: 3px 12px;
    border: 1px solid var(--m-accent-dim);
    background: transparent;
    color: var(--m-muted);
    cursor: pointer;
    transition: all 0.2s;
    &:first-child {
      border-radius: 4px 0 0 4px;
    }
    &:last-child {
      border-radius: 0 4px 4px 0;
    }
    &.active {
      background: var(--m-accent-dim);
      color: var(--m-accent);
      border-color: var(--m-accent);
    }
    &:hover:not(.active) {
      color: var(--m-text);
      background: rgba(201, 169, 110, 0.06);
    }
  }
}
.direction-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}
.toggle-btn {
  background: none;
  border: none;
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 9px;
  color: var(--m-muted);
  cursor: pointer;
  letter-spacing: 1px;
  padding: 3px 8px;
  border-radius: 6px;
  transition: all 0.2s;
  &.active {
    color: #fff;
    background: var(--m-accent);
    font-weight: 600;
  }
}
.toggle-track {
  width: 30px;
  height: 16px;
  background: rgba(139, 115, 85, 0.12);
  border-radius: 8px;
  cursor: pointer;
  position: relative;
}
.toggle-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--m-accent);
  position: absolute;
  top: 2px;
  left: 2px;
  transition: left 0.25s;
  &.toWorld {
    left: 16px;
  }
}
.btn-random {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px 0;
  margin-bottom: 6px;
  background: var(--m-accent-dim);
  border: 1px solid var(--m-accent);
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  z-index: 1;
  color: var(--m-accent);
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 3px;
  transition: all 0.2s;
  &:hover {
    background: var(--m-accent);
    color: #fff;
  }
}
.btn-icon {
  font-size: 10px;
}
.btn-custom-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 7px 0;
  background: none;
  border: 1px dashed var(--m-accent-dim);
  border-radius: 8px;
  cursor: pointer;
  color: var(--m-accent);
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 10px;
  letter-spacing: 2px;
  transition: all 0.2s;
  position: relative;
  z-index: 1;
  &:hover {
    border-color: var(--m-accent);
    border-style: solid;
  }
}
.custom-form {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 6px;
  padding: 10px;
  background: rgba(139, 115, 85, 0.04);
  border: 1px solid rgba(139, 115, 85, 0.1);
  border-radius: 8px;
}
.form-section {
  padding: 6px 8px;
  background: rgba(139, 115, 85, 0.06);
  border-radius: 6px;
  cursor: pointer;
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 10px;
  color: var(--m-muted);
  letter-spacing: 1px;
  transition: background 0.15s;
  user-select: none;
  &:hover {
    background: rgba(139, 115, 85, 0.12);
  }
}
.mx-arrow {
  display: inline-block;
  transition: transform 0.2s;
  font-size: 10px;
  margin-right: 2px;
  &.open {
    transform: rotate(90deg);
  }
}
.section-body {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-top: 4px;
}
.mx-mode-toggle {
  font-size: 8px;
  color: var(--m-accent);
  cursor: pointer;
  background: var(--m-accent-dim);
  padding: 1px 6px;
  border-radius: 8px;
  margin-left: 4px;
  transition: all 0.15s;
  &:hover {
    background: var(--m-accent);
    color: #fff;
  }
}
.mx-fandom-simple {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.mx-fandom-simple select,
.mx-fandom-simple input {
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid rgba(139, 115, 85, 0.15);
  background: rgba(255, 255, 255, 0.6);
  color: #4a4035;
  font-family: 'DouyinSans', var(--font-main);
  font-size: 10px;
  outline: none;
  &:focus {
    border-color: var(--m-accent);
  }
}
.mx-fandom-ext {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  background: rgba(139, 115, 85, 0.04);
  border: 1px solid rgba(139, 115, 85, 0.1);
  border-radius: 6px;
}
.mx-fandom-ext select,
.mx-fandom-ext input {
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid rgba(139, 115, 85, 0.15);
  background: rgba(255, 255, 255, 0.6);
  color: var(--m-text);
  font-family: 'DouyinSans', var(--font-main);
  font-size: 10px;
  outline: none;
  &:focus {
    border-color: var(--m-accent);
  }
}
.tag-custom {
  border-style: dashed !important;
  display: inline-flex;
  align-items: center;
}
.tag-custom {
  display: inline-flex;
  align-items: center;
  gap: 1px;
}
.tag-pool .tag-custom input {
  width: 54px;
  height: 16px;
  line-height: 16px;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 9px;
  color: var(--m-muted);
  outline: none;
  text-align: center;
  padding: 0;
  &::placeholder {
    color: var(--m-dim);
  }
}
.tag-custom-btn {
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: var(--m-accent-dim);
  color: var(--m-accent);
  font-size: 10px;
  line-height: 16px;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;
  &:hover {
    background: var(--m-accent);
    color: #fff;
  }
}
.form-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
  label {
    font-family: '寒蝉全圆体', var(--font-main);
    font-size: 9px;
    color: var(--m-muted);
    letter-spacing: 1px;
  }
  > select,
  > input,
  > textarea {
    padding: 5px 8px;
    border-radius: 6px;
    border: 1px solid rgba(139, 115, 85, 0.15);
    background: rgba(255, 255, 255, 0.6);
    color: #4a4035;
    font-family: 'DouyinSans', var(--font-main);
    font-size: 10px;
    outline: none;
    resize: vertical;
    &:focus {
      border-color: var(--m-accent);
    }
  }
}
.tag-pool {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tag {
  padding: 2px 8px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid var(--m-accent-dim);
  font-family: 'DouyinSans', var(--font-main);
  font-size: 9px;
  color: var(--m-muted);
  transition: all 0.12s;
  &:hover {
    border-color: var(--m-accent);
    color: var(--m-accent);
  }
  &.picked {
    background: var(--m-accent-dim);
    border-color: var(--m-accent);
    color: var(--m-accent);
    font-weight: 600;
  }
}
.btn-send {
  flex: 1;
  padding: 8px 0;
  background: var(--m-accent);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #fff;
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.85;
  }
}
.btn-gen {
  flex: 1.3;
  padding: 8px 0;
  background: var(--m-accent-dim);
  border: 1px solid var(--m-accent);
  border-radius: 8px;
  cursor: pointer;
  color: var(--m-accent);
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
  transition: all 0.2s;
  &:hover:not(:disabled) {
    background: var(--m-accent);
    color: #fff;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
.mx-other-input {
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid rgba(139, 115, 85, 0.15);
  background: rgba(255, 255, 255, 0.6);
  color: #4a4035;
  font-family: 'DouyinSans', var(--font-main);
  font-size: 10px;
  outline: none;
  resize: vertical;
  min-height: 50px;
  &:focus {
    border-color: var(--m-accent);
  }
  &::placeholder {
    color: var(--m-dim);
  }
}
.mx-gen-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 2px 0;
}
.mx-save-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
  input[type='checkbox'] {
    accent-color: var(--m-accent);
    width: 12px;
    height: 12px;
    cursor: pointer;
  }
  .toggle-label {
    font-family: '寒蝉全圆体', var(--font-main);
    font-size: 8px;
    color: var(--m-muted);
    letter-spacing: 1px;
    transition: color 0.15s;
  }
  &:hover .toggle-label {
    color: var(--m-accent);
  }
}
.btn-row {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}
.mx-gen-status {
  text-align: center;
  padding: 8px;
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 10px;
  color: var(--m-muted);
  letter-spacing: 1px;
  &.error {
    color: var(--m-rose);
  }
}
.gen-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid var(--m-accent-dim);
  border-top-color: var(--m-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 6px;
  vertical-align: middle;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.mx-gen-result {
  margin-top: 6px;
  padding: 0;
  background: rgba(139, 115, 85, 0.06);
  border: 1px solid rgba(139, 115, 85, 0.12);
  border-radius: 8px;
  overflow: hidden;
}
.gen-result-label {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 9px;
  color: var(--m-accent);
  letter-spacing: 2px;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(139, 115, 85, 0.1);
}
.gen-result-text {
  display: block;
  width: 100%;
  min-height: 180px;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  font-family: 'DouyinSans', var(--font-main);
  font-size: 10px;
  color: var(--m-text);
  line-height: 1.7;
  padding: 8px;
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(139, 115, 85, 0.12);
  border-radius: 6px;
  resize: vertical;
  outline: none;
  &:focus {
    border-color: var(--m-accent);
  }
}
.gen-result-actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  padding: 0 4px 4px;
  align-items: center;
}
.btn-gen-save {
  padding: 5px 12px;
  background: var(--m-accent);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #fff;
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 9px;
  letter-spacing: 1px;
  transition: opacity 0.15s;
  &:hover {
    opacity: 0.85;
  }
}
.btn-gen-inject {
  padding: 5px 12px;
  background: none;
  border: 1px solid var(--m-accent);
  border-radius: 6px;
  cursor: pointer;
  color: var(--m-accent);
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 9px;
  letter-spacing: 1px;
  transition: all 0.15s;
  &:hover {
    background: var(--m-accent);
    color: #fff;
  }
}
.btn-gen-retry {
  padding: 5px 12px;
  background: none;
  border: 1px solid var(--m-accent-dim);
  border-radius: 6px;
  cursor: pointer;
  color: var(--m-muted);
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 9px;
  letter-spacing: 1px;
  transition: all 0.15s;
  &:hover {
    border-color: var(--m-accent);
    color: var(--m-accent);
  }
}
.gen-saved-hint {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 9px;
  color: var(--m-accent);
  letter-spacing: 1px;
}
</style>
