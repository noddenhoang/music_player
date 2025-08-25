<template>
  <div class="playlist-container">
    <!-- Header -->
    <div class="playlist-header">
      <div class="header-info">
        <button 
          @click="$emit('toggle-playlist')"
          class="header-icon-btn"
          title="Hide Playlist"
        >
          <ListMusic class="header-icon" />
        </button>
        <h3 class="header-title">Playlist</h3>
        <span class="track-count">({{ playlist.length }})</span>
      </div>
      
      <div class="header-actions">
        <!-- Add Songs button -->
        <button
          @click="$emit('add-files')"
          class="add-btn"
          title="Add Songs"
        >
          <Plus class="add-icon" />
        </button>
        
        <!-- Clear button -->
        <button
          v-if="playlist.length > 0"
          @click="$emit('clear-playlist')"
          class="clear-btn"
          title="Clear Playlist"
        >
          <Trash2 class="clear-icon" />
        </button>
      </div>
    </div>

    <!-- Playlist Items -->
    <div class="playlist-content">
      <div v-if="playlist.length === 0" class="empty-state">
        <Music class="empty-icon" />
        <p class="empty-text">No music in playlist</p>
        <p class="empty-subtext">Add files or drag & drop music here</p>
      </div>

      <div v-else class="playlist-items">
        <div
          v-for="(track, index) in playlist"
          :key="track.id"
          @click="$emit('select-track', index)"
          @dblclick="$emit('play-track', index)"
          class="playlist-item"
          :class="{ 'current-track': currentTrackIndex === index }"
        >
          <!-- Play indicator / Track number -->
          <div class="track-indicator">
            <div
              v-if="currentTrackIndex === index && isPlaying"
              class="equalizer"
            >
              <!-- Animated equalizer bars -->
              <div class="eq-bar" style="animation-delay: 0ms;" />
              <div class="eq-bar" style="animation-delay: 150ms;" />
              <div class="eq-bar" style="animation-delay: 300ms;" />
              <div class="eq-bar" style="animation-delay: 450ms;" />
            </div>
            
            <Play 
              v-else-if="currentTrackIndex === index && !isPlaying"
              class="play-icon current"
            />
            
            <span 
              v-else 
              class="track-number"
            >
              {{ index + 1 }}
            </span>
          </div>

          <!-- Track info -->
          <div class="track-info">
            <div class="track-name">
              {{ track.name }}
            </div>
            
            <div class="track-details">
              <span class="file-size">
                {{ formatFileSize(track.size) }}
              </span>
              <span class="detail-separator">•</span>
              <span class="file-type">
                {{ track.type.split('/')[1] || 'audio' }}
              </span>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="track-actions">
            <!-- Play button -->
            <button
              @click.stop="$emit('play-track', index)"
              class="action-btn play-action"
              title="Play"
            >
              <Play class="action-icon" />
            </button>
            
            <!-- Remove button -->
            <button
              @click.stop="$emit('remove-track', index)"
              class="action-btn remove-action"
              title="Remove"
            >
              <X class="action-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Drop zone overlay -->
    <div
      v-if="isDragOver"
      class="drop-zone"
      @dragenter.prevent="isDragOver = true"
      @dragover.prevent
      @dragleave.prevent="isDragOver = false"
      @drop.prevent="handleDrop"
    >
      <div class="drop-content">
        <Upload class="drop-icon" />
        <p class="drop-title">Drop music files here</p>
        <p class="drop-subtitle">Supports MP3, WAV, FLAC, and more</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  ListMusic, 
  Music, 
  Play, 
  X, 
  Trash2, 
  Upload,
  Plus
} from 'lucide-vue-next'

defineProps({
  playlist: Array,
  currentTrackIndex: Number,
  isPlaying: Boolean
})

const emit = defineEmits([
  'select-track',
  'play-track', 
  'remove-track',
  'clear-playlist',
  'add-files',
  'toggle-playlist'
])

// Drag and drop state
const isDragOver = ref(false)

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Handle file drop
const handleDrop = (event) => {
  isDragOver.value = false
  
  const files = event.dataTransfer.files
  if (files.length > 0) {
    emit('add-files', files)
  }
}

// Global drag and drop handlers
const handleGlobalDragEnter = (event) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleGlobalDragOver = (event) => {
  event.preventDefault()
}

const handleGlobalDragLeave = (event) => {
  event.preventDefault()
  // Only hide if we're leaving the entire playlist area
  if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget)) {
    isDragOver.value = false
  }
}

const handleGlobalDrop = (event) => {
  event.preventDefault()
  handleDrop(event)
}

onMounted(() => {
  // Add global drag and drop listeners
  window.addEventListener('dragenter', handleGlobalDragEnter)
  window.addEventListener('dragover', handleGlobalDragOver)
  window.addEventListener('dragleave', handleGlobalDragLeave)
  window.addEventListener('drop', handleGlobalDrop)
})

onUnmounted(() => {
  // Remove global drag and drop listeners
  window.removeEventListener('dragenter', handleGlobalDragEnter)
  window.removeEventListener('dragover', handleGlobalDragOver)
  window.removeEventListener('dragleave', handleGlobalDragLeave)
  window.removeEventListener('drop', handleGlobalDrop)
})
</script>

<style scoped>
.playlist-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(16px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.playlist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon-btn {
  padding: 8px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: #a78bfa;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-icon-btn:hover {
  background: rgba(139, 92, 246, 0.2);
  color: #c4b5fd;
}

.header-icon {
  width: 20px;
  height: 20px;
}

.header-title {
  font-weight: 600;
  color: white;
  margin: 0;
}

.track-count {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-btn {
  padding: 8px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

.add-icon {
  width: 16px;
  height: 16px;
}

.clear-btn {
  padding: 8px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.clear-icon {
  width: 16px;
  height: 16px;
}

.playlist-content {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.playlist-content::-webkit-scrollbar {
  width: 6px;
}

.playlist-content::-webkit-scrollbar-track {
  background: transparent;
}

.playlist-content::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.playlist-content::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 128px;
  color: rgba(255, 255, 255, 0.6);
}

.empty-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  margin: 0;
}

.empty-subtext {
  font-size: 12px;
  margin: 4px 0 0 0;
}

.playlist-items {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.playlist-item:hover {
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.playlist-item.current-track {
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3));
  border: 1px solid rgba(139, 92, 246, 0.3);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.track-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.equalizer {
  display: flex;
  align-items: end;
  gap: 2px;
  height: 16px;
}

.eq-bar {
  width: 2px;
  background: #a78bfa;
  border-radius: 1px;
  animation: equalizer 1s ease-in-out infinite;
}

.eq-bar:nth-child(1) { height: 60%; }
.eq-bar:nth-child(2) { height: 100%; }
.eq-bar:nth-child(3) { height: 40%; }
.eq-bar:nth-child(4) { height: 80%; }

.play-icon {
  width: 16px;
  height: 16px;
}

.play-icon.current {
  color: #a78bfa;
}

.track-number {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  transition: color 0.2s;
}

.playlist-item:hover .track-number {
  color: rgba(255, 255, 255, 0.8);
}

.track-info {
  flex: 1;
  min-width: 0;
}

.track-name {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s;
}

.playlist-item:hover .track-name {
  color: white;
}

.playlist-item.current-track .track-name {
  color: #ddd6fe;
}

.track-details {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.file-size,
.file-type {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.detail-separator {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
}

.file-type {
  text-transform: capitalize;
}

.track-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.playlist-item:hover .track-actions {
  opacity: 1;
}

.action-btn {
  padding: 6px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.action-btn.play-action:hover {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
}

.action-btn.remove-action:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.action-icon {
  width: 14px;
  height: 14px;
}

.drop-zone {
  position: absolute;
  inset: 0;
  background: rgba(139, 92, 246, 0.2);
  backdrop-filter: blur(16px);
  border: 2px dashed #a78bfa;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.drop-content {
  text-align: center;
  color: white;
}

.drop-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  color: #a78bfa;
}

.drop-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.drop-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 4px 0 0 0;
}

/* Animations */
@keyframes equalizer {
  0%, 100% { 
    transform: scaleY(1); 
  }
  50% { 
    transform: scaleY(0.3); 
  }
}
</style>
