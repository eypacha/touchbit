<template>
  <header class="flex w-full gap-1 p-3 border-b bg-card">
    <Key @click="store.playPause()" class="border-input">
      <Play v-if="!store.isPlaying"/>
      <Square v-else/>
    </Key>
    <Key @click="store.reset()" class="border-input">
      <RotateCcw/>
    </Key>
    <Key @click="toggleTimeFormat" variant="outline" class="flex justify-end flex-1 border-input">
      <span class="text-time">
        {{ displayTime }}
      </span>
    </Key>
    <Drawer direction="right">
      <DrawerTrigger>
        <Key class="border-input">
          <EllipsisVertical/>
        </Key>
      </DrawerTrigger>
      <DrawerContent class="bg-card">
        <DrawerHeader>
          <DrawerTitle>
            <Logo/>
          </DrawerTitle>
          <DrawerDescription/>
        </DrawerHeader>
        <div class="p-5"> 

        </div>
        <DrawerFooter class="items-center">
          <Switch :checked="themeStore.theme === 'dark'" @update:checked="themeStore.toggleTheme">
            <template #thumb>
              <div class="flex items-center justify-center w-full h-full rounded-full">
                <Moon v-if="themeStore.theme === 'dark'" class="bg-transparent size-4"/>
                <Sun v-else class="bg-transparent size-4" stroke="hsl(var(--number))"/>
              </div>
            </template>
          </Switch>
          <Button variant="ghost" size="sm">
           Settings
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'; // Import ref and computed
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

import { Switch } from '@/components/ui/switch'
import Key from '@/components/common/Key.vue'

import { Play, RotateCcw, Square, EllipsisVertical, Moon, Sun } from 'lucide-vue-next';
import { useMainStore } from '@/stores/mainStore'
import { useThemeStore } from '@/stores/themeStore'; 

import Logo from '@/components/core/Logo.vue';

const store = useMainStore()
const themeStore = useThemeStore(); 

const showFormattedTime = ref(false); // Reactive reference for toggling format

const formattedTime = computed(() => {
  const totalSeconds = Math.floor(store.time / store.sampleRate);
  const totalMinutes = Math.floor(totalSeconds / 60);
  
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    const minutes = totalMinutes;
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
});

const displayTime = computed(() => {
  return showFormattedTime.value ? formattedTime.value : store.time;
});

function toggleTimeFormat() {
  console.log('time', store.time)
  console.log('sampleRate', store.sampleRate)
  showFormattedTime.value = !showFormattedTime.value;
}

</script>
