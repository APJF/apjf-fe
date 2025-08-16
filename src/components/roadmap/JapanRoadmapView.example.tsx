// Example: How to use JapanRoadmapView in CourseDetailPage
// File: src/pages/courses/CourseDetailPage.tsx

import { JapanRoadmapView, type RoadmapStage } from '../../components/roadmap/JapanRoadmapView';

// Example usage in CourseDetailPage component
export function CourseDetailPageExample() {
  // Mock course progression stages
  const courseStages: RoadmapStage[] = [
    {
      id: 1,
      title: "Giới thiệu cơ bản",
      description: "Làm quen với khóa học",
      status: "completed",
      progress: 100,
    },
    {
      id: 2,
      title: "Bài học chính",
      description: "Nội dung chính của khóa học",
      status: "in_progress",
      progress: 60,
    },
    {
      id: 3,
      title: "Luyện tập",
      description: "Bài tập thực hành",
      status: "locked",
      progress: 0,
    },
    {
      id: 4,
      title: "Kiểm tra",
      description: "Đánh giá kiến thức",
      status: "locked",
      progress: 0,
    },
  ];

  const handleStageClick = (stageId: number) => {
    console.log(`Navigate to lesson in stage ${stageId}`);
    // Navigate to specific lesson/chapter
  };

  const handleContinueLearning = () => {
    console.log('Continue learning from current progress');
    // Navigate to current lesson
  };

  const handleViewProgress = () => {
    console.log('View detailed progress');
    // Show progress modal or navigate to progress page
  };

  return (
    <div className="space-y-6">
      {/* Other course content... */}
      
      {/* Course Progress Roadmap */}
      <section>
        <h2 className="text-xl font-bold mb-4">Tiến độ học tập</h2>
        
        {/* Course Progress Roadmap */}
        <JapanRoadmapView
          stages={courseStages}
          title="Lộ trình khóa học"
          subtitle="Tiếng Nhật N5 - Ngữ pháp cơ bản"
          theme="green"
          showHeader={true}
          showNavigation={true}
          showStageCards={true}
          showActionButtons={true}
          onStageClick={handleStageClick}
          onPrimaryAction={handleContinueLearning}
          onSecondaryAction={handleViewProgress}
          primaryActionLabel="Tiếp tục học"
          secondaryActionLabel="Xem tiến độ"
          headerInfo={{
            targetLevel: "N5",
            status: "Đang học",
            completedStages: 1,
            totalStages: 4,
          }}
        />
      </section>

      {/* Compact version for sidebar - now uses standard size */}
      <aside className="w-1/3">
        <JapanRoadmapView
          stages={courseStages}
          title="Tiến độ nhanh"
          theme="blue"
          showHeader={true}
          showNavigation={false}
          showStageCards={false}
          showActionButtons={false}
          onStageClick={handleStageClick}
        />
      </aside>

      {/* Standard version for dashboard widget */}
      <div className="bg-white p-4 rounded-lg shadow">
        <JapanRoadmapView
          stages={courseStages}
          theme="purple"
          showHeader={false}
          showNavigation={false}
          showStageCards={false}
          showActionButtons={false}
          onStageClick={handleStageClick}
        />
      </div>
    </div>
  );
}

// Example with different themes - all using standard size now
export function RoadmapThemeExamples() {
  const stages: RoadmapStage[] = [
    { id: 1, title: "Stage 1", description: "Description", status: "completed", progress: 100 },
    { id: 2, title: "Stage 2", description: "Description", status: "in_progress", progress: 50 },
    { id: 3, title: "Stage 3", description: "Description", status: "locked", progress: 0 },
    { id: 4, title: "Stage 4", description: "Description", status: "locked", progress: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Red theme for Japanese language courses */}
      <JapanRoadmapView
        stages={stages}
        title="Lộ trình tiếng Nhật"
        theme="red"
      />

      {/* Blue theme for general learning */}
      <JapanRoadmapView
        stages={stages}
        title="Lộ trình học tập"
        theme="blue"
      />

      {/* Green theme for completed courses */}
      <JapanRoadmapView
        stages={stages}
        title="Khóa học hoàn thành"
        theme="green"
      />

      {/* Orange theme for current learning */}
      <JapanRoadmapView
        stages={stages}
        title="Đang học"
        theme="orange"
      />

      {/* Purple theme for advanced courses */}
      <JapanRoadmapView
        stages={stages}
        title="Khóa học nâng cao"
        theme="purple"
      />
    </div>
  );
}
