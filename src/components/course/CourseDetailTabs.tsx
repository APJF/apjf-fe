import { BookOpen, Users, Star } from "lucide-react";

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function CourseDetailTabs({ activeTab, onTabChange }: Readonly<TabsProps>) {
  const tabs = [
    { id: "content", label: "Nội dung khóa học", icon: BookOpen },
    { id: "overview", label: "Tổng quan", icon: Users },
    { id: "reviews", label: "Đánh giá", icon: Star },
  ];

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex space-x-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
