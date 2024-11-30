<template>
  <div class="h-[300px]">
    <Carousel class="h-full"> 
      <CarouselContent class="h-full">
        <BottomCard>
          <Keyboard/>
        </BottomCard>
        <BottomCard>
          <AudioSettings/>
        </BottomCard>
      </CarouselContent>
    </Carousel>
  </div>
</template>

<script setup>
import {
  Carousel,
  CarouselContent,
} from '@/components/ui/carousel'

import BottomCard from '@/components/BottomCard.vue'
import Keyboard from '@/components/Keyboard.vue'
import AudioSettings from '@/components/AudioSettings.vue'
</script>
