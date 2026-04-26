import { createContext, useContext, useState, useCallback } from 'react'

const PageActionContext = createContext(null)

export function PageActionProvider({ children }) {
  const [action, setAction] = useState(null)
  const [breadcrumbExtra, setBreadcrumbExtra] = useState(null)
  const [navbarExtra, setNavbarExtra] = useState(null)   // search+filter for kanban

  const registerAction = useCallback((a) => setAction(a), [])
  const clearAction = useCallback(() => setAction(null), [])
  const registerBreadcrumb = useCallback((label) => setBreadcrumbExtra(label), [])
  const clearBreadcrumb = useCallback(() => setBreadcrumbExtra(null), [])
  const registerNavbarExtra = useCallback((node) => setNavbarExtra(node), [])
  const clearNavbarExtra = useCallback(() => setNavbarExtra(null), [])

  return (
    <PageActionContext.Provider value={{
      action, registerAction, clearAction,
      breadcrumbExtra, registerBreadcrumb, clearBreadcrumb,
      navbarExtra, registerNavbarExtra, clearNavbarExtra,
    }}>
      {children}
    </PageActionContext.Provider>
  )
}

export function usePageAction() {
  return useContext(PageActionContext)
}
