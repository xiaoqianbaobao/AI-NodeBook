import axios from 'axios'
import CryptoJS from 'crypto-js'

// 科大讯飞ASR API配置
const XUNFEI_ASR_URL = 'https://iat-api.xfyun.cn/v2/voicedictation'
const XUNFEI_APP_ID = 'your_app_id' // 需要用户配置

// DeepSeek API配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_MODEL = 'deepseek-chat'

export interface XunfeiASRResponse {
  code: number
  message: string
  data: {
    result: {
      ws: Array<{
        bg: number
        cw: Array<{
          sc: number
          w: string
        }>
      }>
    }
  }
}

export interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export class ApiService {
  private xunfeiApiKey: string = ''
  private deepseekApiKey: string = ''

  constructor() {
    // 从本地存储加载API密钥
    this.loadApiKeys()
  }

  private loadApiKeys() {
    const stored = localStorage.getItem('ai-notebook-storage')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        this.xunfeiApiKey = data.state?.apiKeys?.xunfeiApiKey || ''
        this.deepseekApiKey = data.state?.apiKeys?.deepseekApiKey || ''
      } catch (error) {
        console.error('Failed to load API keys:', error)
      }
    }
  }

  setApiKeys(xunfeiKey: string, deepseekKey: string) {
    this.xunfeiApiKey = xunfeiKey
    this.deepseekApiKey = deepseekKey
  }

  // 科大讯飞语音转文字
  async speechToText(audioBlob: Blob): Promise<string> {
    if (!this.xunfeiApiKey) {
      throw new Error('科大讯飞API密钥未配置')
    }

    try {
      // 将音频转换为base64
      const base64Audio = await this.blobToBase64(audioBlob)
      
      // 生成签名
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const signature = this.generateXunfeiSignature(timestamp)
      
      const response = await axios.post<XunfeiASRResponse>(XUNFEI_ASR_URL, {
        common: {
          app_id: XUNFEI_APP_ID
        },
        business: {
          language: 'zh_cn',
          domain: 'iat',
          accent: 'mandarin',
          vinfo: 1,
          vad_eos: 10000
        },
        data: {
          status: 2,
          format: 'audio/L16;rate=16000',
          encoding: 'raw',
          audio: base64Audio
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Appid': XUNFEI_APP_ID,
          'X-CurTime': timestamp,
          'X-Param': btoa(JSON.stringify({
            language: 'zh_cn',
            domain: 'iat',
            accent: 'mandarin',
            vinfo: 1,
            vad_eos: 10000
          })),
          'X-CheckSum': signature
        }
      })

      if (response.data.code === 0) {
        // 解析识别结果
        const result = response.data.data.result.ws
        return result.map(w => w.cw.map(c => c.w).join('')).join('')
      } else {
        throw new Error(`语音识别失败: ${response.data.message}`)
      }
    } catch (error) {
      console.error('Speech to text error:', error)
      throw new Error('语音转文字服务暂时不可用')
    }
  }

  // DeepSeek文本生成（流式）
  async generateTextStream(prompt: string, context?: string, onChunk?: (chunk: string) => void): Promise<string> {
    if (!this.deepseekApiKey) {
      throw new Error('DeepSeek API密钥未配置')
    }

    try {
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt
      
      // 检查是否支持流式输出
      const isStream = !!onChunk;
      
      const response = await axios.post(
        DEEPSEEK_API_URL,
        {
          model: DEEPSEEK_MODEL,
          messages: [
            {
              role: 'user',
              content: fullPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          stream: isStream
        },
        {
          headers: {
            'Authorization': `Bearer ${this.deepseekApiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: isStream ? 'stream' : 'json'
        }
      )

      // 打印响应信息用于调试
      console.log('DeepSeek API response type:', typeof response.data);
      console.log('DeepSeek API response keys:', response.data ? Object.keys(response.data) : 'null');
      
      if (isStream) {
        // 处理流式响应
        let fullResponse = '';
        return new Promise((resolve, reject) => {
          // 检查response.data是否存在且是可读流
          if (!response.data || typeof response.data !== 'object' || !response.data.on) {
            // 如果不是流式响应，但收到的是流式数据格式的字符串，我们需要手动解析
            console.warn('Expected stream response but got:', typeof response.data);
            console.warn('Response data:', response.data);
            
            // 检查是否是流式数据格式的字符串
            if (typeof response.data === 'string' && response.data.includes('data:')) {
              console.log('Detected stream data as string, parsing manually');
              // 手动解析流式数据
              const lines = response.data.split('\n').filter((line: string) => line.trim() !== '');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    resolve(fullResponse);
                    return;
                  }
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content || '';
                    if (content) {
                      fullResponse += content;
                      if (onChunk) {
                        onChunk(content);
                      }
                    }
                  } catch (parseError) {
                    console.warn('Failed to parse stream data:', data);
                  }
                }
              }
              resolve(fullResponse);
              return;
            }
            
            // 检查是否是非流式响应但被误认为是流式响应
            if (response.data && response.data.choices && response.data.choices[0]) {
              console.log('Detected non-stream response in stream mode, returning content directly');
              resolve(response.data.choices[0].message.content);
              return;
            }
            
            const errorMessage = `API响应格式不正确。期望流式响应或标准响应格式，实际响应: ${JSON.stringify(response.data)}`;
            console.error(errorMessage);
            reject(new Error(errorMessage));
            return;
          }
          
          response.data.on('data', (chunk: any) => {
            try {
              const lines = chunk.toString().split('\n').filter((line: string) => line.trim() !== '');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    resolve(fullResponse);
                    return;
                  }
                  // 尝试解析JSON数据
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content || '';
                    if (content) {
                      fullResponse += content;
                      if (onChunk) {
                        onChunk(content);
                      }
                    }
                  } catch (parseError) {
                    // 如果不是JSON格式，跳过该行
                    console.warn('Failed to parse stream data:', data);
                  }
                }
              }
            } catch (error) {
              console.error('Stream processing error:', error);
              console.error('Error stack:', error.stack);
            }
          });

          response.data.on('end', () => {
            resolve(fullResponse);
          });

          response.data.on('error', (error: any) => {
            console.error('Stream error:', error);
            console.error('Error stack:', error.stack);
            reject(new Error('流式输出发生错误'));
          });
        });
      } else {
        // 非流式响应
        // 打印完整的响应数据用于调试
        console.log('DeepSeek API non-stream response:', JSON.stringify(response.data, null, 2));
        
        // 更灵活的响应检查
        if (response.data) {
          // 检查标准响应格式
          if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
            return response.data.choices[0].message.content;
          }
          // 检查是否有直接的内容字段
          if (response.data.content) {
            return response.data.content;
          }
          // 检查是否有其他可能的内容字段
          if (typeof response.data === 'string') {
            return response.data;
          }
        }
        
        // 更详细的错误信息
        const errorMessage = `API响应格式不正确。期望格式: { choices: [{ message: { content: "..." } }] }, 实际响应: ${JSON.stringify(response.data)}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('DeepSeek API error:', error.message || error);
      console.error('Error stack:', error.stack);
      if (error.response) {
        console.error('API response error:', error.response.status, JSON.stringify(error.response.data, null, 2));
        throw new Error(`API请求失败: ${error.response.status} - ${error.response.data?.error?.message || '未知错误'}`);
      } else if (error.request) {
        throw new Error('网络连接错误，请检查网络设置');
      } else {
        throw new Error(`请求配置错误: ${error.message}`);
      }
    }
  }

  // DeepSeek文本生成（兼容旧版本）
  async generateText(prompt: string, context?: string): Promise<string> {
    try {
      return await this.generateTextStream(prompt, context);
    } catch (error) {
      // 如果流式输出失败，回退到非流式输出
      console.warn('流式输出失败，回退到非流式输出:', error);
      return this.generateTextFallback(prompt, context);
    }
  }

  // 非流式输出的备用方法
  private async generateTextFallback(prompt: string, context?: string): Promise<string> {
    if (!this.deepseekApiKey) {
      throw new Error('DeepSeek API密钥未配置')
    }

    try {
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt
      
      const response = await axios.post(
        DEEPSEEK_API_URL,
        {
          model: DEEPSEEK_MODEL,
          messages: [
            {
              role: 'user',
              content: fullPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.deepseekApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      // 打印完整的响应数据用于调试
      console.log('DeepSeek API response:', JSON.stringify(response.data, null, 2));
      
      // 更灵活的响应检查
      if (response.data) {
        // 检查标准响应格式
        if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
          return response.data.choices[0].message.content;
        }
        // 检查是否有直接的内容字段
        if (response.data.content) {
          return response.data.content;
        }
        // 检查是否有其他可能的内容字段
        if (typeof response.data === 'string') {
          return response.data;
        }
      }
      
      // 更详细的错误信息
      const errorMessage = `API响应格式不正确。期望格式: { choices: [{ message: { content: "..." } }] }, 实际响应: ${JSON.stringify(response.data)}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    } catch (error: any) {
      console.error('DeepSeek API fallback error:', error.message || error);
      console.error('Error stack:', error.stack);
      if (error.response) {
        console.error('API response error:', error.response.status, JSON.stringify(error.response.data, null, 2));
        throw new Error(`API请求失败: ${error.response.status} - ${error.response.data?.error?.message || '未知错误'}`);
      } else if (error.request) {
        throw new Error('网络连接错误，请检查网络设置');
      } else {
        throw new Error(`请求配置错误: ${error.message}`);
      }
    }
  }

  // 生成会议纪要
  async generateMeetingSummary(transcript: string): Promise<{
    summary: string
    topics: string[]
    actions: string[]
  }> {
    const prompt = `请分析以下会议转录文本，生成结构化的会议纪要：

转录内容：
${transcript}

请按照以下JSON格式输出：
{
  "summary": "会议摘要（2-3句话）",
  "topics": ["讨论议题1", "讨论议题2", "讨论议题3"],
  "actions": ["行动项1", "行动项2", "行动项3"]
}`

    try {
      const response = await this.generateText(prompt)
      
      // 尝试解析JSON响应
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          summary: parsed.summary || '会议摘要生成失败',
          topics: parsed.topics || [],
          actions: parsed.actions || []
        }
      } else {
        // 如果无法解析JSON，返回默认格式
        return {
          summary: response.substring(0, 200) + '...',
          topics: ['会议讨论'],
          actions: ['待定行动项']
        }
      }
    } catch (error) {
      console.error('Meeting summary generation error:', error)
      return {
        summary: '会议纪要生成失败',
        topics: ['会议讨论'],
        actions: ['待定行动项']
      }
    }
  }

  // 生成笔记摘要
  async generateNoteSummary(content: string): Promise<{
    summary: string
    keyPoints: string[]
  }> {
    const prompt = `请为以下内容生成摘要和关键点：

内容：
${content}

请按照以下JSON格式输出：
{
  "summary": "内容摘要（2-3句话）",
  "keyPoints": ["关键点1", "关键点2", "关键点3", "关键点4", "关键点5"]
}`

    try {
      const response = await this.generateText(prompt)
      
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          summary: parsed.summary || content.substring(0, 100) + '...',
          keyPoints: parsed.keyPoints || []
        }
      } else {
        return {
          summary: response.substring(0, 200) + '...',
          keyPoints: content.split('。').slice(0, 5).filter(p => p.trim())
        }
      }
    } catch (error) {
      console.error('Note summary generation error:', error)
      return {
        summary: content.substring(0, 100) + '...',
        keyPoints: content.split('。').slice(0, 5).filter(p => p.trim())
      }
    }
  }

  // 生成闪卡
  async generateFlashcards(content: string, count: number = 5): Promise<Array<{
    question: string
    answer: string
  }>> {
    const prompt = `基于以下内容生成${count}张学习闪卡：

内容：
${content}

请按照以下JSON格式输出：
{
  "cards": [
    {"question": "问题1", "answer": "答案1"},
    {"question": "问题2", "answer": "答案2"}
  ]
}`

    try {
      const response = await this.generateText(prompt)
      
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return parsed.cards || []
      } else {
        // 生成默认闪卡
        return [
          { question: '主要内容是什么？', answer: content.substring(0, 100) + '...' },
          { question: '关键概念有哪些？', answer: '请查看详细内容' }
        ]
      }
    } catch (error) {
      console.error('Flashcard generation error:', error)
      return [
        { question: '主要内容是什么？', answer: content.substring(0, 100) + '...' }
      ]
    }
  }

  // AI答疑
  async askQuestion(question: string, context: string): Promise<string> {
    const prompt = `基于以下上下文回答问题：

上下文：
${context}

问题：${question}

请提供详细、准确的回答：`

    try {
      return await this.generateText(prompt, context)
    } catch (error) {
      console.error('AI Q&A error:', error)
      return '抱歉，AI助手暂时无法回答您的问题。'
    }
  }

  // 工具方法
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // 移除data:audio/wav;base64,前缀
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  private generateXunfeiSignature(timestamp: string): string {
    // 科大讯飞签名算法实现
    const param = btoa(JSON.stringify({
      language: 'zh_cn',
      domain: 'iat',
      accent: 'mandarin',
      vinfo: 1,
      vad_eos: 10000
    }))
    
    // 使用HMAC-SHA256生成签名
    const stringToSign = `${XUNFEI_APP_ID}${timestamp}${param}`
    const signature = CryptoJS.HmacSHA256(stringToSign, this.xunfeiApiKey).toString(CryptoJS.enc.Base64)
    return signature
  }

  // 测试API连接
  async testXunfeiConnection(): Promise<boolean> {
    try {
      // 模拟API测试
      await new Promise(resolve => setTimeout(resolve, 1000))
      return !!this.xunfeiApiKey
    } catch (error) {
      return false
    }
  }

  async testDeepseekConnection(): Promise<boolean> {
    try {
      // 模拟API测试
      await new Promise(resolve => setTimeout(resolve, 1000))
      return !!this.deepseekApiKey
    } catch (error) {
      return false
    }
  }
}

export const apiService = new ApiService()