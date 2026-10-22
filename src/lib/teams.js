// Team display helpers: ISO flag codes (flagcdn.com) and Traditional Chinese names (Taiwan usage).
export const FLAG_CODE = {
  Argentina: 'ar', France: 'fr', Spain: 'es', England: 'gb-eng', Brazil: 'br', Portugal: 'pt', Netherlands: 'nl',
  Belgium: 'be', Germany: 'de', Croatia: 'hr', Uruguay: 'uy', Morocco: 'ma', USA: 'us', Mexico: 'mx', Switzerland: 'ch',
  Colombia: 'co', Japan: 'jp', Senegal: 'sn', Austria: 'at', Sweden: 'se', Turkey: 'tr', Ecuador: 'ec', Iran: 'ir',
  Australia: 'au', Scotland: 'gb-sct', 'South Korea': 'kr', Norway: 'no', Ghana: 'gh', 'Ivory Coast': 'ci', Algeria: 'dz',
  Qatar: 'qa', Tunisia: 'tn', Egypt: 'eg', Paraguay: 'py', 'South Africa': 'za', 'Saudi Arabia': 'sa', 'Czech Republic': 'cz',
  Canada: 'ca', Panama: 'pa', Uzbekistan: 'uz', Jordan: 'jo', Iraq: 'iq', Haiti: 'ht', 'New Zealand': 'nz',
  'Bosnia & Herzegovina': 'ba', Curaçao: 'cw', 'Democratic Republic of the Congo': 'cd', 'Cape Verde': 'cv',
}

export const ZH_NAME = {
  Argentina: '阿根廷', France: '法國', Spain: '西班牙', England: '英格蘭', Brazil: '巴西', Portugal: '葡萄牙', Netherlands: '荷蘭',
  Belgium: '比利時', Germany: '德國', Croatia: '克羅埃西亞', Uruguay: '烏拉圭', Morocco: '摩洛哥', USA: '美國', Mexico: '墨西哥',
  Switzerland: '瑞士', Colombia: '哥倫比亞', Japan: '日本', Senegal: '塞內加爾', Austria: '奧地利', Sweden: '瑞典', Turkey: '土耳其',
  Ecuador: '厄瓜多', Iran: '伊朗', Australia: '澳洲', Scotland: '蘇格蘭', 'South Korea': '南韓', Norway: '挪威', Ghana: '迦納',
  'Ivory Coast': '象牙海岸', Algeria: '阿爾及利亞', Qatar: '卡達', Tunisia: '突尼西亞', Egypt: '埃及', Paraguay: '巴拉圭',
  'South Africa': '南非', 'Saudi Arabia': '沙烏地阿拉伯', 'Czech Republic': '捷克', Canada: '加拿大', Panama: '巴拿馬',
  Uzbekistan: '烏茲別克', Jordan: '約旦', Iraq: '伊拉克', Haiti: '海地', 'New Zealand': '紐西蘭', 'Bosnia & Herzegovina': '波赫',
  Curaçao: '古拉索', 'Democratic Republic of the Congo': '剛果民主共和國', 'Cape Verde': '維德角',
}

const EN_SHORT = { 'Democratic Republic of the Congo': 'DR Congo', 'Bosnia & Herzegovina': 'Bosnia & Herz.' }

export const DRAW = '平手'

export function teamName(team, lang = 'zh') {
  if (!team) return ''
  if (team === DRAW) return lang === 'en' ? 'Draw' : '平手'
  if (lang === 'en') return EN_SHORT[team] || team
  return ZH_NAME[team] || team
}

export function flagUrl(team, width = 40) {
  const code = FLAG_CODE[team]
  return code ? `https://flagcdn.com/w${width}/${code}.png` : null
}

/** Case-insensitive match against both English and Chinese names. */
export function teamMatches(team, query) {
  if (!query) return true
  const q = query.trim().toLowerCase()
  return String(team).toLowerCase().includes(q) || (ZH_NAME[team] || '').includes(q)
}
