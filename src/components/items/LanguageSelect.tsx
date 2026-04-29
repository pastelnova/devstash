'use client'

import { PROGRAMMING_LANGUAGES, type ProgrammingLanguage } from '@/lib/programming-languages'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface LanguageSelectProps {
  value?: string
  onChange: (value: string | null) => void
  placeholder?: string
}

export function LanguageSelect({ value, onChange, placeholder = "Select language..." }: LanguageSelectProps) {
  const selectedLanguage = PROGRAMMING_LANGUAGES.find(lang => lang.value === value)

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>
          {selectedLanguage?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PROGRAMMING_LANGUAGES.map((language) => (
          <SelectItem key={language.value} value={language.value}>
            {language.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}