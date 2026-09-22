<script setup lang="ts">
import type { CoverEnvironment } from './environment';
defineProps<{ environment?: CoverEnvironment; preview?: boolean }>();
defineEmits<{ retry: [] }>();
</script>
<template>
  <section class="environment" aria-label="环境检测">
    <div class="env-heading">
      <span>启程准备</span><button v-if="!preview" type="button" @click="$emit('retry')">重新检测</button>
    </div>
    <p v-if="preview">本地外观演示 · 不连接酒馆，不代表扩展已就绪。</p>
    <template v-else>
      <ul>
        <li v-for="item in environment?.checks" :key="item.name">
          <span :class="item.ready ? 'ready' : 'waiting'">{{ item.ready ? '✓' : '○' }}</span>
          <div>
            <strong>{{ item.name }}</strong
            ><small>{{ item.detail }}</small>
          </div>
        </li>
      </ul>
      <p v-if="environment?.error" role="status">{{ environment.error }}</p>
      <p v-else-if="environment?.checks.length && environment.checks.every(item => item.ready)">
        环境已就绪，可以开始旅途。
      </p>
      <p v-else>
        {{
          environment?.elapsed
            ? '部分组件尚未就绪，请按上方提示检查。检测会自动继续，已填写的设定会保留。'
            : '正在检查游玩环境。你可以先填写角色与开局，组件就绪后再发送。'
        }}
      </p>
    </template>
  </section>
</template>
<style scoped>
.environment {
  padding: 24px;
  border: 1px solid #ac957a40;
  background: #1b2829;
  color: #efe5d5;
  font:
    12px/1.8 'Microsoft YaHei',
    sans-serif;
}
.env-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #d9bf96;
  letter-spacing: 2px;
}
button {
  color: #e5d6bf;
  background: transparent;
  border: 1px solid #ac957a70;
  padding: 5px 10px;
  cursor: pointer;
  font: inherit;
}
ul {
  padding: 0;
  margin: 15px 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px 22px;
}
li {
  display: flex;
  gap: 10px;
}
strong {
  font-weight: 500;
}
small {
  display: block;
  color: #b8bdb4;
  line-height: 1.7;
}
.ready {
  color: #a8cfb1;
}
.waiting {
  color: #e3bb83;
}
p {
  margin: 12px 0 0;
  color: #c4c2b5;
}
</style>
