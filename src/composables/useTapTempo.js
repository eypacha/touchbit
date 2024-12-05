import { ref } from 'vue';

export function useTapTempo() {
  const taps = ref([]);
  const tempo = ref(0);

  const tapTempo = () => {
    const now = Date.now(); 

    if (taps.value.length > 0) {
      taps.value.push(now);

      if (taps.value.length >= 4) {
        const intervals = taps.value.map((tap, index) => {
          if (index === 0) return 0;
          return (tap - taps.value[index - 1]) / 1000;
        }).slice(1);

        const averageInterval = intervals.reduce((acc, val) => acc + val, 0) / intervals.length;
        tempo.value = 60 / averageInterval; 
      }
    } else {
      taps.value.push(now);
    }

    if (taps.value.length > 10) {
      taps.value.shift();
    }
  };

  return {
    taps,
    tempo,
    tapTempo,
  };
}