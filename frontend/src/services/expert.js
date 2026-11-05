
import api from './api'

export const getExperts = async (filters = {}) => {
  const { data } = await api.get('/experts', { params: filters })
  return data.data.experts
}

export const createExpert = async (expertData) => {
  const { data } = await api.post('/experts', expertData)
  return data.data.expert
}
