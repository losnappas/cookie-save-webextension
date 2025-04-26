import browser from "webextension-polyfill"

export const getCookieKey = (cookie: browser.Cookies.Cookie) => {
  return `${cookie.domain}-${cookie.name}-${cookie.storeId}`
}
