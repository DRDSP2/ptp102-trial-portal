import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Users, LogOut } from 'lucide-react';

export function InvestorGovernance() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Governance Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="founder">
          <TabsList className="mb-4">
            <TabsTrigger value="founder">Founder Agreement</TabsTrigger>
            <TabsTrigger value="exit">Exit Clauses</TabsTrigger>
            <TabsTrigger value="shareholders">Shareholders</TabsTrigger>
          </TabsList>

          <TabsContent value="founder" className="space-y-2 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <FileText size={16} /> Founder roles, IP assignment, and vesting terms.
            </div>
            <p>
              The Founder Agreement establishes the roles of Dr. Daniel Shanahan-Prendergast and Dr. Pamela
              Tiebler, assigns pre-existing IP to Byrock Clinical Ltd, and defines a four-year vesting
              schedule with a one-year cliff.
            </p>
          </TabsContent>

          <TabsContent value="exit" className="space-y-2 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <LogOut size={16} /> Co-founder exit and good/bad leaver provisions.
            </div>
            <p>
              The Co-Founder Exit Clause sets out share repurchase rights, fair-market valuation mechanics,
              and non-compete restrictions for departing founders.
            </p>
          </TabsContent>

          <TabsContent value="shareholders" className="space-y-2 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <Users size={16} /> Shareholder rights and drag-along/tag-along.
            </div>
            <p>
              The Shareholders Agreement covers pre-emption rights, board composition, reserved matters,
              and drag-along/tag-along provisions for future financing rounds.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
