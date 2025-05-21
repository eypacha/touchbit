<template>
    <DropdownMenu>
        <Label class="h-fit w-[full] flex justify-between items-center gap-3">
            <div class="h-fit">{{ label }}</div>
            <DropdownMenuTrigger as-child>
                <Button variant="outline" class="min-w-[120px]" :class="`text-${type}`">
                    {{ formattedOptions[selected] }}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="ml-2">
                <DropdownMenuRadioGroup v-model="selected">
                    <DropdownMenuRadioItem
                        v-for="(optionLabel, optionValue) in formattedOptions"
                        :key="optionValue"
                        :value="optionValue"
                    >
                        <span class="w-full" :class="`text-${type}`">{{ optionLabel }}</span>
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </Label>
    </DropdownMenu>
</template>

<script setup>
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { ref, watch, computed, defineProps, defineEmits } from 'vue'

// Define props
const { options, label, modelValue } = defineProps({
    options: {
        type: [Object, Array],
        required: true,
    },
    label: {
        type: String,
        required: false,
        default: ''
    },
    type: {
        type: String,
        default: 'white',
    },
    modelValue: {
        type: [String, Number],
        required: true,
    },
})

const emit = defineEmits(['update:modelValue'])

const selected = ref(modelValue)

// Formatea opciones para que soporte array y objeto
const formattedOptions = computed(() => {
    if (Array.isArray(options)) {
        return options.reduce((acc, item, index) => {
            acc[index] = item
            return acc
        }, {})
    }
    return options
})

// Sincroniza el valor seleccionado con modelValue
watch(selected, (newValue) => {
    emit('update:modelValue', newValue)
})

watch(() => modelValue, (newValue) => {
    selected.value = newValue
})
</script>