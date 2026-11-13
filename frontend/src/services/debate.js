
import api from './api'

export const getDebatePresets = async () => {
  const { data } = await api.get('/debates/presets')
  return data.data.presets
}

export const createDebateSession = async (sessionData) => {
  const { data } = await api.post('/debates', sessionData)
  return data.data.session
}
export const getDebateSession = async (sessionId) => {
  const { data } = await api.get(`/debates/${sessionId}`)
  return data.data
}
export const postUserMessage = async (sessionId, content) => {
  const { data } = await api.post(`/debates/${sessionId}/messages`, { content })
  return data.data.message
}
export const generateNextTurn = async (sessionId) => {
  const { data } = await api.post(`/debates/${sessionId}/next`)
  return data.data
}