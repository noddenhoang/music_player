<template>
  <div v-if="visible" class="notification-overlay" @click="closeDialog">
    <div class="notification-dialog" @click.stop>
      <div class="dialog-header">
        <div class="dialog-icon">
          <span v-if="type === 'success'">✅</span>
          <span v-else-if="type === 'error'">❌</span>
          <span v-else>ℹ️</span>
        </div>
        <h3 class="dialog-title">{{ title }}</h3>
      </div>
      
      <div class="dialog-content">
        <p>{{ message }}</p>
      </div>
      
      <div class="dialog-actions">
        <button @click="closeDialog" class="dialog-btn dialog-btn-primary">
          OK
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Notification'
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info', // 'success', 'error', 'info'
    validator: value => ['success', 'error', 'info'].includes(value)
  },
  autoClose: {
    type: Number,
    default: 3000 // Auto close after 3 seconds
  }
})

const emit = defineEmits(['close'])

let autoCloseTimer = null

const closeDialog = () => {
  emit('close')
}

// Auto close functionality
watch(() => props.visible, (newVal) => {
  if (newVal && props.autoClose > 0) {
    autoCloseTimer = setTimeout(() => {
      closeDialog()
    }, props.autoClose)
  } else if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
})
</script>

<style scoped>
.notification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.notification-dialog {
  background: rgba(30, 30, 30, 0.95);
  border-radius: 16px;
  padding: 0;
  max-width: 400px;
  min-width: 300px;
  border: 1px solid rgba(139, 92, 246, 0.3);
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.3),
    0 10px 10px -5px rgba(0, 0, 0, 0.2);
  animation: dialogSlideIn 0.3s ease-out;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 16px 24px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
}

.dialog-icon {
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-title {
  margin: 0;
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
}

.dialog-content {
  padding: 16px 24px;
}

.dialog-content p {
  margin: 0;
  color: #e5e7eb;
  font-size: 14px;
  line-height: 1.5;
}

.dialog-actions {
  padding: 16px 24px 20px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-btn {
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dialog-btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: white;
}

.dialog-btn-primary:hover {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Mobile responsive */
@media (max-width: 480px) {
  .notification-dialog {
    margin: 20px;
    max-width: calc(100vw - 40px);
    min-width: unset;
  }
  
  .dialog-header,
  .dialog-content,
  .dialog-actions {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
