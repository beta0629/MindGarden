"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clientApiFetch } from "@/services/clientApi";
import { OPS_API_PATHS } from "@/constants/api";

interface Tenant {
  tenantId: string;
  name: string;
  businessType: string;
  status: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPerson?: string;
}

interface TenantAdmin {
  userId: number;
  email: string;
  name: string;
  username: string;
  phone?: string;
  isActive: boolean;
  roles: Array<{
    roleId: string;
    roleName: string;
    effectiveFrom: string;
    effectiveTo?: string;
    assignedBy?: string;
  }>;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [admins, setAdmins] = useState<Map<string, TenantAdmin[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingAdmins, setLoadingAdmins] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientApiFetch<Tenant[]>(OPS_API_PATHS.TENANTS.ALL);
      setTenants(data);
    } catch (err) {
      console.error("테넌트 목록 로드 실패:", err);
      setError(err instanceof Error ? err.message : "데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadTenantAdmins = async (tenantId: string) => {
    if (admins.has(tenantId)) {
      // 이미 로드된 경우 토글만
      setSelectedTenant(selectedTenant === tenantId ? null : tenantId);
      return;
    }

    try {
      setLoadingAdmins(tenantId);
      const data = await clientApiFetch<TenantAdmin[]>(OPS_API_PATHS.TENANTS.ADMINS(tenantId));
      setAdmins((prev) => {
        const newMap = new Map(prev);
        newMap.set(tenantId, data);
        return newMap;
      });
      setSelectedTenant(tenantId);
    } catch (err) {
      console.error("관리자 계정 로드 실패:", err);
      alert(err instanceof Error ? err.message : "관리자 계정을 불러오는데 실패했습니다.");
    } finally {
      setLoadingAdmins(null);
    }
  };

  if (loading) {
    return (
      <section className="panel">
        <header className="panel__header">
          <h1>로딩 중...</h1>
        </header>
        <div className="loading-message">
          <p>데이터를 불러오는 중입니다...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">
        <header className="panel__header">
          <h1>오류 발생</h1>
        </header>
        <div className="error-message">
          <p>{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <header className="panel__header">
        <h1>테넌트 관리</h1>
        <p>각 테넌트별 관리자 계정 조회 및 테스트</p>
      </header>

      <div className="tenant-list">
        {tenants.length === 0 ? (
          <div className="empty-message">
            <p>등록된 테넌트가 없습니다.</p>
          </div>
        ) : (
          tenants.map((tenant) => {
            const tenantAdmins = admins.get(tenant.tenantId) || [];
            const isSelected = selectedTenant === tenant.tenantId;
            const isLoading = loadingAdmins === tenant.tenantId;

            return (
              <div key={tenant.tenantId} className="tenant-card">
                <div
                  className="tenant-card__header"
                  onClick={() => loadTenantAdmins(tenant.tenantId)}
                >
                  <div>
                    <h3>{tenant.name}</h3>
                    <p className="tenant-card__meta">
                      {tenant.businessType} · {tenant.status}
                      {tenant.contactEmail && ` · ${tenant.contactEmail}`}
                    </p>
                  </div>
                  <div className="tenant-card__actions">
                    {isLoading ? (
                      <span>로딩 중...</span>
                    ) : (
                      <span>{isSelected ? "▼" : "▶"}</span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className="tenant-card__content">
                    {tenantAdmins.length === 0 ? (
                      <div className="empty-message">
                        <p>관리자 계정이 없습니다.</p>
                      </div>
                    ) : (
                      <div className="admin-list">
                        <h4>관리자 계정 ({tenantAdmins.length}명)</h4>
                        {tenantAdmins.map((admin) => (
                          <div key={admin.userId} className="admin-card">
                            <div className="admin-card__info">
                              <div>
                                <strong>{admin.name || admin.username}</strong>
                                <span className="admin-card__email">{admin.email}</span>
                              </div>
                              <div className="admin-card__meta">
                                {admin.phone && <span>📞 {admin.phone}</span>}
                                <span className={admin.isActive ? "status-active" : "status-inactive"}>
                                  {admin.isActive ? "활성" : "비활성"}
                                </span>
                              </div>
                            </div>
                            <div className="admin-card__roles">
                              {admin.roles.map((role, idx) => (
                                <span key={idx} className="role-badge">
                                  {role.roleName}
                                </span>
                              ))}
                            </div>
                            <div className="admin-card__actions">
                              <button
                                className="btn btn--small btn--primary"
                                onClick={() => {
                                  // 테스트용: 관리자 계정 정보 복사
                                  const info = `테넌트: ${tenant.name}\n이메일: ${admin.email}\n비밀번호: (온보딩 시 설정된 비밀번호)`;
                                  navigator.clipboard.writeText(info);
                                  alert("관리자 계정 정보가 클립보드에 복사되었습니다.");
                                }}
                              >
                                계정 정보 복사
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

