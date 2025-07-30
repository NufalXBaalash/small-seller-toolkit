"use client";

import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Download, FileText } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const AnalyticsDashboard = () => {
  const [isExporting, setIsExporting] = useState(false);
  
  const salesData = [
    { month: "Jan", revenue: 2400, orders: 45 },
    { month: "Feb", revenue: 1398, orders: 32 },
    { month: "Mar", revenue: 9800, orders: 78 },
    { month: "Apr", revenue: 3908, orders: 65 },
    { month: "May", revenue: 4800, orders: 89 },
    { month: "Jun", revenue: 3800, orders: 72 },
  ];

  const topProducts = [
    { name: "iPhone Cases", sales: 156, revenue: 3900 },
    { name: "Wireless Headphones", sales: 89, revenue: 8010 },
    { name: "Phone Stands", sales: 67, revenue: 1038 },
    { name: "USB Cables", sales: 45, revenue: 584 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const kpis = useMemo(() => {
    const totalRevenue = salesData.reduce((sum, data) => sum + data.revenue, 0);
    const totalOrders = salesData.reduce((sum, data) => sum + data.orders, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const conversionRate = 24.8;

    return {
      totalRevenue: {
        value: formatCurrency(totalRevenue),
        change: { value: 12.5, isPositive: true }
      },
      totalOrders: {
        value: formatNumber(totalOrders),
        change: { value: 8.2, isPositive: true }
      },
      avgOrderValue: {
        value: formatCurrency(avgOrderValue),
        change: { value: -2.1, isPositive: false }
      },
      conversionRate: {
        value: formatPercent(conversionRate),
        change: { value: 3.2, isPositive: true }
      }
    };
  }, []);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Exporting ${format}`);
      // Here you would implement actual export logic
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {children}
    </div>
  );

  const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`p-6 pb-4 ${className}`}>
      {children}
    </div>
  );

  const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );

  const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h3>
  );

  const CardDescription = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <p className={`text-sm text-gray-600 mt-1 ${className}`}>
      {children}
    </p>
  );

  const Button = ({ 
    children, 
    variant = "default", 
    onClick, 
    disabled = false, 
    className = "" 
  }: {
    children: React.ReactNode;
    variant?: "default" | "outline";
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
  }) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none px-4 py-2";
    const variantClasses = variant === "outline" 
      ? "border border-gray-300 bg-white hover:bg-gray-50 text-gray-900"
      : "bg-blue-600 text-white hover:bg-blue-700";
    
    return (
      <button 
        className={`${baseClasses} ${variantClasses} ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    );
  };

  const KPICard = ({ 
    title, 
    value, 
    change, 
    icon: Icon 
  }: {
    title: string;
    value: string;
    change: { value: number; isPositive: boolean };
    icon: React.ElementType;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className={`flex items-center text-xs mt-1 ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {change.isPositive ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          {change.isPositive ? '+' : ''}{formatPercent(change.value)} from last month
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Analytics</h2>
            <p className="text-gray-600 mt-1">
              Track your business performance and growth metrics
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => handleExport('csv')}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
            >
              <FileText className="h-4 w-4 mr-2" />
              {isExporting ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Revenue"
            value={kpis.totalRevenue.value}
            change={kpis.totalRevenue.change}
            icon={DollarSign}
          />
          <KPICard
            title="Total Orders"
            value={kpis.totalOrders.value}
            change={kpis.totalOrders.change}
            icon={ShoppingCart}
          />
          <KPICard
            title="Avg Order Value"
            value={kpis.avgOrderValue.value}
            change={kpis.avgOrderValue.change}
            icon={DollarSign}
          />
          <KPICard
            title="Conversion Rate"
            value={kpis.conversionRate.value}
            change={kpis.conversionRate.change}
            icon={Users}
          />
        </div>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing products this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{formatNumber(product.sales)} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(product.revenue)}</p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(product.revenue / product.sales)}/unit
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart Placeholders */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex flex-col items-center justify-center bg-gray-50 rounded border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Revenue Chart</p>
                  <p className="text-sm text-gray-500">Interactive chart will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Order Distribution</CardTitle>
              <CardDescription>Order patterns and customer segments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex flex-col items-center justify-center bg-gray-50 rounded border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Distribution Chart</p>
                  <p className="text-sm text-gray-500">Customer analytics will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;