import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { tokensToExpression } from "@/utils/expressionUtils";

export const useStackStore = defineStore("stack", () => {
  const stack = ref([
    { type: 'time', data: 't' },
    { type: 'number', data: 64 },
    { type: 'operator', data: '&' },
    { type: 'time', data: 't' },
    { type: 'number', data: '4' },
    { type: 'operator', data: '>>' },
    { type: 'operator', data: '|' },
  ]);
  
  const expression = computed(() => tokensToExpression(stack.value));

  return {
    stack,
    expression
  };
});