<script setup>
import { cn } from '@/lib/utils';
import {
  SliderRange,
  SliderRoot,
  SliderThumb,
  SliderTrack,
  useForwardPropsEmits,
} from 'radix-vue';
import { computed } from 'vue';

const props = defineProps({
  name: { type: String, required: false },
  defaultValue: { type: Array, required: false },
  modelValue: { type: Array, required: false },
  disabled: { type: Boolean, required: false },
  orientation: { type: String, required: false },
  dir: { type: String, required: false },
  inverted: { type: Boolean, required: false },
  min: { type: Number, required: false },
  max: { type: Number, required: false },
  step: { type: Number, required: false },
  minStepsBetweenThumbs: { type: Number, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: null, required: false },
});
const emits = defineEmits(['update:modelValue', 'valueCommit']);

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <SliderRoot
    :class="
      cn(
        'relative flex w-full touch-none select-none items-center data-[orientation=vertical]:flex-col data-[orientation=vertical]:w-2 data-[orientation=vertical]:h-full',
        props.class,
      )
    "
    v-bind="forwarded"
  >
    <SliderTrack
      class="relative h-2 w-full data-[orientation=vertical]:w-2 grow overflow-hidden rounded-full bg-background border-1 border"
    >
      <SliderRange
        class="absolute h-full data-[orientation=vertical]:w-full bg-number"
      />
    </SliderTrack>
    <SliderThumb
      v-for="(_, key) in modelValue"
      :key="key"
      class="block w-5 h-5 transition-colors border-2 rounded-full border-number bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab"
    />
  </SliderRoot>
</template>
