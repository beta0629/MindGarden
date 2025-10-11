"use client"

import { useState } from "react"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Checkbox } from "../ui/checkbox"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Switch } from "../ui/switch"
import { Slider } from "../ui/slider"
import { Button } from "../ui/button"

export function FormShowcase() {
  const [sliderValue, setSliderValue] = useState([50])
  const [switchChecked, setSwitchChecked] = useState(false)

  return (
    <section className="space-y-6 md:space-y-8">
      <div className="glass-strong rounded-2xl md:rounded-3xl p-6 md:p-12 shadow-2xl">
        <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[#2F2F2F] text-sm md:text-base">
              이름
            </Label>
            <Input
              id="name"
              placeholder="이름을 입력하세요"
              className="bg-[#FFFEF7] border-[#2F2F2F]/20 focus:border-[#50C878] min-h-[44px] text-sm md:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#2F2F2F] text-sm md:text-base">
              이메일 주소
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              className="bg-[#FFFEF7] border-[#2F2F2F]/20 focus:border-[#50C878] min-h-[44px] text-sm md:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-[#2F2F2F] text-sm md:text-base">
              메시지
            </Label>
            <Textarea
              id="message"
              placeholder="자신에 대해 말씀해주세요..."
              rows={4}
              className="bg-[#FFFEF7] border-[#2F2F2F]/20 focus:border-[#50C878] text-sm md:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="counselor" className="text-[#2F2F2F] text-sm md:text-base">
              상담사 선택
            </Label>
            <Select>
              <SelectTrigger className="bg-[#FFFEF7] border-[#2F2F2F]/20 min-h-[44px] text-sm md:text-base">
                <SelectValue placeholder="상담사를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dr-smith">김서연 박사</SelectItem>
                <SelectItem value="dr-jones">이민준 박사</SelectItem>
                <SelectItem value="dr-lee">박지은 박사</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label className="text-[#2F2F2F] text-sm md:text-base">세션 유형</Label>
            <RadioGroup defaultValue="individual">
              <div className="flex items-center space-x-2 min-h-[44px]">
                <RadioGroupItem value="individual" id="individual" className="w-5 h-5" />
                <Label htmlFor="individual" className="text-[#2F2F2F] font-normal text-sm md:text-base cursor-pointer">
                  개인 세션
                </Label>
              </div>
              <div className="flex items-center space-x-2 min-h-[44px]">
                <RadioGroupItem value="couple" id="couple" className="w-5 h-5" />
                <Label htmlFor="couple" className="text-[#2F2F2F] font-normal text-sm md:text-base cursor-pointer">
                  커플 세션
                </Label>
              </div>
              <div className="flex items-center space-x-2 min-h-[44px]">
                <RadioGroupItem value="group" id="group" className="w-5 h-5" />
                <Label htmlFor="group" className="text-[#2F2F2F] font-normal text-sm md:text-base cursor-pointer">
                  그룹 세션
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label className="text-[#2F2F2F] text-sm md:text-base">환경 설정</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 min-h-[44px]">
                <Checkbox id="email-updates" className="w-5 h-5" />
                <Label
                  htmlFor="email-updates"
                  className="text-[#2F2F2F] font-normal text-sm md:text-base cursor-pointer"
                >
                  이메일 업데이트 받기
                </Label>
              </div>
              <div className="flex items-center space-x-2 min-h-[44px]">
                <Checkbox id="sms-reminders" className="w-5 h-5" />
                <Label
                  htmlFor="sms-reminders"
                  className="text-[#2F2F2F] font-normal text-sm md:text-base cursor-pointer"
                >
                  예약 SMS 알림
                </Label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between min-h-[44px]">
            <Label htmlFor="notifications" className="text-[#2F2F2F] text-sm md:text-base">
              알림 활성화
            </Label>
            <Switch id="notifications" checked={switchChecked} onCheckedChange={setSwitchChecked} />
          </div>

          <div className="space-y-2">
            <Label className="text-[#2F2F2F] text-sm md:text-base">세션 시간: {sliderValue[0]}분</Label>
            <Slider value={sliderValue} onValueChange={setSliderValue} max={120} min={30} step={15} className="py-4" />
          </div>

          <Button className="w-full bg-[#50C878] hover:bg-[#3da860] active:bg-[#2d8f4d] text-white py-5 md:py-6 text-base md:text-lg min-h-[48px]">
            제출하기
          </Button>
        </div>
      </div>

      <div className="text-center px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#2F2F2F] mb-2 md:mb-4">폼 컴포넌트</h2>
        <p className="text-sm md:text-base text-[#6B6B6B]">Input, Textarea, Select, Checkbox, Radio, Switch, Slider</p>
      </div>
    </section>
  )
}
