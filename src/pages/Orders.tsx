import React from "react";
import { Card } from "../components/ui/layout";
import { FaShoppingCart, FaBoxOpen, FaCheckCircle, FaClock } from "react-icons/fa";

const Orders: React.FC = () => {
  const stats = [
    { label: "Total Orders", value: "1,284", icon: FaShoppingCart, color: "text-blue-500" },
    { label: "Processing", value: "43", icon: FaClock, color: "text-amber-500" },
    { label: "Shipped", value: "892", icon: FaBoxOpen, color: "text-purple-500" },
    { label: "Completed", value: "349", icon: FaCheckCircle, color: "text-green-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-theme-text">Orders</h1>
        <p className="text-theme-text/60">Manage and track your customer orders.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-theme-icon/5 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-theme-text/40 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-bold text-theme-text">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-theme-text mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-theme-border/50 text-xs font-bold text-theme-text/40 uppercase tracking-widest">
                <th className="py-3 px-2">Order ID</th>
                <th className="py-3 px-2">Customer</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Total</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[
                { id: "#ORD-7721", customer: "John Doe", status: "Completed", total: "$124.00" },
                { id: "#ORD-7722", customer: "Jane Smith", status: "Processing", total: "$89.50" },
                { id: "#ORD-7723", customer: "Mike Johnson", status: "Shipped", total: "$210.00" },
              ].map((order) => (
                <tr key={order.id} className="border-b border-theme-border/20 hover:bg-theme-text/5 transition-colors">
                  <td className="py-4 px-2 font-medium">{order.id}</td>
                  <td className="py-4 px-2">{order.customer}</td>
                  <td className="py-4 px-2">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                      order.status === "Completed" ? "bg-green-500/10 text-green-500" :
                      order.status === "Processing" ? "bg-amber-500/10 text-amber-500" :
                      "bg-purple-500/10 text-purple-500"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-2 font-bold">{order.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Orders;
