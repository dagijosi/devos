import React, { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { FaChartBar } from "react-icons/fa";
import { useFormatCurrency } from "../../../hooks/useCurrencySymbol";

interface AnalyticsChartProps {
  data: { label: string; value: number }[];
  isLoading: boolean;
  title?: string;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ 
  data, 
  isLoading,
  title = "Monthly Analytics"
}) => {
  const formatCurrency = useFormatCurrency();

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const buildChartData = () => {
    if (!data || !data.length) return [{ name: "Revenue", data: [{ x: "No data", y: 0 }] }];

    const rawData = data.map((item) => {
      return {
        x: item.label,
        y: item.value ?? 0,
      };
    });

    return [
      {
        name: "Revenue",
        type: "area",
        data: rawData,
      },
    ];
  };

  const chartOptions: ApexOptions = useMemo(() => ({
    chart: {
      type: "area",
      fontFamily: "inherit",
      toolbar: { show: false },
      zoom: { enabled: false },
      sparkline: { enabled: false },
    },
    colors: ["#06b6d4"],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.05,
        stops: [20, 100],
      },
    },
    markers: {
      size: 0,
      colors: ["#06b6d4"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 5,
      },
    },
    xaxis: {
      type: "category",
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: isMobile ? 5 : 6,
      labels: {
        rotate: isMobile ? -45 : 0,
        rotateAlways: isMobile ? true : false,
        hideOverlappingLabels: true,
        style: {
          colors: "var(--color-text)",
          fontSize: isMobile ? '10px' : '11px',
        },
      },
    },
    yaxis: {
      labels: {
        style: { colors: "var(--color-text)", fontSize: '11px' },
        formatter: (value: number) => formatCurrency(value, true),
      },
    },
    grid: {
      borderColor: "var(--color-border)",
      strokeDashArray: 4,
      padding: {
        left: 10,
        right: 10,
      },
      yaxis: { lines: { show: true } },
    },
    tooltip: {
      theme: "dark",
      shared: true,
      intersect: false,
      y: {
        formatter: (value: number) => formatCurrency(value, true),
      },
    },
  }), [isMobile, formatCurrency]);

  return (
    <div
      id="tour-analytics"
      className="lg:col-span-2 bg-theme-surface/70 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-lg border border-theme-border/30 flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-theme-text flex items-center">
          <FaChartBar className="mr-2 text-theme-icon" />{" "}
          {title}
        </h3>
      </div>

      <div className="w-full h-96 min-h-96 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-theme-surface/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <div className="text-theme-text/60 text-sm">
              Updating chart...
            </div>
          </div>
        )}
        <div className="w-full h-96 relative">
          <ReactApexChart
            options={chartOptions}
            series={buildChartData()}
            type="area"
            height={350}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsChart;
