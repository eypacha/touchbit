<template>
  <header class="w-full p-3 border-b flex gap-1 bg-card">
    <Key @click="store.playPause()" class="border-input">
      <Play v-if="!store.isPlaying"/>
      <Square v-else/>
    </Key>
    <Key variant="outline" class="flex-1 flex justify-end border-input" @click="store.reset()">
      <span class="text-time">
        {{ store.time }}</span>
      <span class="mx-2">➝</span>
      <span class="text-number">

        {{  store.sample.toString().padStart(3, "0") }}

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
          <Switch :checked="store.theme === 'dark'" @update:checked="store.toggleTheme">
            <template #thumb>
              <div class="w-full h-full flex items-center justify-center rounded-full">
                <Moon v-if="store.theme === 'dark'" class="size-4 bg-transparent"/>
                <Sun v-else class="size-4 bg-transparent" stroke="hsl(var(--number))"/>
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
import { useMainStore } from '@/stores/main'

import Logo from '@/components/Logo.vue';

const store = useMainStore()

</script>
