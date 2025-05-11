<template>
  <header class="flex w-full gap-1 p-3 border-b bg-card">
    <Key @click="store.playPause()" class="border-input">
      <Play v-if="!store.isPlaying"/>
      <Square v-else/>
    </Key>
    <Key variant="outline" class="flex justify-end flex-1 border-input" @click="store.reset()">
      <span class="text-time">
        {{ store.time }}</span>
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
import Key from '@/components/Key.vue'

import { Play, Square, EllipsisVertical, Moon, Sun } from 'lucide-vue-next';
import { useMainStore } from '@/stores/mainStore'
import { useThemeStore } from '@/stores/themeStore'; // Add this import

import Logo from '@/components/Logo.vue';

const store = useMainStore()
const themeStore = useThemeStore(); // Add this line

</script>
