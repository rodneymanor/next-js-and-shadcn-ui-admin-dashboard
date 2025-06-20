"use client";

import React, { useState, useEffect } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Star, Calendar, Clock, FileText, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QuickNoteCapture } from "@/components/ui/quick-note-capture";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
}

// Mock data
const mockNotes: Note[] = [
  {
    id: "1",
    title: "Project Ideas",
    content: "Some interesting project concepts to explore further...",
    tags: ["ideas", "projects"],
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    isFavorite: true,
  },
  {
    id: "2",
    title: "Meeting Notes - Q1 Planning",
    content: "Key points from the quarterly planning session...",
    tags: ["meetings", "planning"],
    createdAt: new Date("2024-01-14"),
    updatedAt: new Date("2024-01-14"),
    isFavorite: false,
  },
  {
    id: "3",
    title: "Research Findings",
    content: "Important insights from recent market research...",
    tags: ["research", "insights"],
    createdAt: new Date("2024-01-13"),
    updatedAt: new Date("2024-01-13"),
    isFavorite: false,
  },
];

export default function NotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);

  // Check for quick capture trigger - redirect to editor
  useEffect(() => {
    const trigger = searchParams.get("trigger");
    if (trigger === "quick") {
      router.push("/dashboard/note-editor?id=new");
    }
  }, [searchParams, router]);

  // Get all unique tags
  const allTags = Array.from(new Set(notes.flatMap((note) => note.tags)));

  // Filter notes based on search and tags
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => note.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const handleQuickNoteSave = (title: string, content: string) => {
    const note: Note = {
      id: Date.now().toString(),
      title,
      content,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isFavorite: false,
    };

    setNotes((prev) => [note, ...prev]);
  };

  const toggleFavorite = (noteId: string) => {
    setNotes((prev) => prev.map((note) => (note.id === noteId ? { ...note, isFavorite: !note.isFavorite } : note)));
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <React.Fragment>
      <QuickNoteCapture
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onSave={handleQuickNoteSave}
      />

      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
            <p className="text-muted-foreground">Capture and organize your thoughts and ideas</p>
          </div>
          <Button onClick={() => router.push("/dashboard/note-editor?id=new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="text-muted-foreground h-4 w-4" />
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
                  }}
                >
                  {tag}
                </Badge>
              ))}
              {selectedTags.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedTags([])} className="h-6 px-2 text-xs">
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12">
            <FileText className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No notes found</h3>
            <p className="text-muted-foreground mb-4 text-center">
              {searchQuery || selectedTags.length > 0
                ? "Try adjusting your search or filters"
                : "Create your first note to get started"}
            </p>
            <Button onClick={() => router.push("/dashboard/note-editor?id=new")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Note
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 @md:grid-cols-2 @4xl:grid-cols-3">
            {filteredNotes.map((note) => (
              <Card
                key={note.id}
                className="group cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => router.push(`/dashboard/note-editor?id=${note.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="mb-1 line-clamp-2 text-base">{note.title}</CardTitle>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <Calendar className="h-3 w-3" />
                        {formatDate(note.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleFavorite(note.id)}>
                        <Star
                          className={cn(
                            "h-4 w-4",
                            note.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground",
                          )}
                        />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground mb-3 line-clamp-3 text-sm">{note.content}</p>
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      <Tag className="text-muted-foreground h-3 w-3" />
                      {note.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </React.Fragment>
  );
}
