import { useState, type ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  FlaskConical,
  Microscope,
  FileText,
  ChevronRight,
  ExternalLink,
  Award,
  Lightbulb,
  Users,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ResearchSection {
  id: string;
  title: string;
  icon: ReactNode;
  badge?: string;
  content: ReactNode;
}

export function ResearchHub() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections: ResearchSection[] = [
    {
      id: 'overview',
      title: 'PTP-102 Overview',
      icon: <FlaskConical className="h-5 w-5" />,
      badge: 'Flagship Product',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-[#6b7f3a]/10 to-[#4a5c28]/5 border border-[#6b7f3a]/20 rounded-lg p-4">
            <h4 className="font-semibold text-[#4a5c28] mb-2 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Breakthrough Solution for Laminitis
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              PTP-102 represents Byrock Technologies&apos; pioneering pharmaceutical development 
              in equine healthcare. With patents pending across Europe, the United States, and 
              Australia, PTP-102 is positioned to become the first-in-class therapeutic treatment 
              for laminitis — one of the most debilitating conditions affecting horses worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Formulation</p>
              <p className="text-sm font-medium">5 mg/mL concentration</p>
              <p className="text-xs text-slate-500">IV infusion solution</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Protocol</p>
              <p className="text-sm font-medium">Two-dose regimen</p>
              <p className="text-xs text-slate-500">Hour 0 and Hour 12</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Volume</p>
              <p className="text-sm font-medium">500 mL per dose</p>
              <p className="text-xs text-slate-500">Slow IV infusion</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p>
              <p className="text-sm font-medium">Phase Clinical Trials</p>
              <p className="text-xs text-slate-500">Patents pending</p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-2">Key Research Finding</p>
            <blockquote className="text-sm text-blue-800 italic border-l-2 border-blue-300 pl-3">
              &quot;PTP-100, by far gave the most promising results of a prophylactic or therapeutic 
              treatment for this crippling equine disease.&quot;
            </blockquote>
          </div>
        </div>
      ),
    },
    {
      id: 'mission',
      title: 'Mission & Values',
      icon: <Lightbulb className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-slate-50 to-white border rounded-lg">
            <h4 className="font-semibold text-slate-900 mb-2">Mission Statement</h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              At Byrock Technologies our mission is to support veterinarians, owners and the equine 
              industry in their task to improve the health of horses worldwide.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                title: 'Quality',
                icon: <ShieldCheck className="h-4 w-4 text-[#6b7f3a]" />,
                text: 'At Byrock Technologies, we uphold stringent standards in pharmaceutical development. Our flagship product, PTP-102, has successfully advanced through proof of concept studies, demonstrating significant potential to enhance equine health effectively and safely.',
              },
              {
                title: 'Teamwork',
                icon: <Users className="h-4 w-4 text-[#6b7f3a]" />,
                text: 'Our success is driven by collaborative efforts to fulfil our mission. Our multidisciplinary team combines deep scientific insight with extensive legal expertise to craft innovative solutions for equine health challenges.',
              },
              {
                title: 'Innovation',
                icon: <Lightbulb className="h-4 w-4 text-[#6b7f3a]" />,
                text: 'Driven by a mission to address critical gaps in equine healthcare, our team is at the forefront of pioneering treatments that merge scientific advancement with market demands. PTP-102 represents the first step in Byrock\'s journey to disrupt the equine healthcare market.',
              },
            ].map((value) => (
              <div key={value.title} className="p-3 bg-white border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  {value.icon}
                  <h5 className="font-semibold text-sm">{value.title}</h5>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{value.text}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'clinical-trials',
      title: 'Clinical Trial Data',
      icon: <Microscope className="h-5 w-5" />,
      badge: 'Veterinary Access',
      content: (
        <div className="space-y-4">
          <AlertBanner
            type="info"
            title="Research Documentation"
            message="The following sections contain detailed clinical trial documentation, pharmacokinetic data, and safety profiles for veterinary professionals participating in the PTP-102 trial program."
          />

          <div className="space-y-3">
            <ResearchDocCard
              title="Phase I/II Safety & Efficacy Summary"
              status="available"
              description="Comprehensive analysis of PTP-102 pharmacokinetics, safety margins, and initial efficacy signals in equine subjects."
            />
            <ResearchDocCard
              title="Dosing Protocol & Administration Guidelines"
              status="available"
              description="Detailed veterinary administration procedures, infusion parameters, and monitoring requirements."
            />
            <ResearchDocCard
              title="Adverse Event Reporting Standards"
              status="available"
              description="Standardized adverse event classification, reporting timelines, and escalation protocols."
            />
            <ResearchDocCard
              title="Long-term Follow-up Results (Day 10-14)"
              status="available"
              description="Extended observation data documenting recovery trajectories and sustained therapeutic effects."
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>
                Additional research materials are available via the Byrock documentation portal. 
                Contact your trial coordinator for access to restricted datasets.
              </span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'regulatory',
      title: 'Regulatory & Compliance',
      icon: <FileText className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { region: 'Europe', status: 'Patent Pending', color: 'bg-blue-100 text-blue-800' },
              { region: 'United States', status: 'Patent Pending', color: 'bg-blue-100 text-blue-800' },
              { region: 'Australia', status: 'Patent Pending', color: 'bg-blue-100 text-blue-800' },
            ].map((item) => (
              <div key={item.region} className="p-3 bg-white border rounded-lg text-center">
                <p className="text-xs text-slate-500 mb-1">{item.region}</p>
                <Badge className={item.color}>{item.status}</Badge>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Trial Compliance Requirements</h4>
            {[
              'Informed owner consent documented before enrollment',
              'Veterinary screening and eligibility verification',
              'Standardized Obel grading at all assessment points',
              'Complete adverse event documentation within 24 hours',
              'Protocol deviation reporting to trial coordinator',
              'Day 10-14 follow-up assessment completion',
            ].map((req, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">{req}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl p-6 sm:p-8 text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1534361960057-19889db9621e?w=1200&q=80)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/85 to-[#4a5c28]/80" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#6b7f3a]/20 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-[#a4b86b]" />
            <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Veterinary Research Centre
            </Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Research & Clinical Documentation</h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
            Access comprehensive PTP-102 research materials, clinical trial protocols, 
            and regulatory documentation designed for veterinary professionals.
          </p>
        </div>
      </div>

      {/* Section Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <Dialog key={section.id}>
            <DialogTrigger asChild>
              <button
                className="text-left group"
                onClick={() => setActiveSection(section.id)}
              >
                <Card className="h-full hover:shadow-lg hover:border-[#6b7f3a]/30 transition-all duration-300 cursor-pointer group-hover:-translate-y-0.5">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#6b7f3a]/10 rounded-lg text-[#6b7f3a] group-hover:bg-[#6b7f3a] group-hover:text-white transition-colors">
                          {section.icon}
                        </div>
                        <div>
                          <CardTitle className="text-base sm:text-lg">{section.title}</CardTitle>
                          {section.badge && (
                            <Badge variant="outline" className="mt-1 text-[10px] border-[#6b7f3a]/30 text-[#6b7f3a]">
                              {section.badge}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#6b7f3a] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500 line-clamp-2">
                      {section.id === 'overview' && 'Comprehensive overview of PTP-102 formulation, dosing regimen, and development status.'}
                      {section.id === 'mission' && 'Byrock Technologies mission statement and core values driving equine pharmaceutical innovation.'}
                      {section.id === 'clinical-trials' && 'Access clinical trial data, safety profiles, and efficacy summaries for veterinary review.'}
                      {section.id === 'regulatory' && 'Patent status, compliance requirements, and regulatory documentation by region.'}
                    </p>
                  </CardContent>
                </Card>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0">
              <DialogHeader className="px-6 pt-6 pb-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#6b7f3a]/10 rounded-lg text-[#6b7f3a]">
                    {section.icon}
                  </div>
                  <DialogTitle>{section.title}</DialogTitle>
                </div>
              </DialogHeader>
              <ScrollArea className="px-6 py-4 max-h-[60vh]">
                {section.content}
              </ScrollArea>
            </DialogContent>
          </Dialog>
        ))}
      </div>

      {/* Quick Access Footer */}
      <Card className="border-dashed border-slate-300 bg-slate-50/50">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm">Need additional research materials?</p>
              <p className="text-xs text-slate-500 mt-1">
                Full documentation repository available on the Byrock documentation portal.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-[#6b7f3a]/30 text-[#6b7f3a] hover:bg-[#6b7f3a] hover:text-white"
              onClick={() => window.open('https://byrock.bitdocs.ai/share/d/8SMOPjR3MLB1fDgt', '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-2" />
              Open Full Docs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AlertBanner({ type, title, message }: { type: 'info' | 'warning'; title: string; message: string }) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
  };
  return (
    <div className={`p-4 border rounded-lg ${styles[type]}`}>
      <p className="text-sm font-semibold mb-1 flex items-center gap-2">
        {type === 'info' ? <BookOpen className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        {title}
      </p>
      <p className="text-sm opacity-90">{message}</p>
    </div>
  );
}

function ResearchDocCard({ title, status, description }: { title: string; status: 'available' | 'restricted'; description: string }) {
  return (
    <div className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h5 className="font-semibold text-sm">{title}</h5>
        <Badge className={status === 'available' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-amber-100 text-amber-700'}>
          {status === 'available' ? 'Available' : 'Restricted'}
        </Badge>
      </div>
      <p className="text-sm text-slate-600">{description}</p>
      <div className="mt-3 flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs text-slate-400">Last updated: June 2026</span>
      </div>
    </div>
  );
}
