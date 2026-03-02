package com.coresolution.consultation.assessment.service.impl;

import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;

/**
 * Tess4J(Tesseract) 기반 이미지 OCR 서비스. 한글(kor) 지원.
 *
 * @author Core Solution
 * @since 2026-03-02
 */
@Slf4j
@Service
public class TesseractOcrService {

    private static final String DEFAULT_LANG = "kor";

    @Value("${psych.assessment.tesseract.datapath:}")
    private String tessDataPath;

    /**
     * 이미지 InputStream에서 텍스트 추출.
     *
     * @param imageStream 이미지 바이트 스트림 (JPG, PNG 등)
     * @return 추출된 텍스트 또는 null (실패 시)
     */
    public String extractText(InputStream imageStream) {
        if (imageStream == null) {
            return null;
        }
        try {
            BufferedImage image = ImageIO.read(imageStream);
            if (image == null) {
                log.warn("TesseractOcrService: 이미지 로드 실패 (형식 미지원 또는 손상)");
                return null;
            }
            return extractText(image);
        } catch (IOException e) {
            log.warn("TesseractOcrService: 이미지 읽기 실패: {}", e.getMessage());
            return null;
        }
    }

    /**
     * BufferedImage에서 텍스트 추출.
     *
     * @param image 이미지
     * @return 추출된 텍스트 또는 null (실패 시)
     */
    public String extractText(BufferedImage image) {
        if (image == null) {
            return null;
        }
        try {
            Tesseract tesseract = createTesseract();
            String text = tesseract.doOCR(image);
            return StringUtils.hasText(text) ? text.trim() : null;
        } catch (TesseractException e) {
            log.warn("TesseractOcrService: OCR 실패 - Tesseract가 설치되어 있는지 확인해 주세요. error={}", e.getMessage());
            return null;
        }
    }

    private Tesseract createTesseract() {
        Tesseract tesseract = new Tesseract();
        tesseract.setLanguage(DEFAULT_LANG);
        if (StringUtils.hasText(tessDataPath)) {
            tesseract.setDatapath(tessDataPath);
        } else {
            String envPrefix = System.getenv("TESSDATA_PREFIX");
            if (StringUtils.hasText(envPrefix)) {
                String datapath = envPrefix.endsWith("tessdata") ? envPrefix : envPrefix + "/tessdata";
                tesseract.setDatapath(datapath);
            }
        }
        return tesseract;
    }
}
