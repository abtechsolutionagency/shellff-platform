
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Ban, 
  RefreshCw, 
  Download,
  Shield,
  Trash2,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface UnlockCode {
  id: string;
  code: string;
  releaseId: string;
  releaseTitle: string;
  creatorId: string;
  creatorName: string;
  status: 'unused' | 'redeemed' | 'invalid';
  redeemedBy?: string;
  redeemedAt?: string;
  batchId?: string;
  costPerCode?: number;
  createdAt: string;
}

interface BulkAction {
  type: 'mark_invalid' | 'revoke' | 'delete';
  reason?: string;
}

const STATUS_COLORS = {
  unused: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  redeemed: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  invalid: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

const STATUS_ICONS = {
  unused: Clock,
  redeemed: CheckCircle,
  invalid: XCircle,
};

export default function CodeManagement() {
  const [codes, setCodes] = useState<UnlockCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedCreatorForRefund, setSelectedCreatorForRefund] = useState<string | null>(null);
  const [bulkActionType, setBulkActionType] = useState<BulkAction['type']>('mark_invalid');
  const [actionReason, setActionReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const codesPerPage = 20;

  useEffect(() => {
    fetchCodes();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: codesPerPage.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/codes/list?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch codes');
      }

      const data = await response.json();
      setCodes(data.codes);
      setTotalPages(Math.ceil(data.total / codesPerPage));
    } catch (err) {
      toast.error('Failed to fetch unlock codes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async () => {
    if (selectedCodes.size === 0) return;

    try {
      const response = await fetch('/api/admin/codes/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkActionType,
          codeIds: Array.from(selectedCodes),
          reason: actionReason,
        }),
      });

      if (!response.ok) {
        throw new Error('Bulk operation failed');
      }

      const result = await response.json();
      toast.success(`${result.affectedCount} codes updated successfully`);
      
      setSelectedCodes(new Set());
      setBulkActionDialogOpen(false);
      setActionReason('');
      fetchCodes();
    } catch (err) {
      toast.error('Bulk operation failed');
      console.error(err);
    }
  };

  const handleSingleCodeAction = async (codeId: string, action: 'mark_invalid' | 'restore') => {
    try {
      const response = await fetch('/api/admin/codes/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action === 'restore' ? 'mark_unused' : action,
          codeIds: [codeId],
          reason: action === 'restore' ? 'Admin restore' : 'Admin action',
        }),
      });

      if (!response.ok) {
        throw new Error('Action failed');
      }

      toast.success(`Code ${action === 'restore' ? 'restored' : 'marked as invalid'} successfully`);
      fetchCodes();
    } catch (err) {
      toast.error('Action failed');
      console.error(err);
    }
  };

  const handleRefund = async () => {
    if (!selectedCreatorForRefund) return;

    try {
      const response = await fetch('/api/admin/codes/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: selectedCreatorForRefund,
          codeIds: Array.from(selectedCodes),
          reason: actionReason,
        }),
      });

      if (!response.ok) {
        throw new Error('Refund failed');
      }

      const result = await response.json();
      toast.success(`Refund of $${result.refundAmount} processed successfully`);
      
      setSelectedCodes(new Set());
      setRefundDialogOpen(false);
      setSelectedCreatorForRefund(null);
      setActionReason('');
      fetchCodes();
    } catch (err) {
      toast.error('Refund processing failed');
      console.error(err);
    }
  };

  const exportCodes = async () => {
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/codes/export?${params}`);
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `unlock-codes-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Export failed');
      console.error(err);
    }
  };

  const toggleCodeSelection = (codeId: string) => {
    const newSelection = new Set(selectedCodes);
    if (newSelection.has(codeId)) {
      newSelection.delete(codeId);
    } else {
      newSelection.add(codeId);
    }
    setSelectedCodes(newSelection);
  };

  const selectAllCodes = () => {
    if (selectedCodes.size === codes.length) {
      setSelectedCodes(new Set());
    } else {
      setSelectedCodes(new Set(codes.map(code => code.id)));
    }
  };

  const filteredCodes = codes.filter(code => {
    const matchesSearch = searchTerm === '' || 
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.releaseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.creatorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || code.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-700 rounded w-full"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Code Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search codes, releases, or creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unused">Unused</SelectItem>
                <SelectItem value="redeemed">Redeemed</SelectItem>
                <SelectItem value="invalid">Invalid</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportCodes} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedCodes.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <span className="text-sm">
                {selectedCodes.size} code{selectedCodes.size > 1 ? 's' : ''} selected
              </span>
              
              <Dialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => setBulkActionType('mark_invalid')}>
                    <Ban className="h-4 w-4 mr-2" />
                    Mark Invalid
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Action Confirmation</DialogTitle>
                    <DialogDescription>
                      You are about to {bulkActionType.replace('_', ' ')} {selectedCodes.size} codes. 
                      This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reason">Reason (optional)</Label>
                      <Textarea
                        id="reason"
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder="Enter reason for this action..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setBulkActionDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleBulkAction} className="bg-red-600 hover:bg-red-700">
                      Confirm Action
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Process Refund
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Process Refund</DialogTitle>
                    <DialogDescription>
                      Refund creators for the selected unused codes
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="refund-reason">Refund Reason</Label>
                      <Textarea
                        id="refund-reason"
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder="Enter reason for refund..."
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleRefund}>
                      Process Refund
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Codes Table */}
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="p-3 text-left">
                      <Checkbox
                        checked={selectedCodes.size === codes.length && codes.length > 0}
                        onCheckedChange={selectAllCodes}
                      />
                    </th>
                    <th className="p-3 text-left">Code</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Release</th>
                    <th className="p-3 text-left">Creator</th>
                    <th className="p-3 text-left">Cost</th>
                    <th className="p-3 text-left">Created</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCodes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        No unlock codes found
                      </td>
                    </tr>
                  ) : (
                    filteredCodes.map((code) => {
                      const StatusIcon = STATUS_ICONS[code.status];
                      const statusColor = STATUS_COLORS[code.status];
                      
                      return (
                        <tr key={code.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="p-3">
                            <Checkbox
                              checked={selectedCodes.has(code.id)}
                              onCheckedChange={() => toggleCodeSelection(code.id)}
                            />
                          </td>
                          <td className="p-3">
                            <span className="font-mono font-medium">{code.code}</span>
                            {code.batchId && (
                              <div className="text-xs text-muted-foreground">
                                Batch: {code.batchId}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge className={`${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {code.status.charAt(0).toUpperCase() + code.status.slice(1)}
                            </Badge>
                            {code.redeemedAt && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {formatDate(code.redeemedAt)}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-medium">{code.releaseTitle}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">{code.creatorName}</div>
                          </td>
                          <td className="p-3">
                            {code.costPerCode ? formatCurrency(code.costPerCode) : '-'}
                          </td>
                          <td className="p-3">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(code.createdAt)}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {code.status === 'invalid' ? (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleSingleCodeAction(code.id, 'restore')}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Restore
                                </Button>
                              ) : code.status === 'unused' ? (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleSingleCodeAction(code.id, 'mark_invalid')}
                                >
                                  <Ban className="h-3 w-3 mr-1" />
                                  Mark Invalid
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
