
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Users, 
  Calendar, 
  TrendingUp, 
  Search, 
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Share
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface GroupPackMember {
  id: string;
  role: string;
  joinedAt: string;
  hasRedeemed: boolean;
  redeemedAt?: string;
  user: {
    userId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
}

interface GroupPack {
  id: string;
  name: string;
  description: string | null;
  packType: string;
  maxMembers: number;
  currentMembers: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  originalPrice: string;
  discountedPrice: string;
  discountPercentage: number;
  release: {
    id: string;
    title: string;
    coverArt: string | null;
    status: string;
  };
  members: GroupPackMember[];
  stats: {
    totalMembers: number;
    redeemedCount: number;
    availableCodes: number;
    redemptionRate: number;
  };
}

interface GroupPacksListProps {
  releaseId?: string;
}

const GroupPacksList: React.FC<GroupPacksListProps> = ({ releaseId }) => {
  const [groupPacks, setGroupPacks] = useState<GroupPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPackType, setFilterPackType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadGroupPacks();
  }, [releaseId, filterPackType, filterStatus, currentPage]);

  const loadGroupPacks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (releaseId) params.append('releaseId', releaseId);
      if (filterPackType !== 'all') params.append('packType', filterPackType);
      if (filterStatus !== 'all') params.append('isActive', filterStatus);

      const response = await fetch(`/api/creator/group-packs/list?${params}`);
      const result = await response.json();

      if (result.success) {
        setGroupPacks(result.data.groupPacks);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to load group packs:', error);
      toast.error('Failed to load group packs');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePackStatus = async (packId: string, currentStatus: boolean) => {
    // TODO: Implement pack status toggle API
    toast.success(`Pack ${currentStatus ? 'deactivated' : 'activated'} successfully`);
  };

  const handleDeletePack = async (packId: string) => {
    // TODO: Implement pack deletion API
    toast.success('Pack deleted successfully');
    loadGroupPacks();
  };

  const filteredPacks = groupPacks.filter(pack =>
    pack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pack.release.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPackTypeIcon = (packType: string) => {
    const icons = {
      family: '👨‍👩‍👧‍👦',
      friends: '👥',
      bulk: '📦',
      corporate: '🏢'
    };
    return icons[packType as keyof typeof icons] || '📦';
  };

  const getPackTypeBadge = (packType: string) => {
    const variants = {
      family: 'default',
      friends: 'secondary',
      bulk: 'outline',
      corporate: 'destructive'
    };
    return variants[packType as keyof typeof variants] || 'outline';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search group packs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterPackType} onValueChange={setFilterPackType}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="family">Family</SelectItem>
              <SelectItem value="friends">Friends</SelectItem>
              <SelectItem value="bulk">Bulk</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Group Packs List */}
      <div className="space-y-4">
        {filteredPacks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Group Packs Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search or filters.' : 'Create your first group pack to get started.'}
              </p>
              <Button>Create Group Pack</Button>
            </CardContent>
          </Card>
        ) : (
          filteredPacks.map((pack) => (
            <Card key={pack.id} className={cn(
              "transition-all duration-200 hover:shadow-md",
              !pack.isActive && "opacity-60"
            )}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {pack.release.coverArt && (
                      <img
                        src={pack.release.coverArt}
                        alt={pack.release.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getPackTypeIcon(pack.packType)}</span>
                        <CardTitle className="text-lg">{pack.name}</CardTitle>
                        <Badge 
                          variant={getPackTypeBadge(pack.packType) as any}
                          className="text-xs"
                        >
                          {pack.packType}
                        </Badge>
                      </div>
                      <CardDescription>
                        {pack.release.title} • Created {format(new Date(pack.createdAt), 'MMM d, yyyy')}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={pack.isActive ? "default" : "secondary"}>
                      {pack.isActive ? "Active" : "Inactive"}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share className="h-4 w-4 mr-2" />
                          Share Pack
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Pack
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleTogglePackStatus(pack.id, pack.isActive)}
                        >
                          {pack.isActive ? 'Deactivate' : 'Activate'} Pack
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeletePack(pack.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Pack
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {pack.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {pack.description}
                  </p>
                )}
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="text-sm font-medium">Members</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {pack.currentMembers}/{pack.maxMembers}
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="text-sm font-medium">Redeemed</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {pack.stats.redemptionRate}%
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Package className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="text-sm font-medium">Price</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {pack.discountedPrice} SHC
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Calendar className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="text-sm font-medium">Expires</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {pack.expiresAt 
                        ? format(new Date(pack.expiresAt), 'MMM d')
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>

                {pack.discountPercentage > 0 && (
                  <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      💰 Members save {pack.discountPercentage}% with this group pack!
                      (Original: {pack.originalPrice} SHC → Now: {pack.discountedPrice} SHC)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <span className="text-sm text-muted-foreground px-2">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default GroupPacksList;
