import React, { useState } from "react";
import {
  FaShoppingCart,
  FaClock,
} from "react-icons/fa";
import { 
  chartData, 
  yearlyChartData, 
  allTimeChartData, 
  summaryData 
} from "../data";
import { 
  CustomDropdown, 
  premiumToast, 
  StatCard, 
  AnalyticsChart,
  STAT_CARD_THEMES
} from "../components/ui";

const DashboardHome: React.FC = () => {
  const [timeRange, setTimeRange] = useState("Last 6 Months");
  const [isChartLoading, setIsChartLoading] = useState(false);

  // Handle time range change with loading state
  const handleTimeRangeChange = (newRange: string) => {
    setIsChartLoading(true);
    setTimeRange(newRange);
    // Simulate loading delay for better UX
    setTimeout(() => setIsChartLoading(false), 300);
  };

  // Filter chart data based on selected time range and adapt to AnalyticsChart format
  const getFilteredChartData = () => {
    let rawData;
    switch (timeRange) {
      case "Last Year":
        rawData = yearlyChartData;
        break;
      case "All Time":
        rawData = allTimeChartData;
        break;
      case "Last 6 Months":
      default:
        rawData = chartData;
    }
    return rawData.map(item => ({
      label: item.name,
      value: item.Revenue // Using Revenue as the primary metric for the AnalyticsChart
    }));
  };

  // Test toast functions
  const testSuccessToast = () => {
    premiumToast.success("Operation completed successfully!", {
      description: "Your changes have been saved.",
    });
  };

  const testErrorToast = () => {
    premiumToast.error("Something went wrong!", {
      description: "Please try again later.",
    });
  };

  const testLoadingToast = () => {
    premiumToast.promise(
      (setProgress) => {
        return new Promise<void>((resolve) => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 20) + 5;
            if (progress >= 100) {
              clearInterval(interval);
              resolve();
            } else {
              setProgress(progress);
            }
          }, 300);
        });
      },
      {
        loading: "Uploading file...",
        success: "File uploaded!",
        error: "Upload failed",
      }
    );
  };

  const testMessageToast = () => {
    premiumToast.message("New message from John", "Hey, let's catch up later!", "https://i.pravatar.cc/150?img=12");
  };

  // Map summary data to StatCard themes
  const statThemes = [
    STAT_CARD_THEMES.blue,
    STAT_CARD_THEMES.green,
    STAT_CARD_THEMES.orange,
    STAT_CARD_THEMES.purple
  ];

  return (
    <div className="container mx-auto p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-theme-text tracking-tight">
                Dashboard Overview
            </h1>
            <p className="text-theme-text/60 mt-1 text-sm">
                Welcome back, here's what's happening today.
            </p>
        </div>
        <div className="flex flex-wrap gap-3">
             <button className="px-4 py-2 bg-theme-surface border border-theme-border/50 text-theme-text text-sm font-medium rounded-lg shadow-sm hover:bg-theme-surface/80 hover:border-theme-border transition-all hover:-translate-y-0.5 backdrop-blur-md">
                Download Report
             </button>
             <button onClick={testSuccessToast} className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-green-600 transition-all hover:-translate-y-0.5">
                Success Toast
             </button>
             <button onClick={testErrorToast} className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-red-600 transition-all hover:-translate-y-0.5">
                Error Toast
             </button>
             <button onClick={testLoadingToast} className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-600 transition-all hover:-translate-y-0.5">
                Loading Toast
             </button>
             <button onClick={testMessageToast} className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-purple-600 transition-all hover:-translate-y-0.5">
                Message Toast
             </button>
        </div>
      </div>

      {/* 1. Summary Cards using modernized StatCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryData.map((item, index) => (
          <StatCard
            key={item.title}
            title={item.title}
            value={item.value.replace('$', '')}
            currencySymbol={item.value.startsWith('$') ? '$' : undefined}
            change={item.change}
            isPositive={item.isPositive}
            icon={item.icon}
            theme={statThemes[index % statThemes.length]}
            waveIndex={index}
          />
        ))}
      </div>

      {/* 2. Main Content Widgets (Charts and Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Large Chart Area using modernized AnalyticsChart */}
        <div className="lg:col-span-2 relative">
          <div className="absolute top-4 right-4 z-20">
            <CustomDropdown 
                options={["Last 6 Months", "Last Year", "All Time"]} 
                selected={timeRange} 
                onSelect={handleTimeRangeChange} 
            />
          </div>
          <AnalyticsChart 
            data={getFilteredChartData()}
            isLoading={isChartLoading}
            title="Revenue Analytics"
          />
        </div>

        {/* Recent Activity/Feed */}
        <div className="bg-theme-surface/70 backdrop-blur-md p-0 rounded-2xl shadow-lg border border-theme-border/30 h-[450px] flex flex-col overflow-hidden">
          <div className="p-6 border-b border-theme-border/30 bg-theme-surface/30">
             <h3 className="text-xl font-bold text-theme-text flex items-center">
                <FaClock className="mr-2 text-theme-icon" /> Recent Activity
             </h3>
          </div>
          
          <div className="p-4 space-y-4 flex-1 overflow-hidden">
            {[1, 2, 3, 4].map((_, i) => (
                <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-theme-bg/50 transition-colors group cursor-default">
                    <div className="relative flex-shrink-0">
                         <div className="w-10 h-10 rounded-full bg-theme-icon/10 flex items-center justify-center text-theme-icon group-hover:bg-theme-icon group-hover:text-white transition-colors duration-300">
                            <FaShoppingCart className="w-4 h-4" />
                         </div>
                         {i % 2 === 0 && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-theme-surface rounded-full"></span>}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-theme-text truncate">
                            New order #245{i} placed by <span className="font-bold">Alex Doe</span>
                        </p>
                        <p className="text-xs text-theme-text/50 mt-1">
                            2 minutes ago
                        </p>
                    </div>
                </div>
            ))}
            
            <div className="text-center pt-2">
                <button className="text-sm text-theme-icon hover:text-theme-icon/80 font-medium">
                    View All Activity
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardHome;
