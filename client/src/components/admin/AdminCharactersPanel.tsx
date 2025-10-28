import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Crown, Edit3, Trash2, Eye, EyeOff, Plus, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiRequest } from "@/lib/queryClient";
import CharacterCreation from "@/components/CharacterCreation";
import CharacterEditor from "@/components/CharacterEditor";
import type { Character } from "@shared/schema";

interface CharacterCardProps {
  character: Character;
  onEdit: (character: Character) => void;
  onDelete: (id: string, name: string) => void;
  onToggleVip: (id: string, current: boolean) => void;
  onToggleNsfw: (id: string, current: boolean) => void;
  onToggleEnabled: (id: string, current: boolean) => void;
  onToggleEvent: (id: string, current: boolean) => void; // Added for event toggle
  isUpdating: boolean;
}

const CharacterCard = ({
  character,
  onEdit,
  onDelete,
  onToggleVip,
  onToggleNsfw,
  onToggleEnabled,
  onToggleEvent, // Added for event toggle
  isUpdating
}: CharacterCardProps) => (
  <Card className="bg-gray-800 border-gray-700">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm text-white">{character.name}</CardTitle>
        {character.isVip && <Crown className="w-4 h-4 text-yellow-400" />}
      </div>
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="text-xs text-gray-400 space-y-1">
        <div>Creator: Admin</div>
        <div>Bond: 0</div>
        <div>Affection: 0</div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={character.isVip ? "default" : "outline"}
          onClick={() => onToggleVip(character.id, character.isVip || false)}
          disabled={isUpdating}
          className={character.isVip ? "bg-yellow-600 hover:bg-yellow-700" : "border-yellow-600 text-yellow-600 hover:bg-yellow-600/20"}
        >
          <Crown className="w-3 h-3 mr-1" />
          {character.isVip ? "VIP" : "VIP"}
        </Button>
        <Button
          size="sm"
          variant={character.isNsfw ? "destructive" : "outline"}
          onClick={() => onToggleNsfw(character.id, character.isNsfw || false)}
          disabled={isUpdating}
          className={character.isNsfw ? "bg-red-600 hover:bg-red-700" : "border-red-600 text-red-600 hover:bg-red-600/20"}
        >
          {character.isNsfw ? "🔞" : "🔞"}
          NSFW
        </Button>
        <Button
          size="sm"
          variant={character.isEvent ? "default" : "outline"}
          onClick={() => onToggleEvent(character.id, character.isEvent || false)}
          disabled={isUpdating}
          className={character.isEvent ? "bg-purple-600 hover:bg-purple-700" : "border-purple-600 text-purple-600 hover:bg-purple-600/20"}
        >
          ✨ Event
        </Button>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          variant={character.isEnabled ? "default" : "outline"}
          onClick={() => onToggleEnabled(character.id, character.isEnabled || false)}
          disabled={isUpdating}
          className="flex-1 h-8"
        >
          {character.isEnabled ? "Enabled" : "Disabled"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(character)}
          className="h-8 px-2 text-blue-400 hover:text-blue-300"
        >
          <Edit3 className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(character.id, character.name)}
          disabled={isUpdating}
          className="h-8 px-2 text-red-400 hover:text-red-300"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default function AdminCharactersPanel() {
  const [showCreateCharacter, setShowCreateCharacter] = useState(false);
  const [showEditCharacter, setShowEditCharacter] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const queryClient = useQueryClient();

  // Fetch characters
  const {
    data: characters = [],
    isLoading: charactersLoading,
    error: charactersError,
  } = useQuery({
    queryKey: ["/api/characters"],
    queryFn: async (): Promise<Character[]> => {
      const response = await apiRequest("GET", "/api/characters");
      if (!response.ok) {
        throw new Error(`Failed to fetch characters: ${response.status}`);
      }
      return await response.json();
    },
    retry: 2,
  });

  // Delete character mutation
  const deleteCharacterMutation = useMutation({
    mutationFn: async (charId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/characters/${charId}`);
      if (!response.ok) {
        throw new Error(`Failed to delete character`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Character deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
    },
    onError: () => {
      toast.error("Failed to delete character");
    },
  });

  // Toggle character mutation
  const toggleCharacterMutation = useMutation({
    mutationFn: async ({ characterid, field, value }: { characterid: string; field: string; value: boolean }) => {
      // Get full character data first
      const charResponse = await fetch(`/api/admin/characters`);
      const characters = await charResponse.json();
      const character = characters.find((c: any) => c.id === characterid);

      if (!character) throw new Error("Character not found");

      // Send complete update with all fields
      const response = await apiRequest("PUT", `/api/admin/characters/${characterid}`, {
        name: character.name,
        personality: character.personality,
        chatStyle: character.chatStyle,
        bio: character.bio,
        description: character.description,
        imageUrl: character.imageUrl,
        avatarUrl: character.avatarUrl,
        levelRequirement: character.levelRequirement,
        isNsfw: field === "isNsfw" ? value : character.isNsfw,
        isVip: field === "isVip" ? value : character.isVip,
        isEvent: field === "isEvent" ? value : character.isEvent,
        likes: character.likes,
        dislikes: character.dislikes,
        responseTimeMin: character.responseTimeMin,
        responseTimeMax: character.responseTimeMax
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to toggle character field");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast.success("Character updated!");
    },
    onError: (error: any) => {
      console.error("Toggle error:", error);
      toast.error(error.message || "Failed to update character");
    },
  });

  const handleEdit = useCallback((char: Character) => {
    setSelectedCharacter(char);
    setShowEditCharacter(true);
  }, []);

  const handleDelete = useCallback((id: string, name: string) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteCharacterMutation.mutate(id);
    }
  }, [deleteCharacterMutation]);

  const handleToggleVip = useCallback((id: string, current: boolean) => {
    toggleCharacterMutation.mutate({ characterid: id, field: "isVip", value: !current });
  }, [toggleCharacterMutation]);

  const handleToggleNsfw = useCallback((id: string, current: boolean) => {
    toggleCharacterMutation.mutate({ characterid: id, field: "isNsfw", value: !current });
  }, [toggleCharacterMutation]);

  const handleToggleEnabled = useCallback((id: string, current: boolean) => {
    toggleCharacterMutation.mutate({ characterid: id, field: "isEnabled", value: !current });
  }, [toggleCharacterMutation]);

  const handleToggleEvent = useCallback((id: string, current: boolean) => { // Added handler for event toggle
    toggleCharacterMutation.mutate({ characterid: id, field: "isEvent", value: !current });
  }, [toggleCharacterMutation]);

  const handleCreateSuccess = useCallback(() => {
    setShowCreateCharacter(false);
    queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
    toast.success("Character created!");
  }, [queryClient]);

  const handleEditSuccess = useCallback(() => {
    setShowEditCharacter(false);
    setSelectedCharacter(null);
    queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
    toast.success("Character updated!");
  }, [queryClient]);

  if (charactersError) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-400 mb-4">Failed to load characters</div>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/characters"] })}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Character Management</h2>
          <p className="text-gray-400">Create and manage AI characters</p>
        </div>
        <Button
          onClick={() => setShowCreateCharacter(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Character
        </Button>
      </div>

      {charactersLoading ? (
        <div className="text-center py-8">
          <div className="text-gray-400">Loading characters...</div>
        </div>
      ) : (
        <ScrollArea className="h-96">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleVip={handleToggleVip}
                onToggleNsfw={handleToggleNsfw}
                onToggleEnabled={handleToggleEnabled}
                onToggleEvent={handleToggleEvent} // Pass the new handler
                isUpdating={toggleCharacterMutation.isPending || deleteCharacterMutation.isPending}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Create Character Modal */}
      {showCreateCharacter && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full h-full max-w-4xl max-h-[95vh] overflow-auto bg-gray-900 rounded-lg">
            <CharacterCreation
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateCharacter(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Character Modal */}
      {showEditCharacter && selectedCharacter && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full h-full max-w-4xl max-h-[95vh] overflow-auto bg-gray-900 rounded-lg">
            <CharacterEditor
              character={selectedCharacter}
              isEditing={true}
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setShowEditCharacter(false);
                setSelectedCharacter(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}