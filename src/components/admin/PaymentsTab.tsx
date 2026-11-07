import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ShieldCheck,
  Calendar,
  X,
  PlusCircle,
  DollarSign
} from 'lucide-react';
import { PaymentRecord } from '../../types';
import { api } from '../../services/api';

interface PaymentsTabProps {
  showNotification: (type: 'success' | 'error', msg: string) => void;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({ showNotification }) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.getPayments(params);
      setPayments(res.payments);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [selectedStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>Payment Records</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold font-mono">
              {payments.length} Transactions
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit verified Razorpay payments and student membership upgrade transactions.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search txn ID, student email, name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadPayments()}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        <button
          onClick={loadPayments}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
        >
          Filter
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading payment transactions...</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No payment records found</div>
            <p className="text-xs text-slate-400">No transactions match your active filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-3.5">Transaction ID</th>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Gateway / Method</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-blue-700">
                      {p.transaction_id}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{p.student_name || 'Student'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{p.student_email}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-black text-slate-900 text-sm">₹{p.amount}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-bold uppercase text-[10px] text-slate-700">
                        {p.gateway}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          p.status === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.status === 'success' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : p.status === 'pending' ? (
                          <Clock className="w-3 h-3 text-amber-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-600" />
                        )}
                        <span>{p.status}</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100"
                        title="View Transaction Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TRANSACTION DETAILS MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-base font-black text-slate-900">Transaction Details</h3>
              <button onClick={() => setSelectedPayment(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-800">{selectedPayment.transaction_id}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono text-slate-800">{selectedPayment.order_id || '--'}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800">{selectedPayment.student_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-800">{selectedPayment.student_email}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-black text-slate-900 text-sm">₹{selectedPayment.amount}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Gateway:</span>
                <span className="font-bold text-slate-800 uppercase">{selectedPayment.gateway}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-700 uppercase">{selectedPayment.status}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-700">{new Date(selectedPayment.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
