package com.coresolution.consultation.testsupport;

import java.util.List;

import org.hibernate.boot.model.naming.Identifier;
import org.hibernate.boot.model.naming.ImplicitIndexNameSource;
import org.hibernate.boot.model.naming.ImplicitNamingStrategyJpaCompliantImpl;
import org.hibernate.boot.spi.MetadataBuildingContext;

/**
 * H2는 인덱스 이름이 스키마 전역에서 유일해야 하고, MySQL은 테이블별로 동일 이름을 허용한다.
 * 테스트 프로파일에서만 명시적 {@code @Index(name=...)} 를 무시하고 테이블·컬럼 기반 해시 이름을 사용한다.
 *
 * @author MindGarden
 * @since 2026-04-14
 */
public class H2GlobalUniqueIndexImplicitNamingStrategy extends ImplicitNamingStrategyJpaCompliantImpl {

    @Override
    public Identifier determineIndexName(ImplicitIndexNameSource source) {
        ImplicitIndexNameSource implicitOnly = new ImplicitIndexNameSource() {

            @Override
            public MetadataBuildingContext getBuildingContext() {
                return source.getBuildingContext();
            }

            @Override
            public Identifier getTableName() {
                return source.getTableName();
            }

            @Override
            public List<Identifier> getColumnNames() {
                return source.getColumnNames();
            }

            @Override
            public Identifier getUserProvidedIdentifier() {
                return null;
            }
        };
        return super.determineIndexName(implicitOnly);
    }
}
