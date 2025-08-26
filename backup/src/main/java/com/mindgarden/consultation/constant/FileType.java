package com.mindgarden.consultation.constant;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 파일 타입 상수 클래스
 * 시스템에서 지원하는 모든 파일 타입을 정의
 */
public final class FileType {
    
    // 이미지 파일 타입
    public static final String IMAGE_JPEG = "image/jpeg";
    public static final String IMAGE_JPG = "image/jpg";
    public static final String IMAGE_PNG = "image/png";
    public static final String IMAGE_GIF = "image/gif";
    public static final String IMAGE_WEBP = "image/webp";
    public static final String IMAGE_SVG = "image/svg+xml";
    public static final String IMAGE_BMP = "image/bmp";
    public static final String IMAGE_TIFF = "image/tiff";
    
    // 문서 파일 타입
    public static final String DOCUMENT_PDF = "application/pdf";
    public static final String DOCUMENT_DOC = "application/msword";
    public static final String DOCUMENT_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    public static final String DOCUMENT_XLS = "application/vnd.ms-excel";
    public static final String DOCUMENT_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    public static final String DOCUMENT_PPT = "application/vnd.ms-powerpoint";
    public static final String DOCUMENT_PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    public static final String DOCUMENT_TXT = "text/plain";
    public static final String DOCUMENT_RTF = "application/rtf";
    
    // 오디오 파일 타입
    public static final String AUDIO_MP3 = "audio/mpeg";
    public static final String AUDIO_WAV = "audio/wav";
    public static final String AUDIO_OGG = "audio/ogg";
    public static final String AUDIO_AAC = "audio/aac";
    public static final String AUDIO_FLAC = "audio/flac";
    public static final String AUDIO_M4A = "audio/mp4";
    
    // 비디오 파일 타입
    public static final String VIDEO_MP4 = "video/mp4";
    public static final String VIDEO_AVI = "video/x-msvideo";
    public static final String VIDEO_MOV = "video/quicktime";
    public static final String VIDEO_WMV = "video/x-ms-wmv";
    public static final String VIDEO_FLV = "video/x-flv";
    public static final String VIDEO_WEBM = "video/webm";
    public static final String VIDEO_3GP = "video/3gpp";
    
    // 압축 파일 타입
    public static final String ARCHIVE_ZIP = "application/zip";
    public static final String ARCHIVE_RAR = "application/vnd.rar";
    public static final String ARCHIVE_7Z = "application/x-7z-compressed";
    public static final String ARCHIVE_TAR = "application/x-tar";
    public static final String ARCHIVE_GZ = "application/gzip";
    
    // 코드 파일 타입
    public static final String CODE_JAVA = "text/x-java-source";
    public static final String CODE_PYTHON = "text/x-python";
    public static final String CODE_JAVASCRIPT = "text/javascript";
    public static final String CODE_HTML = "text/html";
    public static final String CODE_CSS = "text/css";
    public static final String CODE_XML = "application/xml";
    public static final String CODE_JSON = "application/json";
    public static final String CODE_SQL = "application/sql";
    
    // 파일 타입 그룹
    public static final Map<String, List<String>> TYPE_GROUPS;
    
    static {
        Map<String, List<String>> groups = new HashMap<>();
        groups.put("IMAGES", Arrays.asList(IMAGE_JPEG, IMAGE_JPG, IMAGE_PNG, IMAGE_GIF, IMAGE_WEBP, IMAGE_SVG, IMAGE_BMP, IMAGE_TIFF));
        groups.put("DOCUMENTS", Arrays.asList(DOCUMENT_PDF, DOCUMENT_DOC, DOCUMENT_DOCX, DOCUMENT_XLS, DOCUMENT_XLSX, DOCUMENT_PPT, DOCUMENT_PPTX, DOCUMENT_TXT, DOCUMENT_RTF));
        groups.put("AUDIO", Arrays.asList(AUDIO_MP3, AUDIO_WAV, AUDIO_OGG, AUDIO_AAC, AUDIO_FLAC, AUDIO_M4A));
        groups.put("VIDEO", Arrays.asList(VIDEO_MP4, VIDEO_AVI, VIDEO_MOV, VIDEO_WMV, VIDEO_FLV, VIDEO_WEBM, VIDEO_3GP));
        groups.put("ARCHIVES", Arrays.asList(ARCHIVE_ZIP, ARCHIVE_RAR, ARCHIVE_7Z, ARCHIVE_TAR, ARCHIVE_GZ));
        groups.put("CODE", Arrays.asList(CODE_JAVA, CODE_PYTHON, CODE_JAVASCRIPT, CODE_HTML, CODE_CSS, CODE_XML, CODE_JSON, CODE_SQL));
        TYPE_GROUPS = Collections.unmodifiableMap(groups);
    }
    
    // 파일 확장자 매핑
    public static final Map<String, String> EXTENSION_MAPPING;
    
    static {
        Map<String, String> mapping = new HashMap<>();
        mapping.put("jpg", IMAGE_JPEG);
        mapping.put("jpeg", IMAGE_JPEG);
        mapping.put("png", IMAGE_PNG);
        mapping.put("gif", IMAGE_GIF);
        mapping.put("webp", IMAGE_WEBP);
        mapping.put("svg", IMAGE_SVG);
        mapping.put("bmp", IMAGE_BMP);
        mapping.put("tiff", IMAGE_TIFF);
        mapping.put("pdf", DOCUMENT_PDF);
        mapping.put("doc", DOCUMENT_DOC);
        mapping.put("docx", DOCUMENT_DOCX);
        mapping.put("xls", DOCUMENT_XLS);
        mapping.put("xlsx", DOCUMENT_XLSX);
        mapping.put("ppt", DOCUMENT_PPT);
        mapping.put("pptx", DOCUMENT_PPTX);
        mapping.put("txt", DOCUMENT_TXT);
        mapping.put("rtf", DOCUMENT_RTF);
        mapping.put("mp3", AUDIO_MP3);
        mapping.put("wav", AUDIO_WAV);
        mapping.put("ogg", AUDIO_OGG);
        mapping.put("aac", AUDIO_AAC);
        mapping.put("flac", AUDIO_FLAC);
        mapping.put("m4a", AUDIO_M4A);
        mapping.put("mp4", VIDEO_MP4);
        mapping.put("avi", VIDEO_AVI);
        mapping.put("mov", VIDEO_MOV);
        mapping.put("wmv", VIDEO_WMV);
        mapping.put("flv", VIDEO_FLV);
        mapping.put("webm", VIDEO_WEBM);
        mapping.put("3gp", VIDEO_3GP);
        mapping.put("zip", ARCHIVE_ZIP);
        mapping.put("rar", ARCHIVE_RAR);
        mapping.put("7z", ARCHIVE_7Z);
        mapping.put("tar", ARCHIVE_TAR);
        mapping.put("gz", ARCHIVE_GZ);
        mapping.put("java", CODE_JAVA);
        mapping.put("py", CODE_PYTHON);
        mapping.put("js", CODE_JAVASCRIPT);
        mapping.put("html", CODE_HTML);
        mapping.put("css", CODE_CSS);
        mapping.put("xml", CODE_XML);
        mapping.put("json", CODE_JSON);
        mapping.put("sql", CODE_SQL);
        EXTENSION_MAPPING = Collections.unmodifiableMap(mapping);
    }
    
    // 파일 타입별 설명
    public static final Map<String, String> TYPE_DESCRIPTIONS;
    
    static {
        Map<String, String> descriptions = new HashMap<>();
        descriptions.put(IMAGE_JPEG, "JPEG 이미지 파일");
        descriptions.put(IMAGE_JPG, "JPG 이미지 파일");
        descriptions.put(IMAGE_PNG, "PNG 이미지 파일");
        descriptions.put(IMAGE_GIF, "GIF 이미지 파일");
        descriptions.put(IMAGE_WEBP, "WebP 이미지 파일");
        descriptions.put(IMAGE_SVG, "SVG 벡터 이미지 파일");
        descriptions.put(IMAGE_BMP, "BMP 이미지 파일");
        descriptions.put(IMAGE_TIFF, "TIFF 이미지 파일");
        descriptions.put(DOCUMENT_PDF, "PDF 문서 파일");
        descriptions.put(DOCUMENT_DOC, "Word 문서 파일 (DOC)");
        descriptions.put(DOCUMENT_DOCX, "Word 문서 파일 (DOCX)");
        descriptions.put(DOCUMENT_XLS, "Excel 스프레드시트 파일 (XLS)");
        descriptions.put(DOCUMENT_XLSX, "Excel 스프레드시트 파일 (XLSX)");
        descriptions.put(DOCUMENT_PPT, "PowerPoint 프레젠테이션 파일 (PPT)");
        descriptions.put(DOCUMENT_PPTX, "PowerPoint 프레젠테이션 파일 (PPTX)");
        descriptions.put(DOCUMENT_TXT, "텍스트 파일");
        descriptions.put(DOCUMENT_RTF, "RTF 문서 파일");
        descriptions.put(AUDIO_MP3, "MP3 오디오 파일");
        descriptions.put(AUDIO_WAV, "WAV 오디오 파일");
        descriptions.put(AUDIO_OGG, "OGG 오디오 파일");
        descriptions.put(AUDIO_AAC, "AAC 오디오 파일");
        descriptions.put(AUDIO_FLAC, "FLAC 오디오 파일");
        descriptions.put(AUDIO_M4A, "M4A 오디오 파일");
        descriptions.put(VIDEO_MP4, "MP4 비디오 파일");
        descriptions.put(VIDEO_AVI, "AVI 비디오 파일");
        descriptions.put(VIDEO_MOV, "MOV 비디오 파일");
        descriptions.put(VIDEO_WMV, "WMV 비디오 파일");
        descriptions.put(VIDEO_FLV, "FLV 비디오 파일");
        descriptions.put(VIDEO_WEBM, "WebM 비디오 파일");
        descriptions.put(VIDEO_3GP, "3GP 비디오 파일");
        descriptions.put(ARCHIVE_ZIP, "ZIP 압축 파일");
        descriptions.put(ARCHIVE_RAR, "RAR 압축 파일");
        descriptions.put(ARCHIVE_7Z, "7-Zip 압축 파일");
        descriptions.put(ARCHIVE_TAR, "TAR 압축 파일");
        descriptions.put(ARCHIVE_GZ, "GZIP 압축 파일");
        descriptions.put(CODE_JAVA, "Java 소스 코드 파일");
        descriptions.put(CODE_PYTHON, "Python 소스 코드 파일");
        descriptions.put(CODE_JAVASCRIPT, "JavaScript 소스 코드 파일");
        descriptions.put(CODE_HTML, "HTML 마크업 파일");
        descriptions.put(CODE_CSS, "CSS 스타일시트 파일");
        descriptions.put(CODE_XML, "XML 마크업 파일");
        descriptions.put(CODE_JSON, "JSON 데이터 파일");
        descriptions.put(CODE_SQL, "SQL 쿼리 파일");
        TYPE_DESCRIPTIONS = Collections.unmodifiableMap(descriptions);
    }
    
    // 파일 타입별 최대 크기 (MB)
    public static final Map<String, Integer> MAX_FILE_SIZES;
    
    static {
        Map<String, Integer> sizes = new HashMap<>();
        sizes.put(IMAGE_JPEG, 10);
        sizes.put(IMAGE_JPG, 10);
        sizes.put(IMAGE_PNG, 10);
        sizes.put(IMAGE_GIF, 10);
        sizes.put(IMAGE_WEBP, 10);
        sizes.put(IMAGE_SVG, 5);
        sizes.put(IMAGE_BMP, 10);
        sizes.put(IMAGE_TIFF, 20);
        sizes.put(DOCUMENT_PDF, 50);
        sizes.put(DOCUMENT_DOC, 20);
        sizes.put(DOCUMENT_DOCX, 20);
        sizes.put(DOCUMENT_XLS, 20);
        sizes.put(DOCUMENT_XLSX, 20);
        sizes.put(DOCUMENT_PPT, 20);
        sizes.put(DOCUMENT_PPTX, 20);
        sizes.put(DOCUMENT_TXT, 5);
        sizes.put(DOCUMENT_RTF, 10);
        sizes.put(AUDIO_MP3, 100);
        sizes.put(AUDIO_WAV, 100);
        sizes.put(AUDIO_OGG, 100);
        sizes.put(AUDIO_AAC, 100);
        sizes.put(AUDIO_FLAC, 100);
        sizes.put(AUDIO_M4A, 100);
        sizes.put(VIDEO_MP4, 500);
        sizes.put(VIDEO_AVI, 500);
        sizes.put(VIDEO_MOV, 500);
        sizes.put(VIDEO_WMV, 500);
        sizes.put(VIDEO_FLV, 500);
        sizes.put(VIDEO_WEBM, 500);
        sizes.put(VIDEO_3GP, 500);
        sizes.put(ARCHIVE_ZIP, 100);
        sizes.put(ARCHIVE_RAR, 100);
        sizes.put(ARCHIVE_7Z, 100);
        sizes.put(ARCHIVE_TAR, 100);
        sizes.put(ARCHIVE_GZ, 100);
        sizes.put(CODE_JAVA, 5);
        sizes.put(CODE_PYTHON, 5);
        sizes.put(CODE_JAVASCRIPT, 5);
        sizes.put(CODE_HTML, 5);
        sizes.put(CODE_CSS, 5);
        sizes.put(CODE_XML, 5);
        sizes.put(CODE_JSON, 5);
        sizes.put(CODE_SQL, 5);
        MAX_FILE_SIZES = Collections.unmodifiableMap(sizes);
    }
    
    // 파일 타입별 아이콘
    public static final Map<String, String> TYPE_ICONS;
    
    static {
        Map<String, String> icons = new HashMap<>();
        icons.put(IMAGE_JPEG, "bi-file-image");
        icons.put(IMAGE_JPG, "bi-file-image");
        icons.put(IMAGE_PNG, "bi-file-image");
        icons.put(IMAGE_GIF, "bi-file-image");
        icons.put(IMAGE_WEBP, "bi-file-image");
        icons.put(IMAGE_SVG, "bi-file-image");
        icons.put(IMAGE_BMP, "bi-file-image");
        icons.put(IMAGE_TIFF, "bi-file-image");
        icons.put(DOCUMENT_PDF, "bi-file-pdf");
        icons.put(DOCUMENT_DOC, "bi-file-word");
        icons.put(DOCUMENT_DOCX, "bi-file-word");
        icons.put(DOCUMENT_XLS, "bi-file-excel");
        icons.put(DOCUMENT_XLSX, "bi-file-excel");
        icons.put(DOCUMENT_PPT, "bi-file-slides");
        icons.put(DOCUMENT_PPTX, "bi-file-slides");
        icons.put(DOCUMENT_TXT, "bi-file-text");
        icons.put(DOCUMENT_RTF, "bi-file-text");
        icons.put(AUDIO_MP3, "bi-file-music");
        icons.put(AUDIO_WAV, "bi-file-music");
        icons.put(AUDIO_OGG, "bi-file-music");
        icons.put(AUDIO_AAC, "bi-file-music");
        icons.put(AUDIO_FLAC, "bi-file-music");
        icons.put(AUDIO_M4A, "bi-file-music");
        icons.put(VIDEO_MP4, "bi-file-play");
        icons.put(VIDEO_AVI, "bi-file-play");
        icons.put(VIDEO_MOV, "bi-file-play");
        icons.put(VIDEO_WMV, "bi-file-play");
        icons.put(VIDEO_FLV, "bi-file-play");
        icons.put(VIDEO_WEBM, "bi-file-play");
        icons.put(VIDEO_3GP, "bi-file-play");
        icons.put(ARCHIVE_ZIP, "bi-file-zip");
        icons.put(ARCHIVE_RAR, "bi-file-zip");
        icons.put(ARCHIVE_7Z, "bi-file-zip");
        icons.put(ARCHIVE_TAR, "bi-file-zip");
        icons.put(ARCHIVE_GZ, "bi-file-zip");
        icons.put(CODE_JAVA, "bi-file-code");
        icons.put(CODE_PYTHON, "bi-file-code");
        icons.put(CODE_JAVASCRIPT, "bi-file-code");
        icons.put(CODE_HTML, "bi-file-code");
        icons.put(CODE_CSS, "bi-file-code");
        icons.put(CODE_XML, "bi-file-code");
        icons.put(CODE_JSON, "bi-file-code");
        icons.put(CODE_SQL, "bi-file-code");
        TYPE_ICONS = Collections.unmodifiableMap(icons);
    }
    
    // 유틸리티 메서드
    public static boolean isValidType(String mimeType) {
        return TYPE_DESCRIPTIONS.containsKey(mimeType);
    }
    
    public static boolean isImageType(String mimeType) {
        return TYPE_GROUPS.get("IMAGES").contains(mimeType);
    }
    
    public static boolean isDocumentType(String mimeType) {
        return TYPE_GROUPS.get("DOCUMENTS").contains(mimeType);
    }
    
    public static boolean isAudioType(String mimeType) {
        return TYPE_GROUPS.get("AUDIO").contains(mimeType);
    }
    
    public static boolean isVideoType(String mimeType) {
        return TYPE_GROUPS.get("VIDEO").contains(mimeType);
    }
    
    public static boolean isArchiveType(String mimeType) {
        return TYPE_GROUPS.get("ARCHIVES").contains(mimeType);
    }
    
    public static boolean isCodeType(String mimeType) {
        return TYPE_GROUPS.get("CODE").contains(mimeType);
    }
    
    public static String getMimeTypeByExtension(String extension) {
        return EXTENSION_MAPPING.getOrDefault(extension.toLowerCase(), "application/octet-stream");
    }
    
    public static String getExtensionByMimeType(String mimeType) {
        return EXTENSION_MAPPING.entrySet().stream()
            .filter(entry -> entry.getValue().equals(mimeType))
            .map(Map.Entry::getKey)
            .findFirst()
            .orElse("bin");
    }
    
    public static List<String> getAllTypes() {
        return List.copyOf(TYPE_DESCRIPTIONS.keySet());
    }
    
    public static List<String> getTypesByGroup(String group) {
        return TYPE_GROUPS.getOrDefault(group, List.of());
    }
    
    public static String getDescription(String mimeType) {
        return TYPE_DESCRIPTIONS.getOrDefault(mimeType, "알 수 없는 파일 타입");
    }
    
    public static int getMaxFileSize(String mimeType) {
        return MAX_FILE_SIZES.getOrDefault(mimeType, 10);
    }
    
    public static String getIcon(String mimeType) {
        return TYPE_ICONS.getOrDefault(mimeType, "bi-file");
    }
    
    public static Set<String> getAllowedExtensions() {
        return EXTENSION_MAPPING.keySet();
    }
    
    public static boolean isAllowedExtension(String extension) {
        return EXTENSION_MAPPING.containsKey(extension.toLowerCase());
    }
    
    // 생성자 방지
    private FileType() {
        throw new UnsupportedOperationException("이 클래스는 인스턴스화할 수 없습니다.");
    }
}
