import { createContext, useContext, useState, useCallback } from 'react'

const PageActionContext = createContext(null)

export function PageActionProvider({ children }) {
  const [action, setAction] = useState(null)
  const [breadcrumbExtra, setBreadcrumbExtra] = useState(null)

  const registerAction = useCallback((a) => setAction(a), [])
  const clearAction = useCallback(() => setAction(null), [])
  const registerBreadcrumb = useCallback((label) => setBreadcrumbExtra(label), [])
  const clearBreadcrumb = useCallback(() => setBreadcrumbExtra(null), [])

  return (
    <PageActionContext.Provider value={{ action, registerAction, clearAction, breadcrumbExtra, registerBreadcrumb, clearBreadcrumb }}>
      {children}
    </PageActionContext.Provider>
  )
}

export function usePageAction() {
  return useContext(PageActionContext)
}
