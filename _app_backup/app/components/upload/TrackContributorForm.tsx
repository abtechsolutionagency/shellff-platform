
'use client';

import { useState } from 'react';
import { Plus, Trash2, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface Contributor {
  id: string;
  name: string;
  sciId: string; // Shellff Creator ID
  role: string;
  royaltyPercentage: number;
}

interface TrackContributorFormProps {
  contributors: Contributor[];
  onChange: (contributors: Contributor[]) => void;
}

const contributorRoles = [
  { value: 'MAIN_ARTIST', label: 'Main Artist' },
  { value: 'FEATURED_ARTIST', label: 'Featured Artist' },
  { value: 'PRODUCER', label: 'Producer' },
  { value: 'SONGWRITER', label: 'Songwriter' },
  { value: 'COMPOSER', label: 'Composer' },
  { value: 'MIXER', label: 'Mixer' },
  { value: 'ENGINEER', label: 'Engineer' },
  { value: 'OTHER', label: 'Other' },
];

export function TrackContributorForm({ contributors, onChange }: TrackContributorFormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const addContributor = () => {
    const newContributor: Contributor = {
      id: Date.now().toString(),
      name: '',
      sciId: '',
      role: 'OTHER',
      royaltyPercentage: 0,
    };
    onChange([...contributors, newContributor]);
  };

  const removeContributor = (id: string) => {
    onChange(contributors.filter(contributor => contributor.id !== id));
  };

  const updateContributor = (id: string, updates: Partial<Contributor>) => {
    onChange(contributors.map(contributor => 
      contributor.id === id ? { ...contributor, ...updates } : contributor
    ));
  };

  const searchCreators = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/creators/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results.creators || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const addSearchedCreator = (creator: any) => {
    const newContributor: Contributor = {
      id: Date.now().toString(),
      name: creator.name || creator.username,
      sciId: creator.sciId,
      role: 'OTHER',
      royaltyPercentage: 0,
    };
    onChange([...contributors, newContributor]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const totalRoyaltyPercentage = contributors.reduce((sum, c) => sum + (c.royaltyPercentage || 0), 0);
  const remainingPercentage = 100 - totalRoyaltyPercentage;

  return (
    <Card className="bg-gray-900/30 border-gray-600">
      <CardHeader>
        <CardTitle className="text-white font-poppins flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Track Contributors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search for existing creators */}
        <div className="space-y-2">
          <Label className="text-gray-300 font-inter">
            Search Shellff Creators
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                searchCreators(e.target.value);
              }}
              placeholder="Search by name or SCI ID..."
              className="bg-gray-800/50 border-gray-600 text-white pl-10"
            />
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                {searchResults.map((creator) => (
                  <div
                    key={creator.id}
                    className="p-2 hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                    onClick={() => addSearchedCreator(creator)}
                  >
                    <div>
                      <p className="text-white font-medium">
                        {creator.name || creator.username}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {creator.sciId}
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-green-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Existing Contributors */}
        {contributors.length > 0 && (
          <div className="space-y-3">
            {contributors.map((contributor, index) => (
              <div key={contributor.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-800/50 rounded-lg">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-gray-400 text-xs">Name</Label>
                    <Input
                      value={contributor.name}
                      onChange={(e) => updateContributor(contributor.id, { name: e.target.value })}
                      placeholder="Contributor name"
                      className="bg-gray-900/50 border-gray-600 text-white text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-gray-400 text-xs">SCI ID</Label>
                    <Input
                      value={contributor.sciId}
                      onChange={(e) => updateContributor(contributor.id, { sciId: e.target.value })}
                      placeholder="SCI000000X"
                      className="bg-gray-900/50 border-gray-600 text-white text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-gray-400 text-xs">Role</Label>
                    <Select
                      value={contributor.role}
                      onValueChange={(value) => updateContributor(contributor.id, { role: value })}
                    >
                      <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-600">
                        {contributorRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-gray-400 text-xs">Royalty %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={contributor.royaltyPercentage}
                      onChange={(e) => updateContributor(contributor.id, { royaltyPercentage: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="bg-gray-900/50 border-gray-600 text-white text-sm"
                    />
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeContributor(contributor.id)}
                  className="text-gray-400 hover:text-red-400 self-start sm:self-center"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add contributor button */}
        <Button
          onClick={addContributor}
          variant="outline"
          className="border-blue-500 text-blue-400 hover:bg-blue-500/20 w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Contributor Manually
        </Button>

        {/* Royalty summary */}
        {contributors.length > 0 && (
          <div className="text-center p-3 bg-gray-800/30 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Total Royalty Splits:</span>
              <span className={`font-medium ${
                totalRoyaltyPercentage > 100 
                  ? 'text-red-400' 
                  : totalRoyaltyPercentage === 100 
                    ? 'text-green-400' 
                    : 'text-yellow-400'
              }`}>
                {totalRoyaltyPercentage.toFixed(2)}%
              </span>
            </div>
            {remainingPercentage !== 0 && (
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-400">Remaining:</span>
                <span className={`font-medium ${remainingPercentage < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                  {remainingPercentage.toFixed(2)}%
                </span>
              </div>
            )}
            {totalRoyaltyPercentage > 100 && (
              <p className="text-red-400 text-xs mt-2 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Total cannot exceed 100%
              </p>
            )}
          </div>
        )}

        {contributors.length === 0 && (
          <div className="text-center py-6 text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No contributors added yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
