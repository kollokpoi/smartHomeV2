// stores/network.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNetworkStore = defineStore('network', () => {
    const isLocalNetwork = ref<boolean | null>(null)
    const isChecking = ref(false)
    
    const LOCAL_API_URL = 'http://192.168.0.100:3000/api'
    const PUBLIC_API_URL = 'https://api.kollokpoi.ddns.net/api'
    
    const apiUrl = computed(() => {
        if (isLocalNetwork.value === true) return LOCAL_API_URL
        if (isLocalNetwork.value === false) return PUBLIC_API_URL
        return PUBLIC_API_URL // fallback
    })
    
    const checkLocalNetwork = async (): Promise<boolean> => {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 2000)
            
            const response = await fetch(`${LOCAL_API_URL}/health`, {
                signal: controller.signal
            })
            
            clearTimeout(timeoutId)
            return response.ok
        } catch {
            return false
        }
    }
    
    const init = async () => {
        if (isChecking.value) return
        isChecking.value = true
        
        isLocalNetwork.value = await checkLocalNetwork()
        console.log(`🌐 Network mode: ${isLocalNetwork.value ? 'LOCAL' : 'PUBLIC'}`)
        
        isChecking.value = false
    }
    
    return {
        isLocalNetwork,
        isChecking,
        apiUrl,
        init,
        checkLocalNetwork
    }
})