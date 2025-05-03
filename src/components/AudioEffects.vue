<template>
  <div class="w-full h-full p-2 border rounded-md content">
     <div class="block w-full mb-6">
          <Label>
            Gain
            <Slider v-model="volumeValue" class="my-2" :max="100" @update:modelValue="setVolume" @touchstart.stop />
          </Label>
        </div>
    
  </div>
</template>

<script setup>
import { ref } from 'vue';

import { useMainStore } from '@/stores/main';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
const volumeValue = ref([80])

const store = useMainStore();
function setVolume() {
  const linearVolume = volumeValue.value[0] / 100;
  const logVolume = Math.pow(linearVolume, 2);
  store.setVolume(logVolume);
}

</script>