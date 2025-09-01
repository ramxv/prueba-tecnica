import { Toaster } from 'sonner'
import './App.css'
import DashboardPage from './components/dashboard/DashboardPage'

function App() {

  return (
    <>
      <DashboardPage />
      <Toaster position="top-right" richColors closeButton expand />
    </>
  )
}

export default App
