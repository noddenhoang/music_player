<template>
  <div class="simple-visualizer">
    <canvas
      ref="canvasRef"
      class="visualizer-canvas"
      :width="canvasWidth"
      :height="canvasHeight"
    />
    
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
const ctx = ref(null)
const canvasWidth = ref(800)
const canvasHeight = ref(200)

// Animation
const animationId = ref(null)
const hasAudioData = ref(false)
const frameCount = ref(0)

// Color scheme for sound waves
const colors = {
  primary: 'rgba(147, 51, 234, 0.9)',    // Purple
  secondary: 'rgba(59, 130, 246, 0.9)',  // Blue  
  accent: 'rgba(34, 197, 94, 0.9)',      // Green
  highlight: 'rgba(251, 191, 36, 0.9)'   // Yellow
}

const initCanvas = async () => {
  await nextTick()
  if (!canvasRef.value) return
  
  ctx.value = canvasRef.value.getContext('2d')
  resizeCanvas()
}

const resizeCanvas = () => {
  if (!canvasRef.value) return
  
  // Force layout recalculation để có size chính xác
  const parent = canvasRef.value.parentElement
  if (parent) {
    parent.style.width = parent.style.width  // Force reflow
  }
  
  const rect = canvasRef.value.getBoundingClientRect()
  const newWidth = rect.width || 800
  const newHeight = rect.height || 200
  
  canvasWidth.value = newWidth * window.devicePixelRatio
  canvasHeight.value = newHeight * window.devicePixelRatio
  
  canvasRef.value.width = canvasWidth.value
  canvasRef.value.height = canvasHeight.value
  
  if (ctx.value) {
    ctx.value.scale(window.devicePixelRatio, window.devicePixelRatio)
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
  
  // Clear canvas with transparent background
  ctx.value.clearRect(0, 0, width, height)
  
  if (!hasAudioData.value) {
    animationId.value = requestAnimationFrame(animate)
    return
  }
  
  // Draw simple frequency bars
  drawFrequencyBars(width, height)
  
  animationId.value = requestAnimationFrame(animate)
}

const drawFrequencyBars = (width, height) => {
  const barCount = 64
  const barWidth = width / barCount * 0.8
  const barSpacing = width / barCount * 0.2
  
  for (let i = 0; i < barCount; i++) {
    const dataIndex = Math.floor((i / barCount) * props.dataArray.length)
    const barHeight = Math.max(2, (props.dataArray[dataIndex] / 255) * height * 0.8)
    
    const x = i * (barWidth + barSpacing)
    const y = height - barHeight
    
    // Color based on frequency range
    let color
    if (i < barCount * 0.25) {
      color = colors.primary
    } else if (i < barCount * 0.5) {
      color = colors.secondary
    } else if (i < barCount * 0.75) {
      color = colors.accent
    } else {
      color = colors.highlight
    }
    
    // Create gradient for each bar
    const gradient = ctx.value.createLinearGradient(x, y + barHeight, x, y)
    gradient.addColorStop(0, color.replace('0.9', '0.3'))
    gradient.addColorStop(1, color)
    
    ctx.value.fillStyle = gradient
    ctx.value.fillRect(x, y, barWidth, barHeight)
    
    // Add glow effect
    ctx.value.shadowColor = color
    ctx.value.shadowBlur = 10
    ctx.value.fillRect(x, y, barWidth, barHeight)
    ctx.value.shadowBlur = 0
  }
}

const startVisualization = () => {
  if (!animationId.value) {
    animate()
  }
}

const stopVisualization = () => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
    animationId.value = null
  }
}

// Watch for playing state changes
watch(() => props.isPlaying, (playing) => {
  if (playing) {
    startVisualization()
  } else {
    stopVisualization()
    hasAudioData.value = false
  }
})

// Debounce resize để tránh spam
let resizeTimeout = null
const handleResize = () => {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    resizeCanvas()
  }, 100)
}

onMounted(async () => {
  await initCanvas()
  window.addEventListener('resize', handleResize)
  
  if (props.isPlaying) {
    startVisualization()
  }
})

// Watch for props changes and force canvas resize
watch(() => props.isPlaying, (newVal) => {
  if (newVal) {
    // Delay để đảm bảo DOM đã update
    nextTick(() => {
      resizeCanvas()
      startVisualization()
    })
  }
})

watch(() => props.analyser, () => {
  // Khi analyser thay đổi (track mới), resize canvas
  nextTick(() => {
    resizeCanvas()
  })
})

onUnmounted(() => {
  stopVisualization()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.simple-visualizer {
  position: relative;
  width: 100%;
  height: 200px;
  background: transparent;
  border-radius: 24px;
  overflow: hidden;
}

.visualizer-canvas {
  width: 100%;
  height: 100%;
  display: block;
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
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
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
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .simple-visualizer {
    height: 150px;
  }
}
</style>
