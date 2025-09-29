
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SearchFiltersProps {
  filters: {
    genre: string;
    mood: string;
    sort: string;
  };
  onFiltersChange: (filters: any) => void;
}

interface Tag {
  id: string;
  name: string;
  category: string;
  usageCount: number;
}

export function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const [genres, setGenres] = useState<Tag[]>([]);
  const [moods, setMoods] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const [genreResponse, moodResponse] = await Promise.all([
        fetch("/api/tags?category=GENRE"),
        fetch("/api/tags?category=MOOD")
      ]);

      const genreData = await genreResponse.json();
      const moodData = await moodResponse.json();

      setGenres(genreData.tags || []);
      setMoods(moodData.tags || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      genre: "",
      mood: "",
      sort: "latest"
    });
  };

  const hasActiveFilters = filters.genre || filters.mood || filters.sort !== "latest";

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Filters</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2"
            >
              <X className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Genre Filter */}
          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <Select
              value={filters.genre}
              onValueChange={(value) => updateFilter("genre", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All genres</SelectItem>
                {loading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  genres.map((genre) => (
                    <SelectItem key={genre.id} value={genre.name}>
                      {genre.name} ({genre.usageCount})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Mood Filter */}
          <div className="space-y-2">
            <Label htmlFor="mood">Mood</Label>
            <Select
              value={filters.mood}
              onValueChange={(value) => updateFilter("mood", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All moods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All moods</SelectItem>
                {loading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  moods.map((mood) => (
                    <SelectItem key={mood.id} value={mood.name}>
                      {mood.name} ({mood.usageCount})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Filter */}
          <div className="space-y-2">
            <Label htmlFor="sort">Sort by</Label>
            <Select
              value={filters.sort}
              onValueChange={(value) => updateFilter("sort", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filter indicators */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {filters.genre && (
              <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                Genre: {filters.genre}
                <button
                  onClick={() => updateFilter("genre", "")}
                  className="ml-1 hover:bg-primary/20 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.mood && (
              <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                Mood: {filters.mood}
                <button
                  onClick={() => updateFilter("mood", "")}
                  className="ml-1 hover:bg-primary/20 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.sort !== "latest" && (
              <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                Sort: {filters.sort === "popular" ? "Most Popular" : filters.sort === "alphabetical" ? "A-Z" : filters.sort}
                <button
                  onClick={() => updateFilter("sort", "latest")}
                  className="ml-1 hover:bg-primary/20 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
