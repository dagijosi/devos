import { useMemo } from "react";

export const useFormatCurrency = () => {
  return useMemo(() => {
    return (value: number, showSymbol = true) => {
      const formatted = new Intl.NumberFormat("en-US", {
        style: showSymbol ? "currency" : "decimal",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
      return formatted;
    };
  }, []);
};
