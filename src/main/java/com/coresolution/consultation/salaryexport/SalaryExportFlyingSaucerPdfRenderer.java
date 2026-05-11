package com.coresolution.consultation.salaryexport;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

import com.lowagie.text.DocumentException;
import com.lowagie.text.pdf.BaseFont;

import org.xhtmlrenderer.pdf.ITextRenderer;

/**
 * Flying Saucer(OpenPDF)로 XHTML을 PDF 바이트열로 렌더링한다. classpath {@code /fonts/NotoSansKR-Regular.otf} 사용.
 *
 * @author CoreSolution
 * @since 2026-05-11
 */
public final class SalaryExportFlyingSaucerPdfRenderer {

    private static final String FONT_RESOURCE = "/fonts/NotoSansKR-Regular.otf";

    private static volatile String cachedFontAbsolutePath;

    private static final Object FONT_LOCK = new Object();

    private SalaryExportFlyingSaucerPdfRenderer() {
    }

    /**
     * XHTML 문서를 PDF로 변환한다.
     *
     * @param xhtml UTF-8 XHTML
     * @return PDF 바이트
     * @throws IllegalStateException 렌더 실패 시
     */
    public static byte[] renderToPdfBytes(String xhtml) {
        try {
            String fontPath = resolveFontPathOnDisk();
            try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                ITextRenderer renderer = new ITextRenderer();
                renderer.getFontResolver().addFont(fontPath, BaseFont.IDENTITY_H, true);
                renderer.setDocumentFromString(xhtml, null);
                renderer.layout();
                renderer.createPDF(baos);
                return baos.toByteArray();
            }
        } catch (DocumentException | IOException e) {
            throw new IllegalStateException("HTML 기반 급여 PDF 생성에 실패했습니다.", e);
        }
    }

    private static String resolveFontPathOnDisk() throws IOException {
        if (cachedFontAbsolutePath != null) {
            Path p = Path.of(cachedFontAbsolutePath);
            if (Files.isRegularFile(p)) {
                return cachedFontAbsolutePath;
            }
        }
        synchronized (FONT_LOCK) {
            if (cachedFontAbsolutePath != null) {
                Path p = Path.of(cachedFontAbsolutePath);
                if (Files.isRegularFile(p)) {
                    return cachedFontAbsolutePath;
                }
            }
            try (InputStream in = SalaryExportFlyingSaucerPdfRenderer.class.getResourceAsStream(FONT_RESOURCE)) {
                if (in == null) {
                    throw new IOException("Classpath font not found: " + FONT_RESOURCE);
                }
                Path tmp = Files.createTempFile("noto-sans-kr-export-", ".otf");
                tmp.toFile().deleteOnExit();
                Files.copy(in, tmp, StandardCopyOption.REPLACE_EXISTING);
                cachedFontAbsolutePath = tmp.toAbsolutePath().toString();
                return cachedFontAbsolutePath;
            }
        }
    }
}
