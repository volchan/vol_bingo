export interface User {
  id: string
  login: string
  displayName: string
  type: string
  broadcasterType: string
  description: string
  profileImageUrl: string
  offlineImageUrl: string
  viewCount: string
  twitchId: string
  twitchCreatedAt: Date
  createdAt: Date
  updatedAt: Date | null
  streamIntegrationToken: string
}
