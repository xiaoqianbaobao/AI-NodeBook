import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Box } from '@mui/material'
import Sidebar from './components/Sidebar'
import MeetingPage from './pages/MeetingPage'
import NotesPage from './pages/NotesPage'
import LearningPage from './pages/LearningPage'
import SettingsPage from './pages/SettingsPage'
import { useAppStore } from './store/appStore'

function App() {
  const { sidebarOpen } = useAppStore()

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginLeft: sidebarOpen ? '240px' : '64px',
          transition: 'margin-left 0.3s',
          overflow: 'hidden'
        }}
      >
        <Routes>
          <Route index element={<MeetingPage />} />
          <Route path="/meeting" element={<MeetingPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/learning" element={<LearningPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<MeetingPage />} />
        </Routes>
      </Box>
    </Box>
  )
}

export default App