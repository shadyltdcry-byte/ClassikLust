/**
 * CharacterEditor.tsx
 * Cleaned: 2025-08-25 - Only character edit logic
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { insertCharacterSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Character } from "@shared/schema";

type CharacterEditForm = z.infer<typeof insertCharacterSchema>;

interface CharacterEditorProps {
  character?: Character;
  isEditing?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CharacterEditor({
  character,
  isEditing = false,
  onSuccess,
  onCancel,
}: CharacterEditorProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const queryClient = useQueryClient();

  // Fetch media files for avatars
  const { data: mediaFiles = [] } = useQuery({
    queryKey: ["/api/media"],
    queryFn: async () => {
      const response = await fetch("/api/media");
      if (!response.ok) throw new Error("Failed to fetch media files");
      const data = await response.json();
      console.log('[CharacterEditor] Fetched media files:', data);
      return data;
    },
  });

  const form = useForm<CharacterEditForm>({
    resolver: zodResolver(insertCharacterSchema),
    defaultValues: {
      name: character?.name ?? "",
      bio: character?.bio ?? "",
      description: character?.description ?? "",
      imageUrl: character?.imageUrl ?? "",
      avatarUrl: character?.avatarUrl ?? "",
      personality: character?.personality ?? "friendly",
      chatStyle: character?.chatStyle ?? "casual",
      likes: character?.likes ?? "",
      dislikes: character?.dislikes ?? "",
      levelRequirement: character?.levelRequirement ?? 1,
      isNsfw: character?.isNsfw ?? false,
      isVip: character?.isVip ?? false,
      isEvent: character?.isEvent ?? false,
      responseTimeMin: character?.responseTimeMin ?? 1,
      responseTimeMax: character?.responseTimeMax ?? 3,
    },
  });

  useEffect(() => {
    if (character) {
      console.log('[CharacterEditor] Loading character data:', character);
      form.reset({
        name: character.name ?? "",
        bio: character.bio ?? "",
        description: character.description ?? "",
        imageUrl: character.imageUrl || character.avatarPath || "",
        avatarUrl: character.avatarUrl || "",
        personality: character.personality ?? "friendly",
        chatStyle: character.chatStyle ?? "casual",
        likes: character.likes ?? "",
        dislikes: character.dislikes ?? "",
        levelRequirement: character.levelRequirement ?? 1,
        isNsfw: character.isNsfw ?? false,
        isVip: character.isVip ?? false,
        isEvent: character?.isEvent ?? false,
        responseTimeMin: character.responseTimeMin ?? 1,
        responseTimeMax: character.responseTimeMax ?? 3,
      });
    }
  }, [character, form]);

  const mutation = useMutation({
    mutationFn: async (data: CharacterEditForm) => {
      const method = isEditing ? "PUT" : "POST";
      const endpoint = isEditing
        ? `/api/admin/characters/${character?.id}`
        : "/api/admin/characters";
      
      // Ensure avatarPath is set for backward compatibility
      const characterData = {
        ...data,
        avatarPath: data.imageUrl || data.avatarUrl || ""
      };
      
      console.log(`[CharacterEditor] ${method} ${endpoint}`, characterData);
      
      const response = await apiRequest(method, endpoint, characterData);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[CharacterEditor] Save failed:", errorText);
        throw new Error(errorText || "Character operation failed");
      }
      
      const result = await response.json();
      console.log("[CharacterEditor] Save successful:", result);
      
      // Force reload character data to ensure UI updates
      await queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      
      return result;
    },
    onSuccess: async (data) => {
      console.log("[CharacterEditor] Mutation success, invalidating queries and reloading data");
      toast.success(
        isEditing
          ? "Character updated successfully!"
          : "Character created successfully!"
      );
      
      // Invalidate all character-related queries
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/character/selected"] });
      
      // Refetch media files to ensure dropdowns are updated
      await queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      
      // If editing, force reload the character data
      if (isEditing && character?.id) {
        const updatedCharacter = data?.data || data;
        if (updatedCharacter) {
          form.reset({
            name: updatedCharacter.name ?? "",
            bio: updatedCharacter.bio ?? "",
            description: updatedCharacter.description ?? "",
            imageUrl: updatedCharacter.imageUrl ?? "",
            avatarUrl: updatedCharacter.avatarUrl ?? "",
            personality: updatedCharacter.personality ?? "friendly",
            chatStyle: updatedCharacter.chatStyle ?? "casual",
            likes: updatedCharacter.likes ?? "",
            dislikes: updatedCharacter.dislikes ?? "",
            levelRequirement: updatedCharacter.levelRequirement ?? 1,
            isNsfw: updatedCharacter.isNsfw ?? false,
            isVip: updatedCharacter.isVip ?? false,
            isEvent: updatedCharacter.isEvent ?? false,
            responseTimeMin: updatedCharacter.responseTimeMin ?? 1,
            responseTimeMax: updatedCharacter.responseTimeMax ?? 3,
          });
        }
      }
      
      if (onSuccess) onSuccess();
      if (!isEditing) form.reset();
    },
    onError: (error: any) => {
      console.error("[CharacterEditor] Mutation error:", error);
      toast.error(error?.message || (isEditing ? "Failed to update character" : "Failed to create character"));
    },
  });

  const onSubmit = (data: CharacterEditForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          {isEditing ? `Edit ${character?.name || "Character"}` : "Create New Character"}
        </h1>
        <p className="text-gray-400">
          {isEditing
            ? "Modify your AI companion's profile."
            : "Design a new character for your game."}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 grid grid-cols-2 bg-gray-800/50">
              <TabsTrigger value="basic" className="text-white data-[state=active]:bg-purple-600">
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="details" className="text-white data-[state=active]:bg-purple-600">
                More Details
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">Basic Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Character name"
                            {...field}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Short bio"
                            className="bg-gray-700 border-gray-600 text-white"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Character description"
                            className="bg-gray-700 border-gray-600 text-white"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">More Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="personality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Personality</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                              <SelectValue placeholder="Select personality" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              <SelectItem value="friendly" className="text-white">Friendly</SelectItem>
                              <SelectItem value="shy" className="text-white">Shy</SelectItem>
                              <SelectItem value="confident" className="text-white">Confident</SelectItem>
                              <SelectItem value="playful" className="text-white">Playful</SelectItem>
                              <SelectItem value="mysterious" className="text-white">Mysterious</SelectItem>
                              <SelectItem value="caring" className="text-white">Caring</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="chatStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Chat Style</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                              <SelectValue placeholder="Select chat style" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              <SelectItem value="casual" className="text-white">Casual</SelectItem>
                              <SelectItem value="formal" className="text-white">Formal</SelectItem>
                              <SelectItem value="flirty" className="text-white">Flirty</SelectItem>
                              <SelectItem value="intellectual" className="text-white">Intellectual</SelectItem>
                              <SelectItem value="cute" className="text-white">Cute</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="likes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Likes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Likes"
                            className="bg-gray-700 border-gray-600 text-white"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dislikes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Dislikes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Dislikes"
                            className="bg-gray-700 border-gray-600 text-white"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="levelRequirement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Required Level</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            {...field}
                            value={field.value || 1}
                            onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responseTimeMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Min Response Time (s)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="60"
                            {...field}
                            value={field.value || 1}
                            onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responseTimeMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Max Response Time (s)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="60"
                            {...field}
                            value={field.value || 1}
                            onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Main Image</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue placeholder="Select main image" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-700 border-gray-600 max-h-[300px] overflow-y-auto">
                                <SelectItem value="" className="text-white">
                                  No image selected
                                </SelectItem>
                                {Array.isArray(mediaFiles) && mediaFiles.map((file: any, index: number) => {
                                  // Extract filename from filePath or fileName
                                  const filename = file.fileName || file.filePath?.split('/').pop() || file.filename || `Image ${index + 1}`;
                                  const filePath = file.filePath || file.filepath || `/uploads/${file.fileName || file.filename}`;
                                  
                                  return (
                                    <SelectItem
                                      key={`main-image-${file.id || index}`}
                                      value={filePath}
                                      className="text-white hover:bg-gray-600"
                                    >
                                      📷 {filename}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="avatarUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Avatar Image</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue placeholder="Select avatar image" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-700 border-gray-600 max-h-[300px] overflow-y-auto">
                                <SelectItem value="" className="text-white">
                                  No image selected
                                </SelectItem>
                                {Array.isArray(mediaFiles) && mediaFiles.map((file: any, index: number) => {
                                  // Extract filename from filePath or fileName
                                  const filename = file.fileName || file.filePath?.split('/').pop() || file.filename || `Avatar ${index + 1}`;
                                  const filePath = file.filePath || file.filepath || `/uploads/${file.fileName || file.filename}`;
                                  
                                  return (
                                    <SelectItem
                                      key={`avatar-image-${file.id || index}`}
                                      value={filePath}
                                      className="text-white hover:bg-gray-600"
                                    >
                                      👤 {filename}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Image Previews */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-white">Main Image Preview</Label>
                      {form.watch("imageUrl") && (
                        <div className="border border-gray-600 rounded-lg p-2 bg-gray-700/50">
                          <img
                            src={form.watch("imageUrl") || ""}
                            alt="Main Preview"
                            className="w-full h-40 object-contain rounded"
                            onError={e => {
                              console.error('[CharacterEditor] Failed to load image:', form.watch("imageUrl"));
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x400/1a1a1a/ff1493?text=👤";
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Avatar Preview</Label>
                      {form.watch("avatarUrl") && (
                        <div className="border border-gray-600 rounded-lg p-2 bg-gray-700/50">
                          <img
                            src={form.watch("avatarUrl") || ""}
                            alt="Avatar Preview"
                            className="w-20 h-20 object-cover rounded-full mx-auto"
                            onError={e => {
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/80x80/1a1a1a/ff1493?text=👤";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-8 mt-4">
                    <Switch
                      checked={form.watch("isVip")}
                      onCheckedChange={v => form.setValue("isVip", v)}
                    />
                    <Label className="text-white">VIP Character</Label>
                    <Switch
                      checked={form.watch("isNsfw")}
                      onCheckedChange={v => form.setValue("isNsfw", v)}
                    />
                    <Label className="text-white">NSFW</Label>
                    <Switch
                      checked={form.watch("isEvent")}
                      onCheckedChange={v => form.setValue("isEvent", v)}
                    />
                    <Label className="text-white">Event</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel} className="bg-gray-700 text-white hover:bg-gray-600">
              Cancel
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
              {isEditing ? "Update Character" : "Create Character"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
