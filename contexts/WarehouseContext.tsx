// frontend/contexts/WarehouseContext.tsx
"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";

interface WarehouseContextType {
  selectedWarehouse: string | null;
  setSelectedWarehouse: (id: string | null) => void;
  isInitialized: boolean; // Tambahkan state untuk menandai inisialisasi
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(
  undefined
);

export const WarehouseProvider = ({ children }: { children: ReactNode }) => {
  // 1. Mulai dengan state awal yang konsisten untuk server dan klien
  const [selectedWarehouse, setSelectedWarehouseState] = useState<
    string | null
  >("all");
  const [isInitialized, setIsInitialized] = useState(false); // State untuk menandai hidrasi selesai

  // 2. Gunakan useEffect untuk membaca dari localStorage HANYA di sisi klien
  // Ini akan berjalan setelah render pertama (hidrasi) selesai.
  useEffect(() => {
    const storedWarehouse = localStorage.getItem("selectedWarehouse");
    if (storedWarehouse) {
      setSelectedWarehouseState(storedWarehouse);
    }
    setIsInitialized(true); // Tandai bahwa state sudah disinkronkan dengan localStorage
  }, []); // Array dependensi kosong berarti hanya berjalan sekali saat mount

  // 3. Efek ini tetap sama, untuk menyimpan perubahan ke localStorage
  useEffect(() => {
    // Hanya simpan ke localStorage jika state sudah diinisialisasi dari client
    if (isInitialized) {
      if (selectedWarehouse) {
        localStorage.setItem("selectedWarehouse", selectedWarehouse);
      } else {
        localStorage.removeItem("selectedWarehouse");
      }
    }
  }, [selectedWarehouse, isInitialized]);

  const setSelectedWarehouse = (id: string | null) => {
    setSelectedWarehouseState(id ?? "all");
  };

  return (
    <WarehouseContext.Provider
      value={{
        selectedWarehouse,
        setSelectedWarehouse,
        isInitialized,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
};

export const useWarehouse = (): WarehouseContextType => {
  const context = useContext(WarehouseContext);
  if (context === undefined) {
    throw new Error("useWarehouse must be used within a WarehouseProvider");
  }
  return context;
};
