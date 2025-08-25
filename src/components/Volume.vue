<template>
  <div class="volume-control">
    <!-- Volume Icon -->
    <button
      @click="toggleMute"
      class="volume-icon-btn"
      :title="isMuted ? 'Unmute' : 'Mute'"
    >
      <component
        :is="getVolumeIcon()"
        class="volume-icon"
      />
    </button>

    <!-- Volume Slider Container -->
    <div class="slider-container">
      <!-- Slider Track -->
      <div class="slider-track">
        <!-- Progress -->
        <div
          class="slider-progress"
          :style="{ width: displayVolume + '%' }"
        >
          <!-- Glow effect -->
          <div class="slider-glow" />
        </div>
        
        <!-- Hover overlay -->
        <div class="slider-hover">
          <div 
            class="hover-progress"
            :style="{ width: hoverVolume + '%' }"
          />
        </div>
      </div>

      <!-- Invisible input for interaction -->
      <input
        type="range"
        min="0"
        max="100"
        :value="displayVolume"
        @input="handleVolumeChange"
        @mousemove="handleMouseMove"
        @mouseleave="hoverVolume = displayVolume"
        class="slider-input"
        :title="`Volume: ${Math.round(displayVolume)}%`"
      />

      <!-- Volume thumb -->
      <div
        class="slider-thumb"
        :class="{ 'thumb-visible': isAdjusting }"
        :style="{ left: `calc(${displayVolume}% - 8px)` }"
      >
        <!-- Inner glow -->
        <div class="thumb-glow" />
      </div>
    </div>

    <!-- Volume Percentage -->
    <div class="volume-display">
      <span 
        class="volume-text"
        :class="{ 'adjusting': isAdjusting }"
      >
        {{ Math.round(displayVolume) }}%
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Volume2, Volume1, VolumeX } from 'lucide-vue-next'

const props = defineProps({
  volume: {
    type: Number,
    default: 70
  }
})

const emit = defineEmits(['volume-change'])

// Local state
const isMuted = ref(false)
const volumeBeforeMute = ref(70)
const hoverVolume = ref(props.volume)
const isAdjusting = ref(false)
let adjustingTimeout = null

// Computed
const displayVolume = computed(() => {
  return isMuted.value ? 0 : props.volume
})

// Get appropriate volume icon
const getVolumeIcon = () => {
  if (isMuted.value || displayVolume.value === 0) {
    return VolumeX
  } else if (displayVolume.value < 50) {
    return Volume1
  } else {
    return Volume2
  }
}

// Handle volume change
const handleVolumeChange = (event) => {
  const newVolume = parseInt(event.target.value)
  
  // If we're unmuting, restore volume
  if (isMuted.value && newVolume > 0) {
    isMuted.value = false
  }
  
  // If volume is set to 0, consider it muted
  if (newVolume === 0) {
    isMuted.value = true
  } else {
    isMuted.value = false
  }
  
  emit('volume-change', newVolume)
  hoverVolume.value = newVolume
  
  // Show adjusting state
  isAdjusting.value = true
  clearTimeout(adjustingTimeout)
  adjustingTimeout = setTimeout(() => {
    isAdjusting.value = false
  }, 500)
}

// Handle mouse move for hover effect
const handleMouseMove = (event) => {
  const rect = event.target.getBoundingClientRect()
  const percentage = Math.max(0, Math.min(100, 
    ((event.clientX - rect.left) / rect.width) * 100
  ))
  hoverVolume.value = percentage
}

// Toggle mute
const toggleMute = () => {
  if (isMuted.value) {
    // Unmute: restore previous volume or set to 50 if it was 0
    isMuted.value = false
    const restoreVolume = volumeBeforeMute.value > 0 ? volumeBeforeMute.value : 50
    emit('volume-change', restoreVolume)
  } else {
    // Mute: save current volume and set to 0
    volumeBeforeMute.value = props.volume
    isMuted.value = true
    emit('volume-change', 0)
  }
}

// Watch for external volume changes
watch(() => props.volume, (newVolume) => {
  hoverVolume.value = newVolume
  
  // Update mute state based on volume
  if (newVolume === 0 && !isMuted.value) {
    isMuted.value = true
  } else if (newVolume > 0 && isMuted.value) {
    isMuted.value = false
  }
})
</script>

<style scoped>
.volume-control {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 200px;
}

.volume-icon-btn {
  padding: 8px;
  border-radius: 50%;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.volume-icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.volume-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.8);
  transition: color 0.2s;
}

.volume-icon-btn:hover .volume-icon {
  color: white;
}

.slider-container {
  flex: 1;
  position: relative;
}

.slider-container:hover .slider-thumb {
  opacity: 1;
}

.slider-container:hover .slider-glow {
  opacity: 1;
}

.slider-container:hover .slider-hover {
  opacity: 1;
}

.slider-track {
  position: relative;
  height: 8px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  overflow: hidden;
}

.slider-progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #3b82f6);
  border-radius: 20px;
  transition: width 0.2s;
}

.slider-glow {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  opacity: 0;
  transition: opacity 0.2s;
}

.slider-hover {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.hover-progress {
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  transition: width 0.1s;
}

.slider-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  -webkit-appearance: none;
  background: transparent;
  border: none;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.slider-input::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.slider-thumb {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  opacity: 0;
  transition: all 0.2s;
}

.slider-thumb.thumb-visible {
  opacity: 1;
  transform: translateY(-50%) scale(1.25);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.thumb-glow {
  position: absolute;
  inset: 4px;
  background: linear-gradient(135deg, #a78bfa, #60a5fa);
  border-radius: 50%;
}

.volume-display {
  min-width: 40px;
  text-align: right;
}

.volume-text {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  font-variant-numeric: tabular-nums;
  transition: all 0.2s;
}

.volume-text.adjusting {
  color: white;
  transform: scale(1.1);
}
</style>
