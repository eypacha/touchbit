<template>
  <div class="h-[100dvh] p-8 border-l border-border bg-background">
    <div class="h-full overflow-x-hidden overflow-y-scroll">
      <div class="space-y-4 text-base leading-relaxed h-full">
        <WelcomePage v-if="page === 0" :navigateTo="navigateTo" :loadExample="loadExample"/>
        <PageOne v-if="page === 1" :navigateTo="navigateTo" :loadExample="loadExample"/>
        <PageTwo v-if="page === 2" :navigateTo="navigateTo" :loadExample="loadExample"/>
        <PageThree v-if="page === 3" :navigateTo="navigateTo"/>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useMainStore } from '@/stores/mainStore';
import { WelcomePage, PageOne, PageTwo, PageThree } from '@/components/sidepanel';

const page = ref(0);
const store = useMainStore();

const navigateTo = (pageNumber) => {
  page.value = pageNumber;
};

const loadExample = (example) => {
  if (store.setExpression) {
    store.setExpression(example);
  } else {
    console.log('Loading example:', example);
  }
};
</script>
