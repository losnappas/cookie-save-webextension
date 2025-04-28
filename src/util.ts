import browser from "webextension-polyfill"

export type UrledCookie = browser.Cookies.Cookie & {
  url: string
}

export const getCookieKey = (cookie: browser.Cookies.Cookie) => {
  return `${cookie.domain}-${cookie.name}-${cookie.storeId}`
}
