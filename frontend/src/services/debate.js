
import api from './api'

export const getDebatePresets = async () => {
  const { data } = await api.get('/debates/presets')
  return data.data.presets
}
