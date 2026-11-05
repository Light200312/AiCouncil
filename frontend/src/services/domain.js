
import api from './api'

export const getDomains = async (search = '') => {
  const { data } = await api.get('/domains', {
    params: search ? { search } : {},
  })

  return data.data.domains
}
