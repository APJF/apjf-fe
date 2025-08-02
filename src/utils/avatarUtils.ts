/**
 * Utility functions for handling avatar URLs
 */

/**
 * Get avatar URL from object name
 * If avatarObjectName is empty/null, returns default avatar
 * If avatarObjectName is already a full URL, returns as is
 * Otherwise, constructs the proper API endpoint URL
 */
export const getAvatarUrl = (avatarObjectName: string | null | undefined): string => {
  // Return default avatar if no object name
  if (!avatarObjectName) {
    return '/img/default-avatar.svg';
  }

  // If it's already a full URL (for backward compatibility), return as is
  if (avatarObjectName.startsWith('http://') || avatarObjectName.startsWith('https://')) {
    return avatarObjectName;
  }

  // Construct the API endpoint URL for avatar
  // This will call backend API which returns the presigned URL
  return `http://localhost:8080/api/users/avatar/${encodeURIComponent(avatarObjectName)}`;
};

/**
 * Get avatar display text (first letter of username) for fallback
 */
export const getAvatarText = (username: string): string => {
  return username?.charAt(0)?.toUpperCase() || 'U';
};
