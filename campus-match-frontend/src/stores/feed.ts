import { defineStore } from 'pinia'

import type { ConnectionState, MatchProfile, MessagePreview } from '@/types/models'
import { attachConnectionState } from '@/utils/match-catalog'

export const useFeedStore = defineStore('feed', {
  state: () => ({
    profiles: [] as MatchProfile[],
    previews: [] as MessagePreview[],
  }),
  getters: {
    profileMap: state => new Map(state.profiles.map(profile => [profile.id, profile])),
    hasConnections: state => state.previews.length > 0,
  },
  actions: {
    setProfiles(nextProfiles: MatchProfile[]) {
      this.profiles = nextProfiles
    },
    removeProfile(profileId: number) {
      this.profiles = this.profiles.filter(profile => profile.id !== profileId)
    },
    updateProfileAction(profileId: number, actionState: 'LIKE' | 'PASS') {
      this.profiles = this.profiles.map(profile =>
        profile.id === profileId ? { ...profile, actionState } : profile,
      )
    },
    updateConnectionState(
      profileId: number,
      payload: {
        state: ConnectionState
        connectionId: number
        conversationId: number | null
        canSendFirstMessage: boolean
        canMutualChat: boolean
      },
    ) {
      this.profiles = this.profiles.map(profile =>
        profile.id === profileId ? attachConnectionState(profile, payload) : profile,
      )
    },
    setPreviews(nextPreviews: MessagePreview[]) {
      this.previews = nextPreviews
    },
    markPreviewRead(connectionId: number) {
      this.previews = this.previews.map(item =>
        item.id === connectionId
          ? {
              ...item,
              unread: 0,
            }
          : item,
      )
    },
    removePreviewByUserId(userId: number) {
      this.previews = this.previews.filter(item => item.targetUserId !== userId)
    },
    getProfileById(profileId: number) {
      return this.profiles.find(profile => profile.id === profileId) ?? null
    },
  },
})
