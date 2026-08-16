<template>
  <header class="zoo-head">
    <div class="zh-identity">
      <div class="zh-mark" aria-hidden="true">
        <i class="fa-solid fa-shield-cat"></i>
        <span>V</span>
      </div>
      <div class="zh-title-block">
        <span class="zh-kicker">EXTRAORDINARY FAUNA AUTHORITY</span>
        <div class="zh-name-row">
          <h1 class="zh-title">{{ data.园名 }}</h1>
          <span class="zh-lv">LV {{ String(data.园区等级).padStart(2, '0') }}</span>
        </div>
        <span class="zh-subtitle">超常生物保全与观测局</span>
      </div>
    </div>

    <div class="zh-resource" title="当前可用愿力">
      <span class="zr-label"><i class="fa-solid fa-diamond"></i>愿力储备</span>
      <strong>{{ data.愿力.toLocaleString() }}</strong>
      <span class="zr-unit">WISH UNITS</span>
    </div>

    <div class="zh-stats">
      <div class="zh-item">
        <span>今日访客</span>
        <b
          >{{ data.今日游客 }}<small>/ {{ data.游客上限 }}</small></b
        >
      </div>
      <div class="zh-item">
        <span>今日收益</span>
        <b>+{{ data.今日收益 }}</b>
      </div>
      <div class="zh-item">
        <span>全园产率</span>
        <b>{{ store.总产率 }}<small>/时</small></b>
      </div>
      <div class="zh-item" :class="{ alert: !data.解锁异种 }">
        <span>异种展区</span>
        <b>{{ data.解锁异种 ? '开放' : '封存' }}</b>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useZooStore } from '../store';

const store = useZooStore();
const data = computed(() => store.data);
</script>
