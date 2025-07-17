"use client"

import { useState } from "react"
import { Button } from "../components/ui/Button"
import { chatbotService } from "../services/chatbotService"
import { useAuth } from "../hooks/useAuth"

export default function TestPage() {
  const [message, setMessage] = useState("")
  const { userId } = useAuth()

  const handleCreateSession = async () => {
    if (!userId) {
      setMessage("User not logged in")
      return
    }

    try {
      const newSession = await chatbotService.createSession(userId, "Test Session")
      if (newSession?.id) {
        setMessage(`Session created successfully! ID: ${newSession.id}`)
      } else {
        setMessage("Failed to create session.")
      }
    } catch (error) {
      if (error instanceof Error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage("An unknown error occurred.")
      }
      console.error("Error creating session:", error)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <Button onClick={handleCreateSession}>Create Test Session</Button>
      {message && <p className="mt-4">{message}</p>}
    </div>
  )
}
