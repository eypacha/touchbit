<template>
    <div class="flex flex-wrap content-start h-full gap-1 px-3 overflow-x-hidden overflow-y-scroll text-3xl pt-9 bg-background pb-x"
         @click="handleContainerClick">
        <div
        v-for="(token, index) in store.stack"
        :key="index"
        class="h-12 p-0 text-5xl font-bold text-center border-b cursor-pointer token-container min-w-5"
        :class="[
            { disabled: token.disabled },
            { 'editing-number': isSelected(index) && token.type === 'number' && store.isEditingNumber },
            `text-${token.type}`, 
             isSelected(index) ? `border border-x-${token.type}` : 'border border-t-transparent border-x-transparent border-b-gray'
        ]"
        @click.stop="handleTouch(token, index)"
        >
            <span v-if="token.data === '<<'">«</span>
            <span v-else-if="token.data === '>>'">»</span>
            <span v-else-if="token.data === '~ ~'" class="opacity-35">~</span>
            <Number v-else-if="token.type === 'number'" 
                :model-value="token.data" 
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

// Manejador para clics en el contenedor (espacio vacío)
const handleContainerClick = (event) => {
    // Si el clic es en el contenedor mismo (no en un token)
    if (event.target === event.currentTarget) {
        store.isEditingNumber = false;
        store.isBinaryEditor = false;
    }
}

const handleTouch = (token, index) => {
    if(isSelected(index)) {
        if (token.type === 'number') {
            store.isEditingNumber = true;
        } else {
            store.isEditingNumber = false;
            store.isBinaryEditor = false;
            
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
        // Si se toca otro token, desactivar el modo de edición de números
        store.isEditingNumber = false;
        store.isBinaryEditor = false;
        store.moveTo(index)
    }
}

const handleUpdateNumber = (token, newValue) => {
   if(token.type !== 'number') return
   
   token.data = newValue.toString();
   store.evalBytebeat();
}
</script>

<style lang="scss">
// Animación existente
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