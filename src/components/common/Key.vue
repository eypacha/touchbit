<template>
  <Button
    variant="outline"
    class="touch-manipulation h-10 font-bold border-[1px] border-b-4 active:border-b-[1px] select-none cursor-pointer"
    :class="[active ? `bg-${color}/20 border-white` : `border-${color}`]"
  >
    <span :class="active ? 'text-white' : `text-${color}`">
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
  },
  active: {
    type: Boolean,
    required: false,
    default: false
  },
})
</script>
