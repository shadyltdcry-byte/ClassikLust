/**
 * FileManagerDB.tsx - Database helper for media operations
 * Last Edited: 2025-08-18 by Assistant
 * 
 * Fixed to use proper schema, added error handling,
 * implemented all CRUD operations with proper typing
 * 
 * ⚠️ DO NOT PUT UI LOGIC HERE - This is purely for DB operations
 */

import { MediaFile, MediaFileDB } from 'shared/schema';

/**
 * Database operations for media file management
 * All functions return promises and include proper error handling
 */
export class FileManagerDB {
  private static readonly API_BASE_URL = '/api/media';


  /**
   * Creates a new media file entry in the database
   * @param mediaFile - The media file data to create
   * @returns Promise with the created media file or null on error
   */
  static async createMediaFile(mediaFile: Omit<MediaFileDB, 'id'>): Promise<MediaFile | null> {
    try {
      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mediaFile),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating media file:', error);
      return null;
    }
  }

  /**
   * Uploads multiple media files with metadata
   * @param formData - FormData containing files and metadata
   * @returns Promise with uploaded media files array or empty array on error
   */
  static async uploadMediaFiles(formData: FormData): Promise<MediaFile[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return Array.isArray(result) ? result : [result];
    } catch (error) {
      console.error('Error uploading media files:', error);
      return [];
    }
  }

  /**
   * Fetches all media files from the database
   * @param filters - Optional filters for character, mood, type, etc.
   * @returns Promise with array of media files
   */
  static async fetchMediaFiles(filters?: {
    characterid?: string;
    mood?: string;
    type?: string;
    isVip?: boolean;
    isNsfw?: boolean;
    isEvent?: boolean;
    level?: number;
  }): Promise<MediaFile[]> {
    try {
      let url = this.API_BASE_URL;

      // Add query parameters if filters are provided
      if (filters && Object.keys(filters).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, value.toString());
          }
        });
        url += `?${searchParams.toString()}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching media files:', error);
      return [];
    }
  }

  /**
   * Fetches a single media file by ID
   * @param id - The media file ID
   * @returns Promise with the media file or null if not found
   */
  static async fetchMediaFileById(id: string): Promise<MediaFile | null> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching media file:', error);
      return null;
    }
  }

  /**
   * Updates an existing media file entry with partial data
   * @param id - The media file ID to update
   * @param updates - Partial media file data to update
   * @returns Promise with the updated media file or null on error
   */
  static async updateMediaFile(
    id: string, 
    updates: Partial<Omit<MediaFileDB, 'id'>>
  ): Promise<MediaFile | null> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating media file:', error);
      return null;
    }
  }

  /**
   * Updates media file metadata in bulk
   * @param updates - Array of {id, data} objects to update
   * @returns Promise with array of updated media files
   */
  static async bulkUpdateMediaFiles(
    updates: Array<{ id: string; data: Partial<Omit<MediaFileDB, 'id'>> }>
  ): Promise<MediaFile[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/bulk-update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error bulk updating media files:', error);
      return [];
    }
  }

  /**
   * Deletes a media file entry from the database
   * @param id - The media file ID to delete
   * @returns Promise with success boolean
   */
  static async deleteMediaFile(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting media file:', error);
      return false;
    }
  }

  /**
   * Deletes multiple media files in bulk
   * @param ids - Array of media file IDs to delete
   * @returns Promise with success count
   */
  static async bulkDeleteMediaFiles(ids: string[]): Promise<number> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/bulk-delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.deletedCount || 0;
    } catch (error) {
      console.error('Error bulk deleting media files:', error);
      return 0;
    }
  }

  /**
   * Fetches media files associated with a specific character
   * @param characterId - The character ID
   * @returns Promise with array of character's media files
   */
  static async fetchCharacterMedia(characterid: string): Promise<MediaFile[]> {
    return this.fetchMediaFiles({ characterid });
  }

  /**
   * Fetches media files by mood
   * @param mood - The mood to filter by
   * @returns Promise with array of mood-specific media files
   */
  static async fetchMediaByMood(mood: string): Promise<MediaFile[]> {
    return this.fetchMediaFiles({ mood });
  }

  /**
   * Fetches VIP media files
   * @returns Promise with array of VIP media files
   */
  static async fetchVIPMedia(): Promise<MediaFile[]> {
    return this.fetchMediaFiles({ isVip: true });
  }

  /**
   * Fetches NSFW media files
   * @returns Promise with array of NSFW media files
   */
  static async fetchNSFWMedia(): Promise<MediaFile[]> {
    return this.fetchMediaFiles({ isNsfw: true });
  }

  /**
   * Assigns media files to a character
   * @param mediaIds - Array of media file IDs
   * @param characterId - The character ID to assign to
   * @returns Promise with success boolean
   */
  static async assignMediaToCharacter(
    mediaIds: string[], 
    characterid: string
  ): Promise<boolean> {
    try {
      const updates = mediaIds.map(id => ({
        id,
        data: { characterid }
      }));

      const result = await this.bulkUpdateMediaFiles(updates);
      return result.length === mediaIds.length;
    } catch (error) {
      console.error('Error assigning media to character:', error);
      return false;
    }
  }

  /**
   * Updates animation sequence for a media file
   * @param id - Media file ID
   * @param sequence - Array of frame indices
   * @returns Promise with updated media file or null on error
   */
  static async updateAnimationSequence(
    id: string, 
    sequence: number[]
  ): Promise<MediaFile | null> {
    return this.updateMediaFile(id, { animationSequence: sequence });
  }

  /**
   * Gets media file statistics
   * @returns Promise with media statistics object
   */
  static async getMediaStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byCharacter: Record<string, number>;
    vipCount: number;
    nsfwCount: number;
    eventCount: number;
  }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching media stats:', error);
      return {
        total: 0,
        byType: {},
        byCharacter: {},
        vipCount: 0,
        nsfwCount: 0,
        eventCount: 0,
      };
    }
  }
}

// Default export for backwards compatibility
export default FileManagerDB;
