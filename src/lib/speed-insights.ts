/**
 * Speed Insights integration for Vercel
 * This module initializes Vercel Speed Insights for performance monitoring
 */

export function initializeSpeedInsights(): void {
  // Only initialize in the browser environment
  if (typeof window === 'undefined') {
    return;
  }

  // Import and inject Speed Insights
  import('@vercel/speed-insights').then(({ injectSpeedInsights }) => {
    injectSpeedInsights();
  }).catch((error) => {
    console.warn('Failed to initialize Speed Insights:', error);
  });
}
