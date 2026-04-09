import { defineStore } from 'pinia'

const TOKEN_KEY = 'campus-match-token'

interface AuthState {
  token: string
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: '',
  }),
  getters: {
    isLoggedIn: state => Boolean(state.token),
  },
  actions: {
    bootstrap() {
      const token = uni.getStorageSync(TOKEN_KEY)
      if (typeof token === 'string') {
        this.token = token
      }
    },
    setToken(token: string) {
      this.token = token
      uni.setStorageSync(TOKEN_KEY, token)
    },
    clearToken() {
      this.token = ''
      uni.removeStorageSync(TOKEN_KEY)
    },
    signOut() {
      this.clearToken()
      uni.reLaunch({
        url: '/pages/login/index',
      })
    },
  },
})
