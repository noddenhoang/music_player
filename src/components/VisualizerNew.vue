<template>
  <div class="enhanced-visualizer">
    <canvas
      ref="canvasRef"
      class="visualizer-canvas"
      :width="canvasWidth"
      :height="canvasHeight"
    />
    
    <!-- Particle Effects -->
    <div class="particles-container">
      <div v-for="(particle, index) in particles" :key="index" 
           class="particle" 
           :style="getParticleStyle(particle)">
      </div>
    </div>
    
    <!-- Central Orb -->
    <div class="central-orb" :style="{ transform: `scale(${orbScale})` }">
      <div class="orb-inner"></div>
    </div>
    
    <!-- Ripple Effects -->
    <div class="ripples-container">
      <div v-for="(ripple, index) in ripples" :key="index" 
           class="ripple" 
           :style="getRippleStyle(ripple)">
      </div>
    </div>
    
    <!-- Status Overlay -->
    <div v-if="!isPlaying || !hasAudioData" class="status-overlay">
      <div class="status-content">
        <div class="status-icon">🎵</div>
        <span>{{ isPlaying ? 'Detecting audio...' : 'Ready to visualize' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  analyser: Object,
  dataArray: Object,
  isPlaying: Boolean
})

// Canvas refs
const canvasRef = ref(null)
const canvasWidth = ref(800)
const canvasHeight = ref(200)
const ctx = ref(null)

// Animation state
const animationId = ref(null)
const hasAudioData = ref(false)
const frameCount = ref(0)

// Visual effects
const particles = ref([])
const ripples = ref([])
const orbScale = ref(1)

// Color scheme
const colors = {
  primary: 'rgba(147, 51, 234, 0.8)',    // Purple
  secondary: 'rgba(59, 130, 246, 0.8)',  // Blue  
  accent: 'rgba(34, 197, 94, 0.8)',      // Green
  highlight: 'rgba(251, 191, 36, 0.8)'   // Yellow
}

const initCanvas = async () => {
  await nextTick()
  if (!canvasRef.value) return
  
  ctx.value = canvasRef.value.getContext('2d')
  resizeCanvas()
}

const resizeCanvas = () => {
  if (!canvasRef.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  canvasWidth.value = rect.width * window.devicePixelRatio
  canvasHeight.value = rect.height * window.devicePixelRatio
  
  canvasRef.value.width = canvasWidth.value
  canvasRef.value.height = canvasHeight.value
  
  if (ctx.value) {
    ctx.value.scale(window.devicePixelRatio, window.devicePixelRatio)
  }
}

const createParticle = (x, y, intensity) => {
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 0.5) * 4,
    life: 1,
    maxLife: 60 + Math.random() * 60,
    size: 2 + intensity * 3,
    color: Math.random() > 0.5 ? colors.primary : colors.secondary,
    id: Date.now() + Math.random()
  }
}

const createRipple = (intensity) => {
  return {
    x: Math.random() * 100,
    y: Math.random() * 100,
    scale: 0,
    maxScale: 2 + intensity * 2,
    life: 0,
    maxLife: 120,
    opacity: 0.6,
    color: Object.values(colors)[Math.floor(Math.random() * 4)],
    id: Date.now() + Math.random()
  }
}

const updateParticles = () => {
  particles.value = particles.value.filter(particle => {
    particle.x += particle.vx
    particle.y += particle.vy
    particle.life++
    particle.vx *= 0.99
    particle.vy *= 0.99
    
    return particle.life < particle.maxLife
  })
}

const updateRipples = () => {
  ripples.value = ripples.value.filter(ripple => {
    ripple.life++
    const progress = ripple.life / ripple.maxLife
    ripple.scale = progress * ripple.maxScale
    ripple.opacity = 0.6 * (1 - progress)
    
    return ripple.life < ripple.maxLife
  })
}

const getParticleStyle = (particle) => {
  const progress = particle.life / particle.maxLife
  const opacity = 1 - progress
  
  return {
    left: particle.x + '%',
    top: particle.y + '%',
    width: particle.size + 'px',
    height: particle.size + 'px',
    backgroundColor: particle.color,
    opacity: opacity,
    transform: `translate(-50%, -50%) scale(${1 - progress * 0.5})`
  }
}

const getRippleStyle = (ripple) => {
  return {
    left: ripple.x + '%',
    top: ripple.y + '%',
    transform: `translate(-50%, -50%) scale(${ripple.scale})`,
    borderColor: ripple.color,
    opacity: ripple.opacity
  }
}

const animate = () => {
  if (!ctx.value || !props.analyser || !props.dataArray) {
    animationId.value = requestAnimationFrame(animate)
    return
  }

  frameCount.value++
  
  props.analyser.getByteFrequencyData(props.dataArray)
  
  const audioSum = Array.from(props.dataArray).reduce((sum, value) => sum + value, 0)
  hasAudioData.value = audioSum > 50
  
  const width = canvasWidth.value / window.devicePixelRatio
  const height = canvasHeight.value / window.devicePixelRatio
  
  // Clear with animated background
  const bgGradient = ctx.value.createLinearGradient(0, 0, width, height)
  bgGradient.addColorStop(0, 'rgba(20, 0, 40, 0.95)')
  bgGradient.addColorStop(0.5, 'rgba(10, 0, 30, 0.98)')
  bgGradient.addColorStop(1, 'rgba(0, 10, 25, 0.95)')
  
  ctx.value.fillStyle = bgGradient
  ctx.value.fillRect(0, 0, width, height)
  
  if (!hasAudioData.value) {
    animationId.value = requestAnimationFrame(animate)
    return
  }
  
  // Calculate average intensity
  const avgIntensity = audioSum / (props.dataArray.length * 255)
  orbScale.value = 1 + avgIntensity * 0.5
  
  // Draw enhanced frequency bars
  drawFrequencyBars(width, height, avgIntensity)
  
  // Draw waveform
  drawWaveform(width, height)
  
  // Create particles on high intensity
  if (avgIntensity > 0.3 && Math.random() > 0.8) {
    const numParticles = Math.floor(avgIntensity * 3) + 1
    for (let i = 0; i < numParticles; i++) {
      particles.value.push(createParticle(
        Math.random() * 100,
        Math.random() * 100,
        avgIntensity
      ))
    }
  }
  
  // Create ripples on beats
  if (avgIntensity > 0.5 && frameCount.value % 30 === 0) {
    ripples.value.push(createRipple(avgIntensity))
  }
  
  // Update effects
  updateParticles()
  updateRipples()
  
  // Limit arrays size
  if (particles.value.length > 50) particles.value.splice(0, 10)
  if (ripples.value.length > 10) ripples.value.splice(0, 2)
  
  animationId.value = requestAnimationFrame(animate)
}

const drawFrequencyBars = (width, height, avgIntensity) => {
  const barCount = 64
  const barWidth = width / barCount * 0.8
  const barSpacing = width / barCount * 0.2
  
  for (let i = 0; i < barCount; i++) {
    const dataIndex = Math.floor((i / barCount) * props.dataArray.length)
    const rawHeight = (props.dataArray[dataIndex] / 255) * height * 0.85
    
    // Add wave animation
    const waveOffset = Math.sin(frameCount.value * 0.05 + i * 0.2) * 5
    const barHeight = Math.max(3, rawHeight + waveOffset)
    
    const x = i * (barWidth + barSpacing)
    const y = height - barHeight
    
    // Create multi-layer effect
    for (let layer = 0; layer < 3; layer++) {
      const layerHeight = barHeight * (1 - layer * 0.25)
      const layerY = height - layerHeight
      const layerWidth = barWidth * (1 - layer * 0.1)
      const layerX = x + (barWidth - layerWidth) / 2
      
      // Color based on frequency range and layer
      let color
      if (i < barCount * 0.25) {
        color = layer === 0 ? colors.primary : layer === 1 ? colors.secondary : colors.accent
      } else if (i < barCount * 0.75) {
        color = layer === 0 ? colors.secondary : layer === 1 ? colors.accent : colors.highlight
      } else {
        color = layer === 0 ? colors.accent : layer === 1 ? colors.highlight : colors.primary
      }
      
      // Add glow effect
      ctx.value.shadowColor = color
      ctx.value.shadowBlur = 15 - layer * 5
      ctx.value.fillStyle = color
      
      // Draw rounded bar
      ctx.value.beginPath()
      ctx.value.roundRect(layerX, layerY, layerWidth, layerHeight, 3)
      ctx.value.fill()
    }
    
    ctx.value.shadowBlur = 0
  }
}

const drawWaveform = (width, height) => {
  ctx.value.strokeStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.value.lineWidth = 2
  ctx.value.lineCap = 'round'
  ctx.value.lineJoin = 'round'
  
  ctx.value.beginPath()
  
  const centerY = height / 2
  const amplitude = height * 0.15
  
  for (let i = 0; i < props.dataArray.length; i++) {
    const x = (i / props.dataArray.length) * width
    const normalizedValue = (props.dataArray[i] - 128) / 128
    const y = centerY + normalizedValue * amplitude
    
    if (i === 0) {
      ctx.value.moveTo(x, y)
    } else {
      ctx.value.lineTo(x, y)
    }
  }
  
  ctx.value.stroke()
}

// Add roundRect polyfill
const addPolyfills = () => {
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
      this.beginPath()
      this.moveTo(x + radius, y)
      this.lineTo(x + width - radius, y)
      this.quadraticCurveTo(x + width, y, x + width, y + radius)
      this.lineTo(x + width, y + height - radius)
      this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
      this.lineTo(x + radius, y + height)
      this.quadraticCurveTo(x, y + height, x, y + height - radius)
      this.lineTo(x, y + radius)
      this.quadraticCurveTo(x, y, x + radius, y)
      this.closePath()
    }
  }
}

watch(() => props.isPlaying, (newPlaying) => {
  if (newPlaying && !animationId.value) {
    animate()
  } else if (!newPlaying && animationId.value) {
    cancelAnimationFrame(animationId.value)
    animationId.value = null
    hasAudioData.value = false
    particles.value = []
    ripples.value = []
  }
}, { immediate: true })

const handleResize = () => resizeCanvas()

onMounted(() => {
  addPolyfills()
  initCanvas()
  window.addEventListener('resize', handleResize)
  
  if (props.isPlaying) {
    animate()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
})
</script>

<style scoped>
.enhanced-visualizer {
  position: relative;
  width: 100%;
  height: 200px;
  background: 
    radial-gradient(ellipse at center, rgba(147, 51, 234, 0.15) 0%, transparent 70%),
    linear-gradient(135deg, rgba(20, 0, 40, 0.9) 0%, rgba(10, 0, 30, 0.95) 50%, rgba(0, 10, 25, 0.9) 100%);
  border-radius: 24px;
  overflow: hidden;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
}

.visualizer-canvas {
  width: 100%;
  height: 100%;
  display: block;
  filter: blur(0.3px);
}

.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.particle {
  position: absolute;
  border-radius: 50%;
  filter: blur(1px);
  transition: transform 0.1s ease-out;
}

.central-orb {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, 
    rgba(147, 51, 234, 0.4) 0%, 
    rgba(59, 130, 246, 0.3) 40%, 
    rgba(34, 197, 94, 0.2) 70%, 
    transparent 100%);
  border-radius: 50%;
  transition: transform 0.2s ease-out;
  animation: pulse-glow 6s ease-in-out infinite;
  pointer-events: none;
}

.orb-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, 
    rgba(255, 255, 255, 0.3) 0%, 
    rgba(147, 51, 234, 0.2) 50%, 
    transparent 70%);
  border-radius: 50%;
  animation: rotate 20s linear infinite;
}

.ripples-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.ripple {
  position: absolute;
  width: 40px;
  height: 40px;
  border: 2px solid;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: ripple-fade 2s ease-out forwards;
}

.status-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  color: rgba(255, 255, 255, 0.7);
}

.status-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.status-icon {
  font-size: 32px;
  animation: float 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { 
    opacity: 0.4; 
    transform: translate(-50%, -50%) scale(1); 
  }
  50% { 
    opacity: 0.7; 
    transform: translate(-50%, -50%) scale(1.05); 
  }
}

@keyframes rotate {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes ripple-fade {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

/* Responsive */
@media (max-width: 768px) {
  .enhanced-visualizer {
    height: 150px;
  }
  
  .central-orb {
    width: 80px;
    height: 80px;
  }
  
  .orb-inner {
    width: 40px;
    height: 40px;
  }
}
</style>
