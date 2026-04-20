import { useState, useRef, useCallback } from 'react'

type VoiceInputLang = 'he' | 'en'
type VoiceInputStatus = 'idle' | 'listening' | 'error'

interface UseVoiceInputOptions {
  onResult: (text: string) => void
  onWrongLanguage: () => void
}

interface UseVoiceInputReturn {
  status: VoiceInputStatus
  errorMessage: string | null
  start: (lang: VoiceInputLang) => void
  stop: () => void
}

const HE_CHAR_REGEX = /[\u05D0-\u05EA]/
const EN_CHAR_REGEX = /[a-zA-Z]/

function detectLang(text: string): VoiceInputLang | null {
  if (HE_CHAR_REGEX.test(text)) return 'he'
  if (EN_CHAR_REGEX.test(text)) return 'en'
  return null
}

const BCP47: Record<VoiceInputLang, string> = {
  he: 'he-IL',
  en: 'en-US',
}

export function useVoiceInput({
  onResult,
  onWrongLanguage,
}: UseVoiceInputOptions): UseVoiceInputReturn {
  const [status, setStatus] = useState<VoiceInputStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const expectedLangRef = useRef<VoiceInputLang>('he')

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

      expectedLangRef.current = lang
      setErrorMessage(null)

      const recognition = new SpeechRecognition()
      recognition.lang = BCP47[lang]
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      recognitionRef.current = recognition

      recognition.onstart = () => setStatus('listening')

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim() ?? ''
        if (!transcript) return

        const detected = detectLang(transcript)
        if (detected !== null && detected !== expectedLangRef.current) {
          onWrongLanguage()
          return
        }

        onResult(transcript)
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
    [onResult, onWrongLanguage]
  )

  return { status, errorMessage, start, stop }
}
