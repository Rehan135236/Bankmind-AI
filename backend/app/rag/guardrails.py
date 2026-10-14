import re
from typing import Tuple, Optional, Dict, Any, List

INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"system\s+prompt",
    r"you\s+are\s+now\s+in\s+developer\s+mode",
    r"jailbreak",
    r"dan\s+mode",
    r"reveal\s+(your\s+)?(internal|hidden)\s+(instructions|prompt)",
    r"pretend\s+you\s+have\s+no\s+(rules|restrictions)",
    r"what\s+is\s+your\s+exact\s+system\s+prompt",
]

TRANSACTIONAL_REQUEST_PATTERNS = [
    r"(?:please\s+)?(?:block|cancel|freeze)\s+my\s+(?:card|account|debit\s+card|cheque)",
    r"\b(?:transfer|send)\s+(?:pkr|\d+|money|funds).*?\bto\b",
    r"(?:reset|change)\s+my\s+(?:pin|password|otp)",
    r"debit\s+my\s+account",
]

CREDENTIAL_HARVEST_PATTERNS = [
    r"\b(?:\d[ -]*?){13,16}\b",
    r"\b\d{3,4}\b\s*(?:cvv|cvc|security\s+code)",
    r"(?:my\s+pin\s+is|my\s+otp\s+is|my\s+password\s+is)\s+[\w\d]+",
]

ABSTENTION_MESSAGE = (
    "I couldn't verify this information in the available official documents. "
    "Please consult the provider's official website or verified support channel."
)


class SafetyGuardrails:
    @staticmethod
    def inspect_query(query: str) -> Tuple[bool, Optional[str]]:
        """
        Validates user query against prompt injection and sensitive credentials.
        Returns: (is_safe: bool, rejection_response: Optional[str])
        """
        # 1. Prompt Injection check
        for pattern in INJECTION_PATTERNS:
            if re.search(pattern, query, re.IGNORECASE):
                return False, (
                    "Security Guardrail: I am BankMate AI, an official banking assistant. "
                    "I cannot override system guidelines, disclose system prompts, or follow instructions that bypass bank security policies."
                )

        # 2. Credential exposure check
        for pattern in CREDENTIAL_HARVEST_PATTERNS:
            if re.search(pattern, query, re.IGNORECASE):
                return False, (
                    "Security Notice: Never share sensitive banking credentials like your full card number, "
                    "PIN, OTP, CVV, or passwords in chat. BankMate AI will never ask for them, and banks never ask for them over public chat."
                )

        # 3. Transactional execution request check
        for pattern in TRANSACTIONAL_REQUEST_PATTERNS:
            if re.search(pattern, query, re.IGNORECASE):
                return False, (
                    "Service Notice: BankMate AI is an informational banking assistant and cannot perform direct account actions, "
                    "such as transferring funds, blocking cards, or changing credentials. "
                    "To block a lost card or report fraud urgently, please contact your bank's 24/7 verified helpline immediately."
                )

        return True, None

    @staticmethod
    def check_provider_alignment(query: str, selected_provider_id: Optional[str]) -> Optional[str]:
        """
        Warns if query explicitly names a different provider than the currently active one.
        """
        if not selected_provider_id or selected_provider_id == "general":
            return None

        provider_keywords = {
            "easypaisa": ["easypaisa", "telenor bank", "telenor microfinance", "3737"],
            "jazzcash": ["jazzcash", "mobilink microfinance", "jazz cash", "4444"],
            "meezan": ["meezan", "meezan bank"],
            "hbl": ["hbl", "habib bank", "konnect"],
            "alfalah": ["bank alfalah", "alfalah", "alfa app"],
            "sbp": ["state bank of pakistan", "sbp", "central bank"]
        }

        query_lower = query.lower()
        selected_provider_lower = selected_provider_id.lower()

        for prov_id, keywords in provider_keywords.items():
            if prov_id != selected_provider_lower:
                for kw in keywords:
                    if re.search(r"\b" + re.escape(kw) + r"\b", query_lower):
                        return (
                            f"Notice: You are currently querying with **{selected_provider_id.title()}** selected, "
                            f"but your question mentions **{kw.title()}**. BankMate AI enforces strict provider isolation "
                            f"and will not apply policies from one institution to another. Switch the provider dropdown to {prov_id.title()} "
                            f"for authoritative answers from that provider."
                        )
        return None

    @staticmethod
    def get_abstention_response() -> str:
        return ABSTENTION_MESSAGE
