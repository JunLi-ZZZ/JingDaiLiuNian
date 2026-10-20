<template>
  <section class="mother-mirror" aria-label="母镜光栅卡">
    <LenticularCard
      :entry="MOTHER_MIRROR_CARD"
      :grade="item.品阶"
      :image="image"
      :alternate-image="alternateImage"
      :auto-start="autoStart"
    />
  </section>
</template>
<script setup lang="ts">
import LenticularCard from './LenticularCard.vue';
import { MOTHER_MIRROR_CARD } from './lenticular-catalog';
withDefaults(
  defineProps<{
    item: { 品阶?: string };
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
</style>
