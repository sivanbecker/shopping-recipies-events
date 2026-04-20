import { useState, useRef, useCallback } from 'react'

type VoiceInputLang = 'he' | 'en'
type VoiceInputStatus = 'idle' | 'listening' | 'error'

interface UseVoiceInputOptions {
  onResult: (text: string) => void
}

interface UseVoiceInputReturn {
  status: VoiceInputStatus
  errorMessage: string | null
  start: (lang: VoiceInputLang) => void
  stop: () => void
}

const BCP47: Record<VoiceInputLang, string> = {
  he: 'he-IL',
  en: 'en-US',
}

export function useVoiceInput({ onResult }: UseVoiceInputOptions): UseVoiceInputReturn {
  const [status, setStatus] = useState<VoiceInputStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setStatus('idle')
  }, [])

  const start = useCallback(
    (lang: VoiceInputLang) => {
      const SpeechRecognition =
        window.SpeechRecognition ??
        (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition })
          .webkitSpeechRecognition

      if (!SpeechRecognition) {
        setStatus('error')
        setErrorMessage('not_supported')
        return
      }

      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }

      setErrorMessage(null)

      const recognition = new SpeechRecognition()
      recognition.lang = BCP47[lang]
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      recognitionRef.current = recognition

      recognition.onstart = () => setStatus('listening')

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim() ?? ''
        if (transcript) onResult(transcript)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'no-speech' || event.error === 'aborted') {
          setStatus('idle')
        } else {
          setStatus('error')
          setErrorMessage(event.error)
        }
      }

      recognition.onend = () => {
        recognitionRef.current = null
        setStatus('idle')
      }

      recognition.start()
    },
    [onResult]
  )

  return { status, errorMessage, start, stop }
}
