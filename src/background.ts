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
        browser.storage.local.remove(key)
        continue
      }
      await browser.cookies.set({
        name: cookie.name,
        url: `https://${cookie.domain}${cookie.path}`,
        domain: cookie.hostOnly ? undefined : cookie.domain,
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
      console.log(`Cookie ${key} restored`)
    } catch (error) {
      console.error(`Failed to restore cookie '${key}': ${error}`)
    }
  }
}

let cookiesRestored = false
browser.runtime.onStartup.addListener(async () => {
  await restoreCookies()
  cookiesRestored = true
})

browser.cookies.onChanged.addListener((changeInfo) => {
  const { cookie, removed } = changeInfo

  if (cookie.storeId === "firefox-default" || !cookiesRestored) {
    return
  }

  const key = getCookieKey(cookie)
  if (removed) {
    browser.storage.local.remove(key)
    console.log(`Cookie ${key} removed from storage`)
  } else {
    storeCookie(cookie)
    console.log(`Cookie ${key} updated`)
  }
})

browser.browserAction.onClicked.addListener(async () => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true })
  const currentTab = tabs[0]
  const url = currentTab.url
  if (!currentTab || !currentTab.url) {
    console.error("No current tab or URL found.")
    return
  }

  const cookies = await browser.cookies.getAll({
    url: currentTab.url,
    storeId: currentTab.cookieStoreId,
    session: false
  })
  cookies.forEach((c) => storeCookie(c))
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
