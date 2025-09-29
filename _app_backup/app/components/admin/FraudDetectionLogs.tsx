
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  RefreshCcw, 
  Search, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface FraudLog {
  id: string;
  userId?: string;
  ipAddress?: string;
  deviceFingerprint?: string;
  attemptedCodes: string[];
  detectionReason: string;
  flaggedAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
}

interface FraudLogsResponse {
  logs: FraudLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export function FraudDetectionLogs() {
  const [logs, setLogs] = useState<FraudLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<FraudLog | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Filters and pagination
  const [filters, setFilters] = useState({
    resolved: '',
    ipAddress: '',
    userId: '',
    page: 1,
    limit: 20,
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (filters.resolved !== '') searchParams.set('resolved', filters.resolved);
      if (filters.ipAddress) searchParams.set('ipAddress', filters.ipAddress);
      if (filters.userId) searchParams.set('userId', filters.userId);
      searchParams.set('page', filters.page.toString());
      searchParams.set('limit', filters.limit.toString());

      const response = await fetch(`/api/admin/security/fraud-logs?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch fraud logs');
      }

      const data: FraudLogsResponse = await response.json();
      setLogs(data.logs);
    } catch (error) {
      console.error('Fraud logs fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load fraud logs');
    } finally {
      setLoading(false);
    }
  };

  const resolveLog = async (logId: string, notes: string) => {
    try {
      setResolving(true);

      const response = await fetch(`/api/admin/security/fraud-logs/${logId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve fraud log');
      }

      toast.success('Fraud log resolved successfully');
      setSelectedLog(null);
      setResolutionNotes('');
      fetchLogs();
    } catch (error) {
      console.error('Failed to resolve fraud log:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resolve fraud log');
    } finally {
      setResolving(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      resolved: '',
      ipAddress: '',
      userId: '',
      page: 1,
      limit: 20,
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchLogs}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Fraud Detection Logs
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Monitor and resolve suspicious activity alerts
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={filters.resolved} 
                onValueChange={(value) => updateFilter('resolved', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="false">Unresolved</SelectItem>
                  <SelectItem value="true">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>IP Address</Label>
              <Input
                placeholder="Filter by IP..."
                value={filters.ipAddress}
                onChange={(e) => updateFilter('ipAddress', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>User ID</Label>
              <Input
                placeholder="Filter by user..."
                value={filters.userId}
                onChange={(e) => updateFilter('userId', e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={fetchLogs} size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button onClick={resetFilters} variant="outline" size="sm">
                Reset
              </Button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Flagged At</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Attempted Codes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCcw className="h-8 w-8 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No fraud logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.resolved ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <Clock className="h-3 w-3 mr-1" />
                            Unresolved
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(log.flaggedAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(log.flaggedAt), 'HH:mm:ss')}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ipAddress || 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.userId || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm">
                          {log.detectionReason}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.attemptedCodes.length} codes
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Fraud Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Fraud Detection Details
            </DialogTitle>
            <DialogDescription>
              Review and resolve suspicious activity
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <div className="mt-1">
                    {selectedLog.resolved ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <Clock className="h-3 w-3 mr-1" />
                        Unresolved
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold">Flagged At</Label>
                  <div className="mt-1 text-sm">
                    {format(new Date(selectedLog.flaggedAt), 'MMM dd, yyyy HH:mm:ss')}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">IP Address</Label>
                  <div className="mt-1 text-sm font-mono">
                    {selectedLog.ipAddress || 'N/A'}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">User ID</Label>
                  <div className="mt-1 text-sm font-mono">
                    {selectedLog.userId || 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">Device Fingerprint</Label>
                <div className="mt-1 text-sm font-mono break-all">
                  {selectedLog.deviceFingerprint || 'N/A'}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">Detection Reason</Label>
                <div className="mt-1 text-sm bg-muted p-3 rounded">
                  {selectedLog.detectionReason}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">Attempted Codes</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {selectedLog.attemptedCodes.map((code, index) => (
                    <Badge key={index} variant="outline" className="font-mono">
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedLog.resolved && (
                <div>
                  <Label className="text-sm font-semibold">Resolution</Label>
                  <div className="mt-1 space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Resolved by:</span> {selectedLog.resolvedBy}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Resolved at:</span> {' '}
                      {selectedLog.resolvedAt && format(new Date(selectedLog.resolvedAt), 'MMM dd, yyyy HH:mm:ss')}
                    </div>
                    {selectedLog.notes && (
                      <div className="bg-muted p-3 rounded text-sm">
                        {selectedLog.notes}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!selectedLog.resolved && (
                <div className="space-y-2">
                  <Label htmlFor="resolutionNotes">Resolution Notes</Label>
                  <Textarea
                    id="resolutionNotes"
                    placeholder="Add notes about how this issue was resolved..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLog(null)}>
              Close
            </Button>
            {selectedLog && !selectedLog.resolved && (
              <Button 
                onClick={() => resolveLog(selectedLog.id, resolutionNotes)}
                disabled={resolving}
              >
                {resolving ? (
                  <RefreshCcw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {resolving ? 'Resolving...' : 'Mark as Resolved'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
