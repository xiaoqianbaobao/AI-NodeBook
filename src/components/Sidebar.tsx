import React from 'react'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  IconButton,
  Divider
} from '@mui/material'
import {
  Menu as MenuIcon,
  Mic as MicIcon,
  Note as NoteIcon,
  School as SchoolIcon,
  Settings as SettingsIcon
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../store/appStore'

const menuItems = [
  { text: '会议纪要', icon: <MicIcon />, path: '/meeting' },
  { text: '笔记管理', icon: <NoteIcon />, path: '/notes' },
  { text: '学习训练', icon: <SchoolIcon />, path: '/learning' },
  { text: '系统设置', icon: <SettingsIcon />, path: '/settings' }
]

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarOpen, setSidebarOpen, setCurrentPage } = useAppStore()

  const handleMenuClick = (path: string) => {
    navigate(path)
    const page = path.replace('/', '') || 'meeting'
    setCurrentPage(page)
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: sidebarOpen ? 240 : 64,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: sidebarOpen ? 240 : 64,
          boxSizing: 'border-box',
          transition: 'width 0.3s',
          overflowX: 'hidden'
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => setSidebarOpen(!sidebarOpen)}>
          <MenuIcon />
        </IconButton>
        {sidebarOpen && (
          <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
            AI笔记本
          </Typography>
        )}
      </Box>
      
      <Divider />
      
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleMenuClick(item.path)}
              selected={location.pathname === item.path || (location.pathname === '/' && item.path === '/meeting')}
              sx={{
                minHeight: 48,
                justifyContent: sidebarOpen ? 'initial' : 'center',
                px: 2.5
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: sidebarOpen ? 3 : 'auto',
                  justifyContent: 'center'
                }}
              >
                {item.icon}
              </ListItemIcon>
              {sidebarOpen && (
                <ListItemText 
                  primary={item.text} 
                  sx={{ opacity: sidebarOpen ? 1 : 0 }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  )
}

export default Sidebar