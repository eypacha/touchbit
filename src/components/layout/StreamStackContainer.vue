<template>
  <div class="w-full h-[100dvh] flex items-center justify-center bg-background">
    <div class="flex flex-wrap items-center justify-center gap-1 px-4" @click="store.playPause()">
      <div
        v-for="(token, index) in store.stack"
        :key="index"
        class="relative h-12 p-0 font-bold text-center token-container min-w-5"
        :class="getTokenClasses(token, index)"
      >
        <span v-if="token.data === '<<'">«</span>
        <span v-else-if="token.data === '>>'">»</span>
        <span v-else-if="token.data === '~ ~'" class="opacity-35">~</span>
        <Number v-else-if="token.type === 'number'"
          :model-value="token.data"
          @update:modelValue="handleUpdateNumber(token, $event)"
          :styled="false"/>
        <span v-else> {{ token.data }} </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '@/stores/mainStore'
import { Number } from '@/components/ui/number';
import { ACTION_OPERATORS, WORD_OPERATORS } from '@/constants'

const store = useMainStore()

const getTokenClasses = (token, index) => {
  const isActionOperator = ACTION_OPERATORS.includes(token.data);
  const isWordOperator = WORD_OPERATORS.includes(token.data);
  const colorClass = isActionOperator ? 'text-action' : `text-${token.type}`;
  const sizeClass = isWordOperator ? 'text-6xl mt-1' : 'text-8xl';

  return [
    { disabled: token.disabled },
    colorClass,
    sizeClass,
  ].filter(Boolean)
}


const handleUpdateNumber = (token, newValue) => {
  if (token.type !== 'number') return
  token.data = newValue.toString();
  store.evalBytebeat();
}
</script>
