<template>
    <div class="flex flex-1 bg-background content-start flex-wrap p-3 text-xl overflow-x-hidden overflow-y-auto gap-1 shadow-[inset_0_0_10px_0_rgba(0,0,0,2)]" >
        <div
        v-for="(token, index) in store.stack"
        :key="index"
        class="p-0 font-bold text-center border-b h-7"
        :class="[
            { disabled: token.disabled },
            `text-${token.type}`, 
             token.type === 'operator' ? 'w-7' : 'min-w-3',
             isSelected(index) ? `border border-x-${token.type}` : 'border border-t-transparent border-x-transparent border-b-gray'
        ]"
        @click="handleTouch(token, index)"
        >
            <ChevronsLeft v-if="token.data === '<<'" />
            <ChevronsRight v-else-if="token.data === '>>'" />
            <Number v-else-if="token.type === 'number'" 
                :model-value="parseFloat(token.data)" 
                @update:modelValue="handleUpdateNumber(token, $event)" 
                :styled="false"/>
            <span v-else> {{ (token.data) }} </span>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

import { useMainStore } from '@/stores/main'
import { ChevronsLeft, ChevronsRight } from 'lucide-vue-next';
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
        
        if (token.type === 'operator') {
            
            console.log(token.data)

            const tokenIndex = operators.indexOf(token.data)

            if(tokenIndex !== -1) {
               
                const mod = {
                     data: operators[(tokenIndex + 1) % operators.length],
                }

               store.modToken(mod,index)
            } else if(token.data === '~') {
                token.disabled = !token.disabled
            }

        }
    } else {
        store.moveTo(index)
    }
}

const handleUpdateNumber = (token, newValue) => {
   if(token.type !== 'number') return
   
   token.data = newValue.toString();
   store.evalBytebeat();
}
</script>