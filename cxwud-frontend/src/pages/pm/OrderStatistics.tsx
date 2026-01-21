import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './OrderStatistics.css';

// Mock data - replace with real API calls when available
const orderHistoryData = [
    { month: 'Jan', orders: 45 },
    { month: 'Feb', orders: 52 },
    { month: 'Mar', orders: 61 },
    { month: 'Apr', orders: 58 },
    { month: 'May', orders: 70 },
    { month: 'Jun', orders: 85 },
];

const orderStatusData = [
    { name: 'Completed', value: 145, color: '#10b981' },
    { name: 'Pending', value: 35, color: '#f59e0b' },
    { name: 'Cancelled', value: 20, color: '#ef4444' },
];

const revenueData = [
    { month: 'Jan', revenue: 12500000 },
    { month: 'Feb', revenue: 15200000 },
    { month: 'Mar', revenue: 18400000 },
    { month: 'Apr', revenue: 16800000 },
    { month: 'May', revenue: 21000000 },
    { month: 'Jun', revenue: 25500000 },
];

const OrderStatistics: React.FC = () => {
    return (
        <div className="order-statistics">
            <div className="page-header">
                <div>
                    <h1>Order Statistics</h1>
                    <p className="page-description">Track orders, revenue, and performance metrics</p>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📦</div>
                    <div className="stat-content">
                        <h3>Total Orders</h3>
                        <p className="stat-value">371</p>
                        <span className="stat-change positive">+12% from last month</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <h3>Total Revenue</h3>
                        <p className="stat-value">₫109.4M</p>
                        <span className="stat-change positive">+18% from last month</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>Completion Rate</h3>
                        <p className="stat-value">72.5%</p>
                        <span className="stat-change neutral">Same as last month</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                        <h3>Average Order Value</h3>
                        <p className="stat-value">₫295K</p>
                        <span className="stat-change positive">+5% from last month</span>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h2>Order History</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={orderHistoryData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip
                                contentStyle={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                            />
                            <Legend />
                            <Bar dataKey="orders" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                            <defs>
                                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#667eea" />
                                    <stop offset="100%" stopColor="#764ba2" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h2>Order Status Distribution</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={orderStatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {orderStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card full-width">
                    <h2>Revenue Over Time</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" stroke="#666" />
                            <YAxis stroke="#666" tickFormatter={(value) => `₫${(value / 1000000).toFixed(1)}M`} />
                            <Tooltip
                                contentStyle={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                                formatter={(value: any) => `₫${value.toLocaleString()}`}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#667eea"
                                strokeWidth={3}
                                dot={{ fill: '#667eea', r: 6 }}
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="info-banner">
                <p>
                    <strong>Note:</strong> These statistics are currently showing mock data.
                    Connect to real API endpoints for live data once backend statistics endpoints are available.
                </p>
            </div>
        </div>
    );
};

export default OrderStatistics;
