import confetti from 'canvas-confetti';

export const triggerConfetti = () => {
  // First burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#10b981', '#34d399', '#6ee7b7', '#ffd700', '#ffed4a'],
  });

  // Second burst after a slight delay
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#10b981', '#34d399', '#6ee7b7'],
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#ffd700', '#ffed4a', '#fbbf24'],
    });
  }, 150);

  // Stars
  setTimeout(() => {
    confetti({
      particleCount: 30,
      spread: 100,
      origin: { y: 0.3 },
      shapes: ['star'],
      colors: ['#ffd700', '#ffed4a'],
      scalar: 1.5,
    });
  }, 300);
};

export const triggerSuccessConfetti = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      particleCount,
      startVelocity: 30,
      spread: 360,
      origin: {
        x: randomInRange(0.1, 0.3),
        y: Math.random() - 0.2,
      },
      colors: ['#10b981', '#34d399', '#6ee7b7'],
    });
    confetti({
      particleCount,
      startVelocity: 30,
      spread: 360,
      origin: {
        x: randomInRange(0.7, 0.9),
        y: Math.random() - 0.2,
      },
      colors: ['#ffd700', '#ffed4a', '#fbbf24'],
    });
  }, 250);
};
