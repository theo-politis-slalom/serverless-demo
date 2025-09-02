/**
 * Converts bytes to megabytes with 2 decimal places
 * @param bytes - The number of bytes to convert
 * @returns The number of megabytes
 */
export const bytesToMB = (bytes: number): number => {
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
};

/**
 * Converts bytes to a human-readable string
 * @param bytes - The number of bytes to convert
 * @param decimals - Number of decimal places (default: 2)
 * @returns A human-readable string (e.g., '1.23 MB')
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};
