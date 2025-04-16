import React, { useEffect, useState } from "react"
import browser from "webextension-polyfill"

const Options = () => {
  const [text, setText] = useState("")

  useEffect(() => {
    const getDomains = async () => {
      const result = await browser.storage.local.get("allowedDomains")
      const storedDomains = (result.allowedDomains as string[]) || []
      setText(storedDomains.join("\n"))
    }

    getDomains()
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value)
  }

  const saveDomains = async () => {
    const newDomains = text
      .split("\n")
      .map((domain) => domain.trim())
      .filter((domain) => domain !== "")
    await browser.storage.local.set({ allowedDomains: newDomains })
    console.log("Domains saved:", newDomains)
  }

  const clearStorage = async () => {
    const saveStorage = await browser.storage.local.get("allowedDomains")
    await browser.storage.local.clear()
    await browser.storage.local.set({ allowedDomains: saveStorage })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h1>Allowed domains</h1>
        <p>
          Allowed domains will have their cookies restored by the extension.
        </p>
        <p>Domain without "https://".</p>
      </div>
      <textarea
        value={text}
        placeholder={`en.wikipedia.org
google.com`}
        onChange={handleChange}
        rows={10}
        cols={50}
      />
      <button onClick={saveDomains}>Save Allowed Domains</button>
      <button onClick={clearStorage}>Clear All Saved Cookies</button>
    </div>
  )
}

export default Options
