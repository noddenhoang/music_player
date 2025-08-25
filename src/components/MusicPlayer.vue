<template>
  <div class="music-player">
    <!-- Background Effects -->
    <div class="background-effects">
      <!-- Animated gradient orbs -->
      <div class="gradient-orb orb-1" />
      <div class="gradient-orb orb-2" />
      <div class="gradient-orb orb-3" />
      <div class="gradient-orb orb-4" />
      <div class="gradient-orb orb-5" />
      
      <!-- Explosion rings based on music -->
      <div class="explosion-container">
        <div 
          v-for="explosion in explosionRings" 
          :key="explosion.id"
          class="explosion-ring"
          :style="explosion.style"
        />
      </div>
    </div>

    <!-- Floating Playlist Toggle Button - Ẩn khi playlist đang show -->
    <button
      v-if="!showPlaylist"
      @click="showPlaylist = true"
      class="playlist-toggle-icon"
    >
      <ListMusic class="icon" />
    </button>

    <!-- Main Player Section -->
    <div class="main-section">
      <!-- Main Content -->
      <main class="main-content">
        <!-- Now Playing Info -->
        <div 
          :class="['now-playing', { 'beat': nowPlayingBeat }]"
        >
          <!-- Album Art / CD Animation -->
          <div 
            class="cd-container"
            :style="{ transform: `scale(${cdScale})` }"
          >
            <!-- Beat ring xung quanh CD -->
            <div 
              class="beat-ring"
              :style="{ 
                transform: `translate(-50%, -50%) scale(${1 + (cdScale - 1) * 3})`,
                opacity: Math.max(0, (cdScale - 1) * 6)
              }"
            />
            
            <div 
              :class="['cd-disc', { 'spinning': isPlaying }]"
            >
              <!-- CD hole -->
              <div class="cd-hole">
                <div class="cd-center" />
              </div>
              
              <!-- Music note icon -->
              <div class="cd-icon">
                <Music class="note-icon" />
              </div>
              
              <!-- Vinyl lines -->
              <div class="vinyl-line line-1" />
              <div class="vinyl-line line-2" />
              <div class="vinyl-line line-3" />
            </div>
          </div>

          <!-- Track Info -->
          <div v-if="currentTrack" class="track-info">
            <h2 class="track-name">{{ currentTrack.name }}</h2>
          </div>
          
          <div v-else class="track-info">
            <h2 class="track-name no-track">Made by Thai Hoang Bao</h2>
            <p class="track-details">Add music to get started</p>
          </div>
        </div>

        <!-- Audio Visualizer -->
        <div class="visualizer-container">
          <Visualizer 
            :analyser="analyser"
            :dataArray="dataArray"
            :isPlaying="isPlaying"
          />
        </div>

        <!-- Progress Bar -->
        <div class="progress-section">
          <div 
            @click="handleProgressClick"
            class="progress-bar-container"
          >
            <!-- Progress -->
            <div 
              class="progress-bar"
              :style="{ width: progress + '%' }"
            >
              <!-- Glow effect -->
              <div class="progress-glow" />
            </div>
            
            <!-- Thumb -->
            <div 
              class="progress-thumb"
              :style="{ left: `calc(${progress}% - 8px)` }"
            >
              <div class="thumb-inner" />
            </div>
          </div>
          
          <!-- Time Display -->
          <div class="time-display">
            <span>{{ formatTime(currentTime) }}</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
        </div>

        <!-- Controls -->
        <Controls
          :isPlaying="isPlaying"
          :isLoop="isLoop"
          :isShuffle="isShuffle"
          :currentTrack="currentTrack"
          :hasNextTrack="hasNextTrack"
          :hasPrevTrack="hasPrevTrack"
          @toggle-play-pause="togglePlayPause"
          @previous="prevTrack"
          @next="nextTrack"
          @toggle-loop="toggleLoop"
          @toggle-shuffle="toggleShuffle"
          @add-file="triggerFileInput"
          @add-folder="triggerFolderInput"
        />

        <!-- Volume Control -->
        <div class="volume-section">
          <Volume 
            :volume="volume"
            @volume-change="setVolume"
          />
        </div>
      </main>
    </div>

    <!-- Playlist Sidebar -->
    <aside 
      :class="['sidebar', { 'sidebar-open': showPlaylist }]"
    >
      <Playlist
        :playlist="playlist"
        :currentTrackIndex="currentTrackIndex"
        :isPlaying="isPlaying"
        @select-track="loadTrack"
        @play-track="playTrack"
        @remove-track="removeTrack"
        @clear-playlist="clearPlaylist"
        @add-files="triggerFileInput"
        @toggle-playlist="showPlaylist = false"
      />
    </aside>

    <!-- Mobile Overlay -->
    <div
      v-if="showPlaylist"
      @click="showPlaylist = false"
      class="mobile-overlay"
    />

    <!-- Hidden File Inputs -->
    <input
      ref="fileInputRef"
      type="file"
      accept="audio/*"
      multiple
      class="hidden-input"
      @change="handleFileInput"
    />
    
    <input
      ref="folderInputRef"
      type="file"
      webkitdirectory
      directory
      multiple
      class="hidden-input"
      @change="handleFolderInput"
    />

    <!-- Audio Element -->
    <audio 
      ref="audioElementRef"
      @loadedmetadata="setupAudioEvents"
      @error="handleAudioError"
    />

    <!-- Notification Dialog -->
    <NotificationDialog
      :visible="notification.visible"
      :title="notification.title"
      :message="notification.message"
      :type="notification.type"
      :auto-close="notification.autoClose"
      @close="closeNotification"
    />

    <!-- Loading Overlay -->
    <div
      v-if="isLoading"
      class="loading-overlay"
    >
      <div class="loading-content">
        <div class="loading-spinner" />
        <p class="loading-text">Loading audio...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { Music, ListMusic } from 'lucide-vue-next'
import { useAudioPlayer } from '../composables/useAudioPlayer'

// Components
import Visualizer from './VisualizerSimple.vue'
import Controls from './Controls.vue'
import Volume from './Volume.vue'
import Playlist from './Playlist.vue'
import NotificationDialog from './NotificationDialog.vue'

// Audio player composable
const {
  audioElement,
  analyser,
  dataArray,
  playlist,
  currentTrackIndex,
  currentTrack,
  isPlaying,
  isLoop,
  isShuffle,
  volume,
  currentTime,
  duration,
  progress,
  isLoading,
  hasNextTrack,
  hasPrevTrack,
  loadTrack,
  play,
  pause,
  togglePlayPause,
  nextTrack,
  prevTrack,
  setVolume,
  seek,
  toggleLoop,
  toggleShuffle,
  addFiles,
  removeTrack,
  clearPlaylist,
  setupAudioEvents
} = useAudioPlayer()

// UI state
const showPlaylist = ref(false)
const cdScale = ref(1)  // Scale theo sound wave realtime
const nowPlayingBeat = ref(false)
const explosionRings = ref([])  // Vòng tròn nổ theo nhạc

// Notification state
const notification = ref({
  visible: false,
  title: '',
  message: '',
  type: 'info',
  autoClose: 3000
})

// Refs
const audioElementRef = ref(null)
const fileInputRef = ref(null)
const folderInputRef = ref(null)

// Format time in MM:SS format
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Format file type
const formatFileType = (type) => {
  if (!type) return 'Audio'
  
  const audioType = type.split('/')[1]?.toUpperCase()
  return audioType || 'Audio'
}

// Notification functions
const showNotification = (title, message, type = 'info', autoClose = 3000) => {
  notification.value = {
    visible: true,
    title,
    message,
    type,
    autoClose
  }
}

const closeNotification = () => {
  notification.value.visible = false
}

// Handle progress bar click
const handleProgressClick = (event) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const percentage = (event.clientX - rect.left) / rect.width * 100
  seek(percentage)
}

// File input handlers
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const triggerFolderInput = () => {
  folderInputRef.value?.click()
}

const handleFileInput = (event) => {
  const files = event.target.files
  if (files.length > 0) {
    const count = addFiles(files)
    showNotification(
      '🎵 Files Added',
      `Successfully added ${count} audio file${count > 1 ? 's' : ''} to playlist`,
      'success'
    )
  }
  
  // Reset input
  event.target.value = ''
}

const handleFolderInput = (event) => {
  const files = event.target.files
  if (files.length > 0) {
    const count = addFiles(files)
    showNotification(
      '📁 Folder Added',
      `Successfully added ${count} audio file${count > 1 ? 's' : ''} from folder to playlist`,
      'success'
    )
  }
  
  // Reset input
  event.target.value = ''
}

// Play specific track
const playTrack = (index) => {
  loadTrack(index)
  nextTick(() => {
    play()
  })
}

// Handle audio errors
const handleAudioError = (event) => {
  console.error('Audio error:', event)
  // You could show a toast notification here
}

// Initialize
onMounted(async () => {
  await nextTick()
  
  // Set audio element ref
  audioElement.value = audioElementRef.value
  
  // Setup audio events
  setupAudioEvents()
  
  // Beat detection for CD animation - theo sound wave
  const detectBeat = () => {
    if (analyser.value && dataArray.value && isPlaying.value) {
      analyser.value.getByteFrequencyData(dataArray.value)
      
      // Sử dụng cùng logic với sound wave - average tất cả frequencies
      const avgIntensity = dataArray.value.reduce((sum, val) => sum + val, 0) / dataArray.value.length / 255
      
      // CD scale theo realtime sound wave intensity (nhẹ nhàng)
      cdScale.value = 1 + (avgIntensity * 0.15)  // Scale từ 1.0 đến 1.15
      
      // Now playing beat khi có âm thanh mạnh
      nowPlayingBeat.value = avgIntensity > 0.2
      
      // Tạo explosion rings theo nhạc
      createExplosionRings(avgIntensity)
      
      requestAnimationFrame(detectBeat)
    } else {
      // Reset khi không phát nhạc
      cdScale.value = 1
      nowPlayingBeat.value = false
      explosionRings.value = []
      if (isPlaying.value) {
        setTimeout(detectBeat, 100)
      }
    }
  }
  
  // Tạo explosion rings theo nhạc
  const createExplosionRings = (intensity) => {
    // Chỉ tạo khi nhạc đủ mạnh
    if (intensity < 0.4) return
    
    const ringCount = Math.floor(intensity * 2) // 1-2 rings cho ít lộn xộn hơn
    
    for (let i = 0; i < ringCount; i++) {
      if (explosionRings.value.length > 15) {
        explosionRings.value.shift() // Xóa ring cũ nhất
      }
      
      // Màu khói nhạt và mờ hơn
      const colors = [
        'rgba(173, 216, 230, 0.08)', // Light blue smoke
        'rgba(221, 160, 221, 0.06)', // Light plum smoke  
        'rgba(152, 251, 152, 0.05)', // Light green smoke
        'rgba(255, 218, 185, 0.07)', // Light peach smoke
        'rgba(230, 230, 250, 0.04)', // Lavender smoke
        'rgba(240, 248, 255, 0.06)', // Alice blue smoke
        'rgba(250, 240, 230, 0.07)', // Linen smoke
        'rgba(245, 245, 220, 0.05)'  // Beige smoke
      ]
      
      const ring = {
        id: Date.now() + Math.random(),
        style: {
          left: Math.random() * 80 + 10 + '%',  // 10-90% để không ra ngoài
          top: Math.random() * 80 + 10 + '%',
          '--ring-color': colors[Math.floor(Math.random() * colors.length)],
          '--ring-size': (120 + intensity * 150) + 'px', // Size dựa theo intensity nhưng lớn hơn
          '--animation-duration': (2.5 + Math.random() * 1.5) + 's' // Chậm hơn cho hiệu ứng khói
        }
      }
      
      explosionRings.value.push(ring)
      
      // Tự động xóa ring sau 4s
      setTimeout(() => {
        const index = explosionRings.value.findIndex(r => r.id === ring.id)
        if (index > -1) {
          explosionRings.value.splice(index, 1)
        }
      }, 4000)
    }
  }

  // Start beat detection when playing
  watch(isPlaying, (playing) => {
    if (playing) {
      detectBeat()
      updateTitle()
    } else {
      // Reset title when stopped
      document.title = '🎵 Vue Music Player'
    }
  })
  
  // Watch current track to update title
  watch(currentTrack, (track) => {
    if (track && isPlaying.value) {
      updateTitle()
    }
  })
  
  // Update title with animated sound waves
  const updateTitle = () => {
    if (!currentTrack.value) {
      document.title = '🎵 Vue Music Player'
      return
    }
    
    const waves = ['🎵', '🎶', '🎼', '🎤', '🎧']
    let waveIndex = 0
    
    const animateTitle = () => {
      if (isPlaying.value && currentTrack.value) {
        const wave = waves[waveIndex % waves.length]
        document.title = `${wave} ${currentTrack.value.name} - Vue Music Player`
        waveIndex++
        setTimeout(animateTitle, 1000) // Change every 1 second
      }
    }
    
    animateTitle()
  }
  
  // Show welcome message
  console.log('🎵 Vue Music Player initialized!')
  console.log('🎹 Keyboard shortcuts:')
  console.log('   Space: Play/Pause')
  console.log('   ←/→: Previous/Next track')
  console.log('   L: Toggle loop')
  console.log('   S: Toggle shuffle')
})
</script>

<style scoped>
.music-player {
  display: flex;
  flex-direction: row;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

@media (max-width: 1023px) {
  .music-player {
    flex-direction: column;
  }
}

.background-effects {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(48px);
  animation: floatAndPulse 8s ease-in-out infinite;
}

.orb-1 {
  top: 80px;
  left: 80px;
  width: 288px;
  height: 288px;
  background: linear-gradient(45deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.2));
  animation-delay: 0s;
}

.orb-2 {
  bottom: 80px;
  right: 80px;
  width: 384px;
  height: 384px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(34, 197, 94, 0.2));
  animation-delay: 2s;
}

.orb-3 {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 256px;
  height: 256px;
  background: linear-gradient(225deg, rgba(236, 72, 153, 0.3), rgba(251, 191, 36, 0.2));
  animation-delay: 4s;
}

.orb-4 {
  top: 20%;
  right: 15%;
  width: 192px;
  height: 192px;
  background: linear-gradient(315deg, rgba(34, 197, 94, 0.25), rgba(139, 92, 246, 0.15));
  animation-delay: 1s;
}

.orb-5 {
  bottom: 30%;
  left: 10%;
  width: 320px;
  height: 320px;
  background: linear-gradient(45deg, rgba(251, 191, 36, 0.2), rgba(59, 130, 246, 0.2));
  animation-delay: 3s;
}

/* Floating particles */
.explosion-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.explosion-ring {
  position: absolute;
  width: var(--ring-size, 100px);
  height: var(--ring-size, 100px);
  background: radial-gradient(circle, var(--ring-color, rgba(139, 92, 246, 0.15)) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  animation: smokeExpand var(--animation-duration, 1s) ease-out forwards;
  filter: blur(8px);
  opacity: 0.3;
}

.main-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  z-index: 10;
  position: relative;
  transition: all 0.3s ease;
  min-width: 0;
}

.playlist-toggle-icon {
  position: fixed;
  top: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 9999;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.playlist-toggle-icon:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.playlist-toggle-icon.active {
  background: rgba(139, 92, 246, 0.5);
  border-color: rgba(139, 92, 246, 0.7);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
}

.playlist-toggle-icon .icon {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.playlist-toggle-icon.active .icon {
  transform: rotate(180deg);
}

@media (max-width: 768px) {
  .playlist-toggle-icon {
    top: 16px;
    right: 16px;
    width: 44px;
    height: 44px;
    z-index: 9999;
  }
  
  .playlist-toggle-icon .icon {
    width: 18px;
    height: 18px;
  }
  
  /* Đảm bảo button luôn hiển thị trên mobile kể cả khi playlist mở */
  .sidebar.sidebar-open ~ .playlist-toggle-icon {
    z-index: 9999;
    position: fixed;
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  gap: 32px;
  min-height: 0;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .main-content {
    padding: 16px;
    gap: 24px;
    justify-content: flex-start;
    padding-top: 32px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 12px;
    gap: 20px;
  }
}

.now-playing {
  text-align: center;
  max-width: 400px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: transform 0.15s ease-out;
}

.now-playing.beat {
  animation: nowPlayingBeatPulse 0.1s ease-out;
}

.cd-container {
  position: relative;
  margin: 0 auto;
  padding: 20px;  /* Thêm padding để beat-ring không bị cắt */
  transition: transform 0.1s ease-out;  /* Smooth transition cho realtime scale */
}

.beat-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 220px;
  height: 220px;
  border: 3px solid rgba(139, 92, 246, 0.8);
  border-radius: 50%;
  transform-origin: center center;
  transition: transform 0.1s ease-out, opacity 0.1s ease-out;
  box-shadow: 
    0 0 20px rgba(139, 92, 246, 0.6),
    inset 0 0 20px rgba(139, 92, 246, 0.3);
  z-index: 1;
}

@media (max-width: 768px) {
  .beat-ring {
    width: 180px;
    height: 180px;
  }
}

@media (max-width: 480px) {
  .beat-ring {
    width: 160px;
    height: 160px;
  }
}

.cd-disc {
  width: 192px;
  height: 192px;
  margin: 0 auto;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6, #ec4899);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  transition: all 0.5s;
  z-index: 2;
}

@media (max-width: 768px) {
  .cd-disc {
    width: 160px;
    height: 160px;
  }
}

@media (max-width: 480px) {
  .cd-disc {
    width: 140px;
    height: 140px;
  }
}

.cd-disc.spinning {
  animation: spin 8s linear infinite;
  box-shadow: 0 25px 50px rgba(139, 92, 246, 0.5);
}

.cd-hole {
  position: absolute;
  inset: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.cd-center {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(59, 130, 246, 0.2));
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.cd-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.note-icon {
  width: 48px;
  height: 48px;
  color: rgba(255, 255, 255, 0.9);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.vinyl-line {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.line-1 {
  inset: 16px;
  border-width: 2px;
}

.line-2 {
  inset: 32px;
}

.line-3 {
  inset: 48px;
}

.track-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.track-name {
  font-size: 24px;
  font-weight: bold;
  color: white;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-name.no-track {
  color: rgba(255, 255, 255, 0.6);
}

.track-details {
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.visualizer-container {
  width: 100%;
  max-width: 672px;
}

.progress-section {
  width: 100%;
  max-width: 672px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar-container {
  position: relative;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  cursor: pointer;
  overflow: hidden;
}

.progress-bar-container:hover .progress-thumb {
  opacity: 1;
}

.progress-bar-container:hover .progress-glow {
  opacity: 1;
}

.progress-bar {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #3b82f6);
  border-radius: 20px;
  transition: width 0.2s;
}

.progress-glow {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  opacity: 0;
  transition: opacity 0.2s;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: all 0.2s;
}

.thumb-inner {
  position: absolute;
  inset: 4px;
  background: linear-gradient(135deg, #a78bfa, #60a5fa);
  border-radius: 50%;
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  font-family: 'Courier New', monospace;
}

.volume-section {
  width: 100%;
  max-width: 384px;
}

.sidebar {
  width: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(16px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease-in-out;
  z-index: 20;
  overflow: hidden;
  flex-shrink: 0;
  transform: translateX(100%);
}

.sidebar.sidebar-open {
  transform: translateX(0);
}

@media (max-width: 1023px) {
  .sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    width: 100%;
  }
  
  .sidebar.sidebar-open {
    width: 100%;
  }
}

@media (min-width: 1024px) {
  .sidebar {
    position: relative;
    transform: translateX(0);
  }
  
  .sidebar.sidebar-open {
    width: 384px;
  }
}

.mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 10;
  cursor: pointer;
}

.hidden-input {
  display: none;
}

.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(16px);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  border-radius: 16px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(139, 92, 246, 0.3);
  border-top: 4px solid #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: white;
  font-weight: 500;
  margin: 0;
}

/* Animations */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes beat {
  0% { 
    transform: scale(1);
  }
  50% { 
    transform: scale(1.05);
  }
  100% { 
    transform: scale(1);
  }
}

@keyframes beatPulse {
  0% { 
    transform: scale(1);
    filter: brightness(1) drop-shadow(0 0 10px rgba(139, 92, 246, 0.3));
  }
  30% { 
    transform: scale(1.12);
    filter: brightness(1.3) drop-shadow(0 0 25px rgba(139, 92, 246, 0.8));
  }
  100% { 
    transform: scale(1);
    filter: brightness(1) drop-shadow(0 0 10px rgba(139, 92, 246, 0.3));
  }
}

@keyframes nowPlayingBeat {
  0% { 
    transform: scale(1) translateY(0);
  }
  50% { 
    transform: scale(1.02) translateY(-2px);
  }
  100% { 
    transform: scale(1) translateY(0);
  }
}

@keyframes nowPlayingBeatPulse {
  0% { 
    transform: scale(1) translateY(0);
  }
  40% { 
    transform: scale(1.04) translateY(-4px);
  }
  100% { 
    transform: scale(1) translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* New animations for dynamic background */
@keyframes floatAndPulse {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.8;
  }
  25% {
    transform: translate(20px, -15px) scale(1.1);
    opacity: 1;
  }
  50% {
    transform: translate(-10px, -25px) scale(0.9);
    opacity: 0.6;
  }
  75% {
    transform: translate(-25px, 10px) scale(1.05);
    opacity: 0.9;
  }
}

@keyframes smokeExpand {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0.6;
    filter: blur(4px);
  }
  50% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0.3;
    filter: blur(6px);
  }
  100% {
    transform: translate(-50%, -50%) scale(8);
    opacity: 0;
    filter: blur(12px);
  }
}
</style>
