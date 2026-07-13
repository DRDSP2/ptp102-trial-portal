import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building2, FileCheck } from 'lucide-react';

export function CompanyProfileCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 size={20} /> Byrock Technologies Ltd
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Legal Entity</span>
          <span>Private Limited Company</span>
        </div>
        <div className="flex justify-between">
          <span>Jurisdiction</span>
          <span>Republic of Ireland</span>
        </div>
        <div className="flex justify-between">
          <span>Registered Office</span>
          <span>Augustine House, Oliver Bond Street, Dublin 8, Ireland</span>
        </div>
        <div className="flex items-center gap-2 text-green-600 mt-4">
          <FileCheck size={16} /> Entity Verified
        </div>
      </CardContent>
    </Card>
  );
}
