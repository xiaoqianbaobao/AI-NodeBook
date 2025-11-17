import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  sidebarOpen: boolean
  currentPage: string
  apiKeys: {
    xunfeiApiKey: string
    deepseekApiKey: string
  }
  notes: Note[]
  meetings: Meeting[]
  flashcards: Flashcard[]
  setSidebarOpen: (open: boolean) => void
  setCurrentPage: (page: string) => void
  setApiKeys: (keys: Partial<AppState['apiKeys']>) => void
  addNote: (note: Note) => void
  addMeeting: (meeting: Meeting) => void
  addFlashcard: (card: Flashcard) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  updateMeeting: (id: string, updates: Partial<Meeting>) => void
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => void
  deleteNote: (id: string) => void
  deleteMeeting: (id: string) => void
  deleteFlashcard: (id: string) => void
}

export interface Note {
  id: string
  title: string
  content: string
  type: 'pdf' | 'video' | 'text'
  createdAt: Date
  updatedAt: Date
  summary?: string
  keyPoints?: string[]
}

export interface Meeting {
  id: string
  title: string
  audioPath?: string
  transcript: string
  summary: string
  topics: string[]
  actions: string[]
  createdAt: Date
  duration: number
}

export interface Flashcard {
  id: string
  question: string
  answer: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  lastReviewed?: Date
  reviewCount: number
  correctCount: number
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      currentPage: 'meeting',
      apiKeys: {
        xunfeiApiKey: '',
        deepseekApiKey: 'sk-47456d1b61924975b53c6e7185407b56'
      },
      notes: [],
      meetings: [],
      flashcards: [],
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setCurrentPage: (page) => set({ currentPage: page }),
      
      setApiKeys: (keys) => set((state) => ({
        apiKeys: { ...state.apiKeys, ...keys }
      })),
      
      addNote: (note) => set((state) => ({
        notes: [...state.notes, note]
      })),
      
      addMeeting: (meeting) => set((state) => ({
        meetings: [...state.meetings, meeting]
      })),
      
      addFlashcard: (card) => set((state) => ({
        flashcards: [...state.flashcards, card]
      })),
      
      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
        )
      })),
      
      updateMeeting: (id, updates) => set((state) => ({
        meetings: state.meetings.map(meeting => 
          meeting.id === id ? { ...meeting, ...updates } : meeting
        )
      })),
      
      updateFlashcard: (id, updates) => set((state) => ({
        flashcards: state.flashcards.map(card => 
          card.id === id ? { ...card, ...updates } : card
        )
      })),
      
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter(note => note.id !== id)
      })),
      
      deleteMeeting: (id) => set((state) => ({
        meetings: state.meetings.filter(meeting => meeting.id !== id)
      })),
      
      deleteFlashcard: (id) => set((state) => ({
        flashcards: state.flashcards.filter(card => card.id !== id)
      }))
    }),
    {
      name: 'ai-notebook-storage',
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        notes: state.notes,
        meetings: state.meetings,
        flashcards: state.flashcards
      })
    }
  )
)