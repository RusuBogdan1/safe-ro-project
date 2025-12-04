import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Romanian regions with bounding boxes [min_lon, min_lat, max_lon, max_lat]
const REGIONS: Record<string, { bbox: number[], name: string }> = {
  fagaras: { bbox: [24.5, 45.5, 25.5, 46.0], name: "Făgăraș" },
  iasi: { bbox: [27.5, 47.0, 27.8, 47.3], name: "Iași" },
  timisoara: { bbox: [21.1, 45.6, 21.4, 45.9], name: "Timișoara" },
  craiova: { bbox: [23.7, 44.2, 24.0, 44.5], name: "Craiova" },
  constanta: { bbox: [28.5, 44.1, 28.8, 44.4], name: "Constanța" },
  baia_mare: { bbox: [23.4, 47.5, 23.7, 47.8], name: "Baia Mare" },
  bucuresti: { bbox: [25.9, 44.3, 26.2, 44.6], name: "București" },
  cluj: { bbox: [23.5, 46.7, 23.8, 47.0], name: "Cluj" },
};

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface ProductMetadata {
  id: string;
  name: string;
  acquisitionDate: string;
  cloudCover?: number;
  productType: string;
  satellite: string;
  processingLevel: string;
}

// Get OAuth2 token from Copernicus Data Space
async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get('COPERNICUS_CLIENT_ID');
  const clientSecret = Deno.env.get('COPERNICUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Copernicus credentials not configured');
  }

  const tokenUrl = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
  
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[satellite-data] Token error:', error);
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data: TokenResponse = await response.json();
  return data.access_token;
}

// Search for satellite products using OData API
async function searchProducts(
  accessToken: string,
  regionId: string,
  satellite: 'sentinel-1' | 'sentinel-2',
  maxCloudCover: number = 30,
  daysBack: number = 30
): Promise<ProductMetadata[]> {
  const region = REGIONS[regionId];
  if (!region) {
    throw new Error(`Unknown region: ${regionId}`);
  }

  const [minLon, minLat, maxLon, maxLat] = region.bbox;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Build collection filter based on satellite
  let collectionFilter: string;
  if (satellite === 'sentinel-2') {
    collectionFilter = "Collection/Name eq 'SENTINEL-2'";
  } else {
    collectionFilter = "Collection/Name eq 'SENTINEL-1'";
  }

  // Build spatial filter using WKT polygon
  const polygon = `POLYGON((${minLon} ${minLat},${maxLon} ${minLat},${maxLon} ${maxLat},${minLon} ${maxLat},${minLon} ${minLat}))`;
  const spatialFilter = `OData.CSC.Intersects(area=geography'SRID=4326;${polygon}')`;

  // Build temporal filter
  const temporalFilter = `ContentDate/Start ge ${startDate.toISOString()} and ContentDate/Start le ${endDate.toISOString()}`;

  // Cloud cover filter (only for Sentinel-2)
  let cloudFilter = '';
  if (satellite === 'sentinel-2') {
    cloudFilter = ` and Attributes/OData.CSC.DoubleAttribute/any(att:att/Name eq 'cloudCover' and att/OData.CSC.DoubleAttribute/Value le ${maxCloudCover})`;
  }

  const filter = `${collectionFilter} and ${spatialFilter} and ${temporalFilter}${cloudFilter}`;
  
  const catalogUrl = `https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=${encodeURIComponent(filter)}&$top=10&$orderby=ContentDate/Start desc`;

  console.log(`[satellite-data] Searching ${satellite} for ${regionId}`);
  
  const response = await fetch(catalogUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[satellite-data] Search error:', error);
    throw new Error(`Failed to search products: ${response.status}`);
  }

  const data = await response.json();
  
  return (data.value || []).map((product: any) => {
    const cloudCoverAttr = product.Attributes?.find((a: any) => a.Name === 'cloudCover');
    
    return {
      id: product.Id,
      name: product.Name,
      acquisitionDate: product.ContentDate?.Start || product.ModificationDate,
      cloudCover: cloudCoverAttr?.Value,
      productType: product.ProductType || 'Unknown',
      satellite: satellite === 'sentinel-2' ? 'Sentinel-2' : 'Sentinel-1',
      processingLevel: product.Name?.includes('L2A') ? 'L2A' : product.Name?.includes('L1C') ? 'L1C' : 'Unknown',
    };
  });
}

// Calculate simple hazard indicators based on available data
function calculateHazardIndicators(
  sentinel2Products: ProductMetadata[],
  sentinel1Products: ProductMetadata[]
): {
  floodRisk: 'low' | 'medium' | 'high';
  vegetationHealth: 'poor' | 'moderate' | 'good';
  dataAvailability: 'limited' | 'moderate' | 'good';
  lastUpdate: string | null;
  radarCoverage: boolean;
  opticalCoverage: boolean;
} {
  const hasOptical = sentinel2Products.length > 0;
  const hasRadar = sentinel1Products.length > 0;
  
  // Determine data availability
  let dataAvailability: 'limited' | 'moderate' | 'good' = 'limited';
  if (hasOptical && hasRadar) {
    dataAvailability = 'good';
  } else if (hasOptical || hasRadar) {
    dataAvailability = 'moderate';
  }

  // Calculate average cloud cover for optical imagery
  const avgCloudCover = sentinel2Products.length > 0
    ? sentinel2Products.reduce((sum, p) => sum + (p.cloudCover || 0), 0) / sentinel2Products.length
    : 100;

  // Estimate vegetation health based on cloud cover and data freshness
  // (In a real implementation, this would use actual NDVI calculations)
  let vegetationHealth: 'poor' | 'moderate' | 'good' = 'moderate';
  if (avgCloudCover < 20 && hasOptical) {
    vegetationHealth = 'good';
  } else if (avgCloudCover > 50 || !hasOptical) {
    vegetationHealth = 'poor';
  }

  // Estimate flood risk based on radar availability
  // (In a real implementation, this would use SAR intensity thresholding)
  let floodRisk: 'low' | 'medium' | 'high' = 'medium';
  if (hasRadar && sentinel1Products.length >= 3) {
    floodRisk = 'low'; // Good radar coverage allows monitoring
  } else if (!hasRadar) {
    floodRisk = 'high'; // Can't monitor without radar
  }

  // Get the most recent acquisition date
  const allDates = [
    ...sentinel2Products.map(p => p.acquisitionDate),
    ...sentinel1Products.map(p => p.acquisitionDate),
  ].filter(Boolean).sort().reverse();

  return {
    floodRisk,
    vegetationHealth,
    dataAvailability,
    lastUpdate: allDates[0] || null,
    radarCoverage: hasRadar,
    opticalCoverage: hasOptical,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, regionId, satellite, maxCloudCover, daysBack } = await req.json();

    console.log(`[satellite-data] Action: ${action}, Region: ${regionId}`);

    // Action: list-regions - Return available regions
    if (action === 'list-regions') {
      const regions = Object.entries(REGIONS).map(([id, data]) => ({
        id,
        name: data.name,
        bbox: data.bbox,
      }));
      return new Response(JSON.stringify({ regions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: search - Search for satellite products
    if (action === 'search') {
      if (!regionId) {
        return new Response(JSON.stringify({ error: 'regionId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const accessToken = await getAccessToken();
      const products = await searchProducts(
        accessToken,
        regionId,
        satellite || 'sentinel-2',
        maxCloudCover || 30,
        daysBack || 30
      );

      return new Response(JSON.stringify({ products }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: analyze - Get hazard analysis for a region
    if (action === 'analyze') {
      if (!regionId) {
        return new Response(JSON.stringify({ error: 'regionId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const accessToken = await getAccessToken();
      
      // Search for both Sentinel-1 and Sentinel-2 products in parallel
      const [sentinel2Products, sentinel1Products] = await Promise.all([
        searchProducts(accessToken, regionId, 'sentinel-2', maxCloudCover || 30, daysBack || 30),
        searchProducts(accessToken, regionId, 'sentinel-1', 100, daysBack || 30),
      ]);

      const indicators = calculateHazardIndicators(sentinel2Products, sentinel1Products);
      const region = REGIONS[regionId];

      return new Response(JSON.stringify({
        regionId,
        regionName: region.name,
        bbox: region.bbox,
        indicators,
        sentinel2Products: sentinel2Products.slice(0, 5),
        sentinel1Products: sentinel1Products.slice(0, 5),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[satellite-data] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
