
import api from './api'

export const loginUser = async (credentials) => {
  const { data } = await api.post('/auth/login', credentials)
  return data.data.user
}

export const registerUser = async (userData) => {
  const { data } = await api.post('/auth/register', userData)
  return data.data.user
}

export const logoutUser = async () => {
  const { data } = await api.post('/auth/logout')
  return data
}
