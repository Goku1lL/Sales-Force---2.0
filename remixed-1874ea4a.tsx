import { useState, useEffect } from 'react';
import { TrendingUp, Zap, Package, ShoppingCart, UserCheck, Trophy, AlertCircle, Clock, Phone, Target, Star, ArrowUp, CircleDot } from 'lucide-react';

const mockDatabase = {
  salesExecutive: {
    name: 'Rajesh Kumar',
    todayEarnings: 1200,
    streak: 5,
    rank: 1,
    coins: 2450,
    dailyTarget: 5000,
    todayProgress: { tonnage: 4.2, tonnageTarget: 5.0, orders: 21, ordersTarget: 19, base: 5, baseTarget: 4 }
  },
  liveActivity: [
    { name: 'Priya', action: 'closed 3 orders', time: '2m ago', earnings: 450 },
    { name: 'Amit', action: 'hit tonnage target', time: '5m ago', earnings: 1200 },
    { name: 'Sneha', action: 'reactivated customer', time: '8m ago', earnings: 300 }
  ],
  urgentActions: [
    { customer: 'Green Valley', reason: 'Volume ↓35%', impact: '₹890', tonnage: '1.2T', priority: 'critical', closing: '2h', coinsReward: 50 },
    { customer: 'Fresh Mart', reason: 'No order W3', impact: '₹595', tonnage: '0.8T', priority: 'high', closing: '4h', coinsReward: 30 },
    { customer: 'Urban Greens', reason: 'Can order more', impact: '₹370', tonnage: '0.5T', priority: 'medium', closing: '6h', coinsReward: 20 }
  ],
  nearbyOpportunities: [
    { customer: 'City Fresh', earnings: '₹650', distance: '0.8km', closing: '1h' },
    { customer: 'Metro Mart', earnings: '₹420', distance: '1.2km', closing: '3h' }
  ]
};

function HomePage() {
  const { salesExecutive, liveActivity, urgentActions, nearbyOpportunities } = mockDatabase;
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 45, seconds: 32 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dailyPercent = (salesExecutive.todayEarnings / salesExecutive.dailyTarget * 100);

  return (
    <div className="space-y-4">
      {/* Main Earnings Card */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-5 shadow-md border-2 border-orange-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-orange-700 text-sm font-bold mb-2">💰 Pending to Earn Today</p>
            <div className="flex items-baseline space-x-3">
              <h1 className="text-6xl font-black text-gray-900">₹{salesExecutive.dailyTarget - salesExecutive.todayEarnings}</h1>
              <span className="px-3 py-1.5 bg-orange-500 text-white text-sm font-bold rounded-lg shadow-sm">Remaining</span>
            </div>
            <p className="text-orange-700 text-sm mt-2 font-semibold">⚡ Still available to earn today</p>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            <div className="px-3 py-2 bg-yellow-400 rounded-lg border-2 border-yellow-500 shadow-md">
              <p className="text-xs font-black text-gray-900">RANK</p>
              <p className="text-2xl font-black text-gray-900">#{salesExecutive.rank}</p>
            </div>
            <div className="px-3 py-1.5 bg-orange-500 rounded-lg border-2 border-orange-600 shadow-md">
              <p className="text-xs text-white font-black">🔥 {salesExecutive.streak} day streak</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="h-4 bg-white/50 rounded-full overflow-hidden border-2 border-orange-200 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all"
              style={{ width: `${dailyPercent}%` }}
            ></div>
          </div>
          <p className="text-xs text-orange-700 mt-1 font-bold">{dailyPercent.toFixed(0)}% complete</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white rounded-lg border border-orange-200 shadow-sm">
            <p className="text-gray-600 text-xs font-medium mb-1">Today's Earning</p>
            <p className="text-2xl font-bold text-gray-900">₹{salesExecutive.todayEarnings}</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-orange-200 shadow-sm">
            <p className="text-gray-600 text-xs font-medium mb-1">MTD Earning</p>
            <p className="text-2xl font-bold text-gray-900">₹24,850</p>
          </div>
        </div>
      </div>

      {/* Weekly Pending Card */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-5 shadow-md border-2 border-blue-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-blue-700 text-sm font-bold mb-2">📅 Pending to Earn This Week</p>
            <div className="flex items-baseline space-x-3">
              <h1 className="text-6xl font-black text-gray-900">₹21,550</h1>
              <span className="px-3 py-1.5 bg-blue-500 text-white text-sm font-bold rounded-lg shadow-sm">Remaining</span>
            </div>
            <p className="text-blue-700 text-sm mt-2 font-semibold">⚡ Still available to earn this week</p>
          </div>
        </div>

        <div className="mb-2">
          <div className="h-4 bg-white/50 rounded-full overflow-hidden border-2 border-blue-200 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full transition-all"
              style={{ width: '28%' }}
            ></div>
          </div>
          <p className="text-xs text-blue-700 mt-1 font-bold">28% complete • ₹8,450 earned this week</p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-bold text-gray-900">Weekly Leaderboard</h3>
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded">
              Cluster
            </button>
            <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded hover:bg-gray-200">
              City
            </button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">Bangalore North Cluster • This Week</p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border-2 border-yellow-300">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">👑</span>
              <div>
                <p className="text-base font-bold text-gray-900">YOU - Rajesh Kumar</p>
                <p className="text-xs text-gray-600">Bangalore North</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Weekly Earnings</p>
              <p className="text-2xl font-bold text-gray-900">₹8,450</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-700">
                2
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">Suresh Nair</p>
                <p className="text-xs text-gray-600">Bangalore North</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">₹8,120</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-700">
                3
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">Deepak Singh</p>
                <p className="text-xs text-gray-600">Bangalore North</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">₹7,890</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-700">
                4
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">Kavitha Rao</p>
                <p className="text-xs text-gray-600">Bangalore North</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">₹7,650</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-xs font-medium">Tonnage</p>
            <Package className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">{salesExecutive.todayProgress.tonnage}T</p>
          <div className="flex items-center space-x-1">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
              <div className="h-1.5 bg-orange-500 rounded-full" style={{ width: `${(salesExecutive.todayProgress.tonnage / salesExecutive.todayProgress.tonnageTarget * 100)}%` }}></div>
            </div>
            <span className="text-xs text-gray-500">{salesExecutive.todayProgress.tonnageTarget}T</span>
          </div>
          {salesExecutive.todayProgress.tonnage < salesExecutive.todayProgress.tonnageTarget && (
            <p className="text-xs font-medium text-red-600 mt-2">0.8T short</p>
          )}
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-xs font-medium">Orders</p>
            <ShoppingCart className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">{salesExecutive.todayProgress.orders}</p>
          <div className="flex items-center space-x-1">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
              <div className="h-1.5 bg-green-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
            <span className="text-xs text-gray-500">{salesExecutive.todayProgress.ordersTarget}</span>
          </div>
          <p className="text-xs font-medium text-green-600 mt-2">Target exceeded</p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-xs font-medium">Active Base</p>
            <UserCheck className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">{salesExecutive.todayProgress.base}</p>
          <div className="flex items-center space-x-1">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
              <div className="h-1.5 bg-green-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
            <span className="text-xs text-gray-500">{salesExecutive.todayProgress.baseTarget}</span>
          </div>
          <p className="text-xs font-medium text-green-600 mt-2">+1 bonus</p>
        </div>
      </div>

      {/* Critical Actions */}
      <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-red-300">
        <div className="flex items-center space-x-2 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-bold text-gray-900">Critical Actions Required</h3>
        </div>
        <p className="text-sm text-red-600 font-medium mb-4">₹1,855 at risk • 2.5T potential loss</p>

        <div className="space-y-3">
          {urgentActions.map((action, idx) => (
            <div key={idx} className={`p-4 rounded-lg border-2 ${
              action.priority === 'critical' ? 'bg-red-50 border-red-300' :
              action.priority === 'high' ? 'bg-orange-50 border-orange-300' :
              'bg-yellow-50 border-yellow-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-lg font-bold text-gray-900">{action.customer}</p>
                    {action.priority === 'critical' && (
                      <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">URGENT</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{action.reason}</p>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-bold text-gray-900">{action.impact}</span>
                    <span className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700">{action.tonnage}</span>
                    <span className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-red-600">⏰ {action.closing}</span>
                  </div>
                </div>
                <button className="ml-4 px-5 py-5 bg-green-600 hover:bg-green-700 rounded-lg shadow-sm">
                  <Phone className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Activity */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CircleDot className="w-4 h-4 text-green-500" />
            <h3 className="text-base font-bold text-gray-900">Live Activity</h3>
          </div>
          <span className="text-xs text-gray-500">Just now</span>
        </div>
        <div className="space-y-2">
          {liveActivity.map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center font-semibold text-green-700 text-sm">
                  {activity.name[0]}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{activity.name} {activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
              <p className="text-base font-bold text-green-600">+₹{activity.earnings}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Nearby Opportunities */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Target className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-gray-900">Nearby Opportunities</h3>
        </div>
        <div className="space-y-3">
          {nearbyOpportunities.map((opp, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="text-base font-bold text-gray-900">{opp.customer}</p>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-xs font-medium text-gray-600">📍 {opp.distance}</span>
                  <span className="text-xs font-medium text-red-600">⏰ {opp.closing}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-600">{opp.earnings}</p>
                <button className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium">
                  Call Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TonnagePage() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-5 shadow-sm border-2 border-red-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-600 text-sm font-semibold mb-2">⚠️ Tonnage Gap</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">0.8T Short</h2>
            <p className="text-xl font-bold text-red-600 mb-1">₹595 at risk</p>
            <p className="text-gray-600 text-sm">Close this gap to secure your incentive</p>
          </div>
          <div className="text-right">
            <div className="px-4 py-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs font-medium text-red-600 mb-1">Closes in</p>
              <p className="text-3xl font-bold text-red-700">2h 15m</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-red-300">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Volume Crash Alerts</h3>
        <div className="space-y-3">
          <div className="p-4 bg-red-50 rounded-lg border-2 border-red-300">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className="text-lg font-bold text-gray-900 mb-1">Green Valley Stores</p>
                <p className="text-sm text-gray-700 mb-3">Volume crashed 35% • Lost 1.2T this week</p>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1.5 bg-white border border-red-300 rounded text-lg font-bold text-gray-900">₹890</span>
                  <span className="px-3 py-1.5 bg-white border border-red-300 rounded text-sm font-medium text-gray-700">1.2T</span>
                  <span className="px-3 py-1.5 bg-white border border-red-300 rounded text-xs font-medium text-red-600">⏰ 2h</span>
                </div>
              </div>
              <button className="ml-4 px-5 py-5 bg-green-600 hover:bg-green-700 rounded-lg shadow-sm">
                <Phone className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrdersPage() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-5 shadow-sm border-2 border-green-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-600 text-sm font-semibold mb-2">✓ Orders Status</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">+2 Over Target</h2>
            <p className="text-xl font-bold text-green-600 mb-1">Bonus ₹300 Unlocked</p>
            <p className="text-gray-600 text-sm">Great work! 108 more this month</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Win Customers</h3>
        <div className="space-y-3">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className="text-lg font-bold text-gray-900 mb-1">Fresh Mart Retail</p>
                <p className="text-sm text-gray-700 mb-3">Usually 4 orders/week • Only 2 this week</p>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1.5 bg-white border border-blue-300 rounded text-lg font-bold text-gray-900">₹420</span>
                  <span className="px-3 py-1.5 bg-white border border-blue-300 rounded text-sm font-medium text-gray-700">+2 orders</span>
                </div>
              </div>
              <button className="ml-4 px-5 py-5 bg-green-600 hover:bg-green-700 rounded-lg shadow-sm">
                <Phone className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActiveBasePage() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-5 shadow-sm border-2 border-green-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-600 text-sm font-semibold mb-2">✓ Active Base Status</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">+1 Bonus Customer</h2>
            <p className="text-xl font-bold text-green-600 mb-1">Earned ₹250 extra</p>
            <p className="text-gray-600 text-sm">17 more to hit 100% of base</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-orange-300">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Inactive Customers</h3>
        <p className="text-orange-700 font-medium mb-4 text-sm">Each reactivation = ₹200-800 instant earnings</p>
        <div className="space-y-3">
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className="text-lg font-bold text-gray-900 mb-1">Fresh Choice Mart</p>
                <p className="text-sm text-gray-700 mb-3">Inactive 3 weeks • Was ₹950/week customer</p>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1.5 bg-white border border-orange-300 rounded text-lg font-bold text-gray-900">₹800</span>
                  <span className="px-3 py-1.5 bg-white border border-orange-300 rounded text-xs font-medium text-orange-600">Act now</span>
                </div>
              </div>
              <button className="ml-4 px-5 py-5 bg-green-600 hover:bg-green-700 rounded-lg shadow-sm">
                <Phone className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomersPage() {
  const customers = [
    { name: 'Urban Greens', status: 'hot', next: 'TODAY', value: '₹1,200', tonnage: '1.5T' },
    { name: 'Green Valley', status: 'critical', next: 'TODAY', value: '₹890', tonnage: '1.2T' },
    { name: 'Organic Hub', status: 'warm', next: 'Tomorrow', value: '₹650', tonnage: '1.0T' }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your Customers</h2>
        <p className="text-gray-600 text-sm">Prioritized by earning potential</p>
      </div>

      <div className="space-y-3">
        {customers.map((c, i) => (
          <div key={i} className={`p-4 rounded-lg border-2 ${
            c.status === 'hot' ? 'bg-green-50 border-green-300' :
            c.status === 'critical' ? 'bg-red-50 border-red-300' :
            'bg-blue-50 border-blue-300'
          }`}>
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-lg font-bold text-gray-900">{c.name}</p>
                  {c.status === 'hot' && <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded">HOT</span>}
                </div>
                <p className="text-sm text-gray-700 mb-2">Next order: {c.next} • {c.tonnage}/week</p>
                <span className="px-3 py-1.5 bg-white border border-gray-300 rounded text-base font-bold text-gray-900">{c.value}</span>
              </div>
              <button className="ml-4 px-5 py-5 bg-green-600 hover:bg-green-700 rounded-lg shadow-sm">
                <Phone className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IncentivePage() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <p className="text-gray-600 text-sm font-medium mb-2">Month Earnings</p>
        <h2 className="text-5xl font-bold text-gray-900 mb-2">₹24,850</h2>
        <p className="text-lg font-semibold text-gray-700 mb-4">₹10,150 still available</p>
        <div className="h-3 bg-gray-100 rounded-full">
          <div className="h-3 bg-green-500 rounded-full" style={{ width: '71%' }}></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">71% complete</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-gray-600 text-xs font-medium mb-2">Tonnage (50%)</p>
          <p className="text-2xl font-bold text-gray-900">₹12,425</p>
          <p className="text-xs text-gray-500 mt-2">74.6% done</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-gray-600 text-xs font-medium mb-2">Orders (30%)</p>
          <p className="text-2xl font-bold text-gray-900">₹7,980</p>
          <p className="text-xs text-gray-500 mt-2">76.0% done</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-gray-600 text-xs font-medium mb-2">Base (20%)</p>
          <p className="text-2xl font-bold text-gray-900">₹5,600</p>
          <p className="text-xs text-gray-500 mt-2">80.0% done</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Cluster Rankings</h3>
        <div className="space-y-3">
          <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">👑</span>
                <div>
                  <p className="text-base font-bold text-gray-900">YOU - Rajesh</p>
                  <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded">RANK #1</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">96.8%</p>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center">
              <p className="font-medium text-gray-700">Priya - Behind by 2.3%</p>
              <p className="text-xl font-bold text-gray-900">94.5%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatPage() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Quick Answers</h2>
        <p className="text-gray-600 text-sm">Ask anything about your performance</p>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 h-96 flex items-center justify-center">
        <p className="text-gray-400 text-base text-center">Chat interface coming soon...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">{mockDatabase.salesExecutive.name}</h1>
                <p className="text-xs text-gray-600">Bangalore North</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <span className="w-6 h-6 text-gray-700">🔔</span>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  3
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 sticky top-[61px] z-10 overflow-x-auto">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex space-x-1">
            {[
              { id: 'home', label: '🏠 Home' },
              { id: 'tonnage', label: '📦 Tonnage' },
              { id: 'orders', label: '🛒 Orders' },
              { id: 'base', label: '👥 Base' },
              { id: 'customers', label: '📋 Customers' },
              { id: 'incentive', label: '💰 Earnings' },
              { id: 'chat', label: '💬 Chat' }
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-3 font-semibold text-sm whitespace-nowrap transition-all ${
                  activeTab === id
                    ? 'bg-green-600 text-white rounded-t-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-4">
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'tonnage' && <TonnagePage />}
        {activeTab === 'orders' && <OrdersPage />}
        {activeTab === 'base' && <ActiveBasePage />}
        {activeTab === 'customers' && <CustomersPage />}
        {activeTab === 'incentive' && <IncentivePage />}
        {activeTab === 'chat' && <ChatPage />}
      </main>
    </div>
  );
}