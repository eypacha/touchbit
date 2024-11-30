<template>
  <header class="w-full p-3 border-b-2 border-gray-300 dark:border-gray-800 flex gap-1">
    <Button variant="outline">Play</Button>
    <Button variant="outline" class="flex-1">
      <span class="text-cyan-500">t</span>
      <span class="text-white">➝</span>
      <span class="text-yellow-500">000</span>
    </Button>
    <SampleRates />
    <Drawer>
    <DrawerTrigger>
      <Button variant="outline">
        ☰
      </Button>
    </DrawerTrigger>
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Are you absolutely sure?</DrawerTitle>
        <DrawerDescription>This action cannot be undone.</DrawerDescription>
      </DrawerHeader>
      <DrawerFooter>
        <Button>Submit</Button>
        <DrawerClose>
          <Button variant="outline">
            Cancel
          </Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
  </header>
</template>

<script setup>
import { Button } from '@/components/ui/button'
import SampleRates from '@/components/SampleRates.vue'

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
</script>
