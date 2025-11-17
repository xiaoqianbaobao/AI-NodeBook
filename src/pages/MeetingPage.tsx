import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Alert,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material'
import {
  Mic as MicIcon,
  Stop as StopIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { useAppStore } from '../store/appStore'
import { Meeting } from '../store/appStore'
import { apiService } from '../services/apiService'

const MeetingPage: React.FC = () => {
  const { meetings, addMeeting, deleteMeeting } = useAppStore()
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setAudioBlob(audioBlob)
        processAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)
      setRecordingTime(0)
      setError('')

      // 开始计时
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (err) {
      setError('无法访问麦克风，请检查权限设置')
      console.error('Error accessing microphone:', err)
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        setIsPaused(false)
        intervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        setIsPaused(true)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      // 停止所有音频轨道
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    try {
      // 调用科大讯飞API进行语音转文字
      const transcript = await apiService.speechToText(audioBlob)
      setTranscript(transcript)
      
      // 生成会议纪要
      await generateMeetingSummary(transcript)
    } catch (err) {
      console.error('Error processing audio:', err)
      // 如果API调用失败，使用模拟数据
      const mockTranscript = "语音转文字服务暂时不可用，请检查API配置。"
      setTranscript(mockTranscript)
      await generateMeetingSummary(mockTranscript)
    } finally {
      setIsProcessing(false)
    }
  }

  const generateMeetingSummary = async (transcript: string) => {
    try {
      // 调用DeepSeek API生成结构化纪要
      const summary = await apiService.generateMeetingSummary(transcript)

      const meeting: Meeting = {
        id: Date.now().toString(),
        title: `会议纪要 ${new Date().toLocaleString()}`,
        transcript,
        summary: summary.summary,
        topics: summary.topics,
        actions: summary.actions,
        createdAt: new Date(),
        duration: recordingTime
      }

      addMeeting(meeting)
    } catch (err) {
      console.error('Error generating summary:', err)
      // 如果API调用失败，使用模拟数据
      const mockSummary = {
        topics: ['项目进度讨论', '技术方案评审', '下阶段计划'],
        actions: ['完成技术方案设计', '准备项目演示', '安排团队会议'],
        summary: '本次会议主要讨论了项目当前进度，评审了技术方案，并制定了下一阶段的工作计划。'
      }

      const meeting: Meeting = {
        id: Date.now().toString(),
        title: `会议纪要 ${new Date().toLocaleString()}`,
        transcript,
        summary: mockSummary.summary,
        topics: mockSummary.topics,
        actions: mockSummary.actions,
        createdAt: new Date(),
        duration: recordingTime
      }

      addMeeting(meeting)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleDeleteMeeting = (id: string) => {
    deleteMeeting(id)
  }

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        会议纪要
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 录音控制区域 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            会议录音
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {!isRecording ? (
              <Button
                variant="contained"
                startIcon={<MicIcon />}
                onClick={startRecording}
                size="large"
              >
                开始录音
              </Button>
            ) : (
              <>
                <IconButton
                  color="primary"
                  onClick={pauseRecording}
                  size="large"
                >
                  {isPaused ? <PlayIcon /> : <PauseIcon />}
                </IconButton>
                <IconButton
                  color="error"
                  onClick={stopRecording}
                  size="large"
                >
                  <StopIcon />
                </IconButton>
              </>
            )}
            
            <Typography variant="h6" sx={{ ml: 2 }}>
              {formatTime(recordingTime)}
            </Typography>
          </Box>

          {isProcessing && (
            <Box>
              <Typography variant="body2" gutterBottom>
                正在处理音频...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {transcript && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                转录文本：
              </Typography>
              <Typography variant="body2" sx={{ 
                p: 2, 
                bgcolor: 'grey.100', 
                borderRadius: 1,
                whiteSpace: 'pre-wrap'
              }}>
                {transcript}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 会议列表 */}
      <Typography variant="h6" gutterBottom>
        历史会议
      </Typography>
      
      <Grid container spacing={2}>
        {meetings.map((meeting) => (
          <Grid item xs={12} md={6} key={meeting.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {meeting.title}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteMeeting(meeting.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {meeting.createdAt.toLocaleString()} • 时长: {formatTime(meeting.duration)}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {meeting.summary}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    讨论议题：
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {meeting.topics.map((topic, index) => (
                      <Chip key={index} label={topic} size="small" />
                    ))}
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    行动项：
                  </Typography>
                  <List dense>
                    {meeting.actions.map((action, index) => (
                      <ListItem key={index} sx={{ py: 0 }}>
                        <ListItemText 
                          primary={`• ${action}`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default MeetingPage