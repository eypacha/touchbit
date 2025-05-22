import { useMainStore } from "@/stores/mainStore";
import { computed } from "vue";

export function useShare() {
  const store = useMainStore();
  
  // Get current expression for sharing
  const shareText = computed(() => {
    return `🚀 ${store.getExpression}`;
  });
  
  // Get current URL for sharing
  const shareUrl = computed(() => {
    return window.location.href;
  });
  
  /**
   * Share the current expression and URL using Web Share API
   * Falls back to copy to clipboard if Web Share API is not supported
   */
  const shareContent = async () => {
    // Check if the Web Share API is supported
    if (navigator.share) {

    const text = `🚀 ${shareText.value}`
      try {
        await navigator.share({
          title: text,
          text: `${text}\n\n 🔗`,
          url: shareUrl.value,
        });
        console.log('Content shared successfully');
      } catch (err) {
        console.error('Error sharing content:', err);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      try {
        await navigator.clipboard.writeText(`${shareText.value}\n${shareUrl.value}`);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        alert('Unable to share content');
      }
    }
  };
  
  return {
    shareContent,
    shareText,
    shareUrl
  };
}
