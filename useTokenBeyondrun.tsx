import React, { useEffect, useRef, useState } from 'react'
import { BASE_HOME_PAGE } from 'constant'

const isBeyondRunDomain = (url) => {
  const { hostname } = new URL(url)

  return hostname.includes('beyondrun.com')
}

export function usePostMessageBeyondrun(): Window {
  const [curWindow, setCurWindow] = useState()
  useEffect(() => {
    setCurWindow((window.frames as any).beyondrun)
  }, [typeof window !== 'undefined'])

  return curWindow
}

interface UseTokenBeyondrunConfig {
  onTokenChanged?: (token) => void
}

function useTokenBeyondrun(configs?: UseTokenBeyondrunConfig) {
  const { onTokenChanged = () => {} } = configs || {}
  const refIframe = useRef()
  const win = usePostMessageBeyondrun()

  useEffect(() => {
    const cb = (event: MessageEvent) => {
      if (event.origin === document.location.origin) {
        return
      }
      if (!isBeyondRunDomain(event.origin) && !process.env.isGlobalMessage) {
        return
      }

      if (event.data.type === 'token') {
        const token = event.data.value
        if (token) {
          localStorage.setItem('tokenpublic', token)
        } else {
          localStorage.removeItem('tokenpublic')
        }
        onTokenChanged(token)
      }
    }
    window.addEventListener('message', cb)

    return () => {
      window.removeEventListener('message', cb)
    }
  }, [])

  return (
    <iframe
      id={'ibeyondrun'}
      title={'Beyond Run'}
      src={`${BASE_HOME_PAGE}/itb`}
      name={'beyondrun'}
      ref={refIframe}
      style={{ display: 'none' }}
      onLoad={() => {
        win.postMessage('token', BASE_HOME_PAGE)
      }}
    />
  )
}

export default useTokenBeyondrun
