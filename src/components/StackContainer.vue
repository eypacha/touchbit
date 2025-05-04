<template>
    <div class="flex bg-background content-start flex-wrap px-3 pb-x pt-6 text-3xl gap-1 shadow-[inset_0_0_10px_0_rgba(0,0,0,2)] h-full">
        <div
        v-for="(token, index) in store.stack"
        :key="index"
        class="p-0 font-bold text-center border-b cursor-pointer token-container min-h-7 min-w-5"
        :class="[
            { disabled: token.disabled },
            { 'editing-number': isSelected(index) && token.type === 'number' && store.isEditingNumber },
            `text-${token.type}`, 
             isSelected(index) ? `border border-x-${token.type}` : 'border border-t-transparent border-x-transparent border-b-gray'
        ]"
        @click="handleTouch(token, index)"
        >
            <span v-if="token.data === '<<'">«</span>
            <span v-else-if="token.data === '>>'">»</span>
            <span v-else-if="token.data === '~ ~'" class="opacity-35">~</span>
            <Number v-else-if="token.type === 'number'" 
                :model-value="parseFloat(token.data)" 
                @update:modelValue="handleUpdateNumber(token, $event)" 
                :selected="isSelected(index)"
                :styled="false"/>
            <span v-else> {{ (token.data) }} </span>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

import { useMainStore } from '@/stores/mainStore'
import { Number } from '@/components/ui/Number';

const store = useMainStore()

const isSelected = (index) => store.selectedToken === index

const formatNumber = computed(() => {
    return (data) => {
        const strData = String(data);

        if (strData.startsWith('0.')) return strData.substring(1);
        if (strData.startsWith('-0.')) return `-${strData.substring(2)}`;
        if (strData.startsWith('0') && strData.length > 1 && !strData.includes('.'))  return strData.replace(/^0+/, '');
        
        return strData;
    };
});

const operators = ["+", "-","*", "/", "&", "|", "^", "%",">>","<<"];

const handleTouch = (token, index) => {
    if(isSelected(index)) {
        if (token.type === 'number') {
            store.isEditingNumber = true;
        } else {
            store.isEditingNumber = false;
            
            if (token.type === 'operator') {
                console.log(token.data)
                const tokenIndex = operators.indexOf(token.data)

                if(tokenIndex !== -1) {
                    const mod = {
                        data: operators[(tokenIndex + 1) % operators.length],
                    }
                    store.modToken(mod,index)
                } else if(token.data === '~') {
                    // Cambiar de "~" a "~ ~"
                    const mod = {
                        data: '~ ~'
                    }
                    store.modToken(mod, index)
                } else if(token.data === '~ ~') {
                    // Cambiar de "~ ~" a "~"
                    const mod = {
                        data: '~'
                    }
                    store.modToken(mod, index)
                }
            }
        }
    } else {
        store.isEditingNumber = false;
        store.moveTo(index)
    }
}

const handleUpdateNumber = (token, newValue) => {
   if(token.type !== 'number') return
   
   token.data = newValue.toString();
   store.evalBytebeat();
}
</script>

<style>
@keyframes blink-right-border {
  0%, 100% {
    border-right-color: transparent;
  }
  50% {
    border-right-color: currentColor;
  }
}

.editing-number {
  animation: blink-right-border 600ms ease-in-out infinite;
}
</style>