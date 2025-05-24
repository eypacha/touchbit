<template>
  <div class="h-[100dvh] p-4 border-l border-border bg-background">
    <div class="h-full overflow-x-hidden overflow-y-scroll">
      <div class="space-y-4 text-base leading-relaxed">
        <!-- Dynamic component rendering based on current page -->
        <WelcomePage 
          v-if="page === -1" 
          :navigateTo="navigateTo"
          :loadExample="loadExample" 
        />
        
        <TutorialPage 
          v-if="page === 0" 
          :navigateTo="navigateTo"
          :loadExample="loadExample" 
        />
        
        <PageOne
          v-if="page === 1"
          :navigateTo="navigateTo"
        />
        
        <PageTwo
          v-if="page === 2"
          :navigateTo="navigateTo"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useMainStore } from '@/stores/mainStore';
import { WelcomePage, TutorialPage, PageOne, PageTwo } from '@/components/sidepanel';

const page = ref(-1); // -1 is welcome page, 0 and up are other pages
const store = useMainStore();

// Unified navigation function
const navigateTo = (pageNumber) => {
  page.value = pageNumber;
};

const loadExample = (example) => {
  // Check if the store has a method to load examples
  if (store.setExpression) {
    store.setExpression(example);
  } else {
    console.log('Loading example:', example);
  }
};
</script>
