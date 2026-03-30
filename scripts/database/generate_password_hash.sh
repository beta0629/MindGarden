#!/bin/bash
# 비밀번호 해시 생성 스크립트
# CoreSolution의 BCrypt 강도 12를 사용하여 해시 생성

PASSWORD="godgod826!"

# Maven을 사용하여 Java 클래스 실행
cd "$(dirname "$0")/../.."

# Spring Boot 애플리케이션 컨텍스트를 사용하여 PasswordEncoder 빈을 주입받아 해시 생성
# 임시로 간단한 Java 코드 작성
cat > /tmp/PasswordHashGenerator.java << 'JAVA'
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        if (args.length < 1) {
            System.err.println("Usage: java PasswordHashGenerator <password>");
            System.exit(1);
        }
        
        String password = args[0];
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        String hash = encoder.encode(password);
        System.out.println(hash);
    }
}
JAVA

# Java 컴파일 및 실행 (Spring Security 의존성 필요)
echo "비밀번호 해시 생성 중..."
echo "비밀번호: $PASSWORD"
echo ""
echo "주의: 이 스크립트는 Spring Security 라이브러리가 필요합니다."
echo "대신 Maven/Gradle을 사용하여 해시를 생성하거나,"
echo "직접 데이터베이스에서 비밀번호를 재설정해야 합니다."

