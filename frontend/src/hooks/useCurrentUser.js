
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me')
      return data.data.user
    },
    retry: false,
    refetchOnWindowFocus: false,
  })
}
