<template>
  <CarouselItem class="h-full">
    <div class="p-1 h-full">
      <Card class="h-full">
        <CardContent class="w-full h-full flex items-center justify-center p-1">
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
