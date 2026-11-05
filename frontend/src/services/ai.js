import api from './api'

export const suggestDomains = async (topic) => {
  const { data } = await api.post('/ai/suggest-domains', { topic })
  return data.data.suggestions
}