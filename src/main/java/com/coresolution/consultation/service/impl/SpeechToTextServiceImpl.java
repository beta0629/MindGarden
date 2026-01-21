package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.AudioTranscription;
import com.coresolution.consultation.entity.ConsultationAudioFile;
import com.coresolution.consultation.repository.AudioTranscriptionRepository;
import com.coresolution.consultation.repository.ConsultationAudioFileRepository;
import com.coresolution.consultation.service.SpeechToTextService;
import com.google.cloud.speech.v1.*;
import com.google.protobuf.ByteString;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Google Cloud Speech-to-Text 서비스 구현체
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SpeechToTextServiceImpl implements SpeechToTextService {

    private final ConsultationAudioFileRepository audioFileRepository;
    private final AudioTranscriptionRepository transcriptionRepository;

    @Override
    @Transactional
    public AudioTranscription transcribeAudio(ConsultationAudioFile audioFile) {
        long startTime = System.currentTimeMillis();

        try {
            log.info("🎤 음성 전사 시작: audioFileId={}, fileName={}",
                audioFile.getId(), audioFile.getFileName());

            // 파일 읽기
            Path filePath = Paths.get(audioFile.getFilePath());
            byte[] audioBytes = Files.readAllBytes(filePath);
            ByteString audioContent = ByteString.copyFrom(audioBytes);

            // Google Cloud Speech API 설정
            try (SpeechClient speechClient = SpeechClient.create()) {

                // 인식 설정
                RecognitionConfig config = RecognitionConfig.newBuilder()
                    .setEncoding(getEncodingFromMimeType(audioFile.getMimeType()))
                    .setLanguageCode("ko-KR")
                    .setEnableAutomaticPunctuation(true)
                    .setModel("latest_long") // 의료 전문 모델
                    .build();

                RecognitionAudio audio = RecognitionAudio.newBuilder()
                    .setContent(audioContent)
                    .build();

                // 전사 실행
                RecognizeResponse response = speechClient.recognize(config, audio);

                // 결과 처리
                StringBuilder transcriptBuilder = new StringBuilder();
                BigDecimal totalConfidence = BigDecimal.ZERO;
                int resultCount = 0;

                for (SpeechRecognitionResult result : response.getResultsList()) {
                    SpeechRecognitionAlternative alternative = result.getAlternativesList().get(0);
                    transcriptBuilder.append(alternative.getTranscript()).append(" ");
                    totalConfidence = totalConfidence.add(
                        BigDecimal.valueOf(alternative.getConfidence() * 100));
                    resultCount++;
                }

                long processingTime = System.currentTimeMillis() - startTime;

                // 평균 신뢰도 계산
                BigDecimal avgConfidence = resultCount > 0
                    ? totalConfidence.divide(BigDecimal.valueOf(resultCount), 2, java.math.RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

                // 전사 결과 저장
                AudioTranscription transcription = AudioTranscription.builder()
                    .audioFileId(audioFile.getId())
                    .transcriptionText(transcriptBuilder.toString().trim())
                    .confidenceScore(avgConfidence)
                    .languageCode("ko-KR")
                    .processingTimeMs((int) processingTime)
                    .aiProvider("GOOGLE_SPEECH")
                    .aiModelUsed("latest_long")
                    .build();

                transcription = transcriptionRepository.save(transcription);

                // 음성 파일 상태 업데이트
                audioFile.completeTranscription();
                audioFileRepository.save(audioFile);

                log.info("✅ 음성 전사 완료: audioFileId={}, textLength={}, confidence={}%, time={}ms",
                    audioFile.getId(), transcription.getTextLength(),
                    avgConfidence.intValue(), processingTime);

                return transcription;
            }

        } catch (IOException e) {
            log.error("❌ 음성 파일 읽기 실패: audioFileId={}, error={}",
                audioFile.getId(), e.getMessage(), e);

            audioFile.failTranscription();
            audioFileRepository.save(audioFile);

            throw new RuntimeException("음성 파일 읽기 실패: " + e.getMessage(), e);

        } catch (Exception e) {
            log.error("❌ 음성 전사 실패: audioFileId={}, error={}",
                audioFile.getId(), e.getMessage(), e);

            audioFile.failTranscription();
            audioFileRepository.save(audioFile);

            throw new RuntimeException("음성 전사 실패: " + e.getMessage(), e);
        }
    }

    @Override
    public String streamTranscribe(InputStream audioStream) {
        // TODO: 실시간 스트리밍 전사 구현 (향후 개발)
        log.warn("⚠️ 실시간 스트리밍 전사는 아직 구현되지 않았습니다.");
        throw new UnsupportedOperationException("실시간 스트리밍 전사는 현재 지원되지 않습니다.");
    }

    @Override
    @Async
    @Transactional
    public void transcribeAudioAsync(Long audioFileId) {
        log.info("🔄 비동기 음성 전사 시작: audioFileId={}", audioFileId);

        try {
            ConsultationAudioFile audioFile = audioFileRepository.findById(audioFileId)
                .orElseThrow(() -> new IllegalArgumentException("음성 파일을 찾을 수 없습니다: " + audioFileId));

            audioFile.startTranscription();
            audioFileRepository.save(audioFile);

            transcribeAudio(audioFile);

        } catch (Exception e) {
            log.error("❌ 비동기 음성 전사 실패: audioFileId={}, error={}",
                audioFileId, e.getMessage(), e);
        }
    }

    @Override
    public String getTranscriptionStatus(Long audioFileId) {
        return audioFileRepository.findById(audioFileId)
            .map(ConsultationAudioFile::getTranscriptionStatus)
            .orElse("NOT_FOUND");
    }

    /**
     * MIME 타입에서 인코딩 타입 추출
     */
    private RecognitionConfig.AudioEncoding getEncodingFromMimeType(String mimeType) {
        if (mimeType == null) {
            return RecognitionConfig.AudioEncoding.LINEAR16;
        }

        if (mimeType.contains("wav")) {
            return RecognitionConfig.AudioEncoding.LINEAR16;
        } else if (mimeType.contains("ogg")) {
            return RecognitionConfig.AudioEncoding.OGG_OPUS;
        } else if (mimeType.contains("flac")) {
            return RecognitionConfig.AudioEncoding.FLAC;
        }

        return RecognitionConfig.AudioEncoding.LINEAR16;
    }
}
