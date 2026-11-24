# -*- coding: utf-8 -*-
"""마인드가든 문장완성 질문지 v3 생성 스크립트 (v2 내용 검증 반영, review/검증보고서.md 참조)
원래 설명: v2 생성 스크립트 (docx + md)
- 성인·청소년·아동 각 50문항, 모든 문항 센터 자체 창작
- 항목 구조: (문항, 영역, 세부, 방향(+ 긍정 / 0 중립 / - 부정), 시간(과/현/미), 옵션)
"""
import re, sys
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

CENTER = "마인드가든심리상담센터"
TITLE = "마인드가든 문장완성 질문지"
OUT = "/workspace/center-ops/sct/"
DISCLAIMER = ("이 질문지는 마인드가든심리상담센터가 자체 개발한 상담 면담 질문지입니다. "
              "응답은 담당 상담사가 면담과 함께 살펴봅니다. "
              "무단 복제·배포를 금합니다. ⓒ 마인드가든심리상담센터")
# 상담사용 별지 맨 끝 고지. 내담자용 고지와 달리 표준화 검사가 아님을 명시한다.
COUNSELOR_DISCLAIMER = ("이 질문지는 마인드가든심리상담센터가 자체 제작한 상담 면담 참고용 자료이며, 표준화된 심리검사가 아닙니다. "
              "규준·점수·진단 기능이 없고, 응답은 상담사가 면담과 함께 참고하는 데만 씁니다. "
              "기존에 출판된 어떤 심리검사의 문항도 옮기지 않았습니다. 무단 복제·배포를 금합니다. ⓒ 마인드가든심리상담센터")
NA = "na"  # '해당 없음' 표시 가능 문항
DATE_FIELD = "20____년 ____월 ____일"
# 양식 머리 표: 행마다 (칸 이름, 값) 쌍. 쌍이 하나뿐인 행은 값이 오른쪽 세 칸을 합쳐 쓴다. 내담자 이름·번호 칸은 두지 않는다.
# 상담사용 응답 기록 요약표 머리 문구 (디자인본도 이 값을 그대로 쓴다)
RECORD_LINE = ("관리번호: ____________________\n"
               "실시 날짜: 20____. ____. ____.   기록 상담사: __________   □ 구술(받아 적음)   □ 분할 실시\n"
               "□ 상담 동의서와 민감정보 동의를 확인했습니다.   □ (만 14세 미만) 법정대리인 동의를 확인했습니다.")
FOOTER_NOTE = "마인드가든심리상담센터 자체 제작 상담 면담 질문지입니다."
FOOTER_NOTE_COUNSELOR = "상담 면담 참고용 질문지이며, 표준화 검사가 아닙니다."
COUNSELOR_SUB = "내담자에게 배부하지 않습니다. 응답지와 함께 상담 기록으로 잠가 보관합니다."
def subline(f):
    return f"대상은 {f['target']}입니다. 마인드가든심리상담센터 자체 제작 상담 면담 질문지입니다. 모두 {len(f['items'])}문항입니다."
H_LENSES = "해석할 때 보는 8가지 관점(모든 영역 공통)"
H_DOMAIN = "영역별 문항 번호표 · 해석 시 볼 포인트"
H_LIST = "문항 일람(방향·시점 표시)"

# ======================= 성인용 (영역별 원천 목록) =======================
ADULT_SRC = {
 "자기개념": [
  ("내 이름 앞에 어울리는 수식어를 하나 붙인다면", "", "0", "현"),
  ("남들 앞에서는 감추고 혼자 있을 때만 드러나는 내 모습은", "", "-", "현"),
  ("열 살 무렵의 내가 지금의 나를 만난다면", "", "0", "과"),
  ("요즘 들어 나 자신이 조금 마음에 드는 때는", "", "+", "현"),
  ("몇 해 지나 오늘의 나를 돌아보면 아마", "", "0", "미"),
 ],
 "부모/원가족": [
  ("어릴 적 우리 집 안에서 가장 자주 들리던 소리는", "원가족", "0", "과"),
  ("어머니(또는 나를 키워 준 여성 보호자)를 떠올리면 먼저 생각나는 장면은", "모", "0", "과", NA),   # v3: adult v2-10번 수정
  ("아버지(또는 나를 키워 준 남성 보호자)와 나 사이의 거리는", "부", "0", "현", NA),   # v3: adult v2-18번 수정
  ("자라면서 집에서 몸에 밴 것 가운데 고맙게 여기는 것은", "원가족", "+", "현"),   # v3: adult v2-30번 수정
  ("명절이나 가족 모임이 다가오면 내 마음은", "원가족", "0", "미"),
 ],
 "배우자·연인": [
  ("연인이나 배우자와 함께 있을 때 나는", "", "0", "현", NA),   # v3: adult v2-9번 수정
  ("연인이나 배우자에게 말하지 못하고 삼켜 둔 이야기는", "", "-", "현", NA),   # v3: adult v2-20번 수정
  ("지나온 연애나 결혼을 돌아보며 알게 된 것은", "", "+", "과", NA),   # v3: adult v2-32번 수정
  ("함께 나이 들어 갈 사람에게 바라는 모습은", "", "+", "미"),
 ],
 "자녀": [
  ("아이가 내 말을 따르지 않을 때 나는", "", "-", "현", NA),
  ("아이와 보낸 시간 중 오래 간직하고 싶은 장면은", "", "+", "과", NA),
  ("아이가 자라서 나를 떠올릴 때 기억해 주었으면 하는 것은", "", "+", "미", NA),
 ],
 "대인관계": [
  ("모임에서 처음 보는 사람이 말을 걸어오면 나는", "", "0", "현"),
  ("누군가 내게 실망한 눈치를 보이면", "", "-", "현"),
  ("연락이 뜸해진 옛 친구를 생각하면", "", "0", "과"),
  ("내 편이 되어 준다고 느끼는 사람은", "", "+", "현"),
  ("사람들과 거리를 두고 싶어지는 때는", "", "-", "현"),
 ],
 "직장·역할": [
  ("하루 일과(출근·등교·살림 등)를 시작할 때 내 발걸음은", "", "0", "현"),
  ("일에서 인정받았다고 느꼈던 기억은", "", "+", "과"),
  ("내 일을 평가하는 사람 앞에서 나는", "", "-", "현"),
  ("지금 맡은 역할에서 가장 버거운 부분은", "", "-", "현"),
  ("일과 쉼의 균형이 맞춰진다면 내 하루는", "", "+", "미"),
 ],
 "정서": [
  ("기운이 바닥난 날 내 방의 모습은", "우울", "-", "현"),
  ("내 웃음이 줄어드는 때는", "우울", "-", "현"),   # v3: adult v2-5번 수정
  ("확인하고 또 확인하게 되는 일은", "불안", "-", "현"),
  ("아직 일어나지 않은 일 가운데 자꾸 마음에 걸리는 것은", "불안", "-", "미"),
  ("화가 치밀어 오르는 순간은", "분노", "-", "현"),   # v3: adult v2-15번 수정
  ("화가 가라앉고 나면 나는", "분노", "0", "현"),
  ("누군가에게 진 마음의 빚은", "죄책감", "-", "과"),
  ("떠올리면 얼굴이 화끈해지는 장면은", "수치심", "-", "과"),
 ],
 "과거 경험": [
  ("내 삶의 방향이 바뀐 날을 하나 고른다면", "", "0", "과"),
  ("학창 시절 나를 가장 힘들게 한 것은", "", "-", "과"),
  ("오래전 누군가 해 준 말 가운데 아직 마음에 남은 것은", "", "0", "과"),
  ("지나고 보니 잘했다고 여겨지는 결정은", "", "+", "과"),
 ],
 "미래·목표": [
  ("일 년 뒤 오늘, 달력 속 내 하루에는", "", "0", "미"),      # 기존 성인 6번 대체
  ("이루고 싶은 일을 가로막는 가장 큰 벽은", "", "-", "미"),
  ("시간과 여유가 생긴다면 새로 배워 보고 싶은 것은", "", "+", "미"),
  ("상담을 마칠 무렵 달라져 있기를 바라는 것은", "", "+", "미"),
 ],
 "대처·자원·강점": [
  ("마음이 복잡할 때 내 손이 먼저 가는 것은", "대처", "0", "현"),
  ("어려운 순간에 의외로 침착해지는 내 모습은", "강점", "+", "과"),
  ("도움을 청하기가 망설여지는 까닭은", "자원", "-", "현"),
  ("지쳤을 때 나를 다시 일으켜 세우는 작은 것은", "자원", "+", "현"),
 ],
 "가치·의미": [
  ("손해를 보더라도 지키고 싶은 원칙은", "", "+", "현"),
  ("내가 생각하는 '잘 산 하루'란", "", "0", "현"),
  ("이 질문지를 다 채워 갈 즈음 드는 생각은", "마무리", "0", "현"),
 ],
}
ADULT_FIRST = "내 이름 앞에 어울리는 수식어를 하나 붙인다면"
ADULT_LAST = "이 질문지를 다 채워 갈 즈음 드는 생각은"

# ======================= 청소년용 =======================
TEEN_SRC = {
 "자기개념·신체상": [
  ("사진 속 내 모습을 보면 나는", "신체상", "0", "현"),
  ("내 몸에서 마음에 드는 곳은", "신체상", "+", "현"),
  ("누군가 내 외모를 두고 한마디 하면", "신체상", "-", "현"),
  ("사람들이 나를 한 단어로 표현한다면", "자기개념", "0", "현"),   # v3: teen v2-30번 수정
  ("초등학생 때의 나와 지금의 나를 비교해 보면", "자기개념", "0", "과"),   # v3: teen v2-40번 수정
 ],
 "부모": [
  ("엄마(또는 보호자)가 나를 부르는 소리가 들리면", "", "0", "현", NA),   # v3: teen v2-3번 수정
  ("아빠(또는 다른 보호자)와 단둘이 있게 되면", "", "0", "현", NA),   # v3: teen v2-10번 수정
  ("부모님(또는 보호자)이 내 편이라고 느꼈던 때는", "", "+", "과"),
  ("집에서 듣는 잔소리 중 가장 듣기 힘든 것은", "", "-", "현"),
  ("부모님(또는 보호자)이 나를 더 알아줬으면 하는 점은", "", "0", "현"),   # v3: teen v2-32번 수정
  ("주말 오후 우리 집 거실 풍경은", "", "0", "현"),
 ],
 "형제": [
  ("형제자매나 다른 아이와 비교될 때", "", "-", "현"),   # v3: teen v2-25번 수정
  ("형제자매(또는 함께 자란 아이)와 같이 웃었던 일은", "", "+", "과", NA),   # v3: teen v2-31번 수정
  ("몇 년 뒤 형제자매(또는 함께 자란 아이)와 나는", "", "0", "미", NA),   # v3: teen v2-44번 수정
 ],
 "친구·또래": [
  ("새 학기 첫날 교실 문을 열고 들어서면", "", "0", "과"),
  ("친구들 사이에서 내가 맡는 역할은", "", "0", "현"),
  ("내 비밀이 다른 사람에게 퍼졌다는 걸 알게 되면", "", "-", "현"),   # v3: teen v2-16번 수정
  ("함께 있으면 시간이 빨리 가는 친구는", "", "+", "현"),
  ("혼자 점심을 먹게 되는 날", "", "-", "현"),
  ("예전에 멀어진 친구를 떠올리면", "", "0", "과"),
 ],
 "좋아하는 마음·관계": [
  ("누군가를 좋아하게 되면 나는", "", "0", "현"),
  ("서로 좋아하는 사이에서 가장 지켜야 할 것은", "", "+", "미"),
  ("좋아하는 마음을 들켰을 때", "", "-", "현"),
  ("연애에 대해 어른들이 하는 말을 들으면", "", "0", "현"),
 ],
 "학교·교사·학업": [
  ("수업 시간에 발표를 해야 할 때", "학업", "-", "현"),
  ("선생님에게 들었던 말 가운데 힘이 된 것은", "교사", "+", "과"),
  ("숙제나 수행평가가 밀려 있으면", "학업", "-", "현"),
  ("학교에서 하루 중 숨 돌리는 시간은", "학교", "+", "현"),
  ("성적이 기대만큼 나오지 않았던 날", "학업", "-", "과"),
  ("내가 교장 선생님이라면 우리 학교에서 바꾸고 싶은 것은", "학교", "0", "미"),
 ],
 "정서": [
  ("요즘 나를 가장 크게 웃게 한 일은", "기쁨", "+", "현"),
  ("이유 없이 축 처지는 날 나는", "우울", "-", "현"),
  ("사람들 속에 있어도 혼자인 것 같을 때는", "외로움", "-", "현"),
  ("내일이 오는 게 부담스러운 밤에는", "불안", "-", "미"),
  ("가슴이 두근거리고 손에 땀이 나는 상황은", "불안", "-", "현"),
  ("화가 크게 났던 날 나는", "분노", "-", "과"),   # v3: teen v2-27번 수정
  ("화가 날 때 하는 행동 중 고쳐 보고 싶은 것은", "분노", "0", "미"),
  ("미안한데 아직 말을 꺼내지 못한 일은", "죄책감", "-", "과"),
 ],
 "미디어·여가": [
  ("요즘 빠져 있는 게임·영상·노래는", "", "+", "현"),
  ("휴대폰을 내려놓아야 할 때 나는", "", "0", "현"),
  ("온라인에서 본 글이나 댓글 때문에 기분이 상하면 나는", "", "-", "현"),   # v3: teen v2-39번 수정
  ("아무 일정 없는 방학 하루가 주어진다면", "", "+", "미"),
 ],
 "미래·진로": [
  ("스무 살 생일 아침, 눈을 뜬 내가 있는 곳은", "", "0", "미"),      # 기존 청소년 34번 대체
  ("진로 이야기가 나오면 내 마음은", "", "0", "현"),
  ("내가 하고 싶은 일과 집에서 바라는 일이 다르다면", "", "-", "미"),
  ("어른이 된 내가 지금의 나에게 문자 한 줄을 보낸다면", "", "+", "미"),  # 기존 청소년 18번 대체
 ],
 "강점·대처": [
  ("힘든 일이 생기면 가장 먼저 연락하는 사람은", "자원", "+", "현"),
  ("그만두고 싶었지만 끝까지 해낸 일은", "강점", "+", "과"),
  ("스트레스가 쌓이면 꺼내 쓰는 나만의 방법은", "대처", "0", "현"),
  ("친구들이 나에게 고마워하는 일은", "강점", "+", "현"),
 ],
}
TEEN_FIRST = "요즘 빠져 있는 게임·영상·노래는"
TEEN_LAST = "어른이 된 내가 지금의 나에게 문자 한 줄을 보낸다면"

# ======================= 아동용 =======================
CHILD_SRC = {
 "나": [
  ("나에게서 제일 마음에 드는 점은", "", "+", "현"),   # v3: child v2-7번 수정
  ("나를 색깔로 칠한다면", "", "0", "현"),
  ("내가 혼자서도 척척 해내는 일은", "", "+", "현"),              # 기존 아동 8번 대체
  ("아기였을 때 나는", "", "0", "과"),
  ("친구들이 생각하는 나는", "", "0", "현"),   # v3: child v2-34번 삭제
  ("내가 나한테 속상한 때는", "", "-", "현"),   # v3: child v2-43번 수정
 ],
 "엄마·아빠·가족": [
  ("엄마(또는 돌봐 주는 어른)가 나를 꼭 안아 주면", "엄마", "+", "현"),
  ("아빠(또는 돌봐 주는 어른)가 나를 부르면", "아빠", "0", "현"),   # v3: child v2-5번 수정
  ("우리 집 저녁밥 시간은", "가족", "0", "현"),
  ("엄마(또는 돌봐 주는 어른)가 바쁠 때 나는", "엄마", "-", "현"),
  ("아빠(또는 돌봐 주는 어른)랑 같이 해 보고 싶은 것은", "아빠", "+", "미"),
  ("가족이랑 같이 갔던 곳 중에 생각나는 곳은", "가족", "+", "과"),
  ("언니·오빠·누나·형·동생이 내 물건을 만지면", "형제", "-", "현", NA),   # v3: child v2-35번 수정
  ("집에 돌아오면 제일 먼저 하는 일은", "가족", "0", "현"),
 ],
 "친구": [
  ("쉬는 시간에 나는", "", "0", "현"),   # v3: child v2-9번 수정
  ("친구가 같이 안 놀아 주면", "", "-", "현"),
  ("친구랑 싸운 다음 날", "", "-", "과"),
  ("새 친구를 처음 만나면 나는", "", "0", "현"),
  ("친구한테 듣고 싶은 말은", "", "+", "미"),
  ("내가 친구를 도와준 일은", "", "+", "과"),
 ],
 "학교·선생님": [
  ("아침에 교실에 들어가면", "학교", "0", "현"),
  ("선생님이 나를 칭찬하면", "선생님", "+", "현"),
  ("공부가 어려우면 나는", "학교", "-", "현"),
  ("학교에서 제일 하기 싫은 시간은", "학교", "-", "현"),
  ("선생님께 꾸중 들었던 날", "선생님", "-", "과"),
  ("다음 학년이 되면", "학교", "0", "미"),
 ],
 "감정": [
  ("웃음이 멈추지 않았던 날은", "기쁨", "+", "과"),
  ("기분이 좋으면 내 몸은", "기쁨", "+", "현"),
  ("눈물이 나려고 할 때 나는", "슬픔", "-", "현"),
  ("마음이 아팠던 날은", "슬픔", "-", "과"),
  ("밤에 불을 끄면", "무서움", "-", "현"),
  ("깜짝 놀라서 무서웠던 일은", "무서움", "-", "과"),
  ("얼굴이 빨개질 만큼 화가 나는 때는", "화", "-", "현"),            # 기존 아동 17번 대체
  ("화가 풀리려면", "화", "0", "현"),
 ],
 "놀이·좋아하는 것": [
  ("제일 좋아하는 놀이는", "", "+", "현"),
  ("혼자 놀 때 제일 자주 하는 것은", "", "0", "현"),   # v3: child v2-15번 삭제
  ("내가 좋아하는 음식은", "", "+", "현"),
  ("텔레비전이나 영상에서 자주 보는 것은", "", "0", "현"),
  ("놀이터에 가면 나는", "", "0", "현"),
  ("지난 방학에 제일 재미있었던 일은", "", "+", "과"),
 ],
 "바람·소원": [
  ("하늘에서 선물 상자가 떨어진다면 그 안에는", "", "+", "미"),
  ("어른이 된 내가 하루 동안 하는 일은", "", "0", "미"),   # v3: child v2-32번 삭제
  ("우리 가족에게 바라는 것은", "", "0", "미"),
  ("학교에 생겼으면 하는 것은", "", "+", "미"),
  ("오늘 밤 꿈에서 만나고 싶은 것은", "", "+", "미"),
 ],
 "걱정": [
  ("잠자기 전에 떠오르는 걱정은", "", "-", "현"),
  ("어른들이 서로 큰 소리로 말하면", "", "-", "현"),
  ("몸이 아플 때 나는", "", "-", "현"),
  ("내일 학교에 가서 걱정되는 것은", "", "-", "미"),
  ("걱정이 생기면 이야기하는 사람은", "", "+", "현"),
 ],
}
CHILD_FIRST = "제일 좋아하는 놀이는"
CHILD_LAST = "오늘 밤 꿈에서 만나고 싶은 것은"

# 기존 초안 지적 문항 → 대체 문항
REPLACED = [
 ("성인 6번", "다섯 해 뒤의 나는", "일 년 뒤 오늘, 달력 속 내 하루에는"),
 ("청소년 18번", "어른이 되면 꼭", "어른이 된 내가 지금의 나에게 문자 한 줄을 보낸다면"),
 ("청소년 34번", "10년 뒤의 나는", "스무 살 생일 아침, 눈을 뜬 내가 있는 곳은"),
 ("아동 8번", "내가 잘하는 것은", "내가 혼자서도 척척 해내는 일은"),
 ("아동 17번", "화가 나면 나는", "얼굴이 빨개질 만큼 화가 나는 때는"),
 ("아동 21번", "혼자 있을 때 나는", "아무도 없는 방에서 나 혼자 하는 놀이는"),
 ("아동 24번", "나중에 크면 나는", "내 키가 엄마·아빠만큼 자라면 나는"),
]

# v3 검증 반영: v2 문항 → v3 문항 (review/변경대비표.md)
REPLACED_V3 = [
 ("adult v2-5번 수정", "웃을 일이 줄었다고 처음 느낀 무렵은", "내 웃음이 줄어드는 때는"),
 ("adult v2-9번 수정", "연인이나 배우자(없다면 바라는 상대)와 함께 있을 때 나는", "연인이나 배우자와 함께 있을 때 나는"),
 ("adult v2-10번 수정", "어머니(또는 나를 키워 준 여성 보호자)가 지쳐 보일 때 어린 나는", "어머니(또는 나를 키워 준 여성 보호자)를 떠올리면 먼저 생각나는 장면은"),
 ("adult v2-15번 수정", "참다 참다 목소리가 커지는 순간은", "화가 치밀어 오르는 순간은"),
 ("adult v2-18번 수정", "아버지(또는 나를 키워 준 남성 보호자)에게서 닮고 싶지 않았던 점은", "아버지(또는 나를 키워 준 남성 보호자)와 나 사이의 거리는"),
 ("adult v2-20번 수정", "둘 사이에서 말하지 못하고 삼켜 둔 이야기는", "연인이나 배우자에게 말하지 못하고 삼켜 둔 이야기는"),
 ("adult v2-30번 수정", "원가족에게서 물려받아 고맙게 여기는 습관은", "자라면서 집에서 몸에 밴 것 가운데 고맙게 여기는 것은"),
 ("adult v2-32번 수정", "지난 연애나 결혼 생활이 내게 남긴 배움은", "지나온 연애나 결혼을 돌아보며 알게 된 것은"),
 ("teen v2-3번 수정", "엄마(또는 보호자)가 내 방문을 두드리면", "엄마(또는 보호자)가 나를 부르는 소리가 들리면"),
 ("teen v2-10번 수정", "아빠(또는 보호자)와 단둘이 있게 되면", "아빠(또는 다른 보호자)와 단둘이 있게 되면"),
 ("teen v2-16번 수정", "내 비밀이 다른 아이에게 전해졌다는 걸 알게 되면", "내 비밀이 다른 사람에게 퍼졌다는 걸 알게 되면"),
 ("teen v2-25번 수정", "형제자매(없으면 사촌이나 가까운 친척 아이)와 비교될 때", "형제자매나 다른 아이와 비교될 때"),
 ("teen v2-27번 수정", "꾹 참았던 화가 터져 버린 날은", "화가 크게 났던 날 나는"),
 ("teen v2-30번 수정", "사람들이 나를 한 단어로 부른다면", "사람들이 나를 한 단어로 표현한다면"),
 ("teen v2-31번 수정", "형제자매(또는 함께 자란 아이)와 같이 웃었던 일은", "형제자매(또는 함께 자란 아이)와 같이 웃었던 일은"),
 ("teen v2-32번 수정", "부모님(또는 보호자)이 나에 대해 아직 모르는 것은", "부모님(또는 보호자)이 나를 더 알아줬으면 하는 점은"),
 ("teen v2-39번 수정", "온라인에서 본 글이나 댓글 때문에 기분이 상했던 적은", "온라인에서 본 글이나 댓글 때문에 기분이 상하면 나는"),
 ("teen v2-40번 수정", "초등학생 때의 나와 지금의 나를 견주어 보면", "초등학생 때의 나와 지금의 나를 비교해 보면"),
 ("teen v2-44번 수정", "몇 년 뒤 형제자매(또는 함께 자란 아이)와 나는", "몇 년 뒤 형제자매(또는 함께 자란 아이)와 나는"),
 ("child v2-5번 수정", "아빠(또는 돌봐 주는 어른)가 큰 소리를 내면", "아빠(또는 돌봐 주는 어른)가 나를 부르면"),
 ("child v2-7번 수정", "내 얼굴에서 제일 마음에 드는 곳은", "나에게서 제일 마음에 드는 점은"),
 ("child v2-9번 수정", "쉬는 시간에 같이 노는 친구는", "쉬는 시간에 나는"),
 ("child v2-15번 삭제", "아무도 없는 방에서 나 혼자 하는 놀이는", "혼자 놀 때 제일 자주 하는 것은"),
 ("child v2-32번 삭제", "내 키가 엄마·아빠만큼 자라면 나는", "어른이 된 내가 하루 동안 하는 일은"),
 ("child v2-34번 삭제", "친구들이 나를 부르는 별명은", "친구들이 생각하는 나는"),
 ("child v2-35번 수정", "형제(언니·오빠·누나·형·동생)가 내 물건을 만지면", "언니·오빠·누나·형·동생이 내 물건을 만지면"),
 ("child v2-43번 수정", "내가 나한테 실망하는 때는", "내가 나한테 속상한 때는"),
]

def arrange(src, first, last):
    """같은 영역이 연달아 나오지 않도록 배치(남은 문항이 많은 영역 우선, 직전 2개 영역 회피)."""
    pools = {d: [dict(text=t[0], domain=d, sub=t[1], dir=t[2], time=t[3], na=(len(t) > 4 and t[4] == NA))
                 for t in items] for d, items in src.items()}
    order = list(src.keys())
    def take(text):
        for d in pools:
            for it in pools[d]:
                if it["text"] == text:
                    pools[d].remove(it); return it
        raise KeyError(text)
    head, tail = take(first), take(last)
    seq = [head]
    total = sum(len(v) for v in pools.values())
    for _ in range(total):
        recent = [x["domain"] for x in seq[-2:]]
        cands = [d for d in order if pools[d] and d not in recent] or \
                [d for d in order if pools[d] and d != seq[-1]["domain"]]
        # 남은 수 많은 영역 우선, 동률이면 직전 문항과 방향이 다른 것 우선
        prev_dir = seq[-1]["dir"]
        def key(d):
            return (-len(pools[d]), pools[d][0]["dir"] == prev_dir, order.index(d))
        d = sorted(cands, key=key)[0]
        seq.append(pools[d].pop(0))
    seq.append(tail)
    return seq

FORMS = [
 dict(key="adult", title=f"{TITLE} (성인용)", target="19세 이상", src=ADULT_SRC, first=ADULT_FIRST, last=ADULT_LAST,
      header=[[("센터명", CENTER), ("실시 날짜", DATE_FIELD)], [("나이", "______ 세")]], lines=2, size=10.5, spacing=1.55, gap=5,
      guide=["이 질문지는 상담 면담에 참고하기 위한 자료입니다. 시험이 아니며 정답도 없습니다.",
             "각 문장의 앞부분을 읽고, 가장 먼저 떠오르는 생각을 이어서 끝까지 써 주세요.",
             "오래 고민하지 말고 떠오르는 대로 솔직하게 쓰면 됩니다. 쓰기 어려운 문항은 비워 두셔도 괜찮습니다.",
             "'□ 해당 없음'이 있는 문항(부모, 연인·배우자, 자녀 관련)은 해당하지 않으면 □에 표시하고 넘어가세요.",
             "걸리는 시간은 대략 30~40분입니다.",
             "작성한 내용은 상담 기록과 같은 수준으로 비밀을 지켜 보관하며, 상담 동의서에서 안내한 목적 안에서만 씁니다. 다만 본인이나 다른 사람의 안전이 걱정되는 내용이 있으면 상담사가 먼저 함께 이야기를 나누고, 필요하면 동의서에 적힌 비밀보장의 예외에 따라 도움을 받을 수 있는 곳과 연결합니다."]),
 dict(key="teen", title=f"{TITLE} (청소년용)", target="중·고등학생", src=TEEN_SRC, first=TEEN_FIRST, last=TEEN_LAST,
      header=[[("센터명", CENTER), ("실시 날짜", DATE_FIELD)],
              [("학교", "□ 중학교    □ 고등학교    □ 기타(학교 밖 등)")],
              [("학교명", "____________________"), ("학년·나이", "____ 학년 · ____ 세")]], lines=2, size=10.5, spacing=1.55, gap=5,
      guide=["이 질문지는 상담 선생님과 이야기를 나누기 위한 참고 자료예요. 시험이 아니고 정답도 없어요.",
             "문장의 앞부분을 읽고, 바로 떠오르는 생각을 이어서 문장을 완성해 주세요.",
             "맞춤법이나 글씨는 신경 쓰지 않아도 돼요. 떠오르는 대로 쓰면 되고, 쓰기 어려운 문항은 비워 둬도 괜찮아요.",
             "'□ 해당 없음'이 있는 문항(부모·형제자매 관련)은 나에게 해당하지 않으면 □에 표시하고 넘어가요. 학교에 다니지 않는다면 지금 다니는 곳이나 지내는 곳을 떠올려 답해도 돼요.",
             "걸리는 시간은 대략 30~40분이에요.",
             "적은 내용은 상담 선생님이 상담에만 쓰고 비밀로 보관해요. 다만 너나 다른 사람의 안전이 걱정되는 내용이 있으면, 먼저 너와 이야기한 뒤 보호자나 도와줄 수 있는 곳에 알릴 수 있어요."]),
 dict(key="child", title=f"{TITLE} (아동용)", target="초등학생", src=CHILD_SRC, first=CHILD_FIRST, last=CHILD_LAST,
      header=[[("센터명", CENTER), ("실시 날짜", DATE_FIELD)],
              [("학교", "____________ 초등학교"), ("학년·나이", "____ 학년 · ____ 세")]], lines=2, size=13, spacing=2.1, gap=9,
      guide=["여기에는 정답이 없어요. 생각나는 대로 말하거나 쓰면 돼요.",
             "문장 앞부분을 읽고, 뒤를 이어서 문장을 만들어 주세요.",
             "글자를 틀리게 써도 괜찮아요. 잘 모르겠으면 넘어가도 돼요.",
             "형제가 없거나 나랑 맞지 않는 문장은 '□ 해당 없음'에 표시하거나 넘어가도 돼요.",
             "시간은 30~40분쯤 걸려요. 힘들면 쉬었다 해도 되고, 두 번에 나눠서 해도 괜찮아요. (저학년은 상담 선생님이 읽어 주고, 말한 대로 받아 적을 수 있어요.)",
             "여기 쓴 이야기는 상담 선생님이 소중하게 보관해요. 네가 다치거나 위험할까 봐 걱정되는 이야기가 있으면, 너를 지키기 위해 다른 어른에게 도움을 부탁할 수 있어요."]),
]
for f in FORMS:
    f["items"] = arrange(f["src"], f["first"], f["last"])


# ======================= 실시 안내 및 동의 (내담자용 첫 쪽, 응답지와 분리 보관 가능) =======================
CONSENT_TITLE = "실시 안내 및 동의"
CONSENT_DETACH = "이 쪽은 응답지와 분리하여 상담 기록에 보관할 수 있습니다."
CONSENT_DETACH_CHILD = "이 쪽은 보호자께서 읽어 주시기 바랍니다. 응답지와 분리하여 상담 기록에 보관할 수 있습니다."
LEGAL_REVIEW_NOTE = "법률 검토 권장"
SENSITIVE_PROMPT = "민감정보(심리·건강 관련 정보) 처리에 대한 동의"
SENSITIVE_YES = "□ 동의함"
SENSITIVE_NO = "□ 동의하지 않음"
CONSENT_H_PURPOSE = "1. 실시 목적과 쓰임"
CONSENT_H_COLLECT = "2. 수집 항목과 민감정보 동의"
CONSENT_H_SECRET = "3. 비밀보장"
CONSENT_H_RETAIN = "4. 보관과 파기"
CONSENT_H_DURATION = "5. 동의의 적용과 철회"
CONSENT_H_SIGN = "6. 서명"
DATE_SIGN = "20____년 ____월 ____일"

CONSENT_PURPOSE = ("이 질문지는 마인드가든심리상담센터가 자체 제작한 상담 면담 질문지입니다. "
                   "응답은 담당 상담사가 면담과 함께 살펴봅니다. "
                   "응답을 거부하거나 도중에 중단할 수 있으며, 답하기를 원하지 않는 문항은 비워 두셔도 됩니다.")
CONSENT_PURPOSE_CHILD = ("이 질문지는 마인드가든심리상담센터가 자체 제작한 상담 면담 질문지입니다. "
                         "아이의 응답은 담당 상담사가 면담과 함께 살펴봅니다. "
                         "아이 또는 보호자는 응답을 거부하거나 도중에 중단할 수 있으며, 답하기를 원하지 않는 문항은 비워 두어도 됩니다.")
CONSENT_COLLECT_ADULT = ("이 질문지를 실시하면 질문지 응답, 실시 날짜, 나이를 수집합니다. "
                         "응답에는 심리·건강과 관련된 정보가 포함될 수 있으며, 이는 개인정보 보호법 제23조에 따른 민감정보에 해당합니다. "
                         "민감정보 처리에 동의하지 않을 권리가 있으며, 동의하지 않더라도 질문지 없이 상담을 진행할 수 있습니다.")
CONSENT_COLLECT_TEEN = ("이 질문지를 실시하면 질문지 응답, 실시 날짜, 나이, 학교·학년을 수집합니다. "
                        "응답에는 심리·건강과 관련된 정보가 포함될 수 있으며, 이는 개인정보 보호법 제23조에 따른 민감정보에 해당합니다. "
                        "민감정보 처리에 동의하지 않을 권리가 있으며, 동의하지 않더라도 질문지 없이 상담을 진행할 수 있습니다.")
CONSENT_COLLECT_CHILD = ("이 질문지를 실시하면 아이의 질문지 응답, 실시 날짜, 나이, 학교·학년을 수집합니다. "
                         "응답에는 심리·건강과 관련된 정보가 포함될 수 있으며, 이는 개인정보 보호법 제23조에 따른 민감정보에 해당합니다. "
                         "민감정보 처리에 동의하지 않을 권리가 있으며, 동의하지 않더라도 질문지 없이 상담을 진행할 수 있습니다.")
CONSENT_SECRET = "이 질문지의 비밀보장과 그 예외는 상담 동의서에 안내한 기준을 따릅니다."
CONSENT_RETAIN = ("작성한 응답지는 상담 기록과 같은 수준으로 잠가 보관합니다. "
                  "응답지는 실시일로부터 1년간 보관한 뒤 파쇄합니다.")
CONSENT_RETAIN_ONLINE = ("작성한 응답은 상담 기록과 같은 수준으로 잠가 보관합니다. "
                         "응답은 실시일로부터 1년간 보관한 뒤 파기합니다.")
CONSENT_DURATION = "한 번 동의하면 철회할 때까지 이후 실시에도 적용됩니다. 동의는 언제든 철회할 수 있습니다."
CONSENT_DURATION_CHILD = "한 번 동의하시면 철회하실 때까지 이후 실시에도 적용됩니다. 동의는 언제든 철회하실 수 있습니다."
CONSENT_TEEN_NOTE = ("만 14세 미만인 경우에는 법정대리인(보호자)의 동의가 필요합니다. "
                     "만 14세 이상 청소년의 보호자 동의 범위는 센터 규정을 따릅니다.")
CONSENT_CHILD_NOTE = ("아동은 만 14세 미만이므로 법정대리인(보호자)의 동의가 필요합니다. "
                      "이는 개인정보 보호법 제22조의2에 따른 것입니다.")

def _sign_row(*pairs):
    return list(pairs)

CONSENT = {
    "adult": dict(
        detach=CONSENT_DETACH,
        purpose=CONSENT_PURPOSE,
        collect=CONSENT_COLLECT_ADULT,
        collect_items=["질문지 응답", "실시 날짜", "나이"],
        secret=CONSENT_SECRET,
        retain=CONSENT_RETAIN,
        duration=CONSENT_DURATION,
        notes=[],
        signs=[("내담자", _sign_row(("서명", "__________"), ("날짜", DATE_SIGN)))],
        optional_signs=[],
    ),
    "teen": dict(
        detach=CONSENT_DETACH,
        purpose=CONSENT_PURPOSE,
        collect=CONSENT_COLLECT_TEEN,
        collect_items=["질문지 응답", "실시 날짜", "나이", "학교·학년"],
        secret=CONSENT_SECRET,
        retain=CONSENT_RETAIN,
        duration=CONSENT_DURATION,
        notes=[CONSENT_TEEN_NOTE],
        signs=[
            ("본인", _sign_row(("서명", "__________"), ("날짜", DATE_SIGN))),
            ("법정대리인(보호자)", _sign_row(("서명", "__________"), ("관계", "__________"), ("날짜", DATE_SIGN))),
        ],
        optional_signs=[],
    ),
    "child": dict(
        detach=CONSENT_DETACH_CHILD,
        purpose=CONSENT_PURPOSE_CHILD,
        collect=CONSENT_COLLECT_CHILD,
        collect_items=["질문지 응답", "실시 날짜", "나이", "학교·학년"],
        secret=CONSENT_SECRET,
        retain=CONSENT_RETAIN,
        duration=CONSENT_DURATION_CHILD,
        notes=[CONSENT_CHILD_NOTE],
        signs=[
            ("법정대리인(보호자)", _sign_row(("서명", "__________"), ("관계", "__________"), ("날짜", DATE_SIGN))),
        ],
        optional_signs=[
            ("(선택) 아동 본인 확인", _sign_row(("이름", "__________"))),
        ],
    ),
}

def consent_sign_line(role, fields):
    bits = [role] + [f"{lab} {val}" for lab, val in fields]
    return "    ".join(bits)

def consent_plain_parts(key):
    """동의 쪽 문구를 읽는 순서대로 반환한다. 디자인본·인수인계 문서가 이 값을 쓴다."""
    c = CONSENT[key]
    parts = [CONSENT_TITLE, c["detach"],
             CONSENT_H_PURPOSE, c["purpose"],
             CONSENT_H_COLLECT, c["collect"],
             SENSITIVE_PROMPT, SENSITIVE_YES, SENSITIVE_NO]
    parts += c["notes"]
    parts += [CONSENT_H_SECRET, c["secret"],
              CONSENT_H_RETAIN, c["retain"],
              CONSENT_H_DURATION, c["duration"],
              CONSENT_H_SIGN]
    for role, fields in c["signs"]:
        parts.append(consent_sign_line(role, fields))
    for role, fields in c["optional_signs"]:
        parts.append(consent_sign_line(role, fields))
    return parts

def consent_md_block(key):
    c = CONSENT[key]
    L = [f"### {CONSENT_TITLE}", "", f"*{c['detach']}*", "",
         f"**{CONSENT_H_PURPOSE}**", "", c["purpose"], "",
         f"**{CONSENT_H_COLLECT}**", "", c["collect"], "",
         f"**{SENSITIVE_PROMPT}**", "", f"- {SENSITIVE_YES}", f"- {SENSITIVE_NO}", ""]
    for note in c["notes"]:
        L += [note, ""]
    L += [f"**{CONSENT_H_SECRET}**", "", c["secret"], "",
          f"**{CONSENT_H_RETAIN}**", "", c["retain"], "",
          f"**{CONSENT_H_DURATION}**", "", c["duration"], "",
          f"**{CONSENT_H_SIGN}**", ""]
    for role, fields in c["signs"]:
        L.append("- " + consent_sign_line(role, fields))
    for role, fields in c["optional_signs"]:
        L.append("- " + consent_sign_line(role, fields))
    L.append("")
    return L

# ======================= 상담사용 별지 내용 =======================
COUNSELOR_INTRO = [
 "이 질문지는 마인드가든심리상담센터가 자체 제작한 상담 면담 참고용 질문지입니다. 표준화 검사가 아니며 규준·타당도 자료나 점수화 방식이 없습니다.",
 "결과를 내담자에게 설명하거나 외부 소견서에 쓸 때 표준화 검사 결과로 표기하지 않습니다.",
 "응답은 담당 상담사가 면담 내용, 관찰, 내담자의 배경과 함께 종합해 보는 질적 참고 자료로만 씁니다. 한두 문항의 응답만으로 내담자를 판단하거나 결론을 내리지 않습니다.",
 "실시 전에 「실시 안내 및 동의」 쪽을 먼저 받습니다. 민감정보 처리에 동의하지 않으면 이 질문지를 실시하지 않으며, 동의하지 않더라도 질문지 없이 상담은 진행할 수 있습니다. 만 14세 미만은 법정대리인 동의가 있어야 실시하고, 만 14세 이상 청소년의 보호자 동의·보호자 열람 범위는 센터 규정에 따릅니다. [센터 규정 확인 필요] 한 번 받은 동의는 철회할 때까지 이후 실시에도 적용되며, 철회하면 이후 실시를 하지 않습니다. 동의 쪽은 응답지와 분리하여 보관할 수 있습니다. 응답지는 상담 기록과 같은 수준으로 잠가 보관합니다. 응답지는 실시일로부터 1년간 보관한 뒤 파쇄합니다.",
 "저학년 아동은 상담사가 문항을 읽어 주고 아이가 말한 그대로 받아 적습니다. 받아 적은 문항은 응답지에 '구술'로 표시합니다. 50문항을 한 번에 하면 아동(특히 1~2학년)에게 부담이 크므로, 쉬는 시간을 두거나 두 회기에 나눠 실시하고, 지친 기색이 보이면 멈춥니다. 주호소에 맞춰 문항을 골라 쓸지는 상담사가 판단합니다.",
 "아동용은 종이로만 실시하며, 상담사가 함께 있을 때 실시합니다.",
 "'□ 해당 없음' 표시와 빈 문항은 회피와 구별해 봅니다. 가족 형태(한부모·조손·재혼·입양·위탁 등)나 연애·결혼·자녀 여부 때문에 해당하지 않는 것일 수 있습니다.",
 "문항은 영역이 연달아 나오지 않도록 섞어 배치했고, 같은 영역 안에서도 긍정·중립·부정 방향과 과거·현재·미래 시점을 섞었습니다. 영역별로 다시 모아 읽을 때는 아래 문항 번호표를 씁니다.",
]
LENSES = [
 ("정서 톤", "응답 전반의 기분(밝음·가라앉음·날카로움·무덤덤함)과, 같은 영역 안에서 긍정 방향 문항에도 부정적으로 답하는지(또는 그 반대) 살핍니다."),
 ("반복 주제", "여러 영역에 걸쳐 되풀이되는 인물·사건·단어(예: 비교, 실패, 외로움, 특정 가족 구성원)를 표시합니다."),
 ("회피·생략·짧은 응답", "비워 둔 문항, '모름'·'없음'·'그냥'처럼 짧게 끝낸 문항, 문항과 다른 쪽으로 돌린 응답을 살핍니다. 이런 응답이 특정 영역에 몰려 있는지 확인하고 면담에서 부드럽게 다시 물어볼 후보로 둡니다."),
 ("갈등 대상", "부정적 정서가 향하는 대상(부모, 형제, 배우자, 또래, 교사, 상사, 자기 자신)과 갈등을 다루는 방식(참기, 터뜨리기, 피하기, 대화)을 살핍니다."),
 ("자기상", "스스로를 묘사하는 말의 온도(비난·체념·과장·균형), 남이 보는 나와 내가 보는 나의 차이를 봅니다."),
 ("강점·자원", "버팀목이 되는 사람·활동, 이겨 낸 경험, 스스로 인정하는 장점을 찾습니다. 상담 목표와 개입 방향을 세울 때 출발점으로 씁니다."),
 ("현실 검증", "응답이 문항 맥락과 맞는지, 앞뒤가 이어지는지, 소원·미래 응답이 비현실적으로 과장되거나 지나치게 막막한지 봅니다. 아동의 공상·소원 응답은 발달상 자연스러울 수 있으며, 이 질문지만으로 현실 검증력을 판단하지 않습니다."),
 ("시간 조망", "과거 문항에서의 후회·미련, 현재 문항에서의 버거움, 미래 문항에서의 기대 또는 막막함을 비교합니다."),
]
DOMAIN_POINTS = {
 "adult": {
  "자기개념": "자기 묘사의 온도, 숨기는 모습과 드러내는 모습의 차이, 과거·미래의 나를 대하는 태도를 봅니다.",
  "부모/원가족": "양육자 각각에 대한 정서 차이, 어린 시절 맡았던 역할(돌봄·눈치), 물려받은 것에 대한 수용 정도를 봅니다. '해당 없음' 표시도 함께 확인합니다.",
  "배우자·연인": "친밀감과 거리감, 말하지 못한 갈등, 과거 관계에서 이어지는 패턴을 봅니다. '해당 없음' 표시는 비혼·무연애 등 삶의 방식일 수 있으므로 문제로 해석하지 않습니다.",
  "자녀": "'해당 없음' 표시 여부를 먼저 확인합니다. 그다음 양육 효능감, 자녀와의 갈등 대처, 원가족 경험의 대물림 여부를 봅니다.",
  "대인관계": "타인의 평가에 대한 민감도, 지지 체계의 유무, 관계에서 물러서는 상황을 봅니다.",
  "직장·역할": "역할 부담과 인정 욕구, 평가 상황의 긴장, 일과 쉼의 균형에 대한 기대를 봅니다.",
  "정서": "우울·불안·분노·죄책감·수치심 중 어느 쪽 응답이 길고 구체적인지, 몸의 반응·행동 묘사, 회복 단서(화가 가라앉은 뒤)를 봅니다.",
  "과거 경험": "전환점으로 꼽는 사건, 아직 남아 있는 말, 과거를 돌아보는 태도(후회 중심인지 의미 부여가 되는지)를 봅니다.",
  "미래·목표": "목표의 구체성과 현실성, 장애물을 바라보는 방식, 상담에 대한 기대를 봅니다.",
  "대처·자원·강점": "주로 쓰는 대처(건강한 것·위험한 것), 도움 요청을 막는 이유, 활용 가능한 자원을 봅니다.",
  "가치·의미": "삶에서 붙드는 원칙과 의미, 마무리 문항에서 드러나는 질문지 작성 경험을 봅니다.",
 },
 "teen": {
  "자기개념·신체상": "외모·몸에 대한 평가와 타인의 말에 대한 반응, 성장에 따른 자기 변화 인식을 봅니다.",
  "부모": "보호자별 정서 차이, 통제·간섭에 대한 반응, 부모에게 인정받고 싶은 부분을 봅니다. '해당 없음' 표시도 함께 확인합니다.",
  "형제": "비교 경험, 경쟁과 친밀감, 형제가 없는 경우 응답 방식을 봅니다.",
  "친구·또래": "소속감과 소외감, 또래 안의 역할, 배신·따돌림 경험 단서를 봅니다.",
  "좋아하는 마음·관계": "관심과 불편감, 관계에서 중요하게 여기는 것, 어른들의 시선에 대한 반응을 봅니다.",
  "학교·교사·학업": "평가·발표 상황의 긴장, 교사와의 관계, 학업 부담과 미루기, 학교 안의 쉼터를 봅니다.",
  "정서": "기쁨·우울·외로움·불안·분노·미안함 중 두드러진 정서, 몸 반응과 밤 시간대 응답, 화를 다루는 방식을 봅니다.",
  "미디어·여가": "몰입 대상, 휴대폰 사용 조절, 온라인에서 받은 상처, 여가의 질을 봅니다.",
  "미래·진로": "진로 이야기에 대한 압박감, 본인과 가족 기대의 차이, 미래 자기상의 구체성을 봅니다.",
  "강점·대처": "기댈 사람, 끝까지 해낸 경험, 스트레스 대처 방식의 안전성, 또래가 인정하는 장점을 봅니다.",
 },
 "child": {
  "나": "자기 자신·친구가 보는 나에 대한 느낌, 스스로 해내는 일(유능감), 자신에게 실망하는 상황을 봅니다.",
  "엄마·아빠·가족": "양육자별 정서 차이, 바쁨·부름에 대한 반응, 가족 일상의 분위기, 형제 관계를 봅니다. 외동이면 형제 문항은 해당하지 않을 수 있습니다.",
  "친구": "놀이 친구 유무, 거절·다툼 뒤 반응, 친구에게 받고 싶은 말을 봅니다.",
  "학교·선생님": "등교 정서, 칭찬·꾸중에 대한 반응, 학습 어려움 단서를 봅니다.",
  "감정": "기쁨·슬픔·무서움·화 각각의 응답 길이와 구체성, 몸 표현, 화가 풀리는 방법을 봅니다.",
  "놀이·좋아하는 것": "혼자 놀이와 함께 놀이의 비율, 미디어 내용, 즐거움의 원천을 봅니다.",
  "바람·소원": "소원이 물건·사람·관계 중 어디를 향하는지, 가족에게 바라는 것을 봅니다.",
  "걱정": "걱정의 대상(가족 갈등, 몸, 학교), 걱정을 나눌 사람이 있는지를 봅니다.",
 },
}
CRISIS = [
 "이 질문지에는 자해·자살을 직접 묻는 문항이 없습니다. 다만 정서·미래·걱정 영역이나 마무리 문항에서 '사라지고 싶다', '끝내고 싶다', '없어지는 게 낫다', 자신이나 다른 사람을 해치는 내용, 극심한 절망감, 학대·폭력 피해를 짐작하게 하는 내용이 보이면 위기 신호로 봅니다.",
 "위기 신호가 보이면 해석을 미루지 말고 같은 회기 안에서 직접 확인 면담을 하고, 센터 위기 개입 절차를 따릅니다. [센터 규정 확인 필요: 보고 대상(책임 상담사·센터장), 안전 계획 양식, 보호자·기관 연락 기준, 기록 방식]",
 "아동·청소년의 학대 의심, 자해·타해 위험 등 비밀보장의 예외는 상담 동의서와 관련 법령에 따라 처리합니다. [센터 규정 확인 필요: 신고 의무 절차]",
]
CHECKLIST = [
 "센터가 보유한 출판 검사지(원본)와 이 질문지의 문항을 한 문항씩 대조해, 같거나 매우 비슷한 문장이 없는지 확인했습니다.",
 "내담자(또는 법정대리인)의 「실시 안내 및 동의」 쪽에서 민감정보 처리 동의를 확인했습니다. 만 14세 미만은 법정대리인 서명이 있습니다. 동의가 없거나 철회되었으면 실시하지 않습니다.",
 "작성된 응답지는 잠금장치가 있는 곳에 보관하고, 실시일로부터 1년간 보관한 뒤 파쇄합니다.",
 "상담사가 문항을 직접 수정·선별한 내역(날짜, 수정자, 바꾼 문항과 이유)을 기록으로 남깁니다. 이 기록은 센터 자체 제작의 근거 자료가 됩니다.",
 "질문지를 외부에 판매·배포하거나 다른 기관에 제공하려면 사전에 변호사 검토를 받습니다.",
]

DIR_LABEL = {"+": "긍정", "0": "중립", "-": "부정"}

def domain_numbers(f):
    nums = {d: [] for d in f["src"]}
    for i, it in enumerate(f["items"], 1): nums[it["domain"]].append(i)
    return nums

def label(it):
    return it["domain"] + (f"({it['sub']})" if it["sub"] else "")

def item_text(it, md=False):
    return it["text"] + ("  [□ 해당 없음]" if it["na"] else "")

# ======================= Markdown =======================
def build_md():
    L = [f"# {TITLE} (v3)", "", f"> {FOOTER_NOTE}", ""]
    for f in FORMS:
        L += ["---", "", f"## {f['title']} — 대상: {f['target']}", ""]
        L += consent_md_block(f["key"])
        L += ["---", "", f"### {f['title']} 응답지", ""]
        for ri, row in enumerate(f["header"]):
            cells = [x for pair in row for x in pair] + [""] * (4 - 2 * len(row))
            L.append("| " + " | ".join(cells) + " |")
            if ri == 0: L.append("|---|---|---|---|")
        L += ["", "**실시 안내**", ""]
        L += [f"- {g}" for g in f["guide"]] + [""]
        for i, it in enumerate(f["items"], 1):
            L += [f"{i}. {item_text(it)} ____________________________________", "",
                  "    ______________________________________________________", ""]
        L += ["*끝까지 작성해 주셔서 고맙습니다. 작성한 질문지는 상담 선생님께 전해 주세요.*", "",
              f"> {DISCLAIMER}", ""]
    L += ["---", "", "## 상담사용 별지", "", f"*{COUNSELOR_SUB}*", "", "### 1. 사용 원칙", ""]
    L += [f"- {t}" for t in COUNSELOR_INTRO] + ["", "### 2. 해석할 때 보는 8가지 관점(모든 영역 공통)", ""]
    L += [f"- **{a}**: {b}" for a, b in LENSES] + [""]
    n = 3
    for f in FORMS:
        nums = domain_numbers(f)
        L += [f"### {n}. {f['title']} — 영역별 문항 번호표 · 볼 포인트(총 {len(f['items'])}문항)", "",
              "| 영역 | 문항 수 | 문항 번호 | 해석 시 볼 포인트 |", "|---|---|---|---|"]
        L += [f"| {d} | {len(nums[d])} | {', '.join(map(str, nums[d]))} | {DOMAIN_POINTS[f['key']][d]} |" for d in f["src"]]
        L += [f"| **합계** | **{len(f['items'])}** | | |", "", f"**{f['title']} 문항 일람**(방향: 긍정/중립/부정 · 시점: 과거/현재/미래)", "",
              "| 번호 | 문항 | 영역(세부) | 방향 | 시점 |", "|---|---|---|---|---|"]
        L += [f"| {i} | {item_text(it)} | {label(it)} | {DIR_LABEL[it['dir']]} | {it['time']} |" for i, it in enumerate(f["items"], 1)]
        L += ["", f"**{f['title']} 응답 기록 요약표** ({RECORD_LINE.replace(chr(10), "   ").replace("   ", " · ")})", "",
              "| 영역 | 문항 번호 | 영역별 메모(정서 톤·생략·짧은 응답) | 주요 주제 | 면담에서 확인할 질문 |", "|---|---|---|---|---|"]
        L += [f"| {d} | {', '.join(map(str, nums[d]))} |  |  |  |" for d in f["src"]]
        L += ["| 종합 | 전체 |  |  |  |", ""]
        n += 1
    L += [f"### {n}. 위기 신호 대응 안내", ""] + [f"- {t}" for t in CRISIS] + [""]
    L += [f"### {n+1}. 사용 전 확인", ""] + [f"- [ ] {t}" for t in CHECKLIST] + ["", "---", "", f"> {COUNSELOR_DISCLAIMER}", "", f"*{LEGAL_REVIEW_NOTE}*", ""]
    open(OUT + "mindgarden_sct_v3.md", "w", encoding="utf-8").write("\n".join(L))

# ======================= DOCX =======================
FONT = "맑은 고딕"
def set_font(run, size=None, bold=None, color=None):
    run.font.name = FONT
    rpr = run._element.get_or_add_rPr()
    rf = rpr.find(qn("w:rFonts"))
    if rf is None:
        rf = OxmlElement("w:rFonts"); rpr.append(rf)
    for a in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"): rf.set(qn(a), FONT)
    if size: run.font.size = Pt(size)
    if bold is not None: run.bold = bold
    if color: run.font.color.rgb = RGBColor(*color)

def para(doc, text="", size=10.5, bold=False, align=None, before=0, after=4, color=None):
    p = doc.add_paragraph()
    pf = p.paragraph_format; pf.space_before = Pt(before); pf.space_after = Pt(after)
    if align is not None: p.alignment = align
    if text:
        r = p.add_run(text); set_font(r, size, bold, color)
    return p

def shade(cell, hexcolor):
    tcPr = cell._element.get_or_add_tcPr()
    sh = OxmlElement("w:shd"); sh.set(qn("w:val"), "clear"); sh.set(qn("w:color"), "auto"); sh.set(qn("w:fill"), hexcolor)
    tcPr.append(sh)

def cell_text(cell, text, size=9, bold=False, align=None):
    cell.text = ""
    p = cell.paragraphs[0]; p.paragraph_format.space_after = Pt(0)
    if align is not None: p.alignment = align
    r = p.add_run(text); set_font(r, size, bold)

def fix_widths(t, widths):
    t.autofit = False
    for gc, w in zip(t._tbl.tblGrid.findall(qn("w:gridCol")), widths): gc.set(qn("w:w"), str(int(w.twips)))
    for row in t.rows:
        for c, w in zip(row.cells, widths): c.width = w

def repeat_header(t):
    trPr = t.rows[0]._tr.get_or_add_trPr(); th = OxmlElement("w:tblHeader"); th.set(qn("w:val"), "true"); trPr.append(th)

def no_split(t):
    for row in t.rows:
        trPr = row._tr.get_or_add_trPr(); cs = OxmlElement("w:cantSplit"); cs.set(qn("w:val"), "true"); trPr.append(cs)

def grid_table(doc, header, rows, widths, size=9, fill="E3E3E3"):
    t = doc.add_table(rows=1 + len(rows), cols=len(header)); t.style = "Table Grid"; t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for ci, v in enumerate(header):
        cell_text(t.cell(0, ci), v, size, True); shade(t.cell(0, ci), fill)
    for ri, row in enumerate(rows, 1):
        for ci, v in enumerate(row): cell_text(t.cell(ri, ci), str(v), size, ci == 0)
    fix_widths(t, widths); repeat_header(t); no_split(t)
    return t

def boxed(doc, title, lines, fill, size=9.5, bold_title=True, checkbox=False):
    box = doc.add_table(rows=1, cols=1); box.style = "Table Grid"; box.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = box.cell(0, 0); shade(c, fill); c.text = ""
    p = c.paragraphs[0]; p.paragraph_format.space_after = Pt(2)
    if title:
        r = p.add_run(title); set_font(r, size + 0.5, bold_title)
    first = not title
    for tx in lines:
        p = c.paragraphs[0] if first else c.add_paragraph(); first = False
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.left_indent = Cm(0.45); p.paragraph_format.first_line_indent = Cm(-0.45)
        r = p.add_run(("□ " if checkbox else "• ") + tx); set_font(r, size)
    return box

def disclaimer(doc, before=10, text=None):
    p = para(doc, "", after=0, before=before)
    p.paragraph_format.keep_together = True
    t = doc.add_table(rows=1, cols=1); t.style = "Table Grid"; t.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = t.cell(0, 0); shade(c, "F3F3F3"); cell_text(c, text or DISCLAIMER, 8, False)
    no_split(t)

def page_break(doc):
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

def add_consent_page(doc, f):
    """내담자용 양식 앞에 두는 실시 안내 및 동의 1쪽. 아동용도 보호자 대상이므로 성인용 서체를 쓴다."""
    c = CONSENT[f["key"]]
    para(doc, CENTER, 10, False, WD_ALIGN_PARAGRAPH.CENTER, after=0, color=(90,90,90))
    para(doc, f["title"], 16, True, WD_ALIGN_PARAGRAPH.CENTER, after=2)
    para(doc, CONSENT_TITLE, 13, True, WD_ALIGN_PARAGRAPH.CENTER, after=2)
    para(doc, c["detach"], 9, False, WD_ALIGN_PARAGRAPH.CENTER, after=8, color=(90,90,90))
    def h_cons(title):
        para(doc, title, 11, True, before=8, after=3).paragraph_format.keep_with_next = True
    def body(text, after=4):
        para(doc, text, 10.5, after=after)
    h_cons(CONSENT_H_PURPOSE); body(c["purpose"])
    h_cons(CONSENT_H_COLLECT); body(c["collect"], after=3)
    para(doc, SENSITIVE_PROMPT, 10.5, True, after=2)
    para(doc, f"{SENSITIVE_YES}        {SENSITIVE_NO}", 11, after=4)
    for note in c["notes"]:
        body(note)
    h_cons(CONSENT_H_SECRET); body(c["secret"])
    h_cons(CONSENT_H_RETAIN); body(c["retain"])
    h_cons(CONSENT_H_DURATION); body(c["duration"])
    h_cons(CONSENT_H_SIGN)
    rows = c["signs"] + c["optional_signs"]
    t = doc.add_table(rows=len(rows), cols=2)
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    from docx.shared import Cm as _Cm
    fix_widths(t, [_Cm(5.2), _Cm(11.8)])
    for i, (role, fields) in enumerate(rows):
        cell_text(t.cell(i, 0), role, 10, True)
        shade(t.cell(i, 0), "EDEDED")
        cell_text(t.cell(i, 1), "    ".join(f"{lab}  {val}" for lab, val in fields), 10.5, False)
        t.rows[i].height = _Cm(1.15)

def build_docx():
    doc = Document()
    sec = doc.sections[0]
    sec.page_height, sec.page_width = Cm(29.7), Cm(21.0)
    sec.left_margin = sec.right_margin = Cm(2.0)
    sec.top_margin = sec.bottom_margin = Cm(1.8)
    text_width = sec.page_width - sec.left_margin - sec.right_margin
    st = doc.styles["Normal"]; st.font.name = FONT; st.font.size = Pt(10.5)
    st.element.rPr.rFonts.set(qn("w:eastAsia"), FONT)

    fp = sec.footer.paragraphs[0]; fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = fp.add_run(f"{TITLE} · {FOOTER_NOTE} 무단 복제·배포를 금합니다. · "); set_font(r, 7.5, color=(110,110,110))
    r = fp.add_run(); set_font(r, 7.5, color=(110,110,110))
    for t, v in (("begin", None), (None, "PAGE"), ("end", None)):
        e = OxmlElement("w:fldChar") if t else OxmlElement("w:instrText")
        if t: e.set(qn("w:fldCharType"), t)
        else: e.set(qn("xml:space"), "preserve"); e.text = v
        r._element.append(e)

    for idx, f in enumerate(FORMS):
        if idx > 0: page_break(doc)
        add_consent_page(doc, f)
        page_break(doc)
        child = f["key"] == "child"
        para(doc, CENTER, 10, False, WD_ALIGN_PARAGRAPH.CENTER, after=0, color=(90,90,90))
        para(doc, f["title"], 16, True, WD_ALIGN_PARAGRAPH.CENTER, after=2)
        para(doc, subline(f), 9, False, WD_ALIGN_PARAGRAPH.CENTER, after=8, color=(90,90,90))
        t = doc.add_table(rows=len(f["header"]), cols=4); t.style = "Table Grid"; t.alignment = WD_TABLE_ALIGNMENT.CENTER
        fix_widths(t, [Cm(3.4), Cm(5.1), Cm(2.4), Cm(6.1)])
        for ri, row in enumerate(f["header"]):
            if len(row) == 1: t.cell(ri, 1).merge(t.cell(ri, 3))
            for k, (lab, val) in enumerate(row):
                c = t.cell(ri, 2 * k); cell_text(c, lab, 9.5, True); shade(c, "EDEDED")
                cell_text(t.cell(ri, 2 * k + 1), val, 9.5, False)
        para(doc, "", after=2)
        boxed(doc, "실시 안내", f["guide"], "F6F6F6", size=11 if child else 9.5)
        para(doc, "", after=4)

        sz = f["size"]
        for i, it in enumerate(f["items"], 1):
            p = doc.add_paragraph(); pf = p.paragraph_format
            pf.space_before = Pt(f["gap"]); pf.space_after = Pt(0); pf.line_spacing = f["spacing"]
            pf.keep_with_next = True; pf.keep_together = True
            ind = Cm(0.9)
            pf.left_indent = ind; pf.first_line_indent = -ind
            pf.tab_stops.add_tab_stop(ind)
            pf.tab_stops.add_tab_stop(text_width, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.LINES)
            r = p.add_run(f"{i}.\t{it['text']} "); set_font(r, sz)
            if it["na"]:
                r = p.add_run("[□ 해당 없음] "); set_font(r, sz - 1.5, color=(100,100,100))
            r = p.add_run("\t"); set_font(r, sz)
            for k in range(f["lines"] - 1):
                p2 = doc.add_paragraph(); q = p2.paragraph_format
                q.space_before = Pt(0); q.space_after = Pt(0); q.left_indent = ind; q.line_spacing = f["spacing"]
                q.tab_stops.add_tab_stop(text_width, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.LINES)
                if k < f["lines"] - 2: q.keep_with_next = True
                rr = p2.add_run("\t"); set_font(rr, sz)
        para(doc, "끝까지 작성해 주셔서 고맙습니다. 작성한 질문지는 상담 선생님께 전해 주세요.",
             11 if child else 9.5, False, WD_ALIGN_PARAGRAPH.CENTER, before=12, after=0, color=(90,90,90))
        disclaimer(doc)

    # ---------- 상담사용 별지 ----------
    from docx.enum.section import WD_SECTION
    csec = doc.add_section(WD_SECTION.NEW_PAGE)
    csec.page_height, csec.page_width = sec.page_height, sec.page_width
    csec.left_margin = csec.right_margin = sec.left_margin
    csec.top_margin = csec.bottom_margin = sec.top_margin
    csec.footer.is_linked_to_previous = False
    cfp = csec.footer.paragraphs[0]; cfp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cr = cfp.add_run(f"{TITLE} · {CENTER}에서 자체 제작했습니다. {FOOTER_NOTE_COUNSELOR} 무단 복제·배포를 금합니다. · "); set_font(cr, 7.5, color=(110,110,110))
    cr = cfp.add_run(); set_font(cr, 7.5, color=(110,110,110))
    for typ, val in (("begin", None), (None, "PAGE"), ("end", None)):
        e = OxmlElement("w:fldChar") if typ else OxmlElement("w:instrText")
        if typ: e.set(qn("w:fldCharType"), typ)
        else: e.set(qn("xml:space"), "preserve"); e.text = val
        cr._element.append(e)
    para(doc, "상담사용 별지", 16, True, WD_ALIGN_PARAGRAPH.CENTER, after=0)
    para(doc, COUNSELOR_SUB, 9, False, WD_ALIGN_PARAGRAPH.CENTER, after=10, color=(160,40,40))
    def h(text, size=12, before=10): para(doc, text, size, True, before=before, after=4).paragraph_format.keep_with_next = True
    def bullet(text, size=9.5, lead=None):
        p = para(doc, "", after=2); p.paragraph_format.left_indent = Cm(0.5); p.paragraph_format.first_line_indent = Cm(-0.4)
        if lead:
            r = p.add_run(f"• {lead}: "); set_font(r, size, True); r = p.add_run(text); set_font(r, size)
        else:
            r = p.add_run("• " + text); set_font(r, size)
    h("1. 사용 원칙", before=0)
    for tx in COUNSELOR_INTRO: bullet(tx)
    h(f"2. {H_LENSES}")
    for a, b in LENSES: bullet(b, lead=a)
    n = 3
    for f in FORMS:
        page_break(doc)
        nums = domain_numbers(f)
        h(f"{n}. {f['title']} (총 {len(f['items'])}문항)", 13, before=0)
        h(f"{n}-1. {H_DOMAIN}", 11, before=4)
        rows = [(d, len(nums[d]), ", ".join(map(str, nums[d])), DOMAIN_POINTS[f["key"]][d]) for d in f["src"]]
        rows.append(("합계", len(f["items"]), "", ""))
        grid_table(doc, ["영역", "문항 수", "문항 번호", "해석 시 볼 포인트"], rows, [Cm(3.0), Cm(1.4), Cm(3.6), Cm(9.0)], 8.5)
        page_break(doc)
        h(f"{n}-2. 응답 기록 요약표", 11, before=0)
        para(doc, RECORD_LINE, 9, after=4)
        rows = [(d, ", ".join(map(str, nums[d])), "", "", "") for d in f["src"]] + [("종합", "전체", "", "", "")]
        t = grid_table(doc, ["영역", "문항 번호", "영역별 메모\n(정서 톤·생략·짧은 응답)", "주요 주제", "면담에서 확인할 질문"], rows,
                       [Cm(2.6), Cm(2.4), Cm(4.2), Cm(3.6), Cm(4.2)], 8.5)
        for row in t.rows[1:]:
            row.height = Cm(1.25)
        h(f"{n}-3. {H_LIST}", 11)
        rows = [(i, item_text(it), label(it), DIR_LABEL[it["dir"]], it["time"]) for i, it in enumerate(f["items"], 1)]
        grid_table(doc, ["번호", "문항", "영역(세부)", "방향", "시점"], rows, [Cm(1.0), Cm(9.2), Cm(4.0), Cm(1.4), Cm(1.4)], 8.5)
        n += 1
    page_break(doc)
    h(f"{n}. 위기 신호 대응 안내", before=0)
    boxed(doc, "", CRISIS, "FDEEEE", size=9.5)
    h(f"{n+1}. 사용 전 확인")
    boxed(doc, "아래 항목을 모두 확인한 뒤 사용하세요.", CHECKLIST, "FFF7E0", size=9.5, checkbox=True)
    para(doc, "확인자: __________   확인일: 20____. ____. ____.", 9.5, before=6)
    disclaimer(doc, before=14, text=COUNSELOR_DISCLAIMER)
    para(doc, LEGAL_REVIEW_NOTE, 8, False, WD_ALIGN_PARAGRAPH.CENTER, before=6, after=0, color=(110,110,110))
    doc.save(OUT + "mindgarden_sct_v3.docx")

# ======================= 검증 =======================
def verify():
    ok = True
    for f in FORMS:
        items = f["items"]
        if len(items) != 50: print("문항 수 오류", f["key"], len(items)); ok = False
        texts = [it["text"] for it in items]
        if len(set(texts)) != len(texts): print("중복 문항", f["key"]); ok = False
        for a, b in zip(items, items[1:]):
            if a["domain"] == b["domain"]: print("영역 연속", f["key"], a["text"], b["text"]); ok = False
    old = {r[1] for r in REPLACED} | {r[1] for r in REPLACED_V3 if r[1] != r[2]}  # 해당 없음만 추가한 문항은 문장 유지
    for f in FORMS:
        for it in f["items"]:
            if it["text"] in old: print("지적 문항 잔존", it["text"]); ok = False
    banned = ["치료", "진단", "완치", "100%", "자해", "자살", "죽"]
    for f in FORMS:
        for it in f["items"]:
            for w in banned:
                if w in it["text"]: print("문항 금지어", w, it["text"]); ok = False
    client_ban = ["치료", "완치", "100%", "표준화 검사가 아닙니다", "표준화 검사 아님", "법률 검토 권장"]
    for key in ("adult", "teen", "child"):
        blob = chr(10).join(consent_plain_parts(key))
        for w in client_ban:
            if w in blob:
                print("동의 쪽 금지어", key, w); ok = False
        if LEGAL_REVIEW_NOTE in blob:
            print("내담자 동의 쪽에 법률 검토 권장", key); ok = False
    if LEGAL_REVIEW_NOTE not in " ".join(CHECKLIST + [LEGAL_REVIEW_NOTE]):
        print("상담사용 별지에 법률 검토 권장 없음"); ok = False
    if "[센터 규정 확인 필요]" in CONSENT_RETAIN:
        print("동의 쪽 보관 기간이 아직 확인 필요로 남아 있음"); ok = False
    if "1년간" not in CONSENT_RETAIN or "파쇄합니다" not in CONSENT_RETAIN:
        print("종이 동의 보관 기간 문구 오류"); ok = False
    if "1년간" not in CONSENT_RETAIN_ONLINE or "파기합니다" not in CONSENT_RETAIN_ONLINE:
        print("온라인 동의 보관 기간 문구 오류"); ok = False
    if "파쇄합니다" in CONSENT_RETAIN_ONLINE:
        print("온라인 동의 보관 문구에 파쇄가 들어 있음"); ok = False
    if "관리번호" not in RECORD_LINE:
        print("상담사용 별지에 관리번호 칸 없음"); ok = False
    for f in FORMS:
        blob = " ".join(lab for row in f["header"] for lab, _ in row)
        if "관리번호" in blob or "이니셜" in blob or "내담자 번호" in blob or "내담자번호" in blob:
            print("내담자용 머리 칸 오류", f["key"], blob); ok = False
    if "아동용은 종이로만 실시하며" not in " ".join(COUNSELOR_INTRO):
        print("별지에 아동용 종이 전용 안내 없음"); ok = False
    return ok

def build_web_handoff():
    """Clinic-OS 연동용 인수인계. 내담자 개인정보 예시 데이터는 넣지 않는다."""
    L = [
        "# 마인드가든 문장완성 질문지 — 웹서비스(Clinic-OS) 인수인계",
        "",
        "작성일: 2026-11-23 (Asia/Seoul)",
        "문구 원본: `/workspace/center-ops/sct/build_sct_v3.py`",
        "인쇄용 디자인 빌드: `/workspace/center-ops/sct/print-design-v3/`",
        "",
        "이 문서는 질문지 실시 동의와 문항 구조를 웹서비스에 넣기 위한 인수인계입니다. "
        "온라인에서는 성인용과 청소년용만 실시합니다. 아동용은 온라인으로 실시하지 않으며, 종이로만 상담사가 함께 있을 때 실시합니다. "
        "내담자용 화면에는 ‘표준화 검사가 아닙니다’라는 문구를 넣지 않습니다. 그 안내는 상담사용 별지에만 둡니다. "
        "‘치료’, ‘완치’, ‘100%’ 표현은 쓰지 않습니다. 외부 기관 이름과 연락처는 넣지 않습니다. "
        "응답은 실시일로부터 1년간 보관한 뒤 파기합니다.",
        "",
        "## 1. 온라인 실시 범위와 동의 처리 규칙",
        "",
        "- 온라인에서는 성인용과 청소년용만 실시합니다.",
        "- 아동용은 온라인 미제공(종이 전용)입니다. 아동용은 종이로만, 상담사가 함께 있을 때 실시합니다.",
        "- 동의는 내담자 단위로 관리합니다. 한 번 동의하면 철회할 때까지 이후 실시에도 유지합니다.",
        "- 질문지를 실시하거나 배부하기 전에, 해당 내담자의 동의 상태를 확인합니다.",
        "  - 필수: 민감정보(심리·건강 관련 정보) 처리 동의(동의함).",
        "  - 만 14세 미만: 법정대리인(보호자) 동의가 있어야 합니다.",
        "  - 만 14세 이상 청소년의 보호자 동의·열람 범위는 센터 규정을 따릅니다. [센터 규정 확인 필요]",
        "- 위 필수 동의가 없거나 철회된 상태이면 실시와 배부를 막습니다. 동의하지 않더라도 질문지 없이 상담은 진행할 수 있습니다.",
        "- 동의 일시와 동의자(내담자 본인 또는 법정대리인, 법정대리인인 경우 관계)를 기록합니다.",
        "- 내담자 또는 법정대리인은 동의를 철회할 수 있습니다. 철회 일시와 철회자를 기록하고, 철회 이후의 실시는 막습니다.",
        "- 동의 기록은 응답 내용과 분리하여 보관할 수 있어야 합니다.",
        "- 작성한 응답은 상담 기록과 같은 수준으로 잠가 보관합니다. 응답은 실시일로부터 1년간 보관한 뒤 파기합니다.",
        "",
        "온라인에서 관리번호는 시스템이 자동으로 부여합니다. 테넌트 단위 시퀀스 또는 해시를 쓰며, 이름·생년월일·전화번호 등 개인정보를 넣지 않습니다. 사람이 수정할 수 없게 합니다. 종이용 관리번호는 상담사용 별지의 관리번호 칸에 적습니다. 내담자용 양식에는 관리번호 칸을 두지 않습니다.",
        "",
        "## 2. 필수·선택 항목과 서명 주체",
        "",
        "| 구분 | 온라인 실시 | 민감정보 동의 | 본인 서명 | 법정대리인 서명·관계 | 아동 본인 이름 확인 | 실시 차단 조건 |",
        "|---|---|---|---|---|---|---|",
        "| 성인(19세 이상) | 제공합니다 | 필수 | 필수 | 해당 없음 | 해당 없음 | 민감정보 미동의 또는 철회 |",
        "| 청소년(만 14세 이상) | 제공합니다 | 필수 | 필수 | 센터 규정에 따름 [센터 규정 확인 필요] | 해당 없음 | 민감정보 미동의 또는 철회. 보호자 동의는 센터 규정 |",
        "| 청소년(만 14세 미만) | 제공합니다 | 필수 | 본인 서명 칸은 두되, 법정대리인 동의가 필수 | 필수 | 해당 없음 | 민감정보 미동의·철회, 또는 법정대리인 동의 없음 |",
        "| 아동(초등학생, 만 14세 미만) | 온라인 미제공(종이 전용) | 필수(법정대리인) | 해당 없음 | 필수 | 선택 | 민감정보 미동의·철회, 또는 법정대리인 동의 없음 |",
        "",
        "온라인 화면(성인용·청소년용)에는 다음 문장을 넣습니다. “한 번 동의하면 철회할 때까지 이후 실시에도 적용됩니다. 동의는 언제든 철회할 수 있습니다.” "
        "아동용 동의 문구는 종이 동의 쪽에만 둡니다. 종이 아동용에는 “한 번 동의하시면 철회하실 때까지 이후 실시에도 적용됩니다. 동의는 언제든 철회하실 수 있습니다.”를 씁니다.",
        "",
        "종이 동의 쪽의 보관 문구는 다음과 같습니다. “작성한 응답지는 상담 기록과 같은 수준으로 잠가 보관합니다. 응답지는 실시일로부터 1년간 보관한 뒤 파쇄합니다.” "
        "온라인 화면의 보관 문구는 다음과 같습니다. “작성한 응답은 상담 기록과 같은 수준으로 잠가 보관합니다. 응답은 실시일로부터 1년간 보관한 뒤 파기합니다.”",
        "",
        "상담사용 별지와 관리자 화면에는 작은 글씨로 “법률 검토 권장”을 표시합니다. 내담자용 화면에는 넣지 않습니다.",
        "",
        "## 3. 동의 쪽 문구 전문",
        "",
        "성인용·청소년용 온라인 화면에는 아래 문장을 그대로 씁니다. 보관·파기 문장만 종이 동의 쪽과 다릅니다. 종이는 ‘응답지’와 ‘파쇄합니다’를, 온라인은 ‘응답’과 ‘파기합니다’를 씁니다. 내담자 이름 칸은 서명란 외에 만들지 않습니다. 아동용 문구는 온라인에 넣지 않으며, 종이 동의 쪽 참고용으로만 둡니다.",
        "",
    ]
    titles = {"adult": "성인용", "teen": "청소년용", "child": "아동용"}
    for key in ("adult", "teen", "child"):
        f = next(x for x in FORMS if x["key"] == key)
        c = CONSENT[key]
        heading = f"### {titles[key]} (대상: {f['target']})"
        if key == "child":
            heading += " — 온라인 미제공(종이 전용)"
        L += [heading, ""]
        if key == "child":
            L += ["아동용은 온라인으로 실시하지 않습니다. 아래는 종이 동의 쪽 문구이며, 온라인 화면에는 넣지 않습니다.", ""]
        L += [f"**{CONSENT_TITLE}**", "", c["detach"], "",
              f"**{CONSENT_H_PURPOSE}**", "", c["purpose"], "",
              f"**{CONSENT_H_COLLECT}**", "", c["collect"], "",
              f"**{SENSITIVE_PROMPT}**", "", f"- {SENSITIVE_YES}", f"- {SENSITIVE_NO}", ""]
        for note in c["notes"]:
            L += [note, ""]
        retain = CONSENT_RETAIN if key == "child" else CONSENT_RETAIN_ONLINE
        L += [f"**{CONSENT_H_SECRET}**", "", c["secret"], "",
              f"**{CONSENT_H_RETAIN}**", "", retain, "",
              f"**{CONSENT_H_DURATION}**", "", c["duration"], "",
              f"**{CONSENT_H_SIGN}**", ""]
        for role, fields in c["signs"]:
            L.append(f"- {consent_sign_line(role, fields)}")
        for role, fields in c["optional_signs"]:
            L.append(f"- {consent_sign_line(role, fields)}")
        L.append("")
    L += ["## 4. 질문지 구조", "",
          "양식마다 문항은 50개입니다. 문항 문구와 배열의 원본은 `/workspace/center-ops/sct/build_sct_v3.py`의 `FORMS`입니다. "
          "온라인 실시 대상은 성인용과 청소년용입니다. 아동용 문항 원문은 종이 실시와 참고를 위해 아래에 둡니다.",
          ""]
    for f in FORMS:
        key = f["key"]
        nums = domain_numbers(f)
        na = [(i, it["text"]) for i, it in enumerate(f["items"], 1) if it.get("na")]
        online = "온라인 미제공(종이 전용)" if key == "child" else "온라인에서 실시합니다"
        L += [f"### {titles[key]}", "",
              f"- 대상: {f['target']}",
              f"- 온라인 실시: {online}",
              f"- 문항 수: {len(f['items'])}문항",
              "- 머리 칸:"]
        for row in f["header"]:
            for lab, val in row:
                L.append(f"  - {lab}: `{val}`")
        L += ["", "- 영역별 문항 번호:"]
        for d in f["src"]:
            L.append(f"  - {d}: {', '.join(map(str, nums[d]))}")
        L += ["", "- ‘□ 해당 없음’ 표시가 있는 문항:"]
        if na:
            for i, text in na:
                L.append(f"  - {i}번. {text}")
        else:
            L.append("  - 없음")
        L += ["", "- 문항 일람:", "",
              "| 번호 | 문항 | 영역 | 해당 없음 |", "|---|---|---|---|"]
        for i, it in enumerate(f["items"], 1):
            na_mark = "예" if it.get("na") else ""
            L.append(f"| {i} | {it['text']} | {label(it)} | {na_mark} |")
        L.append("")
    L += ["## 5. 참고", "",
          "- 비밀보장의 예외 목록은 이 동의 쪽에 반복하지 않습니다. 상담 동의서에 안내한 기준을 따른다고만 적습니다.",
          "- 기존 상담 동의서(`/workspace/docs-mindgarden/forms/상담동의서.md`)에는 민감정보 별도 동의, 만 14세 미만 법정대리인 동의, 기록 보관·파기, 질문지 실시 안내가 없습니다. 이 질문지 동의 쪽이 그 공백을 보완합니다.",
          "- 이 동의 양식은 센터 내부 실무 문안입니다. 법률 검토를 권장합니다.",
          ""]
    path = OUT + "web-handoff.md"
    open(path, "w", encoding="utf-8").write(chr(10).join(L))
    return path


if __name__ == "__main__":
    if not verify(): sys.exit("검증 실패")
    build_md(); build_docx()
    hp = build_web_handoff()
    for f in FORMS:
        nums = domain_numbers(f)
        print(f["key"], len(f["items"]), " · ".join(f"{d}:{len(nums[d])}" for d in f["src"]))
    print("handoff", hp)
