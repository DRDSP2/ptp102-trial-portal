export const NDA_ACKNOWLEDGEMENTS = [
  {
    id: 'ack_mutual_nda',
    label:
      'This is a MUTUAL NDA. Both parties may disclose and receive Confidential Information, and both parties are bound by the same obligations of non-disclosure and restricted use.',
  },
  {
    id: 'ack_affiliates',
    label:
      'Affiliates (entities >50% owned or controlled) are covered by this Agreement and are express third-party beneficiaries of its protections.',
  },
  {
    id: 'ack_representatives',
    label:
      'I am responsible for all Representatives (employees, officers, directors, agents, attorneys, accountants, advisors, consultants, contractors, and other representatives) who receive Confidential Information.',
  },
  {
    id: 'ack_trade_secrets',
    label:
      'Trade secrets will be protected in perpetuity, and all other Confidential Information will be protected for a period of five (5) years from disclosure.',
  },
  {
    id: 'ack_no_competitor',
    label:
      'I will not disclose Confidential Information to a competitor or use it in negotiations with, or for the benefit of, a competitor of the disclosing party.',
  },
  {
    id: 'ack_return_destruction',
    label:
      'I will return or destroy all Confidential Information and copies within ten (10) business days of the disclosing party\'s written request.',
  },
  {
    id: 'ack_equitable_relief',
    label:
      'Money damages may be insufficient for a breach; the disclosing party is entitled to seek injunctive and other equitable relief without the requirement of posting a bond.',
  },
  {
    id: 'ack_irish_law',
    label:
      'This Agreement is governed by the laws of Ireland, and the parties submit to the exclusive jurisdiction of the Courts of Ireland; I waive any inconvenient-forum objection.',
  },
  {
    id: 'ack_no_warranty',
    label:
      'No representations or warranties are made as to the accuracy, completeness, or usefulness of any Confidential Information disclosed hereunder.',
  },
  {
    id: 'ack_third_party_beneficiaries',
    label:
      'Byrock Affiliates are express third-party beneficiaries of this Agreement and may enforce its terms directly.',
  },
  {
    id: 'ack_one_year_exchange',
    label:
      'The Confidential Information exchange period is one (1) year from the Effective Date, unless otherwise terminated or extended in writing.',
  },
  {
    id: 'ack_five_year_protection',
    label:
      'Non-trade-secret Confidential Information will remain protected for five (5) years after the date of disclosure.',
  },
  {
    id: 'ack_perpetuity_trade_secrets',
    label:
      'Trade secrets will be protected for as long as they qualify as trade secrets under applicable law.',
  },
  {
    id: 'ack_backup_retention',
    label:
      'Backup copies of Confidential Information may remain on disaster recovery or archival systems until ordinary deletion in the normal course of business.',
  },
  {
    id: 'ack_notices',
    label:
      'Notices to Byrock must be sent to info@byrocktechnologies.com or to such other address as may be designated in writing.',
  },
  {
    id: 'ack_counterparts',
    label:
      'This Agreement may be executed in counterparts, each of which will be deemed an original and all of which together constitute one instrument.',
  },
  {
    id: 'ack_entire_agreement',
    label:
      'This Agreement constitutes the entire agreement between the parties and supersedes all prior agreements; amendments must be in writing signed by both parties.',
  },
  {
    id: 'ack_attorneys_fees',
    label:
      'The substantially prevailing party in any dispute will be entitled to recover its reasonable costs, including attorneys\' fees, from the other party.',
  },
  {
    id: 'ack_inconvenient_forum',
    label:
      'I will not claim that the courts of Ireland are an inconvenient forum for the resolution of any dispute.',
  },
] as const;

export type NDAAckKey = (typeof NDA_ACKNOWLEDGEMENTS)[number]['id'];
