import { supabase } from "@/integrations/supabase/client";

export interface SatelliteRegion {
  id: string;
  name: string;
  bbox: number[];
}

export interface ProductMetadata {
  id: string;
  name: string;
  acquisitionDate: string;
  cloudCover?: number;
  productType: string;
  satellite: string;
  processingLevel: string;
}

export interface HazardIndicators {
  floodRisk: 'low' | 'medium' | 'high';
  vegetationHealth: 'poor' | 'moderate' | 'good';
  dataAvailability: 'limited' | 'moderate' | 'good';
  lastUpdate: string | null;
  radarCoverage: boolean;
  opticalCoverage: boolean;
}

export interface RegionAnalysis {
  regionId: string;
  regionName: string;
  bbox: number[];
  indicators: HazardIndicators;
  sentinel2Products: ProductMetadata[];
  sentinel1Products: ProductMetadata[];
}

// List available Romanian regions
export async function listRegions(): Promise<SatelliteRegion[]> {
  const { data, error } = await supabase.functions.invoke('satellite-data', {
    body: { action: 'list-regions' },
  });

  if (error) {
    console.error('[satellite-api] listRegions error:', error);
    throw new Error(error.message || 'Failed to list regions');
  }

  return data.regions;
}

// Search for satellite products
export async function searchProducts(
  regionId: string,
  satellite: 'sentinel-1' | 'sentinel-2' = 'sentinel-2',
  maxCloudCover: number = 30,
  daysBack: number = 30
): Promise<ProductMetadata[]> {
  const { data, error } = await supabase.functions.invoke('satellite-data', {
    body: { 
      action: 'search',
      regionId,
      satellite,
      maxCloudCover,
      daysBack,
    },
  });

  if (error) {
    console.error('[satellite-api] searchProducts error:', error);
    throw new Error(error.message || 'Failed to search products');
  }

  return data.products;
}

// Get hazard analysis for a region
export async function analyzeRegion(
  regionId: string,
  maxCloudCover: number = 30,
  daysBack: number = 30
): Promise<RegionAnalysis> {
  const { data, error } = await supabase.functions.invoke('satellite-data', {
    body: { 
      action: 'analyze',
      regionId,
      maxCloudCover,
      daysBack,
    },
  });

  if (error) {
    console.error('[satellite-api] analyzeRegion error:', error);
    throw new Error(error.message || 'Failed to analyze region');
  }

  return data;
}

// Analyze all regions (for overview)
export async function analyzeAllRegions(
  maxCloudCover: number = 30,
  daysBack: number = 30
): Promise<RegionAnalysis[]> {
  const regions = await listRegions();
  
  const analyses = await Promise.all(
    regions.map(region => 
      analyzeRegion(region.id, maxCloudCover, daysBack)
        .catch(err => {
          console.warn(`[satellite-api] Failed to analyze ${region.id}:`, err);
          return null;
        })
    )
  );

  return analyses.filter((a): a is RegionAnalysis => a !== null);
}
