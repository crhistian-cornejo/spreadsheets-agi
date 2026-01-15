import { createFileRoute } from "@tanstack/react-router"
import { POST as chatHandler } from "@/lib/ai/chat-api"

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        return chatHandler(request)
      },
    },
  },
})
