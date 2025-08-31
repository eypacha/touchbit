<template>
  <div class="w-full flex flex-col h-[300px] p-2" @touchstart.stop.passive @keydown.stop>
    <div class="flex flex-col flex-1 overflow-y-auto h-full">
      <div class="flex w-full p-2">
        <Label class="justify-center flex-1 align-center">
          Sample Rate
          <Slider v-model="selectedSampleRate" class="my-2" :min="4000" :max="16000" @update:modelValue="setSampleRate"
            @touchstart.stop.passive />
        </Label>
        <input type="number" v-model="sampleRateInput"
          class="w-24 mt-2 ml-2 text-center bg-transparent border rounded-md text-number" :min="4000" :max="16000"
          @keydown.stop @keydown.enter.prevent="applySampleRateInput" @blur="applySampleRateInput" inputmode="numeric"
          pattern="[0-9]*" enterkeyhint="done" />
      </div>
      <div class="block w-full p-2">
        <Label>
          Gain
          <Slider v-model="volumeValue" class="my-2" :max="100" @update:modelValue="setVolume"
            @touchstart.stop.passive />
        </Label>
      </div>
      <div class="block w-full p-2">
        <Label>
          Reverb
          <Slider v-model="reverbValue" class="my-2" :max="100" @update:modelValue="setReverb"
            @touchstart.stop.passive />
        </Label>
      </div>
      <div class="block w-full p-2">
        <Label class="flex items-center justify-between">
          <div>Equalizer</div>
        </Label>
        <div class="flex flex-col gap-3 mt-2 px-4">
          <div>
            <Label>Bass
              <Slider :modelValue="[bassVal]" :min="-12" :max="12" @update:modelValue="(v) => updateBand('bass', v)" />
            </Label>
          </div>
          <div>
            <Label>Mid
              <Slider :modelValue="[midVal]" :min="-12" :max="12" @update:modelValue="(v) => updateBand('mid', v)" />
            </Label>
          </div>
          <div>
            <Label>Treble
              <Slider :modelValue="[trebleVal]" :min="-12" :max="12"
                @update:modelValue="(v) => updateBand('treble', v)" />
            </Label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useMainStore } from '@/stores/mainStore';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

const volumeValue = ref([80])
const store = useMainStore();
const reverbValue = ref([Math.round((store.reverbWet || 0) * 100)])

watch(() => store.reverbWet, (v) => {
  reverbValue.value = [Math.round((v || 0) * 100)];
});

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

function setReverb() {
  const v = reverbValue.value[0] / 100;
  store.setReverbWet(v);
}

// Graphic EQ UI
const bassVal = ref(store.graphicEQ ? store.graphicEQ[0] : 0);
const midVal = ref(store.graphicEQ ? store.graphicEQ[3] : 0);
const trebleVal = ref(store.graphicEQ ? store.graphicEQ[6] : 0);

watch(() => store.graphicEQ, (v) => {
  if (!v) return;
  bassVal.value = v[0];
  midVal.value = v[3];
  trebleVal.value = v[6];
});

function updateBand(band, v) {
  const num = Array.isArray(v) ? Number(v[0]) : Number(v);
  if (!Number.isFinite(num)) return;
  if (band === 'bass') bassVal.value = num;
  if (band === 'mid') midVal.value = num;
  if (band === 'treble') trebleVal.value = num;
  store.setGraphicEQ({ bass: bassVal.value, mid: midVal.value, treble: trebleVal.value });
}
</script>