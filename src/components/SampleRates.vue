<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="outline" class="w-[70px] text-yellow-500">
                {{ sampleRates[position] }} 
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="mr-2">
            <DropdownMenuLabel>Sample Rates</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup v-model="position">
               <DropdownMenuRadioItem
                    v-for="(label, value) in sampleRates"
                    :key="value"
                    :value="value"
                >
                   <span class="w-full text-yellow-500">{{ label }} </span>
                </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
        </DropdownMenuContent>
    </DropdownMenu>
</template>

<script setup>
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ref } from 'vue'

const position = ref('8000') 

const sampleRates = {
    8000: "8kHz",
    11000: '11kHz',
    22000: '22kHz',
    32000: '32kHz',
    44100: '44kHz',
    48000: '48kHz',
}
</script>