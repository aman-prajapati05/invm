import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, XCircle, CheckCircle, Package, Calendar, Barcode, Eye, Bell, Download, RefreshCw,  } from 'lucide-react';

// TypeScript interfaces
interface Job {
  _id: string;
  batchId: string;
  productId: string;
  type: string;
  notifyAt: string;
  expiryDate: string;
  status: 'scheduled' | 'notified' | 'snoozed' | 'completed' | 'cancelled';
  createdAt: string;
  batchCode: string;
  quantity: number;
  mfg_date: string;
  shelf_life_days: number;
  productName: string;
  sku: string;
  category?: string;
}

interface ProcessedJob extends Job {
  daysUntilExpiry: number;
  calculatedStatus: 'expired' | 'critical' | 'warning' | 'upcoming' | 'good' | 'inactive';
}

interface StatusConfig {
  color: string;
  textColor: string;
  badgeColor: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  label: string;
  priority: number;
}

type FilterStatus = 'all' | 'expired' | 'critical' | 'warning' | 'upcoming' | 'good' | 'inactive';
type SortBy = 'expiry' | 'priority';

const ExpiryDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('expiry');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpiryJobs = async (): Promise<void> => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/jobs?type=expiry-reminder');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.statusText}`);
      }
      
      const data: Job[] = await response.json();
      setJobs(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching expiry jobs:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExpiryJobs();
  }, []);

  const calculateExpiryStatus = (expiryDate: string, jobStatus: Job['status']): { 
    calculatedStatus: ProcessedJob['calculatedStatus']; 
    daysUntilExpiry: number; 
  } => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    
    // If job is cancelled or completed, show as inactive
    if (jobStatus === 'cancelled' || jobStatus === 'completed') {
      return { calculatedStatus: 'inactive', daysUntilExpiry };
    }
    
    if (daysUntilExpiry < 0) {
      return { calculatedStatus: 'expired', daysUntilExpiry };
    } else if (daysUntilExpiry <= 3) {
      return { calculatedStatus: 'critical', daysUntilExpiry };
    } else if (daysUntilExpiry <= 7) {
      return { calculatedStatus: 'warning', daysUntilExpiry };
    } else if (daysUntilExpiry <= 14) {
      return { calculatedStatus: 'upcoming', daysUntilExpiry };
    } else {
      return { calculatedStatus: 'good', daysUntilExpiry };
    }
  };

  const getStatusConfig = (status: ProcessedJob['calculatedStatus']): StatusConfig => {
    const configs: Record<ProcessedJob['calculatedStatus'], StatusConfig> = {
      expired: {
        color: 'bg-red-50 border-red-200',
        textColor: 'text-red-800',
        badgeColor: 'bg-red-100 text-red-800',
        icon: XCircle,
        iconColor: 'text-red-500',
        label: 'Expired',
        priority: 1
      },
      critical: {
        color: 'bg-orange-50 border-orange-200',
        textColor: 'text-orange-800',
        badgeColor: 'bg-orange-100 text-orange-800',
        icon: AlertTriangle,
        iconColor: 'text-orange-500',
        label: 'Critical',
        priority: 2
      },
      warning: {
        color: 'bg-yellow-50 border-yellow-200',
        textColor: 'text-yellow-800',
        badgeColor: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
        iconColor: 'text-yellow-500',
        label: 'Warning',
        priority: 3
      },
      upcoming: {
        color: 'bg-blue-50 border-blue-200',
        textColor: 'text-blue-800',
        badgeColor: 'bg-blue-100 text-blue-800',
        icon: Bell,
        iconColor: 'text-blue-500',
        label: 'Upcoming',
        priority: 4
      },
      good: {
        color: 'bg-green-50 border-green-200',
        textColor: 'text-green-800',
        badgeColor: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        iconColor: 'text-green-500',
        label: 'Good',
        priority: 5
      },
      inactive: {
        color: 'bg-gray-50 border-gray-200',
        textColor: 'text-gray-800',
        badgeColor: 'bg-gray-100 text-gray-800',
        icon: CheckCircle,
        iconColor: 'text-gray-500',
        label: 'Inactive',
        priority: 6
      }
    };
    return configs[status];
  };

  const updateJobStatus = async (jobId: string, newStatus: Job['status'], snoozeUntil: string | null = null): Promise<void> => {
    try {
      const response = await fetch('/api/jobs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          status: newStatus,
          snoozeUntil
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update job status');
      }

      // Refresh the jobs list
      await fetchExpiryJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Failed to update job status');
    }
  };

  const handleSnooze = (jobId: string): void => {
    const days = prompt('Snooze for how many days?', '1');
    if (days && !isNaN(Number(days))) {
      const snoozeDate = new Date();
      snoozeDate.setDate(snoozeDate.getDate() + parseInt(days));
      updateJobStatus(jobId, 'snoozed', snoozeDate.toISOString());
    }
  };

  const exportToCSV = (): void => {
    try {
      const headers = [
        'Product Name',
        'SKU',
        'Batch Code',
        'Quantity',
        'Manufacturing Date',
        'Expiry Date',
        'Days Until Expiry',
        'Status',
        'Job Status',
        'Notify At',
        'Shelf Life (Days)',
        'Category'
      ];

      const csvData = filteredJobs.map(job => [
        job.productName,
        job.sku,
        job.batchCode,
        job.quantity,
        new Date(job.mfg_date).toLocaleDateString(),
        new Date(job.expiryDate).toLocaleDateString(),
        job.daysUntilExpiry,
        job.calculatedStatus,
        job.status,
        new Date(job.notifyAt).toLocaleDateString(),
        job.shelf_life_days,
        job.category || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `expiry-report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export report');
    }
  };

  const processedJobs: ProcessedJob[] = jobs.map(job => {
    const { calculatedStatus, daysUntilExpiry } = calculateExpiryStatus(job.expiryDate, job.status);
    return {
      ...job,
      calculatedStatus,
      daysUntilExpiry
    };
  });

  const filteredJobs: ProcessedJob[] = processedJobs
    .filter(job => filter === 'all' || job.calculatedStatus === filter)
    .sort((a, b) => {
      if (sortBy === 'expiry') {
        return a.daysUntilExpiry - b.daysUntilExpiry;
      } else if (sortBy === 'priority') {
        return getStatusConfig(a.calculatedStatus).priority - getStatusConfig(b.calculatedStatus).priority;
      }
      return 0;
    });

  const getStatusCounts = (): Record<ProcessedJob['calculatedStatus'], number> => {
    return processedJobs.reduce((acc, job) => {
      acc[job.calculatedStatus] = (acc[job.calculatedStatus] || 0) + 1;
      return acc;
    }, {} as Record<ProcessedJob['calculatedStatus'], number>);
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading expiry alerts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-red-800 font-medium">Error loading expiry data</h3>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
          <button 
            onClick={fetchExpiryJobs}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Batch Expiry Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage batch expiration alerts</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchExpiryJobs}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {Object.entries({
          expired: 'Expired',
          critical: 'Critical (≤3 days)',
          warning: 'Warning (≤7 days)',
          upcoming: 'Upcoming (≤14 days)',
          good: 'Good (>14 days)',
          inactive: 'Inactive'
        } as const).map(([status, label]) => {
          const config = getStatusConfig(status);
          const count = statusCounts[status] || 0;
          const Icon = config.icon;
          
          return (
            <div
              key={status}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                filter === status ? 'ring-2 ring-blue-500' : ''
              } ${config.color}`}
              onClick={() => setFilter(filter === status ? 'all' : status)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${config.textColor}`}>{label}</p>
                  <p className={`text-2xl font-bold ${config.textColor}`}>{count}</p>
                </div>
                <Icon className={`h-8 w-8 ${config.iconColor}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-lg border">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="expiry">Days to Expiry</option>
              <option value="priority">Priority Level</option>
            </select>
          </div>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Filter
            </button>
          )}
        </div>
        <div className="text-sm text-gray-600">
          Showing {filteredJobs.length} of {jobs.length} expiry alerts
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {filteredJobs.map((job) => {
          const config = getStatusConfig(job.calculatedStatus);
          const Icon = config.icon;
          
          return (
            <div
              key={job._id}
              className={`p-4 rounded-lg border-2 ${config.color} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Icon className={`h-6 w-6 ${config.iconColor}`} />
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold text-gray-900">{job.productName}</span>
                      </div>
                      <p className="text-sm text-gray-600">SKU: {job.sku}</p>
                      {job.category && <p className="text-xs text-gray-500">{job.category}</p>}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <Barcode className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{job.batchCode}</span>
                      </div>
                      <p className="text-sm text-gray-600">Qty: {job.quantity} units</p>
                      <p className="text-xs text-gray-500">Job: {job.status}</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {new Date(job.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Mfg: {new Date(job.mfg_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Shelf life: {job.shelf_life_days} days
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Notify at:</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(job.notifyAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(job.notifyAt).toLocaleTimeString()}
                      </p>
                    </div>
                    
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.badgeColor}`}>
                        {job.calculatedStatus === 'expired' 
                          ? `Expired ${Math.abs(job.daysUntilExpiry)} days ago`
                          : job.daysUntilExpiry === 0
                          ? 'Expires today'
                          : job.daysUntilExpiry === 1
                          ? 'Expires tomorrow'
                          : `${job.daysUntilExpiry} days left`
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                  
                  {job.status === 'scheduled' && (
                    <>
                      <button 
                        onClick={() => handleSnooze(job._id)}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
                        title="Snooze notification"
                      >
                        {/* <Snooze className="h-4 w-4" /> */}
                      </button>
                      <button 
                        onClick={() => updateJobStatus(job._id, 'notified')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                      >
                        Mark Notified
                      </button>
                    </>
                  )}
                  
                  {(job.calculatedStatus === 'expired' || job.calculatedStatus === 'critical') && job.status === 'scheduled' && (
                    <button 
                      onClick={() => updateJobStatus(job._id, 'completed')}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                    >
                      Take Action
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No expiry alerts found</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'No expiry reminder jobs are currently scheduled in the system.'
              : `No alerts match the selected filter: ${getStatusConfig(filter).label}`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ExpiryDashboard;