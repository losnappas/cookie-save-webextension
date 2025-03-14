import React, { useEffect, useState } from "react"
import browser from "webextension-polyfill"

const Options = () => {
  const [text, setText] = useState("")

  useEffect(() => {
    const getDomains = async () => {
      const result = await browser.storage.local.get("ignoredDomains")
      const storedDomains = (result.ignoredDomains as string[]) || []
      setText(storedDomains.join("\\n"))
    }

    getDomains()
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value)
  }

  const saveDomains = async () => {
    const newDomains = text
      .split("\\n")
      .map((domain) => domain.trim())
      .filter((domain) => domain !== "")
    await browser.storage.local.set({ ignoredDomains: newDomains })
    console.log("Domains saved:", newDomains)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h1>Ignored domains</h1>
        <p>
          Ignored domains will not have their cookies restored by the extension.
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
      <button onClick={saveDomains}>Save Ignored Domains</button>
    </div>
  )
}

export default Options
