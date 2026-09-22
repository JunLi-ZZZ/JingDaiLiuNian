<script setup lang="ts">
import { GradeSchema } from '../../src/grades';
defineProps<{grade:string}>();
</script>
<template><span v-if="GradeSchema.safeParse(grade).success" class="grade-badge" :data-grade="grade">{{grade}}</span><span v-else>{{grade}}</span></template>
<style>
[data-grade="凡常"]{--grade-a:#b5bcc3;--grade-b:#eef0e7;--grade-c:#7f9195}
[data-grade="精良"]{--grade-a:#5da987;--grade-b:#c6efd2;--grade-c:#397d74}
[data-grade="稀有"]{--grade-a:#559ec5;--grade-b:#b4e8ed;--grade-c:#677cbd}
[data-grade="史诗"]{--grade-a:#9570c7;--grade-b:#e1c1f1;--grade-c:#7278c7}
[data-grade="传说"]{--grade-a:#d5a347;--grade-b:#ffedb5;--grade-c:#c7714c}
[data-grade="神话"]{--grade-a:#e67495;--grade-b:#ffe4a8;--grade-c:#ac68ba}
[data-grade="本源"]{--grade-a:#82cfcb;--grade-b:#fff0be;--grade-c:#c193db}
.grade-badge{display:inline-block;vertical-align:middle;padding:2px 10px;line-height:1.6;font:600 11px/1.8 'Microsoft YaHei',sans-serif;letter-spacing:1px;color:#f3f3e9!important;border:1px solid var(--grade-a);border-radius:3px;background:linear-gradient(115deg,#19282d 5%,var(--grade-c) 40%,#243238 60%,var(--grade-a) 95%);background-size:280% 100%;animation:grade-flow 8s ease-in-out infinite;box-shadow:0 0 10px color-mix(in srgb,var(--grade-a) 25%,transparent)}
.grade-badge[data-grade="凡常"]{animation:none}.grade-badge[data-grade="神话"]{animation-duration:6s}.grade-badge[data-grade="本源"]{animation-duration:5s}
@keyframes grade-flow{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
[data-grade].folio{border-left-color:var(--grade-a)!important}
[data-grade].dossier{border-color:var(--grade-a)!important;--accent:var(--grade-a)!important}
[data-grade].dossier h3{background:linear-gradient(105deg,var(--grade-a),var(--grade-b),var(--grade-c),var(--grade-a));background-size:250% 100%;background-clip:text;-webkit-background-clip:text;color:transparent!important;animation:grade-flow 10s ease-in-out infinite}
[data-grade].dossier.relic h3,[data-grade].dossier.fieldnote h3{background:none;color:#293e3b!important}
@media(prefers-reduced-motion:reduce){.grade-badge,[data-grade].dossier h3{animation:none}}
</style>
