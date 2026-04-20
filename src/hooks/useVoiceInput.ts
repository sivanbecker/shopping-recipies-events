import { useState, useRef, useCallback } from 'react'

// Web Speech API — not fully typed in all TS DOM lib versions
interface ISpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}
interface ISpeechRecognitionErrorEvent extends Event {
  error: string
}
interface ISpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((e: ISpeechRecognitionEvent) => void) | null
  onerror: ((e: ISpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

type VoiceInputLang = 'he' | 'en'
type VoiceInputStatus = 'idle' | 'listening' | 'error'

interface UseVoiceInputOptions {
  onResult: (text: string, isFinal: boolean) => void
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

function getSpeechRecognition(): (new () => ISpeechRecognition) | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function useVoiceInput({ onResult }: UseVoiceInputOptions): UseVoiceInputReturn {
  const [status, setStatus] = useState<VoiceInputStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setStatus('idle')
  }, [])

  const start = useCallback(
    (lang: VoiceInputLang) => {
      const Ctor = getSpeechRecognition()
      if (!Ctor) {
        setStatus('error')
        setErrorMessage('not_supported')
        return
      }

      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }

      setErrorMessage(null)

      const recognition = new Ctor()
      recognition.lang = BCP47[lang]
      recognition.interimResults = true
      recognition.maxAlternatives = 1
      recognitionRef.current = recognition

      recognition.onstart = () => setStatus('listening')

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1]
        const transcript = result?.[0]?.transcript?.trim() ?? ''
        if (transcript) onResult(transcript, result?.isFinal ?? true)
      }

      recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
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
