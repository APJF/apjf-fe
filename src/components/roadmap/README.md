# JapanRoadmapView Component

## Tổng quan

`JapanRoadmapView` là một component tái sử dụng để hiển thị lộ trình học tập trên bản đồ Nhật Bản với 4 cột mốc địa điểm. Component này được thiết kế với kích thước chuẩn hóa để sử dụng nhất quán trong tất cả các trang.

## Tính năng chính

- ✨ **Kích thước chuẩn hóa**: Một kích thước duy nhất cho tất cả các trang
- 🎨 **5 theme màu**: `red`, `blue`, `green`, `orange`, `purple`
- 📱 **Responsive**: Tự động điều chỉnh theo kích thước màn hình
- 🖱️ **Interactive**: Click vào các cột mốc, hover tooltip, navigation
- ⚙️ **Highly customizable**: Nhiều props để tùy chỉnh hiển thị
- 🎯 **Consistent UI**: Đồng nhất trên tất cả các trang sử dụng

## Cách sử dụng cơ bản

### Import

```tsx
import { JapanRoadmapView, type RoadmapStage } from '../../components/roadmap/JapanRoadmapView';
// hoặc
import JapanRoadmapView, { type RoadmapStage } from '../../components/roadmap/JapanRoadmapView';
```

### Tạo dữ liệu stages

```tsx
const roadmapStages: RoadmapStage[] = [
  {
    id: 1,
    title: "Hiragana & Katakana",
    description: "Học bảng chữ cái tiếng Nhật cơ bản",
    status: "completed",
    progress: 100,
  },
  {
    id: 2,
    title: "Từ vựng N5",
    description: "800 từ vựng thiết yếu",
    status: "in_progress",
    progress: 65,
  },
  // ...thêm stages khác
];
```

### Sử dụng component

```tsx
<JapanRoadmapView
  stages={roadmapStages}
  title="Lộ trình học tập"
  theme="blue"
  onStageClick={(stageId) => console.log(`Clicked stage ${stageId}`)}
/>
```

## API Reference

### Props

#### Required Props
- `stages: RoadmapStage[]` - Mảng các giai đoạn học tập

#### Optional Props

##### Layout & Styling
- `title?: string` - Tiêu đề roadmap (default: "Lộ trình học tập")
- `subtitle?: string` - Phụ đề
- `className?: string` - CSS class tùy chỉnh
- `theme?: "red" | "blue" | "green" | "orange" | "purple"` - Theme màu (default: "blue")

##### Visibility Controls
- `showHeader?: boolean` - Hiển thị header (default: true)
- `showNavigation?: boolean` - Hiển thị navigation (default: true)
- `showStageCards?: boolean` - Hiển thị cards của stages (default: true)
- `showActionButtons?: boolean` - Hiển thị action buttons (default: false)

##### Event Handlers
- `onStageClick?: (stageId: number) => void` - Click vào stage marker
- `onPrimaryAction?: () => void` - Click primary button
- `onSecondaryAction?: () => void` - Click secondary button

##### Action Button Customization
- `primaryActionLabel?: string` - Label cho primary button
- `secondaryActionLabel?: string` - Label cho secondary button
- `primaryActionIcon?: React.ReactNode` - Icon cho primary button
- `secondaryActionIcon?: React.ReactNode` - Icon cho secondary button

##### Header Info
```tsx
headerInfo?: {
  targetLevel?: string;           // Cấp độ mục tiêu (N5, N4, etc.)
  status?: string;               // Trạng thái ("Đang học", "Hoàn thành")
  duration?: number;             // Thời gian (ngày)
  coursesCount?: number;         // Số khóa học
  completedStages?: number;      // Số stages hoàn thành
  totalStages?: number;          // Tổng số stages
}
```

### RoadmapStage Interface

```tsx
interface RoadmapStage {
  id: number;
  title: string;
  description: string;
  status: "completed" | "in_progress" | "locked";
  progress: number; // 0-100
  position?: { x: number; y: number }; // Tự động gán nếu không có
}
```

## Các trường hợp sử dụng

### 1. Standard version trong LearningPathPage

```tsx
<JapanRoadmapView
  stages={roadmapStages}
  title="Lộ trình đang học"
  subtitle="Tiếng Nhật N5"
  theme="blue"
  showActionButtons={true}
  onPrimaryAction={() => console.log('Continue learning')}
  onSecondaryAction={() => navigate('/detail')}
  primaryActionLabel="Tiếp tục học"
  secondaryActionLabel="Chi tiết"
  headerInfo={{
    targetLevel: "N5",
    status: "Đang học",
    coursesCount: 6,
  }}
/>
```

### 2. Simplified version trong sidebar

```tsx
<JapanRoadmapView
  stages={roadmapStages}
  title="Lộ trình tổng quan"
  onStageClick={handleStageClick}
  theme="blue"
  showHeader={true}
  showNavigation={true}
  showStageCards={false}
  showActionButtons={false}
/>
```

### 3. Minimal version cho dashboard widget

```tsx
<JapanRoadmapView
  stages={roadmapStages}
  theme="green"
  showHeader={false}
  showNavigation={false}
  showStageCards={false}
  showActionButtons={false}
  onStageClick={handleQuickNavigation}
/>
```

### 4. Course detail page usage

```tsx
<JapanRoadmapView
  stages={courseProgressStages}
  title="Tiến độ khóa học"
  theme="green"
  showActionButtons={true}
  onPrimaryAction={handleContinueLearning}
  primaryActionLabel="Tiếp tục học"
  headerInfo={{
    completedStages: 2,
    totalStages: 4,
    status: "Đang học"
  }}
/>
```

## Themes và Colors

### Red Theme (Tiếng Nhật)
Phù hợp cho các khóa học tiếng Nhật, sử dụng màu đỏ truyền thống.

### Blue Theme (Mặc định)
Theme trung tính, phù hợp cho tất cả loại khóa học.

### Green Theme (Hoàn thành)
Sử dụng cho các khóa học đã hoàn thành hoặc đạt thành tích cao.

### Orange Theme (Hiện tại)
Phù hợp cho khóa học đang học hoặc làm nổi bật.

### Purple Theme (Nâng cao)
Sử dụng cho các khóa học nâng cao hoặc premium.

## Responsive Design

Component tự động điều chỉnh:
- **Desktop**: Hiển thị đầy đủ tính năng
- **Tablet**: Compact layout, ẩn một số elements không cần thiết
- **Mobile**: Mini version, tập trung vào roadmap chính

## Performance

- Lazy loading cho images
- Memoized calculations
- Optimized re-renders với React.memo (nếu cần)
- Efficient event handling

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- High contrast colors
- Focus management

## Development

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

### Storybook

```bash
# Xem component trong Storybook
npm run storybook
```

## Changelog

### v1.0.0
- ✨ Initial release với 3 variants
- 🎨 5 theme colors
- 📱 Responsive design
- 🖱️ Interactive features

## License

MIT License - See LICENSE file for details
