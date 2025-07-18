"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card"
import { Input } from "../ui/Input"
import { Label } from "../ui/Label"
import { Button } from "../ui/Button"

export default function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmNewPassword) {
      alert("Mật khẩu mới và xác nhận mật khẩu không khớp.")
      return
    }
    // In a real application, you would send these to your backend for validation and update
    console.log("Đổi mật khẩu:", { currentPassword, newPassword })
    alert("Yêu cầu đổi mật khẩu đã được gửi. (Chức năng này chỉ là mô phỏng)")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmNewPassword("")
  }

  return (
    <Card className="w-full max-w-lg border-red-100 shadow-md">
      <CardHeader className="bg-red-500 text-white rounded-t-lg">
        <CardTitle className="text-2xl">Đổi mật khẩu</CardTitle>
        <CardDescription className="text-red-100">Đảm bảo mật khẩu của bạn đủ mạnh và dễ nhớ.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="current-password" className="text-red-700">
              Mật khẩu hiện tại
            </Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
              className="border-red-200 focus:border-red-500 focus-visible:ring-red-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-red-700">
              Mật khẩu mới
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
              className="border-red-200 focus:border-red-500 focus-visible:ring-red-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-new-password" className="text-red-700">
              Xác nhận mật khẩu mới
            </Label>
            <Input
              id="confirm-new-password"
              type="password"
              value={confirmNewPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmNewPassword(e.target.value)}
              className="border-red-200 focus:border-red-500 focus-visible:ring-red-500"
            />
          </div>
          <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white">
            Đổi mật khẩu
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
