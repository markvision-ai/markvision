let sdkPromise: Promise<void> | null = null;

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

export function loadFacebookSdk(): Promise<void> {
  if (window.FB) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    if (window.location.protocol !== 'https:' && window.location.hostname === 'localhost') {
      console.warn('Facebook SDK skipped due to non-HTTPS protocol');
      reject(new Error('HTTPS required'));
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: '1890905081453686',
        cookie: true,
        xfbml: true,
        version: 'v21.0',
      });
      resolve();
    };

    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/ru_RU/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error('Failed to load Facebook SDK'));
    };
    document.body.appendChild(script);
  });

  return sdkPromise;
}
