import browser from "webextension-polyfill"

import { getCookieKey } from "~src/util"

let ignoredDomains: string[] = []

async function updateIgnoredDomains() {
  ignoredDomains =
    ((await browser.storage.local.get("ignoredDomains"))
      .ignoredDomains as string[]) || []
  console.log("Ignored domains updated:", ignoredDomains)
}

async function restoreCookies() {
  const storedCookies = (await browser.storage.local.get()) || {}

  for (const key in storedCookies) {
    const cookie = storedCookies[key] as browser.Cookies.Cookie
    if (ignoredDomains.includes(cookie.domain)) {
      console.log(
        `Cookie ${cookie.name} from ignored domain ${cookie.domain}, skipping`
      )
      continue
    }

    try {
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
  await updateIgnoredDomains()
  await restoreCookies()
})

browser.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === "local" && changes.ignoredDomains) {
    await updateIgnoredDomains()
    await restoreCookies()
  }
})

browser.cookies.onChanged.addListener((changeInfo) => {
  const { cookie, removed } = changeInfo
  const key = getCookieKey(cookie)

  if (cookie.storeId === "firefox-default") {
    console.log(`Cookie ${cookie.name} from default container, skipping`)
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
