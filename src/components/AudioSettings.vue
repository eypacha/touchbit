<template>
  <div class="w-full h-full p-2" @touchstart.stop.passive @keydown.stop>
    <div class="block w-full p-2">
      <Label>
        Gain
        <Slider v-model="volumeValue" class="my-2" :max="100"  @update:modelValue="setVolume" @touchstart.stop.passive />
      </Label>
    </div>
    <div class="flex w-full p-2">
      <Label class="justify-center flex-1 align-center">
        Sample Rate
        <Slider v-model="selectedSampleRate" class="my-2" :min="4000" :max="16000" @update:modelValue="setSampleRate" @touchstart.stop.passive />
      </Label>
      <input 
        type="number" 
        v-model="selectedSampleRate[0]" 
        class="w-24 mt-3 ml-2 text-center bg-transparent border rounded-md text-number" 
        :min="4000" 
        :max="16000" 
        @input="setSampleRate" 
        @keydown.stop
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Number } from '@/components/ui/Number';
import { useMainStore } from '@/stores/mainStore';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

const volumeValue = ref([80])
const selectedSampleRate = ref([8000])

const store = useMainStore();

function setVolume() {
  const linearVolume = volumeValue.value[0] / 100;
  const logVolume = Math.pow(linearVolume, 2);
  store.setVolume(logVolume);
}

function setSampleRate() {
  console.log('setSampleRate', selectedSampleRate.value[0]);
  store.setSampleRate(selectedSampleRate.value[0]);
}
</script>