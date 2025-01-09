const eventBus = {
  listeners: {},
  
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  },
  
  emit(event, data) {
    const callbacks = this.listeners[event]
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  },
  
  off(event, callback) {
    const callbacks = this.listeners[event]
    if (callbacks) {
      if (callback) {
        const index = callbacks.indexOf(callback)
        if (index !== -1) {
          callbacks.splice(index, 1)
        }
      } else {
        delete this.listeners[event]
      }
    }
  }
}

export default eventBus 