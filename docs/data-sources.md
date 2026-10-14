# BankMate AI — Official Data Sources & Verification Protocol

## 1. Sourcing Philosophy & Strict Evidence Standards

BankMate AI is designed exclusively around **authoritative, publicly verifiable banking documents**. In financial technology applications, using generic AI hallucinations or scraped unverified forum comments risks misleading consumers regarding transaction fees, account limits, and dispute timelines.

### Core Rules:
1. **Authoritative Sources Only**: Information is sourced solely from official bank domains, schedule of charges (SOC), regulatory circulars, and verified help centers.
2. **Never Fabricate Policy Details**: If a fee, limit, or procedure is absent from indexed sources, the assistant abstains.
3. **No Dynamic Account Access**: BankMate AI never requests or connects to private transactional APIs or production payment rails.
4. **Historical Archive Differentiation**: Documents from expired years are tagged as `historical` to warn users if policies have been superseded.

---

## 2. Institutional Source Registry

| Institution | Classification | Authoritative Source URLs | Key Covered Policies | Current Verification |
| :--- | :--- | :--- | :--- | :--- |
| **Easypaisa** (Telenor Microfinance Bank) | Branchless Banking | • [easypaisa.com.pk](https://easypaisa.com.pk/)<br>• [Raast Help](https://easypaisa.com.pk/Send-Money-through-RAAST/)<br>• [Raast FAQ PDF](https://easypaisa.com.pk/wp-content/uploads/2022/10/RAAST-FAQ.pdf)<br>• [Fees & Charges](https://easypaisa.com.pk/fees-and-charges/) | Account Levels (0, 1, 2), Raast Instant Transfers (PKR 0), ATM withdrawal tariff (PKR 25.40), PayPak issuance (PKR 1,200), Helpline (3737). | Verified Active |
| **JazzCash** (Mobilink Microfinance Bank) | Branchless Banking | • [jazzcash.com.pk](https://www.jazzcash.com.pk/)<br>• [Account Tiers](https://www.jazzcash.com.pk/account)<br>• [Customer Support](https://www.jazzcash.com.pk/contact-us/)<br>• [Charges](https://www.jazzcash.com.pk/fees-and-charges/) | Wallet limits (Level 0, 1, 2), Retailer cash-out charges, Raast mobile registration, PayPak card issuance (PKR 1,200), Helpline (4444). | Verified Active |
| **Meezan Bank** | Premier Islamic Commercial Bank | • [meezanbank.com](https://www.meezanbank.com/)<br>• [Downloads & SOC](https://www.meezanbank.com/downloads/)<br>• [Personal Banking](https://www.meezanbank.com/personal-banking/) | Shariah principles (Mudarabah & Qard), zero-interest distinction, Visa Classic annual fee (PKR 2,400 + tax), Meezan ATM free withdrawals, Helpline (+92 21 111-331-331). | Verified Active |
| **Habib Bank Limited (HBL)** | Commercial Bank | • [hbl.com](https://www.hbl.com/)<br>• [Freedom Account](https://www.hbl.com/personal/accounts/freedom-account)<br>• [Document Attachments](https://www.hbl.com/resources/filter_all_attachments_anual_embed) | Freedom Account waiver threshold (PKR 25,000 avg balance), default daily Raast limit (PKR 250,000), lost card blocking via HBL Mobile, Helpline (111-111-425). | Verified Active |
| **Bank Alfalah** | Digital Commercial Bank | • [bankalfalah.com](https://www.bankalfalah.com/)<br>• [Digital Banking SOC](https://www.bankalfalah.com/digital-banking/schedule-of-charges/)<br>• [Contact Center](https://www.bankalfalah.com/contact-us/) | Alfa digital app, free Raast P2P, Transaction Dispute Form (TDF) 45-day window, PayPak card fee (PKR 1,500), 24/7 Helpline (021-111-225-111). | Verified Active |
| **State Bank of Pakistan (SBP)** | Central Bank & Regulator | • [sbp.org.pk](https://www.sbp.org.pk/)<br>• [Digital Financial Services](https://www.sbp.org.pk/dfs/Payments.html)<br>• [Consumer Protection](https://www.sbp.org.pk/cpd/index.asp) | Sovereign Raast P2P zero-fee mandate, IBFT free monthly threshold (PKR 25,000) & 0.1%/PKR 200 fee cap, complaint resolution turnaround (7-14 days), Sunwai portal. | Verified Active |

---

## 3. Document Ingestion Metadata Schema

Every document indexed into ChromaDB and Neon PostgreSQL records the following metadata fields:

```json
{
  "provider_id": "easypaisa",
  "provider_name": "Easypaisa",
  "document_id": "9a7d83be-4971-477d-9cf9-79ad23485f7a",
  "document_title": "Easypaisa Raast & Account Service Guide (Current)",
  "source_url": "https://easypaisa.com.pk/Send-Money-through-RAAST/",
  "page_number": 1,
  "section_title": "Section 1: Raast Instant Transfers & Account Opening",
  "effective_date": "2024-07-01",
  "expiry_date": "2026-06-30",
  "verification_status": "verified",
  "content_hash": "2f65a12a3d76e3c... (SHA-256)"
}
```

---

## 4. Verification Workflow for Administrators

1. **Upload or Register URL**: An administrator submits the document or text through `/api/documents/upload` or the UI Knowledge Base modal.
2. **Text Extraction & OCR Check**: If a PDF is scanned without digital text (<50 characters per page), it is automatically flagged: `is_scanned_ocr_required = True`.
3. **Deduplication**: Content hash (SHA-256) is computed. Re-uploads of identical files update the existing index without duplicating vector entries.
4. **Status Lifecycle**:
   - `verified`: Authoritative active policy.
   - `historical`: Archived document (e.g. 2021 fee schedule); assistant flags citations with archival warnings.
   - `unverified`: Document awaiting compliance sign-off.
