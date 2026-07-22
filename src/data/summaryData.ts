import {
  FaUsers,
  FaShoppingCart,
  FaDollarSign,
  FaRocket,
} from "react-icons/fa";

// Data for the summary cards
export const summaryData = [
  {
    title: "Total Sales",
    value: "$12,450",
    change: "+15.3%",
    isPositive: true,
    icon: FaDollarSign,
    color: "from-green-500 to-emerald-600",
    shadow: "shadow-emerald-500/20",
  },
  {
    title: "New Users",
    value: "258",
    change: "+8.2%",
    isPositive: true,
    icon: FaUsers,
    color: "from-blue-500 to-indigo-600",
    shadow: "shadow-blue-500/20",
  },
  {
    title: "Orders Placed",
    value: "1,540",
    change: "-2.5%",
    isPositive: false,
    icon: FaShoppingCart,
    color: "from-orange-400 to-red-500",
    shadow: "shadow-orange-500/20",
  },
  {
    title: "Growth Rate",
    value: "12.5%",
    change: "+4.1%",
    isPositive: true,
    icon: FaRocket,
    color: "from-purple-500 to-pink-600",
    shadow: "shadow-purple-500/20",
  },
];