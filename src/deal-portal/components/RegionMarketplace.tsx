import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRegionMarketplace } from '@/deal-portal/hooks/useRegionMarketplace';
import { formatCurrency, formatPercent } from '@/deal-portal/lib/dealPortalUtils';
import { Globe, Lock, Unlock } from 'lucide-react';

const statusLabels: Record<string, string> = {
  available: 'Available',
  under_evaluation: 'Under Evaluation',
  under_negotiation: 'Under Negotiation',
  licensed: 'Licensed',
  reserved: 'Reserved',
};

const statusStyles: Record<string, string> = {
  available: 'bg-green-50 text-green-700',
  under_evaluation: 'bg-yellow-50 text-yellow-700',
  under_negotiation: 'bg-orange-50 text-orange-700',
  licensed: 'bg-blue-50 text-blue-700',
  reserved: 'bg-slate-100 text-slate-700',
};

const regionLabels: Record<string, string> = {
  north_america: 'North America',
  eu: 'European Union',
  uk: 'United Kingdom',
  uae: 'UAE / MENA',
  apac: 'Asia-Pacific',
  global: 'Global (Bundle)',
};

export function RegionMarketplace() {
  const { regions, loading, reserveRegion } = useRegionMarketplace();

  if (loading) return <div className="p-8 text-center">Loading marketplace...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regions.map((region) => {
          const isAvailable = region.status === 'available';
          return (
            <Card key={region.region} className={isAvailable ? '' : 'opacity-75'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe size={18} />
                  {regionLabels[region.region] || region.region}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant="secondary" className={statusStyles[region.status]}>
                  {statusLabels[region.status]}
                </Badge>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base Licence Fee</span>
                    <span className="font-medium">
                      {region.base_licence_fee ? formatCurrency(region.base_licence_fee) : 'POA'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Royalty Rate</span>
                    <span className="font-medium">{formatPercent(region.royalty_rate)}</span>
                  </div>
                </div>
                {region.licensee_company && (
                  <div className="text-xs text-slate-500">Licensee: {region.licensee_company}</div>
                )}
                <Button
                  className="w-full"
                  disabled={!isAvailable}
                  onClick={() => reserveRegion(region.region)}
                >
                  {isAvailable ? (
                    <>
                      <Unlock size={14} className="mr-1" /> Reserve Region
                    </>
                  ) : (
                    <>
                      <Lock size={14} className="mr-1" /> Unavailable
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
