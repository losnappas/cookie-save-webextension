import browser from "webextension-polyfill"

import { getCookieKey } from "~src/util"

async function restoreCookies() {
  const storedCookies = (await browser.storage.local.get()) || {}

  for (const key in storedCookies) {
    try {
      const cookie = storedCookies[key] as browser.Cookies.Cookie
      if (
        !cookie.domain ||
        !cookie.expirationDate ||
        cookie.expirationDate < Math.floor(Date.now() / 1000)
      ) {
        continue
      }
      await browser.cookies.set({
        name: cookie.name,
        url: `https://${cookie.domain}${cookie.path}`,
        domain: cookie.domain,
        expirationDate: cookie.expirationDate,
        firstPartyDomain: cookie.firstPartyDomain,
        httpOnly: cookie.httpOnly,
        partitionKey: cookie.partitionKey,
        path: cookie.path,
        sameSite: cookie.sameSite,
        secure: cookie.secure,
        storeId: cookie.storeId,
        value: cookie.value
      })
      console.log(`Cookie ${cookie.name} restored`)
    } catch (error) {
      console.error(`Failed to restore cookie '${key}': ${error}`)
    }
  }
}

browser.runtime.onStartup.addListener(async () => {
  await restoreCookies()
})

browser.cookies.onChanged.addListener((changeInfo) => {
  const { cookie } = changeInfo

  if (cookie.storeId === "firefox-default") {
    return
  }

  const key = getCookieKey(cookie)
  browser.storage.local.remove(key)
  console.log(`Cookie ${cookie.name} removed from storage`)
})

browser.browserAction.onClicked.addListener(async () => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true })
  const currentTab = tabs[0]
  if (!currentTab || !currentTab.url) {
    console.error("No current tab or URL found.")
    return
  }

  const cookies = await browser.cookies.getAll({
    url: currentTab.url,
    storeId: currentTab.cookieStoreId,
    session: false,
  })
  cookies.forEach(storeCookie)
})

async function storeCookie(cookie: browser.Cookies.Cookie) {
  if (cookie.storeId === "firefox-default") {
    return
  }
  const key = getCookieKey(cookie)
  // Cookie was changed, update it in storage
  browser.storage.local.set({ [key]: cookie })
  console.log(`Cookie ${cookie.name} updated in storage`)
}
