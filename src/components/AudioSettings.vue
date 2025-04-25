<template>
  <div class="content min-w-[250px]">
    <div class="flex items-center justify-between gap-2 mb-5">
      <Label :for="'sampleRateLabel'">Sample rate</Label>
      <Number ref="sampleRateLabel"  class="w-24" v-model="selectedSampleRate" :step="10" @update:modelValue="setSampleRate"
        @touchstart="updatingSampleRate = true" @touchend="updatingSampleRate = false" />
    </div>
    <div class="flex items-center justify-between gap-2 mb-5">
      <Label :for="'bpmLabel'">BPM</Label>
      <Key variant="outline" class="ml-8 border-gray" @click="tapTempo">
        <small>tap</small>
      </Key>
      <Number ref="bpmLabel" class="w-24" v-model="selectedBPM" @update:modelValue="setBPM" @touchstart="updatingBPM = true"
        @touchend="updatingBPM = false" />
    </div>
    <Key @click="caclB">C</Key>
    <div>
  </div>
  </div>
</template>


<script setup>

import { ref, watch } from 'vue';
import { useMainStore } from '@/stores/main';

import { calculateSampleRate, calculateBPM } from '@/lib/utils';
import { useTapTempo } from '@/composables/useTapTempo';

import Key from '@/components/Key.vue'
import { Label } from '@/components/ui/label';
import { Number } from '@/components/ui/Number';


const store = useMainStore();

const selectedBPM = ref(117)
const selectedSampleRate = ref(8000)
const updatingSampleRate = ref(false)
const updatingBPM = ref(false)

const { tempo, tapTempo } = useTapTempo();


watch(tempo, (newTempo) => {
  selectedBPM.value = newTempo;
  setBPM();
});


function caclB() {
  console.log('caclB');
  console.log(calculateBPM(selectedSampleRate.value, store.stack[1].data, store.stack[2].data));
  console.log(calculateSampleRate(selectedBPM.value, store.stack[1].data, store.stack[2].data));
}
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
