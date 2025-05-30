<script setup lang="ts">
import Versions from '@renderer/components/Versions.vue'
// import Logo from '@renderer/assets/electron.svg'
import Icon from '@resources/icon.png'

function ipcHandle() {
  window.electron.ipcRenderer.send('ping',"测试")
}
</script>

<template>
  <img alt="logo" class="logo" :src="Icon" />
  <div class="creator">Powered by electron-vite</div>
  <div class="text">
    Build an Electron app with
    <span class="vue">Vue</span>
    and
    <span class="ts">TypeScript</span>
  </div>
  <p class="tip">Please try pressing <code>F12</code> to open the devTool</p>
  <div class="actions">
    <div class="action">
      <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">Documentation</a>
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="ipcHandle">Send IPC</a>
    </div>
  </div>
  <Versions />
</template>
