import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetAssignedCustomersQuery, useGetInactiveCustomersQuery, useGetHighValueCustomersQuery } from './customersApi';
import { CUSTOMER_TAB_LABELS } from './customerConstants';
import { CustomerCard } from './CustomerCard';

export default function CustomersPage() {
  const employeeId = useSelector((s: RootState) => s.auth.user?.employee_id || '');
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
            {CUSTOMER_TAB_LABELS.assigned} ({assigned.data?.length || 0})
          </button>
          <button 
            onClick={() => setTab('inactive')} 
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              tab==='inactive'
                ?'bg-green-500 text-white shadow-sm' 
                :'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {CUSTOMER_TAB_LABELS.inactive} ({inactive.data?.length || 0})
          </button>
          <button 
            onClick={() => setTab('high')} 
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              tab==='high'
                ?'bg-green-500 text-white shadow-sm' 
                :'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {CUSTOMER_TAB_LABELS.high} ({high.data?.length || 0})
          </button>
        </div>

        {/* Customer List */}
        <CustomerCard
          customers={rows}
          title={tab === 'assigned' ? CUSTOMER_TAB_LABELS.assigned : 
                 tab === 'inactive' ? CUSTOMER_TAB_LABELS.inactive : 
                 CUSTOMER_TAB_LABELS.high}
          showDescription={true}
          tabType={tab}
        />
      </div>
    </div>
  );
}
