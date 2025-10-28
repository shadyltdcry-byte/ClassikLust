/**
 * CharacterCreation.tsx
 * PURE CHARACTER CREATION LOGIC ONLY - NO ADMIN UI
 * Last Cleaned: 2025-08-25
 */

import { useState } from "react";
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

type CharacterCreationForm = z.infer<typeof insertCharacterSchema>;

interface CharacterCreationProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CharacterCreation({
  onSuccess,
  onCancel,
}: CharacterCreationProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const queryClient = useQueryClient();

  // Fetch media files for avatars
  const { data: mediaFiles = [] } = useQuery({
    queryKey: ["/api/media"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/media");
      if (!response.ok) throw new Error("Failed to fetch media files");
      return response.json();
    },
  });

  const form = useForm<CharacterCreationForm>({
    resolver: zodResolver(insertCharacterSchema),
    defaultValues: {
      name: "",
      bio: "",
      description: "",
      imageUrl: "",
      avatarUrl: "",
      personality: "friendly",
      chatStyle: "casual",
      likes: "",
      dislikes: "",
      requiredLevel: 1,
      isNsfw: false,
      isVip: false,
      responseTimeMin: 1,
      responseTimeMax: 3,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CharacterCreationForm) => {
      const response = await apiRequest("POST", "/api/characters", data);
      if (!response.ok) throw new Error("Character creation failed");
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Character created successfully!");
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
      if (onSuccess) onSuccess();
      form.reset();
    },
    onError: (error) => {
      console.error("Character creation error:", error);
      toast.error("Failed to create character");
    },
  });

  const onSubmit = (data: CharacterCreationForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Create New Character</h1>
        <p className="text-gray-400">Design a new AI companion for your game.</p>
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
                  <CardDescription className="text-gray-400">
                    Essential character information
                  </CardDescription>
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
                            placeholder="Enter character name"
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
                            placeholder="Short character biography"
                            className="bg-gray-700 border-gray-600 text-white resize-none"
                            rows={3}
                            {...field}
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
                            placeholder="Detailed character description"
                            className="bg-gray-700 border-gray-600 text-white resize-none"
                            rows={4}
                            {...field}
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
                  <CardTitle className="text-white">Personality & Behavior</CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure character traits and responses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <Select onValueChange={field.onChange} value={field.value}>
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="likes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Likes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Things the character likes"
                              className="bg-gray-700 border-gray-600 text-white resize-none"
                              rows={3}
                              {...field}
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
                              placeholder="Things the character dislikes"
                              className="bg-gray-700 border-gray-600 text-white resize-none"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="requiredLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Required Level</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              {...field}
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
                              onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Media Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <SelectContent className="bg-gray-700 border-gray-600">
                                <SelectItem value="" className="text-white">No image</SelectItem>
                                {(mediaFiles as any[])
                                  .filter((file: any) => {
                                    // Include files that have either fileName or filePath set
                                    const hasFileName = file.fileName && file.fileName !== 'undefined' && file.fileName.trim() !== '';
                                    const hasFilePath = file.filePath && file.filePath !== 'undefined' && !file.filePath.includes('undefined');
                                    return hasFileName || hasFilePath;
                                  })
                                  .map((file: any) => {
                                    const displayName = file.fileName || file.filePath?.split('/').pop() || `File ${file.id.slice(0, 8)}`;
                                    const filePath = file.filePath || `/uploads/${file.fileName}`;
                                    
                                    return (
                                      <SelectItem
                                        key={file.id}
                                        value={filePath}
                                        className="text-white"
                                      >
                                        {displayName}
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
                              <SelectContent className="bg-gray-700 border-gray-600">
                                <SelectItem value="" className="text-white">No avatar</SelectItem>
                                {(mediaFiles as any[])
                                  .filter((file: any) => {
                                    const hasFileName = file.fileName && file.fileName !== 'undefined' && file.fileName.trim() !== '';
                                    const hasFilePath = file.filePath && file.filePath !== 'undefined' && !file.filePath.includes('undefined');
                                    return hasFileName || hasFilePath;
                                  })
                                  .map((file: any) => {
                                    const displayName = file.fileName || file.filePath?.split('/').pop() || `File ${file.id.slice(0, 8)}`;
                                    const filePath = file.filePath || `/uploads/${file.fileName}`;
                                    
                                    return (
                                      <SelectItem
                                        key={file.id}
                                        value={filePath}
                                        className="text-white"
                                      >
                                        {displayName}
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
                  {(form.watch("imageUrl") || form.watch("avatarUrl")) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {form.watch("imageUrl") && (
                        <div className="space-y-2">
                          <Label className="text-white">Main Image Preview</Label>
                          <div className="border border-gray-600 rounded-lg p-2 bg-gray-700/50">
                            <img
                              src={form.watch("imageUrl")}
                              alt="Main Preview"
                              className="w-full h-40 object-contain rounded"
                              onError={e => {
                                (e.target as HTMLImageElement).src = "/uploads/placeholder-character.jpg";
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {form.watch("avatarUrl") && (
                        <div className="space-y-2">
                          <Label className="text-white">Avatar Preview</Label>
                          <div className="border border-gray-600 rounded-lg p-2 bg-gray-700/50">
                            <img
                              src={form.watch("avatarUrl")}
                              alt="Avatar Preview"
                              className="w-20 h-20 object-cover rounded-full mx-auto"
                              onError={e => {
                                (e.target as HTMLImageElement).src = "/uploads/placeholder-avatar.jpg";
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Switches */}
                  <div className="flex items-center gap-8">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={form.watch("isVip")}
                        onCheckedChange={v => form.setValue("isVip", v)}
                      />
                      <Label className="text-white">VIP Character</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={form.watch("isNsfw")}
                        onCheckedChange={v => form.setValue("isNsfw", v)}
                      />
                      <Label className="text-white">NSFW Content</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {mutation.isPending ? "Creating..." : "Create Character"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}