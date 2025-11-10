import { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetAssignedCustomersQuery, useGetInactiveCustomersQuery, useGetHighValueCustomersQuery, useGetCustomerPageCustomersQuery } from './customersApi';
import { CustomerCard } from './CustomerCard';

interface Customer {
  Id: string | number;
  customer_id?: string | number;
  description?: string;
  LastOrder?: number; // Days ago
  LastOpened?: number; // Hours ago
  date?: string | Date; // Date field from SA_CustomerPageCustomers
  [key: string]: any;
}

export default function CustomersPage() {
  const employeeId = useSelector((s: RootState) => s.auth.user?.employee_id || '');
  const assigned = useGetAssignedCustomersQuery(employeeId, { skip: !employeeId });
  const inactive = useGetInactiveCustomersQuery(employeeId, { skip: !employeeId });
  const high = useGetHighValueCustomersQuery(employeeId, { skip: !employeeId });
  const customerPage = useGetCustomerPageCustomersQuery(employeeId, { skip: !employeeId });

  // Group customers by description, merging from all sources
  // Deduplicate by customer_id + description (since SA_CustomerPageCustomers has multiple rows per customer)
  const groupedData = useMemo(() => {
    const groups: Record<string, Customer[]> = {};
    const seenKeys = new Set<string>();

    // Process in priority order: assigned > high > inactive > customerPage
    // For SA_CustomerPageCustomers, deduplicate by customer_id + description since it has product-level data
    const allCustomers = [
      ...(assigned.data ?? []).map(c => ({ ...c, _source: 'assigned' })),
      ...(high.data ?? []).map(c => ({ ...c, _source: 'high' })),
      ...(inactive.data ?? []).map(c => ({ ...c, _source: 'inactive' })),
      ...(customerPage.data ?? []).map(c => ({ ...c, _source: 'customerPage' }))
    ];

    allCustomers.forEach((customer: Customer & { _source?: string }) => {
      const desc = customer.description || 'Uncategorized';
      
      // Create unique key: use customer_id + description for customerPage, Id for others
      const uniqueKey = customer._source === 'customerPage' && customer.customer_id
        ? `${customer.customer_id}_${desc}`
        : `${customer.Id}_${desc}`;
      
      if (seenKeys.has(uniqueKey)) return; // Skip duplicates
      seenKeys.add(uniqueKey);
      
      if (!groups[desc]) {
        groups[desc] = [];
      }
      // Remove _source before adding
      const { _source, ...cleanCustomer } = customer;
      groups[desc].push(cleanCustomer);
    });

    // Sort each group by time/date fields (most recent first)
    Object.keys(groups).forEach(desc => {
      groups[desc].sort((a, b) => {
        // For SA_CustomerPageCustomers, sort by date (most recent first)
        if (a.date && b.date) {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA; // DESC: most recent first
        }
        
        // For LastOpened (hours ago - lower is more recent)
        if (a.LastOpened !== undefined && b.LastOpened !== undefined) {
          return (a.LastOpened as number) - (b.LastOpened as number); // ASC: lower hours = more recent
        }
        
        // For LastOrder (days ago - lower is more recent)
        if (a.LastOrder !== undefined && b.LastOrder !== undefined) {
          return (a.LastOrder as number) - (b.LastOrder as number); // ASC: lower days = more recent
        }
        
        // Fallback: maintain original order
        return 0;
      });
    });

    return groups;
  }, [assigned.data, inactive.data, high.data, customerPage.data]);

  // Get unique descriptions sorted alphabetically
  const descriptions = useMemo(() => {
    return Object.keys(groupedData).sort();
  }, [groupedData]);

  // Set initial tab to first description, or empty string if no data
  const [selectedDescription, setSelectedDescription] = useState<string>('');

  // Update selected description when data loads
  useEffect(() => {
    if (descriptions.length > 0 && !selectedDescription) {
      setSelectedDescription(descriptions[0]);
    }
  }, [descriptions, selectedDescription]);

  const currentCustomers = selectedDescription ? (groupedData[selectedDescription] ?? []) : [];
  
  // Determine source type based on which data source has the most customers for this description
  const currentSource = useMemo(() => {
    if (!selectedDescription || currentCustomers.length === 0) return 'assigned';
    
    const assignedCount = (assigned.data ?? []).filter(c => (c.description || 'Uncategorized') === selectedDescription).length;
    const inactiveCount = (inactive.data ?? []).filter(c => (c.description || 'Uncategorized') === selectedDescription).length;
    const highCount = (high.data ?? []).filter(c => (c.description || 'Uncategorized') === selectedDescription).length;
    
    if (inactiveCount > assignedCount && inactiveCount > highCount) return 'inactive';
    if (highCount > assignedCount && highCount > inactiveCount) return 'high';
    return 'assigned';
  }, [selectedDescription, currentCustomers.length, assigned.data, inactive.data, high.data]);

  if (!employeeId) return <p className="p-4">No employee selected</p>;

  if (descriptions.length === 0 && !assigned.isLoading && !inactive.isLoading && !high.isLoading && !customerPage.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Customers</h1>
            <p className="text-gray-600">Manage your customer relationships</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No customers found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Customers</h1>
          <p className="text-gray-600">Manage your customer relationships</p>
        </div>

        {/* Tabs - Dynamic based on descriptions */}
        {descriptions.length > 0 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {descriptions.map((desc) => {
              const count = groupedData[desc].length;
              const isSelected = selectedDescription === desc;
              return (
                <button
                  key={desc}
                  onClick={() => setSelectedDescription(desc)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isSelected
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {desc} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Customer List */}
        {selectedDescription && (
          <CustomerCard
            customers={currentCustomers}
            title={selectedDescription}
            isLoading={assigned.isLoading || inactive.isLoading || high.isLoading}
            showDescription={false}
            tabType={currentSource}
          />
        )}
      </div>
    </div>
  );
}
