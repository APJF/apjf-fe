import { ClipboardList, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import NhatBanImg from "../../assets/NhatBan.webp";
import { useLanguage } from "../../contexts/LanguageContext";

export function Hero() {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-red-50 via-white to-pink-50 py-28 lg:py-44">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 text-6xl">あ</div>
        <div className="absolute top-32 right-20 text-4xl">漢</div>
        <div className="absolute bottom-20 left-20 text-5xl">カ</div>
        <div className="absolute bottom-32 right-10 text-3xl">字</div>
      </div>

      <div className="container mx-auto px-4 relative w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center justify-center max-w-7xl mx-auto">
          {/* Content */}
          <div className="space-y-12">
            <div className="space-y-6">
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                {t('home.heroTitleStart')}{" "}
                <span className="text-red-600 relative">
                  {t('home.heroTitleHighlight')}
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-red-200"
                    viewBox="0 0 200 12"
                    fill="currentColor"
                  >
                    <path d="M0,8 Q50,0 100,8 T200,8 L200,12 L0,12 Z" />
                  </svg>
                </span>{" "}
                {t('home.heroTitleEnd')}
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                {t('home.heroDescription')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
                <ClipboardList className="mr-2 h-5 w-5" />
                {t('home.consultButton')}
              </button>
              <Link
                to="/courses" 
                className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <Eye className="mr-2 h-5 w-5" />
                {t('home.viewCoursesButton')}
              </Link>
            </div>

          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src={NhatBanImg}
                alt="Japanese Learning Platform"
                width={500}
                height={450}
                className="rounded-2xl shadow-2xl w-full h-96 object-cover"
              />
            </div>

            {/* Floating Cards */}
            <div className="absolute -top-4 -left-4 bg-white rounded-lg shadow-lg p-4 z-20">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
                  あ
                </div>
                <div>
                  <div className="text-sm font-medium">{t('home.hiraganaLabel')}</div>
                  <div className="text-xs text-gray-500">{t('home.hiraganaDesc')}</div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-4 z-20">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  漢
                </div>
                <div>
                  <div className="text-sm font-medium">{t('home.kanjiLabel')}</div>
                  <div className="text-xs text-gray-500">{t('home.kanjiDesc')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
