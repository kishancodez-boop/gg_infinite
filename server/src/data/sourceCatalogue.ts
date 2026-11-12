import type { z } from 'zod';
import type { createSourceSchema } from '../schemas/domainSchemas.js';

export type SourceCatalogueEntry = z.input<typeof createSourceSchema>;

const CHECKED_DATE = new Date('2026-11-12T00:00:00.000Z');

/**
 * Researched Indian Renewable Energy Data Sources Catalogue.
 *
 * Rules followed:
 * - Only official domains confirmed via research are marked "verified" (manual reference or documented API).
 * - Automated scraping is NEVER assumed permitted merely because a webpage is public.
 * - State agencies and sub-portals awaiting robots.txt/terms/feed checks are marked "needs_review".
 */
export const OFFICIAL_SOURCE_CATALOGUE: SourceCatalogueEntry[] = [
  {
    sourceName: 'Ministry of New and Renewable Energy (MNRE) Official Portal',
    organization: 'Ministry of New and Renewable Energy, Government of India',
    sourceUrl: 'https://mnre.gov.in',
    domain: 'mnre.gov.in',
    sourceType: 'central_ministry',
    dataCategory: 'policies_schemes',
    description:
      'Official ministry portal publishing central renewable energy policies, solar/wind schemes, National Green Hydrogen Mission updates, and physical progress reports.',
    accessMethod: 'manual',
    expectedFormat: 'mixed',
    updateCadence: 'monthly / periodic',
    accessNotes:
      'Public web portal and downloadable reports. Automated crawling requires explicit robots.txt and terms verification before Milestone 05.',
    verificationStatus: 'verified',
    evidenceNotes:
      'Official gov.in domain confirmed via search on 2026-11-12; marked verified for manual reference only.',
    lastCheckedAt: CHECKED_DATE,
    active: true,
    isDemoData: false,
  },
  {
    sourceName: 'Central Electricity Authority (CEA) Portal & Reports',
    organization: 'Central Electricity Authority, Ministry of Power',
    sourceUrl: 'https://cea.nic.in',
    domain: 'cea.nic.in',
    sourceType: 'central_ministry',
    dataCategory: 'capacity_generation',
    description:
      'Publishes monthly renewable energy generation reports, cumulative installed capacity dashboards, and technical standards.',
    accessMethod: 'manual',
    expectedFormat: 'pdf',
    updateCadence: 'monthly',
    accessNotes:
      'Reports archived in PDF and Excel formats. Automated download requires robots.txt and terms verification.',
    verificationStatus: 'verified',
    evidenceNotes:
      'Official nic.in domain confirmed via search on 2026-11-12; publishes monthly RE generation & installed capacity reports.',
    lastCheckedAt: CHECKED_DATE,
    active: true,
    isDemoData: false,
  },
  {
    sourceName: 'Open Government Data (OGD) Platform India',
    organization: 'National Informatics Centre (NIC), Government of India',
    sourceUrl: 'https://data.gov.in',
    domain: 'data.gov.in',
    sourceType: 'public_open_data',
    dataCategory: 'capacity_generation',
    description:
      'Central open-data catalog hosting MNRE and CEA renewable energy datasets with documented API Resource IDs and CSV/JSON exports.',
    accessMethod: 'api',
    expectedFormat: 'json',
    updateCadence: 'dataset-dependent',
    accessNotes:
      'Requires free registered data.gov.in API key and specific dataset Resource ID before automated API queries.',
    verificationStatus: 'verified',
    evidenceNotes:
      'Official gov.in open data API documented with API key + Resource ID workflow; confirmed on 2026-11-12.',
    lastCheckedAt: CHECKED_DATE,
    active: true,
    isDemoData: false,
  },
  {
    sourceName: 'India Climate & Energy Dashboard (ICED)',
    organization: 'NITI Aayog, Government of India',
    sourceUrl: 'https://iced.niti.gov.in',
    domain: 'iced.niti.gov.in',
    sourceType: 'central_ministry',
    dataCategory: 'capacity_generation',
    description:
      'NITI Aayog analytical portal integrating official energy, climate, and renewable generation datasets with XLS/chart exports.',
    accessMethod: 'manual',
    expectedFormat: 'xlsx',
    updateCadence: 'periodic',
    accessNotes:
      'Interactive dashboard with downloadable XLS datasets. Automated ingestion requires terms & endpoint check.',
    verificationStatus: 'verified',
    evidenceNotes:
      'Official niti.gov.in domain confirmed on 2026-11-12; aggregates official ministry energy parameters.',
    lastCheckedAt: CHECKED_DATE,
    active: true,
    isDemoData: false,
  },
  {
    sourceName: 'Central Electricity Regulatory Commission (CERC)',
    organization: 'Central Electricity Regulatory Commission',
    sourceUrl: 'https://cercind.gov.in',
    domain: 'cercind.gov.in',
    sourceType: 'regulator',
    dataCategory: 'rpo_regulations',
    description:
      'National electricity regulator publishing tariff orders, grid regulations, REC/RPO regulatory frameworks, and market monitoring reports.',
    accessMethod: 'manual',
    expectedFormat: 'pdf',
    updateCadence: 'periodic',
    accessNotes:
      'Official regulatory orders published as PDFs. Manual verification recommended for RPO legal determinations.',
    verificationStatus: 'verified',
    evidenceNotes:
      'Official gov.in regulator domain confirmed via search on 2026-11-12.',
    lastCheckedAt: CHECKED_DATE,
    active: true,
    isDemoData: false,
  },
  {
    sourceName: 'Solar Energy Corporation of India (SECI)',
    organization: 'Solar Energy Corporation of India Limited',
    sourceUrl: 'https://www.seci.co.in',
    domain: 'www.seci.co.in',
    sourceType: 'central_ministry',
    dataCategory: 'tenders_opportunities',
    description:
      'Central PSU under MNRE facilitating national solar, wind, hybrid, and storage tenders and program implementation.',
    accessMethod: 'manual',
    expectedFormat: 'html',
    updateCadence: 'periodic',
    accessNotes:
      'Public tender & program notices. Automated tender scraping is NOT enabled without explicit permission.',
    verificationStatus: 'verified',
    evidenceNotes:
      'Official PSU portal confirmed on 2026-11-12 for reference.',
    lastCheckedAt: CHECKED_DATE,
    active: true,
    isDemoData: false,
  },
  {
    sourceName: 'Indian Renewable Energy Development Agency (IREDA)',
    organization: 'Indian Renewable Energy Development Agency Limited',
    sourceUrl: 'https://www.ireda.in',
    domain: 'www.ireda.in',
    sourceType: 'central_ministry',
    dataCategory: 'green_finance',
    description:
      'Public sector financial institution under MNRE providing term loans and financing schemes for renewable energy and energy efficiency.',
    accessMethod: 'manual',
    expectedFormat: 'mixed',
    updateCadence: 'periodic',
    accessNotes:
      'Financing guidelines and loan scheme pages. Interest rates and terms must be manually verified against official circulars.',
    verificationStatus: 'verified',
    evidenceNotes:
      'Official IREDA portal confirmed on 2026-11-12.',
    lastCheckedAt: CHECKED_DATE,
    active: true,
    isDemoData: false,
  },
  {
    sourceName: 'Bureau of Energy Efficiency (BEE)',
    organization: 'Bureau of Energy Efficiency, Ministry of Power',
    sourceUrl: 'https://www.beeindia.gov.in',
    domain: 'www.beeindia.gov.in',
    sourceType: 'regulator',
    dataCategory: 'policies_schemes',
    description:
      'Statutory body developing energy conservation policies, PAT schemes, and appliance efficiency standards.',
    accessMethod: 'manual',
    expectedFormat: 'mixed',
    updateCadence: 'periodic',
    accessNotes:
      'Official policy and standards portal for manual reference.',
    verificationStatus: 'verified',
    evidenceNotes:
      'Official gov.in portal confirmed on 2026-11-12.',
    lastCheckedAt: CHECKED_DATE,
    active: true,
    isDemoData: false,
  },
  {
    sourceName: 'CEA Daily Renewable Generation Portal',
    organization: 'Central Electricity Authority',
    sourceUrl: 'https://gen-re.cea.gov.in',
    domain: 'gen-re.cea.gov.in',
    sourceType: 'central_ministry',
    dataCategory: 'solar_wind',
    description:
      'Dedicated CEA sub-portal for daily renewable generation tracking across solar and wind.',
    accessMethod: 'html_public',
    expectedFormat: 'mixed',
    updateCadence: 'daily',
    accessNotes:
      'Candidate automated source: requires human verification of robots.txt, terms, and direct downloadable report URLs.',
    verificationStatus: 'needs_review',
    evidenceNotes:
      'Domain referenced in CEA search results on 2026-11-12; direct machine-readable feed and robots policy not yet inspected.',
    lastCheckedAt: CHECKED_DATE,
    active: true,
    isDemoData: false,
  },
  {
    sourceName: 'Gujarat Energy Development Agency (GEDA)',
    organization: 'Government of Gujarat',
    sourceUrl: 'https://geda.gujarat.gov.in',
    domain: 'geda.gujarat.gov.in',
    sourceType: 'state_nodal_agency',
    dataCategory: 'state_statistics',
    description:
      'State nodal agency for renewable energy policies, rooftop solar, and wind programs in Gujarat.',
    accessMethod: 'manual',
    expectedFormat: 'html',
    updateCadence: 'unknown',
    accessNotes:
      'Candidate state source: requires human review of robots policy, terms, and downloadable state datasets.',
    verificationStatus: 'needs_review',
    evidenceNotes:
      'Official gujarat.gov.in subdomain identified via search on 2026-11-12; content structure not yet audited.',
    lastCheckedAt: CHECKED_DATE,
    active: true,
    isDemoData: false,
  },
  {
    sourceName: 'Maharashtra Energy Development Agency (MEDA)',
    organization: 'Government of Maharashtra',
    sourceUrl: 'https://www.mahaurja.com',
    domain: 'www.mahaurja.com',
    sourceType: 'state_nodal_agency',
    dataCategory: 'state_statistics',
    description:
      'State nodal agency for renewable energy schemes, RPO facilitation, and energy conservation in Maharashtra.',
    accessMethod: 'manual',
    expectedFormat: 'html',
    updateCadence: 'unknown',
    accessNotes:
      'Candidate state source: requires human verification of canonical domain (mahaurja.com vs mahaurja.maharashtra.gov.in) and terms.',
    verificationStatus: 'needs_review',
    evidenceNotes:
      'Identified via search on 2026-11-12; dual domain usage requires human confirmation.',
    lastCheckedAt: CHECKED_DATE,
    active: true,
    isDemoData: false,
  },
  {
    sourceName: 'Karnataka Renewable Energy Development Ltd (KREDL)',
    organization: 'Government of Karnataka',
    sourceUrl: 'https://kredl.karnataka.gov.in',
    domain: 'kredl.karnataka.gov.in',
    sourceType: 'state_nodal_agency',
    dataCategory: 'state_statistics',
    description:
      'State nodal agency managing solar, wind, and renewable capacity statistics and policies in Karnataka.',
    accessMethod: 'manual',
    expectedFormat: 'html',
    updateCadence: 'unknown',
    accessNotes:
      'Candidate state source: requires human verification of robots policy and available state statistics.',
    verificationStatus: 'needs_review',
    evidenceNotes:
      'Official karnataka.gov.in subdomain identified via search on 2026-11-12; feed structure not yet audited.',
    lastCheckedAt: CHECKED_DATE,
    active: true,
    isDemoData: false,
  },
];

