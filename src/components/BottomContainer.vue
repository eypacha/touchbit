<template>
  <div class="relative">
    <Logger/>
    <SampleDisplay />
    <Carousel :opts="{
      startIndex: 0,
      loop: true,
    }"> 
      <CarouselContent class="h-full">
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


import Logger from "@/components/Logger.vue";
import SampleDisplay from "@/components/SampleDisplay.vue";

import BottomCard from '@/components/BottomCard.vue'
import Keyboard from '@/components/Keyboard.vue'
import AudioSettings from '@/components/AudioSettings.vue'
import AudioEffects from '@/components/AudioEffects.vue';
</script>
