<template>
    <div class="flex flex-1 p-3 text-xl">
        <div v-for="(token, index) in tokens" :key="index" :class="getTokenClass(token.type)" class="w-[30px] aspect-square font-bold text-center p-1">
            {{ token.value }}
        </div>
    </div>
</template>

<script setup>
const tokens = [
    { value: "t", type: "time" },
    { value: ">>", type: "operator" },
    { value: "4", type: "number" }, 
];

const operators = [">>", "<<", "+", "-", "*", "/", "&", "|", "^"];
const time = ["t"]; 
function isNumber(value) {
    return !isNaN(value) && !isNaN(parseFloat(value));
}

function getTokenClass(type) {
    switch (type) {
        case "operator":
            return "text-slate-300"; 
        case "number":
            return "text-yellow-500";
        case "time":
            return "text-cyan-500";
        default:
            return "";
    }
}

tokens.forEach(token => {
    if (time.includes(token.value)) {
        token.type = "time";
    } else if (operators.includes(token.value)) {
        token.type = "operator";
    } else if (isNumber(token.value)) {
        token.type = "number";
    }
});
</script>