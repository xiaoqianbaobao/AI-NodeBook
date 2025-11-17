import React, { useState, useRef } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material'
import {
  Upload as UploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  VideoLibrary as VideoIcon,
  Description as PdfIcon,
  TextFields as TextIcon,
  School as SchoolIcon
} from '@mui/icons-material'
import { useAppStore } from '../store/appStore'
import { Note } from '../store/appStore'
import { apiService } from '../services/apiService'
import { Flashcard } from '../store/appStore'

const NotesPage: React.FC = () => {
  const { notes, addNote, updateNote, deleteNote, addFlashcard } = useAppStore()
  const [tabValue, setTabValue] = useState(0)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [bilibiliUrl, setBilibiliUrl] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [pdfContent, setPdfContent] = useState('') // 用于存储PDF内容
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  // PDF文件解析函数
  const parsePDF = async (file: File): Promise<string> => {
    try {
      // 使用fetch获取CDN上的pdf.js库
      const pdfjsScript = document.createElement('script');
      pdfjsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      
      // 等待脚本加载完成
      await new Promise((resolve, reject) => {
        pdfjsScript.onload = resolve;
        pdfjsScript.onerror = reject;
        document.head.appendChild(pdfjsScript);
      });
      
      // 获取全局pdfjsLib对象
      const pdfjsLib = (window as any).pdfjsLib;
      
      // 设置worker路径
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      
      // 读取文件为ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // 加载PDF文档
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let content = '';
      
      // 逐页提取文本内容
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        content += pageText + '\n\n';
      }
      
      return content;
    } catch (error) {
      console.error('PDF parsing error:', error);
      // 如果PDF解析失败，返回文件基本信息
      return `PDF文件: ${file.name}\n大小: ${(file.size / 1024 / 1024).toFixed(2)} MB\n\n注意: PDF内容解析失败，请检查文件格式。`;
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setError('')

    try {
      let content = '';
      let type: 'pdf' | 'text' = 'text';
      
      if (file.type.includes('pdf')) {
        // 处理PDF文件
        type = 'pdf';
        content = await parsePDF(file);
        setPdfContent(content); // 保存PDF内容用于生成闪卡
      } else {
        // 处理文本文件
        content = await file.text();
      }
      
      const note: Note = {
        id: Date.now().toString(),
        title: file.name,
        content: content,
        type: type,
        createdAt: new Date(),
        updatedAt: new Date(),
        summary: `这是从 ${file.name} 提取的内容摘要`,
        keyPoints: ['关键点1', '关键点2', '关键点3']
      }

      addNote(note)
    } catch (err) {
      setError('文件处理失败')
      console.error('File processing error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  // 基于PDF内容生成闪卡
  const generateFlashcardsFromPDF = async (content: string, noteId: string) => {
    try {
      setIsProcessing(true);
      const flashcards = await apiService.generateFlashcards(content, 5);
      
      // 添加生成的闪卡到存储中
      flashcards.forEach((card, index) => {
        const flashcard: Flashcard = {
          id: `${noteId}-card-${index}`,
          question: card.question,
          answer: card.answer,
          category: 'PDF笔记',
          difficulty: 'medium',
          reviewCount: 0,
          correctCount: 0
        };
        addFlashcard(flashcard);
      });
      
      return flashcards.length;
    } catch (error) {
      console.error('Flashcard generation error:', error);
      throw new Error('生成闪卡失败');
    } finally {
      setIsProcessing(false);
    }
  }

  const handleBilibiliProcess = async () => {
    if (!bilibiliUrl.trim()) return

    setIsProcessing(true)
    setError('')

    try {
      // 模拟Bilibili视频处理
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const note: Note = {
        id: Date.now().toString(),
        title: `Bilibili视频笔记 - ${new Date().toLocaleDateString()}`,
        content: `视频链接: ${bilibiliUrl}\n\n这是从Bilibili视频提取的转录内容。在实际实现中，这里会调用Bilibili API获取字幕或使用ASR进行转录。`,
        type: 'video',
        createdAt: new Date(),
        updatedAt: new Date(),
        summary: 'Bilibili视频内容摘要',
        keyPoints: ['视频要点1', '视频要点2', '视频要点3']
      }

      addNote(note)
      setBilibiliUrl('')
    } catch (err) {
      setError('视频处理失败')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTextNote = async () => {
    if (!noteContent.trim() || !noteTitle.trim()) return

    setIsProcessing(true)
    try {
      // 使用AI生成摘要和关键点
      const summary = await apiService.generateNoteSummary(noteContent)
      
      const note: Note = {
        id: Date.now().toString(),
        title: noteTitle,
        content: noteContent,
        type: 'text',
        createdAt: new Date(),
        updatedAt: new Date(),
        summary: summary.summary,
        keyPoints: summary.keyPoints
      }

      addNote(note)
      setNoteTitle('')
      setNoteContent('')
    } catch (error) {
      console.error('Error generating note summary:', error)
      // 如果AI生成失败，使用简单摘要
      const note: Note = {
        id: Date.now().toString(),
        title: noteTitle,
        content: noteContent,
        type: 'text',
        createdAt: new Date(),
        updatedAt: new Date(),
        summary: noteContent.substring(0, 100) + '...',
        keyPoints: noteContent.split('。').slice(0, 3).filter(p => p.trim())
      }

      addNote(note)
      setNoteTitle('')
      setNoteContent('')
    } finally {
      setIsProcessing(false)
    }
  }

  // 为PDF笔记生成闪卡
  const handleGenerateFlashcards = async (note: Note) => {
    if (note.type !== 'pdf') return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      const count = await generateFlashcardsFromPDF(note.content, note.id);
      alert(`成功生成 ${count} 张闪卡！`);
    } catch (err) {
      setError('生成闪卡失败');
      console.error('Flashcard generation error:', err);
    } finally {
      setIsProcessing(false);
    }
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setOpenDialog(true)
  }

  const handleSaveEdit = () => {
    if (editingNote) {
      updateNote(editingNote.id, {
        title: editingNote.title,
        content: editingNote.content
      })
      setOpenDialog(false)
      setEditingNote(null)
    }
  }

  const handleDeleteNote = (id: string) => {
    deleteNote(id)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <PdfIcon />
      case 'video': return <VideoIcon />
      default: return <TextIcon />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'error'
      case 'video': return 'primary'
      default: return 'default'
    }
  }

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        笔记管理
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="上传文件" />
          <Tab label="Bilibili视频" />
          <Tab label="文本笔记" />
        </Tabs>
      </Box>

      {/* 上传文件标签页 */}
      {tabValue === 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              上传PDF文件
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              选择PDF文件
            </Button>
            {isProcessing && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  正在处理文件...
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bilibili视频标签页 */}
      {tabValue === 1 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Bilibili视频处理
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Bilibili视频链接"
                value={bilibiliUrl}
                onChange={(e) => setBilibiliUrl(e.target.value)}
                placeholder="https://www.bilibili.com/video/..."
              />
              <Button
                variant="contained"
                onClick={handleBilibiliProcess}
                disabled={isProcessing || !bilibiliUrl.trim()}
              >
                处理视频
              </Button>
            </Box>
            {isProcessing && (
              <Box>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  正在提取视频内容...
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* 文本笔记标签页 */}
      {tabValue === 2 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              创建文本笔记
            </Typography>
            <TextField
              fullWidth
              label="笔记标题"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={6}
              label="笔记内容"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleTextNote}
              disabled={!noteTitle.trim() || !noteContent.trim()}
            >
              创建笔记
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 笔记列表 */}
      <Typography variant="h6" gutterBottom>
        我的笔记 ({notes.length})
      </Typography>

      <Grid container spacing={2}>
        {notes.map((note) => (
          <Grid item xs={12} md={6} lg={4} key={note.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getTypeIcon(note.type)}
                    <Typography variant="h6" component="div">
                      {note.title}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleEditNote(note)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteNote(note.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Chip
                  label={note.type.toUpperCase()}
                  color={getTypeColor(note.type) as any}
                  size="small"
                  sx={{ mb: 2 }}
                />

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {note.createdAt.toLocaleString()}
                </Typography>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  {note.summary}
                </Typography>

                {note.keyPoints && note.keyPoints.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      关键点：
                    </Typography>
                    <List dense>
                      {note.keyPoints.map((point, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemText 
                            primary={`• ${point}`}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                
                {note.type === 'pdf' && (
                  <Button
                    variant="outlined"
                    startIcon={<SchoolIcon />}
                    onClick={() => handleGenerateFlashcards(note)}
                    disabled={isProcessing}
                    fullWidth
                    sx={{ mt: 1 }}
                  >
                    生成闪卡
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 编辑对话框 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>编辑笔记</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="标题"
            value={editingNote?.title || ''}
            onChange={(e) => setEditingNote(prev => prev ? { ...prev, title: e.target.value } : null)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            multiline
            rows={10}
            label="内容"
            value={editingNote?.content || ''}
            onChange={(e) => setEditingNote(prev => prev ? { ...prev, content: e.target.value } : null)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>取消</Button>
          <Button onClick={handleSaveEdit} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default NotesPage