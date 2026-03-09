import type { LoginCredentials } from "@/types/User/LoginCredentials";
import type { User } from "@/types/User/User";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(
        localStorage.getItem('user')
            ? JSON.parse(localStorage.getItem('user')!)
            : null
    )

    const token = ref<string | null>(localStorage.getItem('auth_token'))
    const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const isInitialized = ref(false)

    let isRefreshing = false
    let refreshSubscribers: ((token: string) => void)[] = []

    const isAuthenticated = computed(() => !!token.value && !!user.value)

    const onTokenRefreshed = (newToken: string) => {
        refreshSubscribers.forEach(callback => callback(newToken))
        refreshSubscribers = []
    }


    const addRefreshSubscriber = (callback: (token: string) => void) => {
        refreshSubscribers.push(callback)
    }

    const login = async (credentials: LoginCredentials) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await authService.login(credentials)
            if (!response.success) {
                return { success: false, user: null }
            }
            user.value = response.data.user
            token.value = response.data.tokens.accessToken
            refreshToken.value = response.data.tokens.refreshToken || null

            localStorage.setItem('auth_token', token.value||'')
            localStorage.setItem('user', JSON.stringify(user.value))
            if (refreshToken.value)
                localStorage.setItem('refresh_token', refreshToken.value)

            return { success: true, user: user.value }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Ошибка авторизации'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    const refreshAccessToken = async (): Promise<string | null> => {
        if (!refreshToken.value) {
            return null
        }

        if (isRefreshing) {
            return new Promise((resolve) => {
                addRefreshSubscriber((newToken: string) => {
                    resolve(newToken)
                })
            })
        }

        isRefreshing = true

        try {
            const response = await authService.refreshToken(refreshToken.value)
            if (!response.success) {
                logout()
                throw error
            }
            const newAccessToken = response.data.accessToken
            const newRefreshToken = response.data.refreshToken

            token.value = newAccessToken

            if (newRefreshToken) {
                refreshToken.value = newRefreshToken
                localStorage.setItem('refresh_token', newRefreshToken)
            }
            localStorage.setItem('auth_token', newAccessToken)

            onTokenRefreshed(newAccessToken)

            return newAccessToken
        } catch (error) {
            logout()
            throw error
        } finally {
            isRefreshing = false
        }
    }
    const logout = () => {
        user.value = null
        token.value = null
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        localStorage.removeItem('refresh_token')
    }

    const checkAuth = async (): Promise<boolean> => {
        if (!token.value) return false

        try {
            const storedUser = localStorage.getItem('user')
            if (storedUser) {
                user.value = JSON.parse(storedUser)
            }
            return true
        } catch {
            logout()
            return false
        }
    }

    const initialize = async () => {
        if (isInitialized.value) return

        try {
            await checkAuth()
        } finally {
            isInitialized.value = true
        }
    }
    return {
        user,
        token,
        isLoading,
        error,
        isInitialized,

        isAuthenticated,


        login,
        logout,
        checkAuth,
        initialize,
        refreshAccessToken,
    }
})