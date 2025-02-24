import PredictionMarketDashboard from "@/components/predictionMarketDashboard";
import Image from "next/image";
import { Toaster } from "@/components/ui/toaster"; 

export default function Home() {
  return (
    <>
      <Toaster />
      <PredictionMarketDashboard />
    </>
  );
}
