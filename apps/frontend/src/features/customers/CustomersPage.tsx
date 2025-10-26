import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetAssignedCustomersQuery, useGetInactiveCustomersQuery, useGetHighValueCustomersQuery } from './customersApi';

export default function CustomersPage() {
  const employeeId = useSelector((s: RootState) => s.auth.user?.employee_id || 0);
  const [tab, setTab] = useState<'assigned' | 'inactive' | 'high'>('assigned');
  const assigned = useGetAssignedCustomersQuery(employeeId, { skip: !employeeId });
  const inactive = useGetInactiveCustomersQuery(employeeId, { skip: !employeeId });
  const high = useGetHighValueCustomersQuery(employeeId, { skip: !employeeId });

  const rows = tab === 'assigned' ? (assigned.data ?? []) : tab === 'inactive' ? (inactive.data ?? []) : (high.data ?? []);

  if (!employeeId) return <p className="p-4">No employee selected</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Customers</h1>
          <p className="text-gray-600">Manage your customer relationships</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setTab('assigned')} 
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              tab==='assigned'
                ?'bg-green-500 text-white shadow-sm' 
                :'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Assigned ({assigned.data?.length || 0})
          </button>
          <button 
            onClick={() => setTab('inactive')} 
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              tab==='inactive'
                ?'bg-green-500 text-white shadow-sm' 
                :'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Inactive ({inactive.data?.length || 0})
          </button>
          <button 
            onClick={() => setTab('high')} 
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              tab==='high'
                ?'bg-green-500 text-white shadow-sm' 
                :'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            High Value ({high.data?.length || 0})
          </button>
        </div>

        {/* Customer List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {rows.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {rows.map((r: any) => (
                <div key={r.CustomerId ?? r.Id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-indigo-700">
                            {r.Customer ? r.Customer.toString().charAt(0).toUpperCase() : 'C'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {r.Customer ? r.Customer.toString() : r.name || 'Unknown Customer'}
                          </h3>
                          <p className="text-sm text-gray-500">{r.City || 'Unknown City'}</p>
                        </div>
                      </div>
                      <div className="ml-13 space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Segment:</span> {r.CustomerSegment || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Type:</span> {r.CustomerType || 'N/A'}
                        </p>
                        {r.ContactNumber && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Contact:</span> {r.ContactNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                        {r.Status || 'Active'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500">No customers match the selected filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
