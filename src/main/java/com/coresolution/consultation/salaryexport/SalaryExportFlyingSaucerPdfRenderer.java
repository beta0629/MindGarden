package com.coresolution.consultation.salaryexport;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
            String fontUri = Path.of(fontPath).toUri().toString();
            Path parent = Path.of(fontPath).getParent();
            String baseUri = parent != null ? parent.toUri().toString() : "";
            /*
             * CSS font-family:SalaryExportKorean 와 addFont 를 동일 계열로 맞춘다.
             * @font-face 의 file: URI 로 Flying Saucer 가 글리프를 찾도록 한다(미지정 시 한글 공란 PDF).
             */
            String fontFaceBlock = "<style type=\"text/css\"><![CDATA[\n"
                    + "@font-face{font-family:SalaryExportKorean;src:url(\""
                    + Matcher.quoteReplacement(fontUri)
                    + "\");font-weight:normal;font-style:normal;}\n"
                    + "]]></style>";
            String document = injectAfterHeadOpen(xhtml, fontFaceBlock);
            try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                ITextRenderer renderer = new ITextRenderer();
                renderer.getFontResolver().addFont(fontPath, BaseFont.IDENTITY_H, true);
                renderer.setDocumentFromString(document, baseUri);
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

    private static String injectAfterHeadOpen(String xhtml, String injection) {
        if (xhtml == null || injection == null) {
            return xhtml;
        }
        Matcher m = Pattern.compile("(?i)<head[^>]*>").matcher(xhtml);
        if (m.find()) {
            int end = m.end();
            return xhtml.substring(0, end) + injection + xhtml.substring(end);
        }
        return injection + xhtml;
    }
}
