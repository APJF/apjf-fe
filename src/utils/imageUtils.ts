/**
 * Utility function để generate đúng URL cho course image từ MinIO
 * @param imageId - Course image ID (ví dụ: course_image_ce85e137-274b-4b3e-b5cc-6db37e2d8d5c)
 * @param fallbackUrl - Fallback image URL nếu không có imageId
 * @returns Full URL to MinIO course image or fallback
 */
export const getCourseImageUrl = (imageId?: string | null, fallbackUrl: string = '/img/NhatBan.webp'): string => {
  if (!imageId || imageId.includes('undefined')) {
    return fallbackUrl
  }
  
  // Thử path giống avatar (không có /browser/)
  return `http://localhost:9000/course-image/${imageId}`
}

/**
 * Utility function để validate course image ID
 * @param imageId - Course image ID to validate
 * @returns boolean indicating if imageId is valid
 */
export const isValidCourseImageId = (imageId?: string | null): boolean => {
  return Boolean(imageId && !imageId.includes('undefined') && imageId.trim() !== '')
}
