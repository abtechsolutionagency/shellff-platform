
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
  Calendar,
  User,
  Music,
  DollarSign,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface CodeData {
  id: string;
  code: string;
  status: string;
  release: {
    id: string;
    title: string;
    coverArt: string | null;
  };
  redeemer: {
    username: string;
    name: string;
  } | null;
  redeemedAt: string | null;
  createdAt: string;
  costPerCode: number | null;
  batchId: string | null;
  paymentInfo: {
    batchId: string;
    amount: number;
    method: string;
  } | null;
  lastRedemptionAttempt: {
    redeemedAt: string;
    ipAddress: string;
  } | null;
}

interface CodesResponse {
  codes: CodeData[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCodes: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface Release {
  id: string;
  title: string;
  _count: {
    unlockCodes: number;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'unused':
      return 'bg-yellow-100 text-yellow-800';
    case 'redeemed':
      return 'bg-green-100 text-green-800';
    case 'invalid':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const CodeStatusTable: React.FC = () => {
  const [data, setData] = useState<CodesResponse | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [releaseFilter, setReleaseFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        search,
        status: statusFilter,
        releaseId: releaseFilter,
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/creator/analytics/codes?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error('Failed to fetch codes data');
      }
    } catch (error) {
      console.error('Codes fetch error:', error);
      toast.error('Failed to fetch codes data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, releaseFilter, search, sortBy, sortOrder, statusFilter]);

  const fetchReleases = useCallback(async () => {
    try {
      const response = await fetch('/api/creator/analytics/redemptions');
      const result = await response.json();

      if (result.success) {
        setReleases(result.data.releases);
      }
    } catch (error) {
      console.error('Releases fetch error:', error);
    }
  }, []);

  useEffect(() => {
    void fetchReleases();
  }, [fetchReleases]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchCodes();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchCodes]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/creator/analytics/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: {
            search,
            status: statusFilter,
            releaseId: releaseFilter,
          },
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `unlock-codes-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Codes exported successfully');
      } else {
        toast.error('Failed to export codes');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export codes');
    } finally {
      setExporting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-2 text-lg">Loading codes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Code Status Monitor</h2>
          <p className="text-gray-600">
            {data ? `${data.pagination.totalCodes} total codes` : 'Loading...'}
          </p>
        </div>

        <Button 
          onClick={handleExport} 
          disabled={exporting}
          variant="outline"
          className="w-full sm:w-auto"
        >
          {exporting ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Codes
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Enter code..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select 
                value={statusFilter} 
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="unused">Unused</SelectItem>
                  <SelectItem value="redeemed">Redeemed</SelectItem>
                  <SelectItem value="invalid">Invalid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Release
              </label>
              <Select 
                value={releaseFilter} 
                onValueChange={(value) => {
                  setReleaseFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Releases" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Releases</SelectItem>
                  {releases.map((release) => (
                    <SelectItem key={release.id} value={release.id}>
                      {release.title} ({release._count.unlockCodes})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <Select 
                value={`${sortBy}-${sortOrder}`} 
                onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="code-asc">Code A-Z</SelectItem>
                  <SelectItem value="code-desc">Code Z-A</SelectItem>
                  <SelectItem value="status-asc">Status A-Z</SelectItem>
                  <SelectItem value="redeemedAt-desc">Recently Redeemed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-purple-600 mr-2" />
              <span>Loading codes...</span>
            </div>
          ) : !data || data.codes.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900">No codes found</p>
              <p className="text-gray-600 mt-1">
                Try adjusting your filters or generate some codes first
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('code')}
                      >
                        <div className="flex items-center">
                          Code
                          {sortBy === 'code' && (
                            <span className="ml-1 text-xs">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Release</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                          Status
                          {sortBy === 'status' && (
                            <span className="ml-1 text-xs">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Redeemer</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('redeemedAt')}
                      >
                        <div className="flex items-center">
                          Redeemed At
                          {sortBy === 'redeemedAt' && (
                            <span className="ml-1 text-xs">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Batch</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.codes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell>
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {code.code}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {code.release.coverArt ? (
                              <div className="relative w-8 h-8 rounded bg-gray-200 flex-shrink-0">
                                <Image
                                  src={code.release.coverArt}
                                  alt={code.release.title}
                                  fill
                                  className="object-cover rounded"
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                <Music className="h-4 w-4 text-gray-500" />
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {code.release.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(code.status)} capitalize`}>
                            {code.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {code.redeemer ? (
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm">{code.redeemer.name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Not redeemed</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {code.redeemedAt ? (
                            <div className="text-sm">
                              <div className="flex items-center text-gray-900">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(code.redeemedAt).toLocaleDateString()}
                              </div>
                              <div className="text-gray-500">
                                {new Date(code.redeemedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {code.costPerCode ? (
                            <div className="flex items-center text-sm">
                              <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                              {code.costPerCode.toFixed(2)}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {code.batchId ? (
                            <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {code.batchId.slice(0, 8)}...
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-gray-700">
                    Showing {((data.pagination.currentPage - 1) * data.pagination.limit) + 1} to{' '}
                    {Math.min(data.pagination.currentPage * data.pagination.limit, data.pagination.totalCodes)} of{' '}
                    {data.pagination.totalCodes} codes
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!data.pagination.hasPrevPage}
                      onClick={() => handlePageChange(data.pagination.currentPage - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={page === data.pagination.currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        );
                      })}
                      
                      {data.pagination.totalPages > 5 && (
                        <>
                          <span className="px-2">...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(data.pagination.totalPages)}
                            className="w-8 h-8 p-0"
                          >
                            {data.pagination.totalPages}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!data.pagination.hasNextPage}
                      onClick={() => handlePageChange(data.pagination.currentPage + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CodeStatusTable;






