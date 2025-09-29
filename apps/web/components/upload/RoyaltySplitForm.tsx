
'use client';

import { useState } from 'react';
import { Plus, Trash2, Percent, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RoyaltySplit {
  userId: string;
  percentage: number;
  userName?: string;
  userSciId?: string;
}

interface RoyaltySplitFormProps {
  splits: RoyaltySplit[];
  onChange: (splits: RoyaltySplit[]) => void;
  error?: string;
}

export function RoyaltySplitForm({ splits, onChange, error }: RoyaltySplitFormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const addSplit = () => {
    const newSplit: RoyaltySplit = {
      userId: '',
      percentage: 0,
    };
    onChange([...splits, newSplit]);
  };

  const removeSplit = (index: number) => {
    onChange(splits.filter((_, i) => i !== index));
  };

  const updateSplit = (index: number, updates: Partial<RoyaltySplit>) => {
    onChange(splits.map((split, i) => 
      i === index ? { ...split, ...updates } : split
    ));
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results.users || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const addUserSplit = (user: any) => {
    const newSplit: RoyaltySplit = {
      userId: user.id,
      percentage: 0,
      userName: user.name || user.username,
      userSciId: user.sciId,
    };
    onChange([...splits, newSplit]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const totalPercentage = splits.reduce((sum, split) => sum + (split.percentage || 0), 0);
  const remainingPercentage = 100 - totalPercentage;

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white font-poppins flex items-center gap-2">
          <Percent className="w-5 h-5 text-green-400" />
          Royalty Splits (Optional)
        </CardTitle>
        <p className="text-gray-400 text-sm font-inter">
          Configure how royalties will be distributed among collaborators. Leave empty to keep 100% for yourself.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search for users */}
        <div className="space-y-2">
          <Label className="text-gray-300 font-inter">
            Add Collaborator
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                searchUsers(e.target.value);
              }}
              placeholder="Search by name, username, or User ID..."
              className="bg-gray-900/50 border-gray-600 text-white pl-10"
            />
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                    onClick={() => addUserSplit(user)}
                  >
                    <div>
                      <p className="text-white font-medium">
                        {user.name || user.username}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {user.userId} {user.sciId && `• ${user.sciId}`}
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-green-400" />
                  </div>
                ))}
              </div>
            )}
            
            {isSearching && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg p-3 text-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400 mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">Searching...</p>
              </div>
            )}
          </div>
        </div>

        {/* Current Splits */}
        {splits.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-3">
              {splits.map((split, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-900/30 rounded-lg border border-gray-600">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-gray-400 text-xs">Collaborator</Label>
                        {split.userName ? (
                          <div className="p-2 bg-gray-800/50 rounded border border-gray-600">
                            <p className="text-white font-medium text-sm">{split.userName}</p>
                            {split.userSciId && (
                              <p className="text-gray-400 text-xs">{split.userSciId}</p>
                            )}
                          </div>
                        ) : (
                          <Input
                            value={split.userId}
                            onChange={(e) => updateSplit(index, { userId: e.target.value })}
                            placeholder="User ID or search above"
                            className="bg-gray-800/50 border-gray-600 text-white text-sm"
                          />
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-gray-400 text-xs">Percentage</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={split.percentage}
                            onChange={(e) => updateSplit(index, { percentage: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                            className="bg-gray-800/50 border-gray-600 text-white text-sm pr-8"
                          />
                          <span className="absolute right-3 top-2.5 text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSplit(index)}
                    className="text-gray-400 hover:text-red-400 self-start sm:self-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Total percentage display */}
            <div className="text-center p-4 bg-gray-900/30 rounded-lg border border-gray-600">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-inter">Total Allocated:</span>
                  <span className={`font-semibold ${
                    totalPercentage > 100 
                      ? 'text-red-400' 
                      : totalPercentage === 100 
                        ? 'text-green-400' 
                        : 'text-yellow-400'
                  }`}>
                    {totalPercentage.toFixed(2)}%
                  </span>
                </div>
                
                {totalPercentage < 100 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-inter">Your Share:</span>
                    <span className="font-semibold text-purple-400">
                      {remainingPercentage.toFixed(2)}%
                    </span>
                  </div>
                )}
                
                {totalPercentage > 100 && (
                  <p className="text-red-400 text-sm flex items-center justify-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Total cannot exceed 100%
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add split button */}
        <Button
          onClick={addSplit}
          variant="outline"
          className="border-green-500 text-green-400 hover:bg-green-500/20 w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Manual Split
        </Button>

        {error && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}

        {splits.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Percent className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No royalty splits configured</p>
            <p className="text-xs mt-1">You&apos;ll receive 100% of the royalties</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

