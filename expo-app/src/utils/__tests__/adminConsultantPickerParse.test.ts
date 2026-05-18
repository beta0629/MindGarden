import { parseAdminConsultantPickerResponse } from '@/utils/adminConsultantPickerNormalize';

describe('parseAdminConsultantPickerResponse', () => {
  it('parses AdminUserController { success, data: [] } envelope', () => {
    const raw = {
      success: true,
      data: [
        {
          id: 10,
          name: '김선희',
          email: 'kim@example.com',
          role: 'CONSULTANT',
          isActive: true,
        },
        {
          id: 11,
          name: '조재은',
          email: 'cho@example.com',
          role: 'CONSULTANT',
          isActive: true,
        },
      ],
    };
    const items = parseAdminConsultantPickerResponse(raw);
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.name).sort()).toEqual(['김선희', '조재은']);
  });

  it('throws when success is false', () => {
    expect(() =>
      parseAdminConsultantPickerResponse({ success: false, message: '권한 없음' }),
    ).toThrow('권한 없음');
  });

  it('excludes inactive consultants', () => {
    const raw = {
      success: true,
      data: [
        { id: 1, name: '활성', role: 'CONSULTANT', isActive: true },
        { id: 2, name: '비활성', role: 'CONSULTANT', isActive: false },
      ],
    };
    const items = parseAdminConsultantPickerResponse(raw);
    expect(items).toHaveLength(1);
    expect(items[0]?.name).toBe('활성');
  });
});
