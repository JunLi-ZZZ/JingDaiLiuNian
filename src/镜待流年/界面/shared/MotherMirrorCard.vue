<template>
  <section class="mother-mirror" aria-label="母镜资料">
    <LenticularCard
      :entry="MOTHER_MIRROR_CARD"
      :grade="item.品阶"
      :image="image"
      :alternate-image="alternateImage"
      :auto-start="autoStart"
    />
    <div class="mother-mirror-copy">
      <p v-if="item.数量 !== undefined" class="mother-mirror-count">随身物品 · {{ name }} ×{{ item.数量 }}</p>
      <p>{{ item.描述?.trim() || '一面流转千年的古朴铜镜，隐约流转星河微光，背面刻有古老符文。' }}</p>
      <p v-if="item.能力 && item.能力 !== '无'"><span class="mother-mirror-label">能力</span>{{ item.能力 }}</p>
      <p><span class="mother-mirror-label">来历</span>虞姝昀在你幼时赠予，称作“护身符”。</p>
    </div>
  </section>
</template>
<script setup lang="ts">
import LenticularCard from './LenticularCard.vue';
import { MOTHER_MIRROR_CARD } from './lenticular-catalog';
withDefaults(
  defineProps<{
    name: string;
    item: { 描述?: string; 数量?: number; 品阶?: string; 能力?: string };
    image?: string;
    alternateImage?: string;
    autoStart?: boolean;
  }>(),
  { autoStart: false, image: undefined, alternateImage: undefined },
);
</script>
<style scoped>
.mother-mirror {
  width: 100%;
  max-width: 380px;
  box-sizing: border-box;
  margin: 8px auto 14px;
}
.mother-mirror-copy {
  margin: 0 14px;
  padding: 8px 12px;
  border-left: 2px solid #b2925e55;
  color: var(--t-text, #76634c);
  font-size: 11px;
  line-height: 1.85;
  text-align: left;
  overflow-wrap: anywhere;
}
.mother-mirror-copy p {
  margin: 0 0 7px;
}
.mother-mirror-copy p:last-child {
  margin-bottom: 0;
}
.mother-mirror-count {
  color: var(--t-muted, #97866e);
  font-size: 10px;
}
.mother-mirror-label {
  margin-right: 7px;
  color: var(--t-accent, #ad8c52);
}
</style>
