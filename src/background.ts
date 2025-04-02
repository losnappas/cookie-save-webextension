import browser from "webextension-polyfill"

import { getCookieKey } from "~src/util"

let allowedDomains: string[] = []

async function updateAllowedDomains() {
  allowedDomains =
    ((await browser.storage.local.get("allowedDomains"))
      .allowedDomains as string[]) || []
  console.log("Allowed domains updated:", allowedDomains)
}

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
      if (!allowedDomains.includes(cookie.domain)) {
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
  await updateAllowedDomains()
  await restoreCookies()
})

browser.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === "local" && changes.allowedDomains) {
    await updateAllowedDomains()
  }
})

browser.cookies.onChanged.addListener((changeInfo) => {
  const { cookie, removed } = changeInfo
  const key = getCookieKey(cookie)

  if (cookie.storeId === "firefox-default") {
    return
  }

  if (!allowedDomains.includes(cookie.domain)) {
    return
  }

  if (removed) {
    browser.storage.local.remove(key)
    console.log(`Cookie ${cookie.name} removed from storage`)
  } else {
    // Cookie was changed, update it in storage
    browser.storage.local.set({ [key]: cookie })
    console.log(`Cookie ${cookie.name} updated in storage`)
  }
})

browser.browserAction.onClicked.addListener(async () => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true })
  const currentTab = tabs[0]
  if (!currentTab || !currentTab.url) {
    console.error("No current tab or URL found.")
    return
  }

  const url = new URL(currentTab.url)
  const domain = url.hostname

  const result = await browser.storage.local.get("allowedDomains")
  let allowedDomains = (result.allowedDomains as string[]) || []

  if (!allowedDomains.includes(domain)) {
    allowedDomains = [...allowedDomains, domain]
    await browser.storage.local.set({ allowedDomains: allowedDomains })
    console.log(`Added ${domain} to allowed domains.`)
  } else {
    console.log(`${domain} is already in allowed domains.`)
  }
})
