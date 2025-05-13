<template>
  <CarouselItem class="h-[328px]">
    <div class="h-full p-0">
      <Card class="h-full rounded-none">
        <CardContent class="flex flex-col items-center justify-center w-full h-full px-2 pb-2">
          <div class="py-1 pb-2">
            <span class="opacity-20">...</span></div>
            <slot/>
        </CardContent>
      </Card>
    </div>
  </CarouselItem>
</template>

<script setup>
import {
  Card,
  CardContent,
} from '@/components/ui/card'


import {
  CarouselItem,
} from '@/components/ui/carousel'

</script>
