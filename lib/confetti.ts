import confetti from 'canvas-confetti'

export function fireStarConfetti() {
  confetti({
    particleCount: 90,
    spread: 80,
    origin: { y: 0.55 },
    colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#fb923c', '#10b981'],
    shapes: ['star', 'circle'],
    scalar: 1.3,
    ticks: 220,
  })
}
