/**
 * CharacterSelection.tsx - Character Selection for New Players
 * Shows enabled characters for new players to choose from
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, Star, Lock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Character {
  id: string;
  name: string;
  personality: string;
  backstory?: string;
  mood: string;
  level: number;
  isNsfw: boolean;
  isVip: boolean;
  levelRequirement: number;
  isEnabled: boolean;
}

interface CharacterSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterSelected: (characterid: string) => void;
  userId: string;
}

export function CharacterSelection({ isOpen, onClose, onCharacterSelected, userId }: CharacterSelectionProps) {
  const [selectedCharacterid, setSelectedCharacterid] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available characters (only enabled ones)
  const { data: characters = [], isLoading } = useQuery({
    queryKey: ['/api/characters'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/characters");
      const data = await response.json();
      // Filter to only show enabled characters
      return data.filter((char: Character) => char.isEnabled);
    },
    enabled: isOpen
  });

  const selectCharacterMutation = useMutation({
    mutationFn: async (characterid: string) => {
      const response = await apiRequest("POST", `/api/player/${userId}/select-character`, {
        characterid
      });
      if (!response.ok) {
        throw new Error("Failed to select character");
      }
      return response.json();
    },
    onSuccess: (data, characterid) => {
      toast({
        title: "Character Selected!",
        description: `You've chosen ${characters.find(c => c.id === characterid)?.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/character/selected", userId] });
      onCharacterSelected(characterid);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to select character. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSelectCharacter = () => {
    if (selectedCharacterid) {
      selectCharacterMutation.mutate(selectedCharacterid);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="character-selection-modal">
        <DialogHeader>
          <DialogTitle>Choose Your Character</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Select a character to begin your adventure. Each character has their own unique personality and traits.
          </p>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-32 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {characters.map((character) => (
                  <Card 
                    key={character.id}
                    className={`cursor-pointer transition-all hover:scale-105 ${
                      selectedCharacterid === character.id 
                        ? 'ring-2 ring-primary border-primary' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedCharacterid(character.id)}
                    data-testid={`character-card-${character.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{character.name}</CardTitle>
                        <div className="flex gap-1">
                          {character.isVip && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              <Star className="w-3 h-3 mr-1" />
                              VIP
                            </Badge>
                          )}
                          {character.isNsfw && (
                            <Badge variant="destructive">
                              <Lock className="w-3 h-3 mr-1" />
                              18+
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Avatar className="w-16 h-16 mx-auto">
                        <AvatarFallback className="bg-gradient-to-br from-pink-100 to-purple-100 text-lg">
                          {character.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">{character.personality}</p>
                        {character.backstory && (
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {character.backstory}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-center gap-2">
                        <Heart className="w-4 h-4 text-pink-500" />
                        <span className="text-sm">Level {character.level}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {characters.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No characters available at the moment.</p>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={onClose} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSelectCharacter}
                  disabled={!selectedCharacterid || selectCharacterMutation.isPending}
                  data-testid="button-confirm-selection"
                >
                  {selectCharacterMutation.isPending ? "Selecting..." : "Confirm Selection"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}