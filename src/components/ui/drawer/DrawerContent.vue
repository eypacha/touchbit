<script setup>
import { cn } from '@/lib/utils';
import { inject } from 'vue'
import { useForwardPropsEmits } from 'radix-vue';
import { DrawerContent, DrawerPortal } from 'vaul-vue';
import DrawerOverlay from './DrawerOverlay.vue';

const props = defineProps({
  forceMount: { type: Boolean, required: false },
  trapFocus: { type: Boolean, required: false },
  disableOutsidePointerEvents: { type: Boolean, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: null, required: false }
});

const direction = inject('drawer-direction', 'bottom') 

const emits = defineEmits([
  'escapeKeyDown',
  'pointerDownOutside',
  'focusOutside',
  'interactOutside',
  'openAutoFocus',
  'closeAutoFocus',
]);

const forwarded = useForwardPropsEmits(props, emits);

const getDirectionClasses = (direction) => {
  switch (direction) {
    case 'right':
      return 'fixed inset-y-0 right-0 h-full w-auto border-l rounded-none'
    case 'left':
      return 'fixed inset-y-0 left-0 h-full w-auto border-r rounded-none'
    case 'top':
      return 'fixed inset-x-0 top-0 mb-24 h-auto rounded-b-[10px]'
    default: 
      return 'fixed inset-x-0 bottom-0 mt-24 h-auto rounded-t-[10px]'
  }
}
</script>

<template>
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerContent
      v-bind="forwarded"
      :class="
        cn(
          'z-50 flex flex-col border bg-background',
          getDirectionClasses(direction),
          props.class,
        )
      "
    >
    <template v-if="direction === 'top'">
      <slot />
      <div
        class="mx-auto mb-4 h-2 w-[100px] rounded-full bg-muted"
      />
    </template>
    
    <template v-else>
      <div
        v-if="direction === 'bottom'"
        class="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted"
      />
      <slot />
    </template>
      
    </DrawerContent>
  </DrawerPortal>
</template>
