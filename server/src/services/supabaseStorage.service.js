import { supabaseAdmin, STORAGE_BUCKET } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import logger from '../utils/logger.js';

class SupabaseStorageService {
  constructor() {
    this.bucket = STORAGE_BUCKET;
  }

  /**
   * Upload a single file to Supabase storage
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} originalName - Original filename
   * @param {string} folder - Folder path (optional)
   * @returns {Promise<{url: string, path: string}>}
   */
  async uploadFile(fileBuffer, originalName, folder = '') {
    try {
      // Generate unique filename
      const fileExtension = path.extname(originalName);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      const filePath = folder ? `${folder}/${uniqueFilename}` : uniqueFilename;

      // Upload file to Supabase storage
      const { data, error } = await supabaseAdmin.storage
        .from(this.bucket)
        .upload(filePath, fileBuffer, {
          contentType: this.getMimeType(fileExtension),
          upsert: false
        });

      if (error) {
        logger.error('Supabase upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(this.bucket)
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        path: filePath,
        filename: uniqueFilename
      };
    } catch (error) {
      logger.error('Error uploading file to Supabase:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files to Supabase storage
   * @param {Array} files - Array of file objects with buffer and originalname
   * @param {string} folder - Folder path (optional)
   * @returns {Promise<Array<{url: string, path: string}>>}
   */
  async uploadMultipleFiles(files, folder = '') {
    try {
      const uploadPromises = files.map(file => 
        this.uploadFile(file.buffer, file.originalname, folder)
      );

      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      logger.error('Error uploading multiple files to Supabase:', error);
      throw error;
    }
  }

  /**
   * Delete a file from Supabase storage
   * @param {string} filePath - File path in storage
   * @returns {Promise<boolean>}
   */
  async deleteFile(filePath) {
    try {
      const { error } = await supabaseAdmin.storage
        .from(this.bucket)
        .remove([filePath]);

      if (error) {
        logger.error('Supabase delete error:', error);
        throw new Error(`Delete failed: ${error.message}`);
      }

      return true;
    } catch (error) {
      logger.error('Error deleting file from Supabase:', error);
      throw error;
    }
  }

  /**
   * Delete multiple files from Supabase storage
   * @param {Array<string>} filePaths - Array of file paths
   * @returns {Promise<boolean>}
   */
  async deleteMultipleFiles(filePaths) {
    try {
      const { error } = await supabaseAdmin.storage
        .from(this.bucket)
        .remove(filePaths);

      if (error) {
        logger.error('Supabase batch delete error:', error);
        throw new Error(`Batch delete failed: ${error.message}`);
      }

      return true;
    } catch (error) {
      logger.error('Error deleting multiple files from Supabase:', error);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   * @param {string} filePath - File path in storage
   * @returns {string}
   */
  getPublicUrl(filePath) {
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(this.bucket)
      .getPublicUrl(filePath);
    
    return publicUrl;
  }

  /**
   * Extract file path from Supabase URL
   * @param {string} url - Supabase public URL
   * @returns {string}
   */
  extractFilePathFromUrl(url) {
    if (!url) return null;
    
    // Extract the file path from Supabase URL
    const match = url.match(new RegExp(`${this.bucket}/(.+)$`));
    return match ? match[1] : null;
  }

  /**
   * Get MIME type based on file extension
   * @param {string} extension - File extension
   * @returns {string}
   */
  getMimeType(extension) {
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Check if a file exists in storage
   * @param {string} filePath - File path in storage
   * @returns {Promise<boolean>}
   */
  async fileExists(filePath) {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(this.bucket)
        .list(path.dirname(filePath), {
          search: path.basename(filePath)
        });

      if (error) {
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      logger.error('Error checking file existence:', error);
      return false;
    }
  }
}

export default new SupabaseStorageService();
