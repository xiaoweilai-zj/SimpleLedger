export const DEFAULT_AVATAR = '/images/default-avatar.png'

export const DEFAULT_NICKNAMES = [
  '小可爱',
  '小明',
  '小红',
  '小花',
  '阿福',
  '旺财',
  '发财',
  '小白',
  '小黑',
  '大宝'
]

export function getRandomNickname() {
  const index = Math.floor(Math.random() * DEFAULT_NICKNAMES.length)
  return DEFAULT_NICKNAMES[index]
} 