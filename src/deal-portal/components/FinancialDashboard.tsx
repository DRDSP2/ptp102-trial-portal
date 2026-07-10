import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useFinancialProjections } from '@/deal-portal/hooks/useFinancialProjections';

export function FinancialDashboard() {
  const { projections, loading } = useFinancialProjections();

  if (loading) return <div className="p-8 text-center">Loading financial model...</div>;

  const revenueData = projections.map((p) => ({ year: p.year, revenue: (p.revenue || 0) / 1e6, cogs: (p.cogs || 0) / 1e6 }));
  const marginData = projections.map((p) => ({ year: p.year, margin: p.gross_margin_percent }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {projections.slice(0, 1).map((p) => (
          <Card key={p.year}>
            <CardContent className="p-4">
              <div className="text-xs text-slate-500">Price per Treatment</div>
              <div className="text-xl font-bold">${p.price_per_treatment.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-slate-500">Cost per Treatment</div>
            <div className="text-xl font-bold">${projections[0]?.cost_per_treatment.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-slate-500">Gross Margin</div>
            <div className="text-xl font-bold text-green-600">{projections[0]?.gross_margin_percent}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-slate-500">Year 1 Revenue</div>
            <div className="text-xl font-bold">${((projections[0]?.revenue || 0) / 1e6).toFixed(1)}M</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue vs COGS (USD Millions)</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(v) => `$${Number(v).toFixed(1)}M`} />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
              <Bar dataKey="cogs" fill="#ef4444" name="COGS" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gross Margin Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={marginData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={[90, 100]} />
              <Tooltip formatter={(v) => `${Number(v)}%`} />
              <Line type="monotone" dataKey="margin" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
