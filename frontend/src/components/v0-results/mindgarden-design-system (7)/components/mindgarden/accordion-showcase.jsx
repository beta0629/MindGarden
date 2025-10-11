"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"

export function AccordionShowcase() {
  const faqs = [
    {
      question: "첫 세션은 어떻게 예약하나요?",
      answer:
        '대시보드의 "세션 예약" 버튼을 클릭하여 첫 세션을 예약할 수 있습니다. 선호하는 상담사를 선택하고, 편한 시간대를 선택한 후 예약을 확인하세요.',
    },
    {
      question: "어떤 종류의 상담 서비스를 제공하나요?",
      answer:
        "개인 상담, 커플 치료, 가족 상담, 그룹 세션을 제공합니다. 저희 상담사들은 불안, 우울증, 관계 문제, 개인 성장 등 다양한 분야를 전문으로 합니다.",
    },
    {
      question: "각 상담 세션은 얼마나 걸리나요?",
      answer:
        "표준 세션은 50분입니다. 하지만 커플 치료와 집중 개인 상담을 위한 80분 연장 세션도 제공합니다. 예약 시 원하는 시간을 선택할 수 있습니다.",
    },
    {
      question: "제 정보는 비밀로 유지되나요?",
      answer:
        "네, 물론입니다. 저희는 귀하의 개인정보를 매우 중요하게 생각합니다. 모든 세션과 개인 정보는 전문 윤리 및 HIPAA 규정에 따라 엄격하게 비밀로 유지됩니다.",
    },
    {
      question: "예약을 변경하거나 취소할 수 있나요?",
      answer:
        "네, 예약 시간 24시간 전까지 대시보드를 통해 예약을 변경하거나 취소할 수 있습니다. 늦은 취소의 경우 수수료가 부과될 수 있습니다.",
    },
  ]

  return (
    <section className="space-y-8">
      <div className="glass-strong rounded-2xl p-8 shadow-2xl max-w-3xl mx-auto">
        <h3 className="text-2xl font-bold text-[#2F2F2F] mb-6">자주 묻는 질문</h3>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="glass rounded-xl px-6 border-none">
              <AccordionTrigger className="text-left text-[#2F2F2F] font-semibold hover:text-[#50C878] transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-[#6B6B6B] leading-relaxed pt-2">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#2F2F2F] mb-4">아코디언 컴포넌트</h2>
        <p className="text-[#6B6B6B]">글라스모피즘 카드가 적용된 FAQ 스타일 아코디언</p>
      </div>
    </section>
  )
}
