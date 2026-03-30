#!/usr/bin/env bash
# Tesseract OCR 및 tessdata 한글(kor) 설치 스크립트
# docs/psych-assessment/PSYCH_PDF_AND_IMAGE_UPLOAD_PLAN.md §8 참조
#
# @author Core Solution
# @since 2026-03-02

set -e

case "$(uname -s)" in
  Darwin)
    echo "macOS: Homebrew로 Tesseract 설치"
    if command -v brew &>/dev/null; then
      brew install tesseract
      TESSDATA_DIR="$(brew --prefix tesseract 2>/dev/null)/share/tessdata" || true
      if [ -z "$TESSDATA_DIR" ]; then
        TESSDATA_DIR="/opt/homebrew/share/tessdata"
        [ -d "$TESSDATA_DIR" ] || TESSDATA_DIR="/usr/local/share/tessdata"
      fi
    else
      echo "Homebrew가 설치되어 있지 않습니다. https://brew.sh 에서 설치 후 다시 실행하세요."
      exit 1
    fi
    ;;
  Linux)
    if [ -f /etc/debian_version ]; then
      echo "Debian/Ubuntu: apt로 Tesseract 설치"
      sudo apt-get update
      sudo apt-get install -y tesseract-ocr
      TESSDATA_DIR="/usr/share/tesseract-ocr/4.00/tessdata"
      [ -d "$TESSDATA_DIR" ] || TESSDATA_DIR="/usr/share/tesseract-ocr/5/tessdata"
      [ -d "$TESSDATA_DIR" ] || TESSDATA_DIR="/usr/share/tesseract-ocr/tessdata"
    elif [ -f /etc/redhat-release ]; then
      echo "RHEL/CentOS/Fedora: yum/dnf로 Tesseract 설치"
      if command -v dnf &>/dev/null; then
        sudo dnf install -y tesseract
      else
        sudo yum install -y tesseract
      fi
      TESSDATA_DIR="/usr/share/tesseract-ocr/4.00/tessdata"
      [ -d "$TESSDATA_DIR" ] || TESSDATA_DIR="/usr/share/tesseract-ocr/tessdata"
    else
      echo "지원되지 않는 Linux 배포입니다."
      exit 1
    fi
    ;;
  *)
    echo "지원되지 않는 OS입니다."
    exit 1
    ;;
esac

# tessdata 한글(kor) 확인 및 다운로드
if [ -n "$TESSDATA_DIR" ] && [ -d "$TESSDATA_DIR" ]; then
  if [ -f "$TESSDATA_DIR/kor.traineddata" ]; then
    echo "한글(kor) tessdata가 이미 설치되어 있습니다: $TESSDATA_DIR"
  else
    echo "한글(kor) tessdata 다운로드 중..."
    KOR_URL="https://github.com/tesseract-ocr/tessdata_fast/raw/main/kor.traineddata"
    if command -v curl &>/dev/null; then
      curl -L -o /tmp/kor.traineddata "$KOR_URL"
    elif command -v wget &>/dev/null; then
      wget -O /tmp/kor.traineddata "$KOR_URL"
    else
      echo "curl 또는 wget이 필요합니다."
      exit 1
    fi
    sudo mv /tmp/kor.traineddata "$TESSDATA_DIR/"
    echo "한글 tessdata 설치 완료: $TESSDATA_DIR/kor.traineddata"
  fi
else
  echo "tessdata 디렉터리를 찾을 수 없습니다. 수동으로 kor.traineddata를 설치하세요."
fi

# TESSDATA_PREFIX 설정 안내
TESSDATA_PARENT="$(dirname "$TESSDATA_DIR" 2>/dev/null)"
echo ""
echo "설치 완료. TESSDATA_PREFIX 환경 변수 설정:"
echo "  export TESSDATA_PREFIX=$TESSDATA_PARENT"
echo ""
echo "또는 application.yml에 다음을 추가:"
echo "  psych:"
echo "    assessment:"
echo "      tesseract:"
echo "        datapath: $TESSDATA_DIR"
echo ""
tesseract --version 2>/dev/null || true
tesseract --list-langs 2>/dev/null | grep -q kor && echo "kor 언어 확인됨." || echo "kor 언어가 목록에 없습니다. tessdata 경로를 확인하세요."
