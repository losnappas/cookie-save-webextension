import browser from "webextension-polyfill"

import { getCookieKey, type UrledCookie } from "~src/util"

async function restoreCookies() {
  const storedCookies = (await browser.storage.local.get()) || {}

  for (const key in storedCookies) {
    try {
      const cookie = storedCookies[key] as UrledCookie
      if (
        !cookie.domain ||
        !cookie.expirationDate ||
        cookie.expirationDate < Math.floor(Date.now() / 1000)
      ) {
        continue
      }
      await browser.cookies.set({
        name: cookie.name,
        url: cookie.url,
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
      console.log(`Cookie ${cookie.name} restored`)
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

browser.cookies.onChanged.addListener(async (changeInfo) => {
  const { cookie, removed } = changeInfo

  if (cookie.storeId === "firefox-default" || !cookiesRestored) {
    return
  }

  const key = getCookieKey(cookie)
  if (removed) {
    browser.storage.local.remove(key)
    console.log(`Cookie ${key} removed from storage`)
  } else {
    let url = `https://${cookie.domain}${cookie.path}`
    await storeCookie({
      ...cookie,
      url,
    });
    console.log(`Cookie ${key} updated in storage`)
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
  cookies.forEach((c) => storeCookie({ ...c, url }))
})

async function storeCookie(cookie: UrledCookie) {
  if (cookie.storeId === "firefox-default") {
    return
  }
  const key = getCookieKey(cookie)
  // Cookie was changed, update it in storage
  await browser.storage.local.set({ [key]: cookie })
  console.log(`Cookie ${cookie.name} updated in storage`)
}
