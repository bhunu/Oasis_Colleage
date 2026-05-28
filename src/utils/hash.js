import md5 from 'js-md5'

export function hashPassword(password) {
  return md5(password)
}
