'use client'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useEffect } from 'react'

const PageClient = () => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  return null
}

export default PageClient

