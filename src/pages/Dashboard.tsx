import { useState, useEffect, lazy, Suspense } from "react";
import { Layout } from "@/components/layout/Layout";
import { ControlPanel } from "@/components/dashboard/ControlPanel";
import { VolunteerAnnouncementsPanel } from "@/components/dashboard/VolunteerAnnouncementsPanel";
import { MOCK_REGIONS } from "@/lib/api";
import { analyzeRegion, type RegionAnalysis } from "@/lib/satellite-api";
import type { Region, HazardType, AcquisitionMode } from "@/types";
import { toast } from "sonner";
import { MapPin } from "lucide-react";

// Lazy load the map to avoid SSR issues
const HazardMap = lazy(() => import("@/components/dashboard/HazardMap").then(m => ({ default: m.HazardMap })));

function MapFallback() {
  return (
    <div className="h-full w-full rounded-xl border border-border bg-card flex items-center justify-center">
      <div className="text-center">
        <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [regions] = useState<Region[]>(MOCK_REGIONS);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [hazardType, setHazardType] = useState<HazardType>("flood");
  const [satelliteData, setSatelliteData] = useState<RegionAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedRegion) {
      setSatelliteData(null);
      return;
    }
    
    const loadSatelliteData = async () => {
      setIsLoading(true);
      try {
        const data = await analyzeRegion(selectedRegion.id, 50, 14);
        setSatelliteData(data);
        toast.success(`Loaded satellite data for ${selectedRegion.displayName}`);
      } catch (error) {
        console.error("Failed to load satellite data:", error);
        toast.error("Failed to load satellite data");
        setSatelliteData(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSatelliteData();
  }, [selectedRegion]);

  const handleRunAcquisition = async (mode: AcquisitionMode) => {
    if (!selectedRegion) return;
    setIsLoading(true);
    try {
      // Run fresh analysis with satellite-data edge function
      const data = await analyzeRegion(selectedRegion.id, 30, 30);
      setSatelliteData(data);
      toast.success(`Analysis complete for ${selectedRegion.displayName}`);
    } catch {
      toast.error("Failed to run acquisition");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!selectedRegion) return;
    setIsLoading(true);
    try {
      const data = await analyzeRegion(selectedRegion.id, 50, 14);
      setSatelliteData(data);
      toast.success("Analysis refreshed with latest satellite data");
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout fullHeight>
      <div className="h-full flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar - Control Panel */}
        <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 glass-panel-elevated border-b lg:border-b-0 lg:border-r border-border max-h-[40vh] lg:max-h-full overflow-auto">
          <ControlPanel
            regions={regions}
            selectedRegion={selectedRegion}
            onRegionChange={setSelectedRegion}
            hazardType={hazardType}
            onHazardTypeChange={setHazardType}
            satelliteData={satelliteData}
            isLoading={isLoading}
            onRunAcquisition={handleRunAcquisition}
            onRefresh={handleRefresh}
          />
        </aside>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-auto">
          {/* Map Section */}
          <div className="flex-1 p-3 lg:p-4 min-h-[250px] lg:min-h-0">
            <div className="h-full min-h-[250px] rounded-xl overflow-hidden border border-border/50 shadow-lg">
              <Suspense fallback={<MapFallback />}>
                <HazardMap region={selectedRegion} hazardType={hazardType} className="h-full w-full" />
              </Suspense>
            </div>
          </div>
          
          {/* Announcements Section */}
          <div className="p-3 lg:p-4 pt-0">
            <VolunteerAnnouncementsPanel />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
