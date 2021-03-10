import React, { useContext, useEffect, useState } from 'react'
import { ReactComponentLike } from 'prop-types'
import Header from 'layouts/containers/Public/Header'
import Footer from 'layouts/containers/Public/Footer'
import Content from 'components/Layout/Content'
import BottomNavigation from 'layouts/containers/Public/BottomNavigation/BottomNavigation'
import useTokenBeyondrun, {
  usePostMessageBeyondrun,
} from 'hooks/useTokenBeyondrun'
import ModalNotLogin from 'layouts/containers/Public/ModalNotLogin/ModalNotLogin'
import ModalLogin from 'layouts/containers/Public/ModalLogin/ModalLogin'
import { AxiosError } from 'axios'
import Router from 'next/router'
import { DefaultLayoutContext, queryCache } from 'layouts/core/DefaultLayout'
import { BASE_HOME_PAGE } from 'constant'

interface IProps {
  Component: ReactComponentLike
}

export const PublicContext = React.createContext<{
  isLogin: boolean
  setIsLogin: (value: any) => void
  isShowModalWarningLogin: boolean
  setIsShowModalWarningLogin: (value: any) => void
  isShowModalLogin: boolean
  setIsShowModalLogin: (value: any) => void
}>({
  isLogin: null,
  setIsLogin: null,
  isShowModalLogin: null,
  setIsShowModalLogin: null,
  isShowModalWarningLogin: null,
  setIsShowModalWarningLogin: null,
})

function HandleErrorReactQuery() {
  const ctxPublic = useContext(PublicContext)
  const win = usePostMessageBeyondrun()

  // @ts-ignore
  queryCache.config.defaultConfig.queries.retry = (
    failureCount,
    error: AxiosError,
  ) => {
    const { status } = error?.response || {}
    if (status === 401) {
      win.postMessage(
        {
          type: 'set_token',
          value: null,
        },
        BASE_HOME_PAGE,
      )
      ctxPublic.setIsLogin(false)
      Router.replace('/')
      return false
    }

    return failureCount < 3
  }

  return null
}

function useRedirectNoAuthorize() {
  const ctxDefaultLayout = useContext(DefaultLayoutContext)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  useEffect(() => {
    setLoading(false)
    setToken(localStorage.getItem('tokenpublic'))
  }, [])

  const value = ctxDefaultLayout.isHideOnLoggedIn && Boolean(token)

  return {
    loading,
    value,
    allowRender: !loading && !value,
  }
}

function PublicContainer(props: IProps) {
  const { Component } = props
  const [isLogin, setIsLogin] = useState(false)
  const [isShowModalWarningLogin, setIsShowModalWarningLogin] = useState(false)
  const [isShowModalLogin, setIsShowModalLogin] = useState(false)

  const iframeBeyondrun = useTokenBeyondrun({
    onTokenChanged(token) {
      setIsLogin(Boolean(token))
    },
  })

  const redirect = useRedirectNoAuthorize()

  useEffect(() => {
    const token = localStorage.getItem('tokenpublic')
    setIsLogin(Boolean(token))
  }, [])

  useEffect(() => {
    if (!redirect.loading && redirect.value) {
      Router.replace('/')
    }
  }, [redirect.loading, redirect.value])

  return (
    <PublicContext.Provider
      value={{
        isLogin,
        setIsLogin,
        isShowModalWarningLogin,
        setIsShowModalWarningLogin,
        isShowModalLogin,
        setIsShowModalLogin,
      }}
    >
      <HandleErrorReactQuery />
      <div style={{ marginBottom: isLogin && 64 }}>
        <Header />
        <Content style={{ padding: 0, minHeight: '62vh' }}>
          {redirect.allowRender && <Component {...props} />}
        </Content>
        <Footer />
        <BottomNavigation />
      </div>
      {iframeBeyondrun}

      <ModalNotLogin
        onCancel={() => {
          setIsShowModalWarningLogin(false)
        }}
        visible={isShowModalWarningLogin}
      />

      <ModalLogin
        onCancel={() => {
          setIsShowModalLogin(false)
        }}
        visible={!isLogin && isShowModalLogin}
      />
    </PublicContext.Provider>
  )
}

export default PublicContainer
