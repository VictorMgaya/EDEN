/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

// TypeScript interfaces for SoilGrids API response
interface SoilGridsResponse {
    type: string;
    geometry: {
        type: string;
        coordinates: [number, number];
    };
    properties: {
        layers: SoilLayer[];
    };
    query_time_s: number;
}

interface SoilLayer {
    name: string;
    unit_measure: {
        d_factor: number;
        mapped_units: string;
        target_units: string;
        uncertainty_unit: string;
    };
    depths: SoilDepth[];
}

interface SoilDepth {
    range: {
        top_depth: number;
        bottom_depth: number;
        unit_depth: string;
    };
    label: string;
    values: {
        Q0_05: number | null;
        Q0_5: number | null;
        Q0_95: number | null;
        mean: number | null;
        uncertainty: number | null;
    };
}

interface ProcessedSoilData {
    name: string;
    unit: string;
    mappedUnits: string;
    targetUnits: string;
    dFactor: number;
    depths: ProcessedDepth[];
    depthCount: number;
}

interface ProcessedDepth {
    depth: string;
    topDepth: number;
    bottomDepth: number;
    mean: number | null;
    q05: number | null;
    q95: number | null;
    unit: string;
    uncertainty: number | null;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const lat = searchParams.get('lat');
        const lon = searchParams.get('lon');

        if (!lat || !lon) {
            return NextResponse.json(
                { error: 'Latitude and longitude are required' },
                { status: 400 }
            );
        }

        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);

        if (isNaN(latNum) || isNaN(lonNum)) {
            return NextResponse.json(
                { error: 'Invalid latitude or longitude values' },
                { status: 400 }
            );
        }

        console.log(`Fetching soil data for coordinates: ${lonNum}, ${latNum}`);

        // Fetch soil data from SoilGrids API
        const response = await fetch(
            `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lonNum}&lat=${latNum}&property=bdod&property=cec&property=cfvo&property=clay&property=nitrogen&property=ocd&property=ocs&property=phh2o&property=sand&property=silt&property=soc&property=wv0010&property=wv0033&property=wv1500&depth=0-5cm&depth=0-30cm&depth=5-15cm&depth=15-30cm&depth=30-60cm&depth=60-100cm&depth=100-200cm&value=Q0.05&value=Q0.5&value=Q0.95&value=mean&value=uncertainty`,
            {
                headers: {
                    'User-Agent': 'EDEN-Soil-Analysis/1.0',
                    'Accept': 'application/json',
                },
                // Add timeout to prevent hanging requests
                signal: AbortSignal.timeout(10000), // 10 second timeout
            }
        );

        if (!response.ok) {
            console.error(`SoilGrids API error: ${response.status} ${response.statusText}`);

            // Return appropriate error based on status code
            if (response.status === 404) {
                return NextResponse.json(
                    {
                        error: 'No soil data available for this location',
                        code: 'NO_DATA',
                        coordinates: { lat: latNum, lon: lonNum }
                    },
                    { status: 404 }
                );
            }

            if (response.status >= 500) {
                return NextResponse.json(
                    {
                        error: 'Soil data service is temporarily unavailable',
                        code: 'SERVICE_ERROR',
                        coordinates: { lat: latNum, lon: lonNum }
                    },
                    { status: 503 }
                );
            }

            return NextResponse.json(
                {
                    error: `Failed to fetch soil data: ${response.statusText}`,
                    code: 'API_ERROR',
                    coordinates: { lat: latNum, lon: lonNum }
                },
                { status: response.status }
            );
        }

        const data: SoilGridsResponse = await response.json();

        // Validate response structure
        if (!data.properties || !data.properties.layers || !Array.isArray(data.properties.layers)) {
            console.error('Invalid response structure from SoilGrids API:', data);
            return NextResponse.json(
                {
                    error: 'Invalid data format received from soil service',
                    code: 'INVALID_DATA',
                    coordinates: { lat: latNum, lon: lonNum }
                },
                { status: 502 }
            );
        }

        // Transform and validate data
        const formattedData: ProcessedSoilData[] = data.properties.layers
            .map((layer: SoilLayer) => {
                if (!layer.name || !layer.depths || !Array.isArray(layer.depths)) {
                    console.warn(`Skipping invalid layer:`, layer);
                    return null;
                }

                const depths: ProcessedDepth[] = layer.depths
                    .map((depth: SoilDepth): ProcessedDepth | null => {
                        if (!depth.label || !depth.values || typeof depth.values !== 'object') {
                            return null;
                        }

                        const meanValue = depth.values.mean;
                        const q05Value = depth.values.Q0_05;
                        const q95Value = depth.values.Q0_95;

                        // Only include depths with valid mean values
                        if (meanValue === null || meanValue === undefined) {
                            return null;
                        }

                        return {
                            depth: depth.label,
                            topDepth: depth.range?.top_depth || 0,
                            bottomDepth: depth.range?.bottom_depth || 0,
                            mean: meanValue ? Math.round(meanValue * layer.unit_measure.d_factor) / layer.unit_measure.d_factor : null,
                            q05: q05Value ? Math.round(q05Value * layer.unit_measure.d_factor) / layer.unit_measure.d_factor : null,
                            q95: q95Value ? Math.round(q95Value * layer.unit_measure.d_factor) / layer.unit_measure.d_factor : null,
                            unit: layer.unit_measure?.target_units || '-',
                            uncertainty: depth.values.uncertainty
                        };
                    })
                    .filter((depth: ProcessedDepth | null): depth is ProcessedDepth => depth !== null && depth.mean !== null);

                if (depths.length === 0) {
                    return null;
                }

                return {
                    name: layer.name,
                    unit: layer.unit_measure?.target_units || '-',
                    mappedUnits: layer.unit_measure?.mapped_units || '',
                    targetUnits: layer.unit_measure?.target_units || '',
                    dFactor: layer.unit_measure?.d_factor || 1,
                    depths: depths,
                    depthCount: depths.length
                };
            })
            .filter((layer: ProcessedSoilData | null): layer is ProcessedSoilData => layer !== null && layer.depths.length > 0);

        if (formattedData.length === 0) {
            return NextResponse.json(
                {
                    error: 'No valid soil property data found for this location',
                    code: 'NO_VALID_DATA',
                    coordinates: { lat: latNum, lon: lonNum }
                },
                { status: 404 }
            );
        }

        // Add metadata
        const result = {
            success: true,
            coordinates: {
                lat: latNum,
                lon: lonNum
            },
            queryTime: data.query_time_s || 0,
            dataSource: 'SoilGrids v2.0',
            timestamp: new Date().toISOString(),
            properties: formattedData,
            summary: {
                totalProperties: formattedData.length,
                totalDepths: formattedData.reduce((sum: number, prop: any) => sum + prop.depthCount, 0),
                availableProperties: formattedData.map((prop: any) => prop.name)
            }
        };

        console.log(`Successfully processed soil data: ${result.summary.totalProperties} properties, ${result.summary.totalDepths} depth measurements`);

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error in soil API route:', error);

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                return NextResponse.json(
                    {
                        error: 'Request timeout - soil data service is slow to respond',
                        code: 'TIMEOUT',
                        coordinates: { lat: parseFloat(request.nextUrl.searchParams.get('lat') || '0'), lon: parseFloat(request.nextUrl.searchParams.get('lon') || '0') }
                    },
                    { status: 408 }
                );
            }

            return NextResponse.json(
                {
                    error: `Internal server error: ${error.message}`,
                    code: 'INTERNAL_ERROR',
                    coordinates: { lat: parseFloat(request.nextUrl.searchParams.get('lat') || '0'), lon: parseFloat(request.nextUrl.searchParams.get('lon') || '0') }
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                error: 'Unknown error occurred while fetching soil data',
                code: 'UNKNOWN_ERROR',
                coordinates: { lat: parseFloat(request.nextUrl.searchParams.get('lat') || '0'), lon: parseFloat(request.nextUrl.searchParams.get('lon') || '0') }
            },
            { status: 500 }
        );
    }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
