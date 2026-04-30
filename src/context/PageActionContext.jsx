import { createContext, useContext, useState, useCallback } from 'react'

const PageActionContext = createContext(null)

export function PageActionProvider({ children }) {
  const [action, setAction] = useState(null)
  const [download, setDownload] = useState(null)
  const [print, setPrint] = useState(null)
  const [breadcrumbExtra, setBreadcrumbExtra] = useState(null)
  const [navbarExtra, setNavbarExtra] = useState(null)
  const [sidebarClickHandler, setSidebarClickHandler] = useState(null)

  const registerAction = useCallback((a) => setAction(a), [])
  const clearAction = useCallback(() => setAction(null), [])
  const clearDownload = useCallback(() => setDownload(null), [])
  const clearPrint = useCallback(() => setPrint(null), [])
  const registerBreadcrumb = useCallback((label) => setBreadcrumbExtra(label), [])
  const clearBreadcrumb = useCallback(() => setBreadcrumbExtra(null), [])
  const registerNavbarExtra = useCallback((node) => setNavbarExtra(node), [])
  const clearNavbarExtra = useCallback(() => setNavbarExtra(null), [])
  const registerSidebarClick = useCallback((fn) => setSidebarClickHandler(() => fn), [])
  const clearSidebarClick = useCallback(() => setSidebarClickHandler(null), [])

  return (
    <PageActionContext.Provider value={{
      action, registerAction, clearAction,      
      download, setDownload, clearDownload,
      print, setPrint, clearPrint,
      breadcrumbExtra, registerBreadcrumb, clearBreadcrumb,
      navbarExtra, registerNavbarExtra, clearNavbarExtra,
      sidebarClickHandler, registerSidebarClick, clearSidebarClick,
      
    }}>
      {children}
    </PageActionContext.Provider>
  )
}

export function usePageAction() {
  return useContext(PageActionContext)
}
