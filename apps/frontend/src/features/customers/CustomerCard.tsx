import { useNavigate } from 'react-router-dom';

interface Customer {
  Id: string | number;
  customername?: string;
  description?: string;
  Priority?: number;
  contactnumber?: string | number;
  LastOrder?: number; // Days since last order
  LastOpened?: number; // Hours since last opened (from SA_HomePageAppFunnelCustomers)
}

interface CustomerCardProps {
  customers: Customer[];
  title: string;
  isLoading?: boolean;
  error?: any;
  showDescription?: boolean;
  showLastOrder?: boolean;
  tabType?: 'assigned' | 'inactive' | 'high';
}

export function CustomerCard({ 
  customers, 
  title, 
  isLoading, 
  error, 
  showDescription = true,
  showLastOrder = true,
  tabType = 'assigned'
}: CustomerCardProps) {
  const navigate = useNavigate();

  const formatTimeAgo = (dateValue: string | number | Date | null | undefined) => {
    if (!dateValue) return 'Unknown';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Invalid';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${diffDays} days ago`;
  };

  const formatHoursAgo = (hours: number | null | undefined) => {
    if (hours === null || hours === undefined) return 'Unknown';
    const hoursNum = typeof hours === 'number' ? hours : parseFloat(String(hours));
    if (isNaN(hoursNum)) return 'Invalid';
    
    // LastOpened is already in hours, so format it appropriately
    if (hoursNum < 1) {
      const mins = Math.floor(hoursNum * 60);
      return mins <= 1 ? '1 min ago' : `${mins} mins ago`;
    } else if (hoursNum < 24) {
      const wholeHours = Math.floor(hoursNum);
      return wholeHours === 1 ? '1 hr ago' : `${wholeHours} hrs ago`;
    } else {
      const days = Math.floor(hoursNum / 24);
      return days === 1 ? '1 day ago' : `${days} days ago`;
    }
  };

  const formatDaysAgo = (days: number | null | undefined) => {
    if (days === null || days === undefined) return 'Unknown';
    return `${days} days ago`;
  };

  const handleCall = (phoneNumber: string | number | null | undefined) => {
    if (!phoneNumber) return;
    window.location.href = `tel:${phoneNumber}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
        </div>
        <div className="text-center py-12">
          <p className="text-red-600">Error loading customers</p>
        </div>
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
        <button
          onClick={() => navigate('/customers')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All →
        </button>
      </div>
      
      <div className="divide-y divide-gray-200">
        {customers.map((r: any) => (
          <div key={r.Id} className="p-5 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-base font-semibold text-indigo-700">
                  {r.customername ? r.customername.charAt(0).toUpperCase() : 'C'}
                </span>
              </div>
              
              {/* Customer Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base mb-1">
                      {r.customername || 'Unknown Customer'}
                    </h3>
                    {showDescription && r.description && (
                      <p className="text-sm text-gray-600 mb-1">
                        {r.description}
                      </p>
                    )}
                  </div>
                  {/* Priority Badge */}
                  {r.Priority && (
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      r.Priority === 1 ? 'bg-red-100 text-red-700' : 
                      r.Priority === 2 ? 'bg-orange-100 text-orange-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      Priority {r.Priority}
                    </div>
                  )}
                </div>
                
                {/* Contact Info */}
                <div className="flex items-center gap-4 flex-wrap">
                  {r.contactnumber && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCall(r.contactnumber)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                      >
                        <span>📞</span>
                        <span>{String(r.contactnumber)}</span>
                      </button>
                    </div>
                  )}
                  
                  {/* Last Order/Opened Time */}
                  {showLastOrder && (r.LastOrder !== undefined || r.LastOpened !== undefined) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">
                        {tabType === 'assigned' || tabType === 'high' ? 'Last Order:' : 'Last Opened:'}
                      </span>
                      <span>
                        {tabType === 'assigned' || tabType === 'high'
                          ? formatDaysAgo(r.LastOrder)
                          : formatHoursAgo(r.LastOpened)
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
