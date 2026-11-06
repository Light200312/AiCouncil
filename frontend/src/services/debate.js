
import api from './api'

export const getDebatePresets = async () => {
  const { data } = await api.get('/debates/presets')
  return data.data.presets
}

export const createDebateSession = async (sessionData) => {
  const { data } = await api.post('/debates', sessionData)
  return data.data.session
}
