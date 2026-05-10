import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConversationProvider } from '@elevenlabs/react'
import { TranscriptProvider } from './context/TranscriptContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ConversationProvider>
        <TranscriptProvider>
          <App />
        </TranscriptProvider>
      </ConversationProvider>
    </BrowserRouter>
  </StrictMode>,
)
