"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card"
import { Input } from "../ui/Input"
import { Label } from "../ui/Label"
import { Button } from "../ui/Button"

interface ProfileDetailsFormProps {
  readonly initialEmail: string
  readonly initialAddress: string
  readonly initialPhone: string
  readonly onSave: (data: { email: string; address: string; phone: string }) => void
}

export default function ProfileDetailsForm({
  initialEmail,
  initialAddress,
  initialPhone,
  onSave,
}: ProfileDetailsFormProps) {
  const [email, setEmail] = useState(initialEmail)
  const [address, setAddress] = useState(initialAddress)
  const [phone, setPhone] = useState(initialPhone)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ email, address, phone })
    alert("Thông tin hồ sơ đã được cập nhật!")
  }

  return (
    <Card className="w-full max-w-lg border-red-100 shadow-md">
      <CardHeader className="bg-red-500 text-white rounded-t-lg">
        <CardTitle className="text-2xl">Thông tin cá nhân</CardTitle>
        <CardDescription className="text-red-100">Cập nhật chi tiết hồ sơ của bạn.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-red-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className="border-red-200 focus:border-red-500 focus-visible:ring-red-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="text-red-700">
              Địa chỉ
            </Label>
            <Input
              id="address"
              placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
              value={address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
              className="border-red-200 focus:border-red-500 focus-visible:ring-red-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-red-700">
              Số điện thoại
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0901234567"
              value={phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
              className="border-red-200 focus:border-red-500 focus-visible:ring-red-500"
            />
          </div>
          <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white">
            Lưu thay đổi
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
