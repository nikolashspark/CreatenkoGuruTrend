import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'

interface FileUploadProps {
  label: string
  onFileSelect: (file: File | null) => void
  acceptedFile?: File | null
} 

const FileUpload = ({ label, onFileSelect, acceptedFile }: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      onFileSelect(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelect(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    onFileSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div
        className={`file-upload-area ${
          isDragOver ? 'border-primary-500 bg-primary-50' : ''
        } ${acceptedFile ? 'border-green-500 bg-green-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInput}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        
        {acceptedFile ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2">
              <Upload className="w-8 h-8 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                {acceptedFile.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove()
                }}
                className="p-1 hover:bg-red-100 rounded-full"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
            <span className="text-xs text-gray-500">
              Натисніть для зміни файлу
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <div className="text-sm text-gray-600">
              <span className="font-medium">Натисніть для завантаження</span>
              <p className="text-xs text-gray-500 mt-1">
                або перетягніть файл сюди
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FileUpload
