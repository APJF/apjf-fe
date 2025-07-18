"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/Avatar"
import { Button } from "../ui/Button"
import { Loader2, Upload } from "lucide-react"

interface AvatarUploadProps {
  readonly url: string | null
  readonly onUpload: (filePath: string) => void
}

export default function AvatarUpload({ url, onUpload }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const downloadImage = useCallback(async () => {
    try {
      setAvatarUrl(url)
    } catch (error) {
      console.error("Error downloading image: ", (error as Error).message)
      setAvatarUrl(null) // Clear avatar if download fails
    }
  }, [url])

  useEffect(() => {
    if (url) downloadImage()
  }, [url, downloadImage])

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Bạn phải chọn một hình ảnh để tải lên.")
      }

      const file = event.target.files[0]
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      onUpload(filePath) // Notify parent component of new file path
      alert("Tải ảnh đại diện thành công!")
    } catch (error) {
      alert((error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg shadow-sm">
      <Avatar className="w-32 h-32 border-4 border-red-500">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl || "/placeholder.svg"} alt="Ảnh đại diện" />
        ) : (
          <AvatarFallback className="bg-red-100 text-red-700 text-4xl font-bold">JD</AvatarFallback>
        )}
      </Avatar>
      <div className="relative">
        <input
          type="file"
          id="single"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label="Tải lên ảnh đại diện"
        />
        <Button asChild className="bg-red-500 hover:bg-red-600 text-white" disabled={uploading}>
          <label htmlFor="single" className="flex items-center gap-2 cursor-pointer">
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tải lên...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Tải ảnh đại diện
              </>
            )}
          </label>
        </Button>
      </div>
    </div>
  )
}
