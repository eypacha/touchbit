<template>
  <div class="w-full h-full p-2">
    <div class="flex items-center gap-2">
      <input
        class="flex-1 p-2 font-bold bg-transparent border text-md h-30 text-primary border-grey focus:outline-none"
        :placeholder="currentExpression ?? ''"
        v-model="expressionName"
      />
      <Key color="grey" class="h-full">Save</Key>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useMainStore } from '@/stores/mainStore';
import { useCurrentExpression } from '@/composables/useCurrentExpression';
import Key from '@/components/Key.vue';

const store = useMainStore();
const expressionName = ref('');
const { currentExpression } = useCurrentExpression();
</script>