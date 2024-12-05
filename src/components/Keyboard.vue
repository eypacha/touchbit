<template>
  <div class="w-full h-full grid grid-cols-12 gap-2">
    <Key v-for="(key, index) in layout" :key="index" :color="key.color ?? key.type" :class="getColSpan(key.width)"
    :disabled="key.disabled" @click="keyPressed(key.type, key.data)">
      <ChevronsLeft v-if="key.data === '<<'" />
      <ChevronsRight v-else-if="key.data === '>>'" />
      <Delete v-else-if="key.data === 'BCKS'"/>
      <BetweenHorizontalEnd v-else-if="key.data === 'STACK'" stroke="hsl(var(--number))"/>
      <Pi v-else-if="key.data === 'FUNC'" stroke="hsl(var(--number))"/>
      <Share v-else-if="key.data === 'SHARE'" stroke="hsl(var(--number))"/>
      <MoveLeft v-else-if="key.data === 'LEFT'" />
      <MoveRight v-else-if="key.data === 'RIGHT'"/>
      <Delete v-else-if="key.data === 'BCKS'" />
      <template v-else> {{ key.data }} </template>
    </Key>
  </div>
</template>

<script setup>

import { useMainStore } from '@/stores/main'
import Key from '@/components/Key.vue'
import { Delete, MoveLeft, MoveRight, ChevronsLeft, ChevronsRight, Share, Pi, BetweenHorizontalEnd} from 'lucide-vue-next';

const store = useMainStore()

const layout = [
  { type: 'action', data: 'UNDO', width: 3, disabled: true },
  { type: 'action', data: 'REDO', width: 3 , disabled: true},
  { type: 'action', data: 'STACK', color: 'time', disabled: true},
  { type: 'action', data: 'FUNC', color: 'time' , disabled: true},
  { type: 'action', data: 'SHARE', color: 'time', disabled: true},
  { type: 'number', data: 7 },
  { type: 'number', data: 8 },
  { type: 'number', data: 9 },
  { type: 'operator', data: '*' },
  { type: 'operator', data: '/' },
  { type: 'operator', data: '&' },
  { type: 'number', data: 4 },
  { type: 'number', data: 5 },
  { type: 'number', data: 6 },
  { type: 'operator', data: '+' },
  { type: 'operator', data: '-' },
  { type: 'operator', data: '|' },
  { type: 'number', data: 1 },
  { type: 'number', data: 2 },
  { type: 'number', data: 3 },
  { type: 'operator', data: '%' },
  { type: 'operator', data: '~' },
  { type: 'operator', data: '^' },
  { type: 'number', data: '.' },
  { type: 'number', data: 0 },
  { type: 'action', data: 'BCKS', color: 'error' },
  { type: 'time', data: 't' },
  { type: 'operator', data: '<<' },
  { type: 'operator', data: '>>' },
  { type: 'action', data: 'HOLD' , disabled: true },
  { type: 'action', data: 'INS', disabled: true },
  { type: 'action', data: 'DEL', color: 'error' },
  { type: 'action', data: 'LEFT', width: 3 },
  { type: 'action', data: 'RIGHT', width: 3 }
]

const keyPressed = (type, data) => {
  store.keyPressed(type, data)
}

const getColSpan = (width) => `col-span-${width ?? 2}`
</script>
