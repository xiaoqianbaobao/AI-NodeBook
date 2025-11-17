import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  Fab
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Quiz as QuizIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Close as WrongIcon
} from '@mui/icons-material'
import { useAppStore } from '../store/appStore'
import { Flashcard } from '../store/appStore'
import { apiService } from '../services/apiService'

const LearningPage: React.FC = () => {
  const { flashcards, addFlashcard, updateFlashcard, deleteFlashcard } = useAppStore()
  const [tabValue, setTabValue] = useState(0)
  const [openCardDialog, setOpenCardDialog] = useState(false)
  const [openQuizDialog, setOpenQuizDialog] = useState(false)
  const [openChatDialog, setOpenChatDialog] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 })
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai', content: string }>>([])
  
  const [newCard, setNewCard] = useState({
    question: '',
    answer: '',
    category: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
  })

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleCreateCard = () => {
    if (!newCard.question.trim() || !newCard.answer.trim()) return

    const card: Flashcard = {
      id: Date.now().toString(),
      question: newCard.question,
      answer: newCard.answer,
      category: newCard.category || '未分类',
      difficulty: newCard.difficulty,
      reviewCount: 0,
      correctCount: 0
    }

    addFlashcard(card)
    setNewCard({ question: '', answer: '', category: '', difficulty: 'medium' })
    setOpenCardDialog(false)
  }

  const handleEditCard = (card: Flashcard) => {
    setEditingCard(card)
    setOpenCardDialog(true)
  }

  const handleSaveEdit = () => {
    if (editingCard) {
      updateFlashcard(editingCard.id, editingCard)
      setOpenCardDialog(false)
      setEditingCard(null)
    }
  }

  const handleDeleteCard = (id: string) => {
    deleteFlashcard(id)
  }

  const startQuiz = () => {
    if (flashcards.length === 0) return
    setCurrentCardIndex(0)
    setShowAnswer(false)
    setQuizScore({ correct: 0, total: 0 })
    setOpenQuizDialog(true)
  }

  const handleQuizAnswer = (isCorrect: boolean) => {
    const card = flashcards[currentCardIndex]
    if (card) {
      updateFlashcard(card.id, {
        reviewCount: card.reviewCount + 1,
        correctCount: card.correctCount + (isCorrect ? 1 : 0),
        lastReviewed: new Date()
      })
    }

    setQuizScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }))

    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1)
      setShowAnswer(false)
    } else {
      // 测验结束
      setTimeout(() => {
        setOpenQuizDialog(false)
      }, 2000)
    }
  }

  const handleChatSubmit = async () => {
    if (!chatMessage.trim()) return

    const userMessage = chatMessage
    setChatMessage('')
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      // 添加AI回复占位符
      setChatHistory(prev => [...prev, { role: 'ai', content: '' }])
      
      // 调用DeepSeek API进行AI答疑（流式输出）
      const context = flashcards.map(card => `Q: ${card.question}\nA: ${card.answer}`).join('\n\n')
      
      let fullResponse = '';
      await apiService.generateTextStream(
        `基于以下上下文回答问题：\n\n上下文：\n${context}\n\n问题：${userMessage}\n请提供详细、准确的回答：`,
        undefined,
        (chunk) => {
          // 流式更新AI回复
          fullResponse += chunk;
          setChatHistory(prev => {
            const newHistory = [...prev];
            const lastIndex = newHistory.length - 1;
            if (newHistory[lastIndex].role === 'ai') {
              // 转义HTML特殊字符以防止XSS攻击
              const escapedContent = fullResponse
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
              newHistory[lastIndex] = { ...newHistory[lastIndex], content: escapedContent };
            }
            return newHistory;
          });
        }
      );
    } catch (error: any) {
      console.error('AI chat error:', error)
      // 如果API调用失败，显示具体错误信息
      const aiResponse = `抱歉，AI助手暂时无法回答您的问题。错误信息：${error.message || '未知错误'}`
      setChatHistory(prev => {
        const newHistory = [...prev];
        const lastIndex = newHistory.length - 1;
        if (newHistory[lastIndex].role === 'ai') {
          newHistory[lastIndex] = { ...newHistory[lastIndex], content: aiResponse };
        }
        return newHistory;
      });
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success'
      case 'medium': return 'warning'
      case 'hard': return 'error'
      default: return 'default'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单'
      case 'medium': return '中等'
      case 'hard': return '困难'
      default: return '未知'
    }
  }

  const currentCard = flashcards[currentCardIndex]
  const progress = flashcards.length > 0 ? ((currentCardIndex + 1) / flashcards.length) * 100 : 0

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        学习训练
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="闪卡管理" />
          <Tab label="出题训练" />
          <Tab label="AI助手" />
        </Tabs>
      </Box>

      {/* 闪卡管理标签页 */}
      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              我的闪卡 ({flashcards.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCardDialog(true)}
            >
              创建闪卡
            </Button>
          </Box>

          <Grid container spacing={2}>
            {flashcards.map((card) => (
              <Grid item xs={12} md={6} lg={4} key={card.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Typography variant="h6" component="div">
                        {card.question}
                      </Typography>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleEditCard(card)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteCard(card.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={card.category}
                        size="small"
                        color="primary"
                      />
                      <Chip
                        label={getDifficultyText(card.difficulty)}
                        size="small"
                        color={getDifficultyColor(card.difficulty) as any}
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      复习次数: {card.reviewCount} | 正确率: {card.reviewCount > 0 ? Math.round((card.correctCount / card.reviewCount) * 100) : 0}%
                    </Typography>

                    <Typography variant="body2" sx={{ 
                      p: 2, 
                      bgcolor: 'grey.100', 
                      borderRadius: 1,
                      minHeight: 60,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {card.answer}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* 出题训练标签页 */}
      {tabValue === 1 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                出题训练
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                基于你的闪卡进行训练，提高记忆效果
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SchoolIcon />}
                  onClick={startQuiz}
                  disabled={flashcards.length === 0}
                  size="large"
                >
                  开始训练 ({flashcards.length} 张卡片)
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* 训练统计 */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    {flashcards.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    总卡片数
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {flashcards.filter(card => card.reviewCount > 0).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    已复习
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    {flashcards.length > 0 ? Math.round(flashcards.reduce((acc, card) => 
                      acc + (card.reviewCount > 0 ? (card.correctCount / card.reviewCount) * 100 : 0), 0) / flashcards.length) : 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    平均正确率
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* AI助手标签页 */}
      {tabValue === 2 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI学习助手
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                基于你的笔记内容进行智能答疑
              </Typography>
              <Button
                variant="contained"
                startIcon={<ChatIcon />}
                onClick={() => setOpenChatDialog(true)}
                size="large"
              >
                开始对话
              </Button>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* 创建/编辑闪卡对话框 */}
      <Dialog open={openCardDialog} onClose={() => setOpenCardDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCard ? '编辑闪卡' : '创建闪卡'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="问题"
            value={editingCard?.question || newCard.question}
            onChange={(e) => {
              if (editingCard) {
                setEditingCard({ ...editingCard, question: e.target.value })
              } else {
                setNewCard({ ...newCard, question: e.target.value })
              }
            }}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="答案"
            value={editingCard?.answer || newCard.answer}
            onChange={(e) => {
              if (editingCard) {
                setEditingCard({ ...editingCard, answer: e.target.value })
              } else {
                setNewCard({ ...newCard, answer: e.target.value })
              }
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="分类"
            value={editingCard?.category || newCard.category}
            onChange={(e) => {
              if (editingCard) {
                setEditingCard({ ...editingCard, category: e.target.value })
              } else {
                setNewCard({ ...newCard, category: e.target.value })
              }
            }}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenCardDialog(false)
            setEditingCard(null)
            setNewCard({ question: '', answer: '', category: '', difficulty: 'medium' })
          }}>
            取消
          </Button>
          <Button onClick={editingCard ? handleSaveEdit : handleCreateCard} variant="contained">
            {editingCard ? '保存' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 出题训练对话框 */}
      <Dialog open={openQuizDialog} onClose={() => setOpenQuizDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          出题训练
          <IconButton
            onClick={() => setOpenQuizDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {currentCard && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {currentCardIndex + 1} / {flashcards.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  正确率: {quizScore.total > 0 ? Math.round((quizScore.correct / quizScore.total) * 100) : 0}%
                </Typography>
              </Box>
              
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ mb: 3 }}
              />

              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    问题:
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {currentCard.question}
                  </Typography>
                  
                  {showAnswer ? (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        答案:
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 3 }}>
                        {currentCard.answer}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => handleQuizAnswer(true)}
                        >
                          答对了
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<WrongIcon />}
                          onClick={() => handleQuizAnswer(false)}
                        >
                          答错了
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={() => setShowAnswer(true)}
                      fullWidth
                    >
                      显示答案
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* AI助手对话框 */}
      <Dialog open={openChatDialog} onClose={() => setOpenChatDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          AI学习助手
          <IconButton
            onClick={() => setOpenChatDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: 400, overflow: 'auto', mb: 2 }}>
            {chatHistory.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2,
                  width: '100%'
                }}
              >
                <Card
                  sx={{
                    maxWidth: '70%',
                    bgcolor: message.role === 'user' ? 'primary.main' : 'grey.100',
                    color: message.role === 'user' ? 'white' : 'text.primary',
                    wordBreak: 'break-word'
                  }}
                >
                  <CardContent sx={{ py: 1 }}>
                    {message.role === 'ai' ? (
                      <div dangerouslySetInnerHTML={{ 
                        __html: message.content
                          .replace(/&/g, '&amp;')
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;')
                          .replace(/\n/g, '<br />')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/`(.*?)`/g, '<code style="background-color: #e0e0e0; padding: 2px 4px; border-radius: 3px;">$1</code>')
                      }} />
                    ) : (
                      <Typography variant="body2">
                        {message.content}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="输入你的问题..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
            />
            <Button
              variant="contained"
              onClick={handleChatSubmit}
              disabled={!chatMessage.trim()}
            >
              发送
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default LearningPage