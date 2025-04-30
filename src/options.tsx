import React, { useEffect, useState } from "react"
import browser from "webextension-polyfill"

import { getCookieKey } from "./util"

const Options = () => {
  const [cookies, setCookies] = useState<browser.Cookies.Cookie[]>([])

  const fetchAndSetCookies = async () => {
    const storedData = await browser.storage.local.get()
    const cookieList: browser.Cookies.Cookie[] = []

    for (const key in storedData) {
      const cookie = storedData[key] as browser.Cookies.Cookie
      // Basic check to ensure it looks like a cookie object
      if (
        cookie &&
        typeof cookie.name === "string" &&
        typeof cookie.domain === "string"
      ) {
        cookieList.push(cookie)
      }
    }
    setCookies(cookieList)
    console.log("Fetched cookies:", cookieList)
  }

  useEffect(() => {
    fetchAndSetCookies() // Fetch cookies on component mount
  }, [])

  const clearStorage = async () => {
    // Clear all items from storage
    await browser.storage.local.clear()
    console.log("Storage cleared.")
    // Refetch cookies to update the display (should be empty now)
    fetchAndSetCookies()
  }

  // Function to handle deleting a single cookie
  const handleDeleteCookie = async (cookieKey: string) => {
    try {
      await browser.storage.local.remove(cookieKey)
      console.log(`Cookie with key ${cookieKey} deleted.`)
      // Refetch cookies to update the display
      fetchAndSetCookies()
    } catch (error) {
      console.error(`Error deleting cookie with key ${cookieKey}:`, error)
    }
  }

  // Helper to format expiration date
  const formatExpirationDate = (timestamp?: number) => {
    if (!timestamp) return "Session"
    const date = new Date(timestamp * 1000)
    return date.toLocaleString()
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h1>Stored Cookies</h1>
        <p>These are the cookies currently stored by the extension.</p>
      </div>

      {cookies.length === 0 ? (
        <p>No cookies stored yet.</p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ccc" }}>
              <th style={{ textAlign: "left", padding: "8px" }}>Key</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Name</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Domain</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Path</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Value</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Expires</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cookies.map((cookie) => {
              const cookieKey = getCookieKey(cookie)
              return (
                <tr key={cookieKey} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px", wordBreak: "break-all" }}>
                    {cookieKey}
                  </td>
                  <td style={{ padding: "8px", wordBreak: "break-all" }}>
                    {cookie.name}
                  </td>
                  <td style={{ padding: "8px", wordBreak: "break-all" }}>
                    {cookie.domain}
                  </td>
                  <td style={{ padding: "8px", wordBreak: "break-all" }}>
                    {cookie.path}
                  </td>
                  <td style={{ padding: "8px", wordBreak: "break-all" }}>
                    {cookie.value}
                  </td>
                  <td style={{ padding: "8px", wordBreak: "break-all" }}>
                    {formatExpirationDate(cookie.expirationDate)}
                  </td>
                  <td style={{ padding: "8px" }}>
                    {" "}
                    {/* New Data Cell */}
                    <button
                      type="button"
                      onClick={() => handleDeleteCookie(cookieKey)}>
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <button onClick={clearStorage}>Clear All Saved Cookies</button>
    </div>
  )
}

export default Options
