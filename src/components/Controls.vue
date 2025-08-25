<template>
  <div class="controls">
    <!-- Previous Button -->
    <button
      @click="$emit('previous')"
      :disabled="!hasPrevTrack"
      class="control-btn"
      :class="{ disabled: !hasPrevTrack }"
      title="Previous (←)"
    >
      <SkipBack class="icon" />
    </button>

    <!-- Play/Pause Button -->
    <button
      @click="$emit('toggle-play-pause')"
      :disabled="!currentTrack"
      class="control-btn play-btn"
      :class="{ disabled: !currentTrack, playing: isPlaying }"
      :title="isPlaying ? 'Pause (Space)' : 'Play (Space)'"
    >
      <!-- Background glow effect -->
      <div 
        v-if="isPlaying"
        class="glow-effect"
      />
      
      <component 
        :is="isPlaying ? Pause : Play"
        class="icon large-icon"
      />
    </button>

    <!-- Next Button -->
    <button
      @click="$emit('next')"
      :disabled="!hasNextTrack"
      class="control-btn"
      :class="{ disabled: !hasNextTrack }"
      title="Next (→)"
    >
      <SkipForward class="icon" />
    </button>

    <!-- Separator -->
    <div class="separator" />

    <!-- Loop Button -->
    <button
      @click="$emit('toggle-loop')"
      class="control-btn toggle-btn"
      :class="{ active: isLoop }"
      title="Loop (L)"
    >
      <Repeat class="icon small-icon" />
    </button>

    <!-- Shuffle Button -->
    <button
      @click="$emit('toggle-shuffle')"
      class="control-btn toggle-btn"
      :class="{ active: isShuffle }"
      title="Shuffle (S)"
    >
      <Shuffle class="icon small-icon" />
    </button>

    <!-- Separator -->
    <div class="separator" />

    <!-- Add File Button -->
    <button
      @click="$emit('add-file')"
      class="control-btn action-btn add-file"
      title="Add Music Files"
    >
      <FileMusic class="icon small-icon" />
    </button>

    <!-- Add Folder Button -->
    <button
      @click="$emit('add-folder')"
      class="control-btn action-btn add-folder"
      title="Add Music Folder"
    >
      <Folder class="icon small-icon" />
    </button>
  </div>
</template>

<script setup>
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Shuffle, 
  FileMusic, 
  Folder 
} from 'lucide-vue-next'

defineProps({
  isPlaying: Boolean,
  isLoop: Boolean,
  isShuffle: Boolean,
  currentTrack: Object,
  hasNextTrack: Boolean,
  hasPrevTrack: Boolean
})

defineEmits([
  'toggle-play-pause',
  'previous',
  'next',
  'toggle-loop',
  'toggle-shuffle',
  'add-file',
  'add-folder'
])
</script>

<style scoped>
.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.control-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.control-btn:active {
  transform: scale(0.95);
}

.control-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5);
}

.control-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn.disabled:hover {
  transform: scale(1);
  background: rgba(255, 255, 255, 0.1);
  box-shadow: none;
}

.play-btn {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  border-color: rgba(255, 255, 255, 0.2);
}

.play-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #2563eb);
}

.play-btn.playing {
  animation: pulse 2s ease-in-out infinite;
}

.glow-effect {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #a78bfa, #60a5fa);
  border-radius: 50%;
  opacity: 0.2;
  animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.toggle-btn.active {
  background: rgba(139, 92, 246, 0.8);
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
}

.toggle-btn.active:hover {
  background: rgba(139, 92, 246, 0.9);
}

.action-btn.add-file {
  color: rgba(255, 255, 255, 0.8);
}

.action-btn.add-file:hover {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.3);
  box-shadow: 0 8px 25px rgba(34, 197, 94, 0.2);
  color: #86efac;
}

.action-btn.add-folder {
  color: rgba(255, 255, 255, 0.8);
}

.action-btn.add-folder:hover {
  background: rgba(249, 115, 22, 0.2);
  border-color: rgba(249, 115, 22, 0.3);
  box-shadow: 0 8px 25px rgba(249, 115, 22, 0.2);
  color: #fdba74;
}

.separator {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 8px;
}

.icon {
  width: 20px;
  height: 20px;
  position: relative;
  z-index: 10;
  transition: transform 0.2s;
}

.large-icon {
  width: 24px;
  height: 24px;
}

.small-icon {
  width: 16px;
  height: 16px;
}

.control-btn:hover .icon {
  transform: scale(1.1);
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}
</style>
