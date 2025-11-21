/**
 * 학원 시스템 대시보드
 * 강좌, 반, 수강 등록 관리 통합 화면
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-19
 */

import React, { useState } from 'react';
import SimpleLayout from '../layout/SimpleLayout';
import CourseList from './CourseList';
import CourseForm from './CourseForm';
import ClassList from './ClassList';
import ClassForm from './ClassForm';
import EnrollmentList from './EnrollmentList';
import EnrollmentForm from './EnrollmentForm';
import './Academy.css';

const AcademyDashboard = () => {
  const [view, setView] = useState('courses'); // courses, classes, enrollments
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  // 강좌 관련 핸들러
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

  // 반 관련 핸들러
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

  // 수강 등록 관련 핸들러
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

  return (
    <SimpleLayout>
      <div className="academy-dashboard">
        <div className="academy-header">
          <h1>학원 시스템 관리</h1>
          <div className="academy-tabs">
            <button
              className={`academy-tab ${view === 'courses' ? 'active' : ''}`}
              onClick={() => {
                setView('courses');
                setShowForm(false);
                setSelectedItem(null);
              }}
            >
              강좌 관리
            </button>
            <button
              className={`academy-tab ${view === 'classes' ? 'active' : ''}`}
              onClick={() => {
                setView('classes');
                setShowForm(false);
                setSelectedItem(null);
              }}
            >
              반 관리
            </button>
            <button
              className={`academy-tab ${view === 'enrollments' ? 'active' : ''}`}
              onClick={() => {
                setView('enrollments');
                setShowForm(false);
                setSelectedItem(null);
              }}
            >
              수강 등록 관리
            </button>
          </div>
        </div>

        <div className="academy-content">
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
        </div>
      </div>
    </SimpleLayout>
  );
};

export default AcademyDashboard;

