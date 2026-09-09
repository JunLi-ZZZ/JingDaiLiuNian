<template>
  <svg viewBox="0 0 24 24" aria-hidden="true" class="vc-icon"><path fill="currentColor" :d="paths[name]" /></svg>
</template>
<script setup lang="ts">
defineProps<{ name: 'back' | 'share' | 'chat' | 'play' | 'hang' | 'video' }>();
// Inline icons keep the phone usable when the host icon font is unavailable.
const paths = {
  back: 'm10.828 12 4.95 4.95-1.414 1.415L8 12l6.364-6.364 1.414 1.414z',
  share: 'M13 14H9a5 5 0 0 0-5 5v1H2v-1A11 11 0 0 1 13 8V3l9 8-9 8zm2 .55L18.99 11 15 7.45V10h-2a8.97 8.97 0 0 0-6.19 2.46A7 7 0 0 1 9 12h6z',
  chat: 'M3 3h18v14H7l-4 4zm2 2v11.17L6.17 15H19V5zM7 8h10v2H7zm0 4h7v2H7z',
  play: 'M8 5v14l11-7z',
  hang: 'M12 9a17 17 0 0 1 11 4l-3 4-5-2v-3a14 14 0 0 0-6 0v3l-5 2-3-4a17 17 0 0 1 11-4',
  video: 'M2 5h14v5l6-4v12l-6-4v5H2zm2 2v10h10V7z',
};
</script>
<style scoped>
.vc-icon{display:inline-block;width:20px;height:20px;flex:none;vertical-align:middle}
</style>
