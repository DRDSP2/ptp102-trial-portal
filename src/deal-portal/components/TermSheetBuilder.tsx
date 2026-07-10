import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { defaultTermSheet } from '@/deal-portal/lib/termSheetDefaults';
import type { Region } from '@/types/roles';

const termSheetSchema = z.object({
  region: z.enum(['north_america', 'eu', 'uk', 'uae', 'apac', 'global'] as const),
  upfront_fee: z.number().min(0),
  royalty_rate: z.number().min(0).max(1),
  exclusivity_months: z.number().min(1).max(12),
  sublicensing_allowed: z.boolean(),
});

export type TermSheetForm = z.infer<typeof termSheetSchema>;

interface TermSheetBuilderProps {
  editable?: boolean;
  onPropose?: (data: TermSheetForm) => void | Promise<void>;
  initialValues?: Partial<TermSheetForm>;
}

const regionLabels: Record<Region, string> = {
  north_america: 'North America',
  eu: 'European Union',
  uk: 'United Kingdom',
  uae: 'UAE / MENA',
  apac: 'Asia-Pacific',
  global: 'Global (Bundle)',
};

export function TermSheetBuilder({ editable = true, onPropose, initialValues }: TermSheetBuilderProps) {
  const form = useForm<TermSheetForm>({
    resolver: zodResolver(termSheetSchema),
    defaultValues: {
      region: 'north_america',
      upfront_fee: defaultTermSheet.upfront_min,
      royalty_rate: defaultTermSheet.royalty_low / 100,
      exclusivity_months: 6,
      sublicensing_allowed: false,
      ...initialValues,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Term Sheet Builder</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onPropose ? form.handleSubmit(onPropose) : (e) => e.preventDefault()} className="space-y-4" data-testid="term-sheet-form">
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Territory</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!editable}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(regionLabels) as Region[]).map((region) => (
                        <SelectItem key={region} value={region}>
                          {regionLabels[region]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="upfront_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upfront Fee (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      disabled={!editable}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="royalty_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Royalty Rate (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      disabled={!editable}
                      onChange={(e) => field.onChange(Number(e.target.value) / 100)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="exclusivity_months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exclusivity (Months)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      disabled={!editable}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sublicensing_allowed"
              render={({ field }) => (
                <FormItem className="flex items-start gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!editable} />
                  </FormControl>
                  <FormLabel className="font-normal text-sm">Allow sublicensing</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            {editable && onPropose && (
              <Button type="submit">Propose to Byrock</Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
