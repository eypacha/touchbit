<template>
  <div class="w-full h-[450px] p-2" @touchstart.stop.passive @keydown.stop>
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
        v-model="sampleRateInput"
        class="w-24 mt-3 ml-2 text-center bg-transparent border rounded-md text-number" 
        :min="4000" 
        :max="16000" 
        @keydown.stop
        @keydown.enter.prevent="applySampleRateInput"
        @blur="applySampleRateInput"
        inputmode="numeric"
        pattern="[0-9]*"
        enterkeyhint="done"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useMainStore } from '@/stores/mainStore';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

const volumeValue = ref([80])
const store = useMainStore();

const selectedSampleRate = computed({
  get: () => [store.sampleRate],
  set: (value) => setSampleRate(value)
});

const sampleRateInput = ref(store.sampleRate);

watch(() => store.sampleRate, (v) => {
  sampleRateInput.value = v;
});

function applySampleRateInput() {
  let num = Number(sampleRateInput.value);
  if (isNaN(num)) num = 4000;
  num = Math.max(4000, Math.min(16000, num));
  setSampleRate([num]);
}

function setVolume() {
  const linearVolume = volumeValue.value[0] / 100;
  const logVolume = Math.pow(linearVolume, 2);
  store.setVolume(logVolume);
}

function setSampleRate(value) {
  const rate = value ? value[0] : selectedSampleRate.value[0];
  console.log('setSampleRate', rate);
  store.setSampleRate(rate);
}
</script>