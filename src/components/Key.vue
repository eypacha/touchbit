<template>
  <Button
    variant="outline"
    class="h-10 font-bold border-[1px] border-b-4 active:border-b-[1px] hover:bg-transparent select-none"
    :class="`border-${color} active:bg-${color}/20`"
  >
    <span :class="`text-${color}`">
      <slot />
    </span>
  </Button>
</template>

<script setup>
import { Button } from '@/components/ui/button'
import { defineProps } from 'vue'

const props = defineProps({
  color: {
    type: String,
    required: false,
    default: 'operator'
  }
})
</script>
