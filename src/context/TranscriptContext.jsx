import { createContext, useContext, useRef } from 'react'

const TranscriptContext = createContext(null)

export function TranscriptProvider({ children }) {
  const transcriptRef = useRef([])

  const setTranscript = (entries) => {
    transcriptRef.current = entries
  }

  const getTranscript = () => transcriptRef.current

  return (
    <TranscriptContext.Provider value={{ setTranscript, getTranscript }}>
      {children}
    </TranscriptContext.Provider>
  )
}

export function useTranscript() {
  const ctx = useContext(TranscriptContext)
  if (!ctx) throw new Error('useTranscript must be used within TranscriptProvider')
  return ctx
}
