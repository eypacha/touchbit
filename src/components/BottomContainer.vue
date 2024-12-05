<template>
  <div class="h-[300px] bg-background">
    <Carousel class="h-full" :opts="{
        startIndex: 1,
        loop: true,
      }"> 
      <CarouselContent class="h-full">
        <BottomCard>
          <AudioSettings/>
        </BottomCard>
        <BottomCard>
          <Keyboard/>
        </BottomCard>
        <BottomCard>
          <AudioEffects/>
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
import AudioEffects from '@/components/AudioEffects.vue';
</script>
