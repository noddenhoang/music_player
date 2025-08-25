import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export function useAudioPlayer() {
  // Reactive state
  const audioElement = ref(null)
  const audioContext = ref(null)
  const analyser = ref(null)
  const source = ref(null)
  const dataArray = ref(null)
  
  // Player state
  const playlist = ref([])
  const currentTrackIndex = ref(0)
  const isPlaying = ref(false)
  const isLoop = ref(false)
  const isShuffle = ref(false)
  const volume = ref(70)
  const currentTime = ref(0)
  const duration = ref(0)
  const isLoading = ref(false)

  // Computed properties
  const currentTrack = computed(() => {
    return playlist.value[currentTrackIndex.value] || null
  })

  const progress = computed(() => {
    return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
  })

  const hasNextTrack = computed(() => {
    return currentTrackIndex.value < playlist.value.length - 1
  })

  const hasPrevTrack = computed(() => {
    return currentTrackIndex.value > 0
  })

  // Initialize audio context for visualizer
  const initAudioContext = () => {
    if (!audioContext.value && audioElement.value) {
      try {
        audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
        analyser.value = audioContext.value.createAnalyser()
        analyser.value.fftSize = 256
        dataArray.value = new Uint8Array(analyser.value.frequencyBinCount)
        
        if (source.value) source.value.disconnect()
        source.value = audioContext.value.createMediaElementSource(audioElement.value)
        source.value.connect(analyser.value)
        analyser.value.connect(audioContext.value.destination)
      } catch (error) {
        console.error('Error initializing audio context:', error)
      }
    }
  }

  // Load track
  const loadTrack = (index) => {
    if (index >= 0 && index < playlist.value.length) {
      currentTrackIndex.value = index
      const track = playlist.value[index]
      
      if (audioElement.value && track) {
        audioElement.value.src = track.url
        audioElement.value.load()
        
        // Update document title
        document.title = `🎵 ${track.name}`
      }
    }
  }

  // Playback controls
  const play = async () => {
    if (audioElement.value && currentTrack.value) {
      try {
        if (!audioContext.value) {
          initAudioContext()
        }
        
        if (audioContext.value && audioContext.value.state === 'suspended') {
          await audioContext.value.resume()
        }
        
        await audioElement.value.play()
        isPlaying.value = true
      } catch (error) {
        console.error('Error playing audio:', error)
      }
    }
  }

  const pause = () => {
    if (audioElement.value) {
      audioElement.value.pause()
      isPlaying.value = false
    }
  }

  const togglePlayPause = () => {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }

  const nextTrack = () => {
    let nextIndex
    
    if (isShuffle.value) {
      nextIndex = Math.floor(Math.random() * playlist.value.length)
    } else {
      nextIndex = (currentTrackIndex.value + 1) % playlist.value.length
    }
    
    loadTrack(nextIndex)
    if (isPlaying.value) {
      play()
    }
  }

  const prevTrack = () => {
    let prevIndex
    
    if (isShuffle.value) {
      prevIndex = Math.floor(Math.random() * playlist.value.length)
    } else {
      prevIndex = (currentTrackIndex.value - 1 + playlist.value.length) % playlist.value.length
    }
    
    loadTrack(prevIndex)
    if (isPlaying.value) {
      play()
    }
  }

  const setVolume = (newVolume) => {
    volume.value = newVolume
    if (audioElement.value) {
      audioElement.value.volume = newVolume / 100
    }
  }

  const seek = (percentage) => {
    if (audioElement.value && duration.value > 0) {
      audioElement.value.currentTime = (percentage / 100) * duration.value
    }
  }

  const toggleLoop = () => {
    isLoop.value = !isLoop.value
    if (audioElement.value) {
      audioElement.value.loop = isLoop.value
    }
  }

  const toggleShuffle = () => {
    isShuffle.value = !isShuffle.value
  }

  // Add files to playlist
  const addFiles = (files) => {
    const audioFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/')
    )

    audioFiles.forEach(file => {
      const track = {
        id: Date.now() + Math.random(),
        file,
        name: file.name.replace(/\.[^/.]+$/, ""),
        url: URL.createObjectURL(file),
        size: file.size,
        type: file.type
      }
      playlist.value.push(track)
    })

    // Auto play first track if playlist was empty
    if (playlist.value.length === audioFiles.length && audioFiles.length > 0) {
      loadTrack(0)
      setTimeout(() => play(), 100)
    }

    // Save to localStorage
    savePlaylistToStorage()
    
    return audioFiles.length
  }

  // Remove track from playlist
  const removeTrack = (index) => {
    if (index >= 0 && index < playlist.value.length) {
      const track = playlist.value[index]
      
      // Revoke URL to free memory
      if (track.url) {
        URL.revokeObjectURL(track.url)
      }
      
      playlist.value.splice(index, 1)
      
      // Adjust current track index
      if (currentTrackIndex.value >= index) {
        currentTrackIndex.value = Math.max(0, currentTrackIndex.value - 1)
      }
      
      // Load new current track if removed current
      if (playlist.value.length > 0) {
        loadTrack(currentTrackIndex.value)
      }
      
      savePlaylistToStorage()
    }
  }

  // Clear playlist
  const clearPlaylist = () => {
    // Revoke all URLs
    playlist.value.forEach(track => {
      if (track.url) {
        URL.revokeObjectURL(track.url)
      }
    })
    
    playlist.value = []
    currentTrackIndex.value = 0
    pause()
    localStorage.removeItem('musicPlayerPlaylist')
  }

  // Save playlist to localStorage (metadata only)
  const savePlaylistToStorage = () => {
    try {
      const playlistData = playlist.value.map(track => ({
        id: track.id,
        name: track.name,
        size: track.size,
        type: track.type
      }))
      localStorage.setItem('musicPlayerPlaylist', JSON.stringify(playlistData))
      localStorage.setItem('musicPlayerState', JSON.stringify({
        currentTrackIndex: currentTrackIndex.value,
        volume: volume.value,
        isLoop: isLoop.value,
        isShuffle: isShuffle.value
      }))
    } catch (error) {
      console.error('Error saving playlist to storage:', error)
    }
  }

  // Load playlist from localStorage (note: files will be lost, only metadata remains)
  const loadPlaylistFromStorage = () => {
    try {
      const savedState = localStorage.getItem('musicPlayerState')
      if (savedState) {
        const state = JSON.parse(savedState)
        volume.value = state.volume || 70
        isLoop.value = state.isLoop || false
        isShuffle.value = state.isShuffle || false
      }
    } catch (error) {
      console.error('Error loading playlist from storage:', error)
    }
  }

  // Audio event handlers
  const setupAudioEvents = () => {
    if (!audioElement.value) return

    audioElement.value.addEventListener('loadedmetadata', () => {
      duration.value = audioElement.value.duration || 0
    })

    audioElement.value.addEventListener('timeupdate', () => {
      currentTime.value = audioElement.value.currentTime || 0
    })

    audioElement.value.addEventListener('ended', () => {
      if (!isLoop.value) {
        nextTrack()
      }
    })

    audioElement.value.addEventListener('loadstart', () => {
      isLoading.value = true
    })

    audioElement.value.addEventListener('canplay', () => {
      isLoading.value = false
    })

    audioElement.value.addEventListener('error', (e) => {
      console.error('Audio error:', e)
      isLoading.value = false
    })

    // Set initial volume
    audioElement.value.volume = volume.value / 100
    audioElement.value.loop = isLoop.value
  }

  // Keyboard shortcuts
  const handleKeyboard = (event) => {
    if (event.target.tagName === 'INPUT') return
    
    switch (event.code) {
      case 'Space':
        event.preventDefault()
        togglePlayPause()
        break
      case 'ArrowLeft':
        event.preventDefault()
        prevTrack()
        break
      case 'ArrowRight':
        event.preventDefault()
        nextTrack()
        break
      case 'KeyL':
        event.preventDefault()
        toggleLoop()
        break
      case 'KeyS':
        event.preventDefault()
        toggleShuffle()
        break
    }
  }

  // Initialize
  onMounted(() => {
    loadPlaylistFromStorage()
    document.addEventListener('keydown', handleKeyboard)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyboard)
    
    // Clean up URLs
    playlist.value.forEach(track => {
      if (track.url) {
        URL.revokeObjectURL(track.url)
      }
    })
  })

  // Watch for volume changes
  watch(volume, (newVolume) => {
    if (audioElement.value) {
      audioElement.value.volume = newVolume / 100
    }
    savePlaylistToStorage()
  })

  // Watch for loop changes
  watch(isLoop, (newLoop) => {
    if (audioElement.value) {
      audioElement.value.loop = newLoop
    }
    savePlaylistToStorage()
  })

  return {
    // Refs
    audioElement,
    analyser,
    dataArray,
    
    // State
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
    
    // Methods
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
    setupAudioEvents,
    initAudioContext
  }
}
