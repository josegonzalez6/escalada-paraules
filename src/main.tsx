import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AdminPage } from './pages/AdminPage'
import './index.css'

function Router() {
  const [hash, setHash] = React.useState(window.location.hash)
  React.useEffect(() => {
    const handler = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])
  if (hash === '#/admin') return <AdminPage />
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><Router /></React.StrictMode>
)
