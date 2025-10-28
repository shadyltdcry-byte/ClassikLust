import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, AlertTriangle, FileX, Database } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MediaFileStats {
  total: number;
  orphaned: number;
  duplicates: number;
  withoutCharacter: number;
  withoutFileName: number;
}

interface MediaFile {
  id: string;
  fileName?: string;
  filePath?: string;
  characterid?: string;
  fileType?: string;
  createdAt?: string;
}

export default function MediaFileCleanup() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<MediaFileStats>({
    queryKey: ['/api/admin/media/stats'],
  });

  const { data: orphanedFiles = [], isLoading: orphanedLoading } = useQuery<MediaFile[]>({
    queryKey: ['/api/admin/media/orphaned'],
  });

  const { data: duplicateData, isLoading: duplicatesLoading } = useQuery<{
    duplicates: MediaFile[];
    groups: { [key: string]: MediaFile[] };
  }>({
    queryKey: ['/api/admin/media/duplicates'],
    select: (data) => {
      // Handle API returning array instead of object
      if (Array.isArray(data)) {
        return { duplicates: data, groups: {} };
      }
      return data || { duplicates: [], groups: {} };
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await apiRequest("DELETE", '/api/admin/media/bulk-delete', { ids });
      if (!response.ok) {
        throw new Error(`Failed to delete files: ${response.status}`);
      }
      return await response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Files Deleted",
        description: `Successfully deleted ${result.deletedCount} files${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/media/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/media/orphaned'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/media/duplicates'] });
      setSelectedFiles([]);
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete selected files",
        variant: "destructive",
      });
    }
  });

  const handleSelectFile = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAllOrphaned = () => {
    if (selectedFiles.length === orphanedFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(orphanedFiles.map(f => f.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedFiles.length === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedFiles.length} selected files? This cannot be undone.`
    );
    
    if (confirmed) {
      bulkDeleteMutation.mutate(selectedFiles);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            Media Files Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="text-gray-400">Loading stats...</div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{stats.orphaned}</div>
                <div className="text-sm text-gray-400">Orphaned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.duplicates}</div>
                <div className="text-sm text-gray-400">Duplicates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{stats.withoutCharacter}</div>
                <div className="text-sm text-gray-400">No Character</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.withoutFileName}</div>
                <div className="text-sm text-gray-400">No Filename</div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleSelectAllOrphaned}
          variant="outline"
          className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
          disabled={orphanedFiles.length === 0}
        >
          {selectedFiles.length === orphanedFiles.length ? 'Deselect All' : 'Select All Orphaned'}
        </Button>
        
        <Button
          onClick={handleBulkDelete}
          variant="destructive"
          disabled={selectedFiles.length === 0 || bulkDeleteMutation.isPending}
          className="bg-red-600 hover:bg-red-700"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {bulkDeleteMutation.isPending ? 'Deleting...' : `Delete Selected (${selectedFiles.length})`}
        </Button>
      </div>

      {/* Orphaned Files */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileX className="w-5 h-5 text-red-500" />
            Orphaned Files ({orphanedFiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {orphanedLoading ? (
              <div className="text-gray-400">Loading orphaned files...</div>
            ) : orphanedFiles.length === 0 ? (
              <div className="text-gray-400">No orphaned files found</div>
            ) : (
              <div className="space-y-2">
                {orphanedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => handleSelectFile(file.id)}
                        className="w-4 h-4"
                      />
                      <div>
                        <div className="text-white text-sm font-mono">
                          {file.fileName || 'No filename'}
                        </div>
                        <div className="text-gray-400 text-xs">
                          ID: {file.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!file.fileName && <Badge variant="destructive">No Name</Badge>}
                      {!file.characterid && <Badge variant="outline">No Character</Badge>}
                      {!file.filePath && <Badge variant="destructive">No Path</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Duplicate Files */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Duplicate Files ({duplicateData?.duplicates.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {duplicatesLoading ? (
              <div className="text-gray-400">Loading duplicate files...</div>
            ) : !duplicateData || duplicateData.duplicates.length === 0 ? (
              <div className="text-gray-400">No duplicate files found</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(duplicateData.groups).map(([fileName, files]) => {
                  if (files.length <= 1) return null;
                  
                  return (
                    <div key={fileName} className="border border-gray-600 rounded p-3">
                      <div className="text-white font-semibold mb-2">
                        {fileName} ({files.length} copies)
                      </div>
                      <div className="space-y-2">
                        {files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedFiles.includes(file.id)}
                                onChange={() => handleSelectFile(file.id)}
                                className="w-4 h-4"
                              />
                              <div className="text-sm">
                                <div className="text-gray-300">{file.id.substring(0, 12)}...</div>
                                <div className="text-gray-500 text-xs">{file.createdAt}</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400">
                              Character: {file.characterid?.substring(0, 8) || 'None'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}