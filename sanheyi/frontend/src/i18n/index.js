const localeModules = import.meta.glob('#locales/*.json', { eager: true })

const AVAILABLE_LOCALES = {}
for (const [path, mod] of Object.entries(localeModules)) {
  if (path.includes('.sources.')) {
    continue
  }
  const match = path.match(/([A-Za-z_]+)\.json$/)
  if (!match) continue
  AVAILABLE_LOCALES[match[1]] = mod.default || mod
}

const DEFAULT_LOCALE = 'zh_CN'
let currentLocale = DEFAULT_LOCALE

const WHITESPACE_RE = /\s+/g
const PLACEHOLDER_RE = /\$\{([^}]+)\}/g

const baseLocale = AVAILABLE_LOCALES[DEFAULT_LOCALE] || {}
const normalizedBaseKeys = new Map()

const normalizeValue = (value) => value.replace(WHITESPACE_RE, ' ').trim()

for (const [key, value] of Object.entries(baseLocale)) {
  if (typeof value !== 'string') continue
  const normalized = normalizeValue(value)
  if (!normalizedBaseKeys.has(normalized)) {
    normalizedBaseKeys.set(normalized, key)
  }
}

const formatTemplate = (template, values) => {
  if (!values) return template
  return template.replace(PLACEHOLDER_RE, (match, expression) => {
    if (Object.prototype.hasOwnProperty.call(values, expression)) {
      const replacement = values[expression]
      return replacement == null ? '' : String(replacement)
    }
    return match
  })
}

const resolveKey = (text) => {
  if (typeof text !== 'string') return undefined
  const normalized = normalizeValue(text)
  return normalizedBaseKeys.get(normalized)
}

export const getAvailableLocales = () => Object.keys(AVAILABLE_LOCALES)

export const getLocale = () => currentLocale

export const setLocale = (localeCode) => {
  if (AVAILABLE_LOCALES[localeCode]) {
    currentLocale = localeCode
  } else {
    console.warn(`[i18n] Unknown locale: ${localeCode}`)
  }
}

export const resolveLocaleKey = (text) => resolveKey(text)

export const normalizeLocaleText = (text) => normalizeValue(text)

export const t = (text, values) => {
  if (typeof text !== 'string') {
    return text
  }
  const localeData = AVAILABLE_LOCALES[currentLocale] || baseLocale
  const key = resolveKey(text)
  const template = key && localeData[key] ? localeData[key] : text
  return formatTemplate(template, values)
}
