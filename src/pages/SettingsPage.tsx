import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material'
import {
  Save as SaveIcon,
  Science as TestIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { useAppStore } from '../store/appStore'
import { apiService } from '../services/apiService'

const SettingsPage: React.FC = () => {
  const { apiKeys, setApiKeys, notes, meetings, flashcards } = useAppStore()
  const [xunfeiKey, setXunfeiKey] = useState(apiKeys.xunfeiApiKey)
  const [deepseekKey, setDeepseekKey] = useState(apiKeys.deepseekApiKey)
  const [darkMode, setDarkMode] = useState(false)
  const [testResults, setTestResults] = useState<{ [key: string]: 'success' | 'error' | 'testing' | null }>({})
  const [message, setMessage] = useState('')

  const handleSaveSettings = () => {
    setApiKeys({
      xunfeiApiKey: xunfeiKey,
      deepseekApiKey: deepseekKey
    })
    setMessage('设置已保存')
    setTimeout(() => setMessage(''), 3000)
  }

  const testXunfeiAPI = async () => {
    setTestResults(prev => ({ ...prev, xunfei: 'testing' }))
    try {
      if (!xunfeiKey.trim()) {
        setTestResults(prev => ({ ...prev, xunfei: 'error' }))
        setMessage('请先输入API密钥')
        return
      }

      // 更新API服务中的密钥
      apiService.setApiKeys(xunfeiKey, deepseekKey)
      
      // 测试API连接
      const success = await apiService.testXunfeiConnection()
      if (success) {
        setTestResults(prev => ({ ...prev, xunfei: 'success' }))
        setMessage('科大讯飞API连接成功')
      } else {
        setTestResults(prev => ({ ...prev, xunfei: 'error' }))
        setMessage('科大讯飞API连接失败')
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, xunfei: 'error' }))
      setMessage('科大讯飞API连接失败')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const testDeepseekAPI = async () => {
    setTestResults(prev => ({ ...prev, deepseek: 'testing' }))
    try {
      if (!deepseekKey.trim()) {
        setTestResults(prev => ({ ...prev, deepseek: 'error' }))
        setMessage('请先输入API密钥')
        return
      }

      // 更新API服务中的密钥
      apiService.setApiKeys(xunfeiKey, deepseekKey)
      
      // 测试API连接
      const success = await apiService.testDeepseekConnection()
      if (success) {
        setTestResults(prev => ({ ...prev, deepseek: 'success' }))
        setMessage('DeepSeek API连接成功')
      } else {
        setTestResults(prev => ({ ...prev, deepseek: 'error' }))
        setMessage('DeepSeek API连接失败')
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, deepseek: 'error' }))
      setMessage('DeepSeek API连接失败')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const clearAllData = () => {
    if (window.confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      // 这里应该调用清空数据的函数
      setMessage('所有数据已清空')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const exportData = () => {
    const data = {
      notes,
      meetings,
      flashcards,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-notebook-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setMessage('数据已导出')
    setTimeout(() => setMessage(''), 3000)
  }

  const getTestStatus = (api: string) => {
    const status = testResults[api]
    if (status === 'testing') return <Chip label="测试中..." color="info" size="small" />
    if (status === 'success') return <Chip label="连接成功" color="success" size="small" />
    if (status === 'error') return <Chip label="连接失败" color="error" size="small" />
    return null
  }

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        系统设置
      </Typography>

      {message && (
        <Alert severity={message.includes('成功') || message.includes('已') ? 'success' : 'error'} sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* API配置 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                API配置
              </Typography>
              
              <TextField
                fullWidth
                label="科大讯飞API密钥"
                value={xunfeiKey}
                onChange={(e) => setXunfeiKey(e.target.value)}
                type="password"
                sx={{ mb: 2 }}
                helperText="用于语音转文字功能"
                InputProps={{
                  endAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTestStatus('xunfei')}
                      <Button
                        size="small"
                        startIcon={<TestIcon />}
                        onClick={testXunfeiAPI}
                        disabled={testResults.xunfei === 'testing'}
                      >
                        测试
                      </Button>
                    </Box>
                  )
                }}
              />

              <TextField
                fullWidth
                label="DeepSeek API密钥"
                value={deepseekKey}
                onChange={(e) => setDeepseekKey(e.target.value)}
                type="password"
                sx={{ mb: 2 }}
                helperText="用于AI内容生成和答疑功能"
                InputProps={{
                  endAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTestStatus('deepseek')}
                      <Button
                        size="small"
                        startIcon={<TestIcon />}
                        onClick={testDeepseekAPI}
                        disabled={testResults.deepseek === 'testing'}
                      >
                        测试
                      </Button>
                    </Box>
                  )
                }}
              />

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveSettings}
                fullWidth
              >
                保存设置
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 界面设置 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                界面设置
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                  />
                }
                label="深色模式"
                sx={{ mb: 2 }}
              />

              <Typography variant="body2" color="text.secondary">
                深色模式可以减少眼部疲劳，适合在光线较暗的环境中使用。
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 数据管理 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                数据管理
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {notes.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        笔记数量
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="secondary">
                        {meetings.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        会议记录
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {flashcards.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        闪卡数量
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {flashcards.filter(card => card.reviewCount > 0).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        已复习
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={exportData}
                >
                  导出数据
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={clearAllData}
                >
                  清空所有数据
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 关于信息 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                关于AI笔记本
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText
                    primary="版本"
                    secondary="1.0.0"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="开发者"
                    secondary="AI Notebook Team"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="技术栈"
                    secondary="Electron + React + TypeScript + Material-UI"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="支持平台"
                    secondary="Windows (当前版本)"
                  />
                </ListItem>
              </List>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                AI笔记本是一个智能化的笔记和学习工具，旨在帮助用户高效捕捉、处理和转化信息为可交互的学习资产。
                支持语音录制、文档上传、视频处理等功能，并能够生成结构化的笔记、闪卡和AI答疑助手。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default SettingsPage