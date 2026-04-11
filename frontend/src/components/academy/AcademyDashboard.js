/**
 * 학원 시스템 대시보드 — 강좌, 반, 수강 등록 관리 통합 화면
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-19
 */

import React, { useState } from 'react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import CourseList from './CourseList';
import CourseForm from './CourseForm';
import ClassList from './ClassList';
import ClassForm from './ClassForm';
import EnrollmentList from './EnrollmentList';
import EnrollmentForm from './EnrollmentForm';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import MGButton from '../common/MGButton';
import './Academy.css';

const ACADEMY_TITLE_ID = 'academy-dashboard-title';

const AcademyDashboard = () => {
  const [view, setView] = useState('courses');
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const selectedBranchId = null;
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  const handleCreateCourse = () => {
    setSelectedItem(null);
    setShowForm(true);
  };

  const handleEditCourse = (course) => {
    setSelectedItem(course);
    setShowForm(true);
  };

  const handleCourseSelect = (course) => {
    setSelectedCourseId(course.courseId);
    setView('classes');
  };

  const handleCourseSave = () => {
    setShowForm(false);
    setSelectedItem(null);
  };

  const handleCourseCancel = () => {
    setShowForm(false);
    setSelectedItem(null);
  };

  const handleCreateClass = () => {
    setSelectedItem(null);
    setShowForm(true);
  };

  const handleEditClass = (classItem) => {
    setSelectedItem(classItem);
    setShowForm(true);
  };

  const handleClassSelect = (classItem) => {
    setView('enrollments');
  };

  const handleClassSave = () => {
    setShowForm(false);
    setSelectedItem(null);
  };

  const handleClassCancel = () => {
    setShowForm(false);
    setSelectedItem(null);
  };

  const handleCreateEnrollment = () => {
    setSelectedItem(null);
    setShowForm(true);
  };

  const handleEditEnrollment = (enrollment) => {
    setSelectedItem(enrollment);
    setShowForm(true);
  };

  const handleEnrollmentSave = () => {
    setShowForm(false);
    setSelectedItem(null);
  };

  const handleEnrollmentCancel = () => {
    setShowForm(false);
    setSelectedItem(null);
  };

  const resetTabView = (next) => {
    setView(next);
    setShowForm(false);
    setSelectedItem(null);
  };

  return (
    <AdminCommonLayout title="학원">
      <div className="mg-v2-ad-b0kla mg-v2-academy-dashboard">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel="학원 시스템 관리 본문">
            <ContentHeader
              title="학원 시스템 관리"
              subtitle="강좌·반·수강 등록을 한곳에서 관리합니다"
              titleId={ACADEMY_TITLE_ID}
            />
            <nav
              className="mg-v2-tab-buttons mg-v2-academy-dashboard__tabs"
              aria-label="학원 관리 섹션"
            >
              <MGButton
                type="button"
                role="tab"
                aria-selected={view === 'courses'}
                className={`mg-v2-tab-button${view === 'courses' ? ' active' : ''}`}
                onClick={() => resetTabView('courses')}
                variant="outline"
                preventDoubleClick={false}
              >
                강좌 관리
              </MGButton>
              <MGButton
                type="button"
                role="tab"
                aria-selected={view === 'classes'}
                className={`mg-v2-tab-button${view === 'classes' ? ' active' : ''}`}
                onClick={() => resetTabView('classes')}
                variant="outline"
                preventDoubleClick={false}
              >
                반 관리
              </MGButton>
              <MGButton
                type="button"
                role="tab"
                aria-selected={view === 'enrollments'}
                className={`mg-v2-tab-button${view === 'enrollments' ? ' active' : ''}`}
                onClick={() => resetTabView('enrollments')}
                variant="outline"
                preventDoubleClick={false}
              >
                수강 등록 관리
              </MGButton>
            </nav>

            <main aria-labelledby={ACADEMY_TITLE_ID} className="academy-content">
              {view === 'courses' && (
                <>
                  {showForm ? (
                    <CourseForm
                      course={selectedItem}
                      branchId={selectedBranchId}
                      onSave={handleCourseSave}
                      onCancel={handleCourseCancel}
                    />
                  ) : (
                    <CourseList
                      branchId={selectedBranchId}
                      onCreateCourse={handleCreateCourse}
                      onEditCourse={handleEditCourse}
                      onCourseSelect={handleCourseSelect}
                    />
                  )}
                </>
              )}

              {view === 'classes' && (
                <>
                  {showForm ? (
                    <ClassForm
                      classItem={selectedItem}
                      branchId={selectedBranchId}
                      courseId={selectedCourseId}
                      onSave={handleClassSave}
                      onCancel={handleClassCancel}
                    />
                  ) : (
                    <ClassList
                      branchId={selectedBranchId}
                      courseId={selectedCourseId}
                      onCreateClass={handleCreateClass}
                      onEditClass={handleEditClass}
                      onClassSelect={handleClassSelect}
                    />
                  )}
                </>
              )}

              {view === 'enrollments' && (
                <>
                  {showForm ? (
                    <EnrollmentForm
                      enrollment={selectedItem}
                      branchId={selectedBranchId}
                      classId={null}
                      onSave={handleEnrollmentSave}
                      onCancel={handleEnrollmentCancel}
                    />
                  ) : (
                    <EnrollmentList
                      branchId={selectedBranchId}
                      classId={null}
                      onCreateEnrollment={handleCreateEnrollment}
                      onEnrollmentSelect={handleEditEnrollment}
                    />
                  )}
                </>
              )}
            </main>
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default AcademyDashboard;
