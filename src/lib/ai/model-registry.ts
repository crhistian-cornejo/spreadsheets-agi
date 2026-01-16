export type ProviderId = 'openai' | 'google'

export type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high'

export interface ModelCapabilities {
  id: string
  label: string
  provider: ProviderId
  apiModel: string
  reasoningEfforts: Array<ReasoningEffort>
  inputModalities?: Array<'text' | 'image' | 'document'>
  enabled?: boolean
}

export const MODEL_REGISTRY: Array<ModelCapabilities> = [
  {
    id: 'openai:gpt-5.2',
    label: 'GPT-5.2',
    provider: 'openai',
    apiModel: 'gpt-5.2',
    reasoningEfforts: ['none', 'minimal', 'low', 'medium', 'high'],
    inputModalities: ['text', 'image', 'document'],
  },
  {
    id: 'openai:gpt-5.1',
    label: 'GPT-5.1',
    provider: 'openai',
    apiModel: 'gpt-5.1',
    reasoningEfforts: ['none', 'minimal', 'low', 'medium', 'high'],
    inputModalities: ['text', 'image', 'document'],
  },
  {
    id: 'openai:gpt-5-mini',
    label: 'GPT-5 Mini',
    provider: 'openai',
    apiModel: 'gpt-5-mini',
    reasoningEfforts: ['none', 'minimal', 'low', 'medium', 'high'],
    inputModalities: ['text', 'image', 'document'],
  },
  {
    id: 'openai:gpt-5-nano',
    label: 'GPT-5 Nano',
    provider: 'openai',
    apiModel: 'gpt-5-nano',
    reasoningEfforts: ['minimal', 'low', 'medium', 'high'],
    inputModalities: ['text'],
  },
  {
    id: 'google:gemini-3-flash',
    label: 'Gemini 3 Flash',
    provider: 'google',
    apiModel: 'gemini-3-flash',
    reasoningEfforts: ['minimal', 'low', 'medium', 'high'],
    inputModalities: ['text', 'image', 'document'],
    enabled: false,
  },
  {
    id: 'google:gemini-3-pro',
    label: 'Gemini 3 Pro',
    provider: 'google',
    apiModel: 'gemini-3-pro',
    reasoningEfforts: ['minimal', 'low', 'medium', 'high'],
    inputModalities: ['text', 'image', 'document'],
    enabled: false,
  },
]

export const DEFAULT_MODEL_ID = 'openai:gpt-5-nano'

export function getModelById(id: string): ModelCapabilities {
  return MODEL_REGISTRY.find((model) => model.id === id) || MODEL_REGISTRY[0]
}

export function isModelEnabled(id: string): boolean {
  return getModelById(id).enabled !== false
}

export function getReasoningEfforts(modelId: string): Array<ReasoningEffort> {
  return getModelById(modelId).reasoningEfforts
}
