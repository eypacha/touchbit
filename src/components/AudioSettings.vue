<template>
  <div class="content min-w-[250px]">
    <div class="mb-6 block">
      <Label>
        Volume
        <Slider v-model="volumeValue" class="my-2" :max="100" @update:modelValue="setVolume" @touchstart.stop />
      </Label>
    </div>
    <div class="mb-5 flex justify-between items-center gap-2">
      <Label :for="'sampleRateLabel'">Sample rate</Label>
      <Number ref="sampleRateLabel"  class="w-24" v-model="selectedSampleRate" :step="10" @update:modelValue="setSampleRate"
        @touchstart="updatingSampleRate = true" @touchend="updatingSampleRate = false" />
    </div>
    <div class="mb-5 flex justify-between items-center gap-2">
      <Label :for="'bpmLabel'">BPM</Label>
      <Key variant="outline" class="border-gray ml-8" @click="tapTempo">
        <small>tap</small>
      </Key>
      <Number ref="bpmLabel" class="w-24" v-model="selectedBPM" @update:modelValue="setBPM" @touchstart="updatingBPM = true"
        @touchend="updatingBPM = false" />
    </div>
    <div>
  </div>
  </div>
</template>


<script setup>

import { ref, watch} from 'vue';
import { useMainStore } from '@/stores/main';

import { calculateSampleRate, calculateBPM } from '@/lib/utils';
import { useTapTempo } from '@/composables/useTapTempo';

import { Slider } from '@/components/ui/slider';
import Key from '@/components/Key.vue'
import { Label } from '@/components/ui/label';
import { Number } from '@/components/ui/Number';

const store = useMainStore();

const selectedBPM = ref(117)
const volumeValue = ref([80])
const selectedSampleRate = ref(8000)
const updatingSampleRate = ref(false)
const updatingBPM = ref(false)

const { tempo, tapTempo } = useTapTempo();

function setVolume() {
  const linearVolume = volumeValue.value[0] / 100;
  const logVolume = Math.pow(linearVolume, 2);
  store.setVolume(logVolume);
}

watch(tempo, (newTempo) => {
  selectedBPM.value = newTempo;
  setBPM();
});

function setSampleRate() {
  if (updatingBPM.value) return;
  console.log('setSampleRate');
  selectedBPM.value = calculateBPM(selectedSampleRate.value, store.stack[1].data, store.stack[2].data)
  store.setSampleRate(selectedSampleRate.value)
}
function setBPM() {
  if (updatingSampleRate.value) return;
  console.log('setBPM', selectedBPM.value);
  selectedSampleRate.value = calculateSampleRate(selectedBPM.value, store.stack[1].data, store.stack[2].data)
  store.setSampleRate(selectedSampleRate.value)
}
</script>
