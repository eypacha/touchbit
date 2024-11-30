<template>
 <div class="w-full h-full grid grid-cols-12 gap-2">

  <Key class="col-span-3 text-fuchsia-600">UNDO</Key>
  <Key class="col-span-3 text-fuchsia-600">REDO</Key>

  <Key class="text-green-500">STACK</Key>
  <Key class="text-green-500">Math</Key>
  <Key class="text-green-500">?</Key>

  <Key class="text-yellow-500">7</Key>
  <Key class="text-yellow-500">8</Key>
  <Key class="text-yellow-500">9</Key>

  <Key class="text-white">*</Key>
  <Key class="text-white">/</Key>
  <Key class="text-white">&</Key>

  <Key class="text-yellow-500">4</Key>
  <Key class="text-yellow-500">5</Key>
  <Key class="text-yellow-500">6</Key>

  <Key class="text-white">+</Key>
  <Key class="text-white">-</Key>
  <Key class="text-white">|</Key>

  <Key class="text-yellow-500">1</Key>
  <Key class="text-yellow-500">2</Key>
  <Key class="text-yellow-500">3</Key>

  <Key class="text-white">%</Key>
  <Key class="text-white">~</Key>
  <Key class="text-white">^</Key>

  <Key class="text-yellow-500">.</Key>
  <Key class="text-yellow-500">0</Key>
  <Key class="text-yellow-500">⌫</Key>

  <Key class="text-cyan-500">t</Key>
  <Key class="text-white">&laquo;</Key>
  <Key class="text-white">&raquo;</Key>

  <Key class="text-fuchsia-600">HOLD</Key>
  <Key class="text-fuchsia-600">INS</Key>
  <Key class="text-fuchsia-600">DEL</Key>
  
  <Key class="col-span-3 text-fuchsia-600 -scale-100">➝</Key>
  <Key class="col-span-3 text-fuchsia-600">➝</Key>
</div>

</template>

<script setup>
import Key from '@/components/Key.vue'

</script>